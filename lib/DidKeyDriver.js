/*!
 * Copyright (c) 2021-2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as didIo from '@digitalbazaar/did-io';
import {
  addX25519Context, getDid, getKey, getKeyAgreementKeyPair,
  getMultibaseMultikeyHeader, setKeyPairId
} from './helpers.js';

const DID_CONTEXT_URL = 'https://www.w3.org/ns/did/v1';

export class DidKeyDriver {
  constructor() {
    // used by did-io to register drivers
    this.method = 'key';
    this._allowedKeyTypes = new Map();
  }

  /**
   * Registers a multibase-multikey header and a multibase-multikey
   * deserializer that is allowed to handle data using that header.
   *
   * @param {object} options - Options hashmap.
   *
   * @param {string} options.multibaseMultikeyHeader - The multibase-multikey
   *   header to register.
   * @param {Function} options.fromMultibase - A function that converts a
   *  `{publicKeyMultibase}` value into a key pair interface.
   */
  use({multibaseMultikeyHeader, fromMultibase} = {}) {
    if(!(multibaseMultikeyHeader &&
      typeof multibaseMultikeyHeader === 'string')) {
      throw new TypeError('"multibaseMultikeyHeader" must be a string.');
    }
    if(typeof fromMultibase !== 'function') {
      throw new TypeError('"fromMultibase" must be a function.');
    }
    this._allowedKeyTypes.set(multibaseMultikeyHeader, fromMultibase);
  }

  /**
   * Generates a DID `key` (`did:key`) method DID Document from a KeyPair.
   *
   * @param {object} options - Options hashmap.
   *
   * @param {object} options.verificationKeyPair - A verification KeyPair.
   * @param {object} [options.keyAgreementKeyPair] - A keyAgreement KeyPair.
   *
   * @returns {Promise<{didDocument: object, keyPairs: Map,
   *   methodFor: Function}>} Resolves with the generated DID Document, along
   *   with the corresponding key pairs used to generate it (for storage in a
   *   KMS).
   */
  async fromKeyPair({verificationKeyPair, keyAgreementKeyPair} = {}) {
    if(!verificationKeyPair) {
      throw new TypeError('"verificationKeyPair" must be an object.');
    }
    // keyPairs is a map of keyId to key pair instance, that includes the
    // verificationKeyPair above and the keyAgreementKey pair that is
    // optionally passed or derived from the passed verification key pair
    const {didDocument, keyPairs} = await this._keyPairToDidDocument(
      {keyPair: verificationKeyPair, keyAgreementKeyPair});

    // convenience function that returns the public/private key pair instance
    // for a given purpose (authentication, assertionMethod, keyAgreement, etc).
    const methodFor = ({purpose}) => {
      const {id: methodId} = this.publicMethodFor({
        didDocument, purpose
      });
      return keyPairs.get(methodId);
    };
    return {didDocument, keyPairs, methodFor};
  }

  /**
   * Returns the public key (verification method) object for a given DID
   * Document and purpose. Useful in conjunction with a `.get()` call.
   *
   * @example
   * const didDocument = await didKeyDriver.get({did});
   * const authKeyData = didDriver.publicMethodFor({
   *   didDocument, purpose: 'authentication'
   * });
   * // You can then create a suite instance object to verify signatures etc.
   * const authPublicKey = await cryptoLd.from(authKeyData);
   * const {verify} = authPublicKey.verifier();
   *
   * @param {object} options - Options hashmap.
   * @param {object} options.didDocument - DID Document (retrieved via a
   *   `.get()` or from some other source).
   * @param {string} options.purpose - Verification method purpose, such as
   *   'authentication', 'assertionMethod', 'keyAgreement' and so on.
   *
   * @returns {object} Returns the public key object (obtained from the DID
   *   Document), without a `@context`.
   */
  publicMethodFor({didDocument, purpose} = {}) {
    if(!didDocument) {
      throw new TypeError('The "didDocument" parameter is required.');
    }
    if(!purpose) {
      throw new TypeError('The "purpose" parameter is required.');
    }

    const method = didIo.findVerificationMethod({doc: didDocument, purpose});
    if(!method) {
      throw new Error(`No verification method found for purpose "${purpose}"`);
    }
    return method;
  }

  /**
   * Returns a `did:key` method DID Document for a given DID, or a key document
   * for a given DID URL (key id).
   * Either a `did` or `url` param is required.
   *
   * @example
   * await resolver.get({did}); // -> did document
   * await resolver.get({url: keyId}); // -> public key node
   *
   * @param {object} options - Options hashmap.
   * @param {string} [options.did] - DID URL or a key id (either an ed25519 key
   *   or an x25519 key-agreement key id).
   * @param {string} [options.url] - Alias for the `did` url param, supported
   *   for better readability of invoking code.
   *
   * @returns {Promise<object>} Resolves to a DID Document or a
   *   public key node with context.
   */
  async get({did, url} = {}) {
    did = did || url;
    if(!did) {
      throw new TypeError('"did" must be a string.');
    }
    const [didAuthority, keyIdFragment] = did.split('#');
    const publicKeyMultibase = didAuthority.substring('did:key:'.length);
    // get the multikey header from the public key value
    const multibaseMultikeyHeader = getMultibaseMultikeyHeader({
      value: publicKeyMultibase
    });

    const fromMultibase =
      this._allowedKeyTypes.get(multibaseMultikeyHeader);
    if(!fromMultibase) {
      throw new Error(
        `Unsupported "multibaseMultikeyHeader", "${multibaseMultikeyHeader}".`);
    }
    let keyPair = await fromMultibase({publicKeyMultibase});
    const {type} = keyPair;
    let keyAgreementKeyPair;
    if(type && (type === 'X25519KeyAgreementKey2020' ||
      type === 'X25519KeyAgreementKey2019')) {
      keyAgreementKeyPair = keyPair;
      keyPair = null;
    }
    const {didDocument} = await this._keyPairToDidDocument({
      keyPair, keyAgreementKeyPair
    });

    if(keyIdFragment) {
      // resolve an individual key
      return getKey({didDocument, keyIdFragment});
    }
    // Resolve the full DID Document
    return didDocument;
  }

  /**
   * Converts a public key object to a `did:key` method DID Document.
   * Note that unlike `generate()`, a `keyPairs` map is not returned. Use
   * `publicMethodFor()` to fetch keys for particular proof purposes.
   *
   * @param {object} options - Options hashmap.
   * @param {object} options.publicKeyDescription - Public key object
   *   used to generate the DID document (either an LDKeyPair instance
   *   containing public key material, or a "key description" plain object
   *   (such as that generated from a KMS)).
   *
   * @returns {Promise<object>} Resolves with the generated DID Document.
   */
  async publicKeyToDidDoc({publicKeyDescription} = {}) {
    const {type} = publicKeyDescription;
    let keyAgreementKeyPair;
    let keyPair;
    if(type && (type === 'X25519KeyAgreementKey2020' ||
      type === 'X25519KeyAgreementKey2019')) {
      keyAgreementKeyPair = publicKeyDescription;
      keyPair = null;
    } else {
      keyPair = publicKeyDescription;
    }
    const {didDocument} = await this._keyPairToDidDocument({
      keyPair, keyAgreementKeyPair
    });
    return {didDocument};
  }

  /**
   * Converts an Ed25519KeyPair object to a `did:key` method DID Document.
   *
   * @param {object} options - Options hashmap.
   * @param {object} options.keyPair - Key used to generate the DID
   *   document (either an LDKeyPair instance containing public key material,
   *   or a "key description" plain object (such as that generated from a KMS)).
   * @param {object} [options.keyAgreementKeyPair] -  Optional
   *   keyAgreement key pair for generating did for keyAgreement.
   * @returns {Promise<{didDocument: object, keyPairs: Map}>}
   *   Resolves with the generated DID Document, along with the corresponding
   *   key pairs used to generate it (for storage in a KMS).
   */
  async _keyPairToDidDocument({keyPair, keyAgreementKeyPair} = {}) {
    const keyPairs = new Map();
    let didDocument;
    let publicDhKey;
    const contexts = [DID_CONTEXT_URL];
    if(!keyPair && keyAgreementKeyPair) {
      const {type} = keyAgreementKeyPair;
      addX25519Context({contexts, type});
      const did = getDid({keyPair: keyAgreementKeyPair});
      keyAgreementKeyPair.controller = did;
      setKeyPairId({keyPair: keyAgreementKeyPair, did});
      publicDhKey = await keyAgreementKeyPair.export({publicKey: true});
      keyPairs.set(keyAgreementKeyPair.id, keyAgreementKeyPair);
      didDocument = {
        '@context': contexts,
        id: did,
        keyAgreement: [publicDhKey]
      };
      return {didDocument, keyPairs};
    }
    let {publicKeyMultibase} = keyPair;
    if(!publicKeyMultibase && keyPair.publicKeyBase58) {
      // handle backwards compatibility w/older key pair interfaces
      publicKeyMultibase = await keyPair.fingerprint();
    }
    // get the multibaseMultikeyHeader from the public key value
    const multibaseMultikeyHeader = getMultibaseMultikeyHeader({
      value: publicKeyMultibase
    });
    const fromMultibase = this._allowedKeyTypes.get(multibaseMultikeyHeader);
    if(!fromMultibase) {
      throw new Error(
        `Unsupported "multibaseMultikeyHeader", "${multibaseMultikeyHeader}".`);
    }
    const verificationKeyPair = await fromMultibase({publicKeyMultibase});

    const did = getDid({keyPair: verificationKeyPair});
    verificationKeyPair.controller = did;
    // Now set the source key's id
    setKeyPairId({keyPair: verificationKeyPair, did});
    // get the public components of verification keypair
    const verificationPublicKey = await verificationKeyPair.export({
      publicKey: true,
      includeContext: true
    });
    contexts.push(verificationPublicKey['@context']);
    // delete context from verificationPublicKey
    delete verificationPublicKey['@context'];
    // get the keyAgreement keypair
    if(!keyAgreementKeyPair) {
      ({keyAgreementKeyPair} = await getKeyAgreementKeyPair({
        contexts, verificationPublicKey
      }));
    }

    // get the public components of keyAgreement keypair
    if(keyAgreementKeyPair) {
      if(!keyAgreementKeyPair.controller) {
        keyAgreementKeyPair.controller = did;
      }
      if(!keyAgreementKeyPair.id) {
        setKeyPairId({keyPair: keyAgreementKeyPair, did});
      }
      publicDhKey = await keyAgreementKeyPair.export({publicKey: true});
    }

    // Compose the DID Document
    didDocument = {
      // Note that did:key does not have its own method-specific context,
      // and only uses the general DID Core context, and key-specific contexts.
      '@context': contexts,
      id: did,
      verificationMethod: [verificationPublicKey],
      authentication: [verificationPublicKey.id],
      assertionMethod: [verificationPublicKey.id],
      capabilityDelegation: [verificationPublicKey.id],
      capabilityInvocation: [verificationPublicKey.id],
    };
    if(publicDhKey) {
      didDocument.keyAgreement = [publicDhKey];
    }
    // create the key pairs map
    keyPairs.set(verificationKeyPair.id, verificationKeyPair);
    if(keyAgreementKeyPair) {
      keyPairs.set(keyAgreementKeyPair.id, keyAgreementKeyPair);
    }

    return {didDocument, keyPairs};
  }

  /**
   * Computes and returns the id of a given key pair. Used by `did-io` drivers.
   *
   * @param {object} options - Options hashmap.
   * @param {object} options.keyPair - The key pair used when computing the
   *   identifier.
   *
   * @returns {string} Returns the key's id.
   */
  async computeId({keyPair}) {
    return `did:key:${keyPair.fingerprint()}#${keyPair.fingerprint()}`;
  }
}

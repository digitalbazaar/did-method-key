/*!
 * Copyright (c) 2021-2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as didIo from '@digitalbazaar/did-io';
import {
  getDid, getKey, getKeyAgreementKeyPair, getMultibaseMultikeyHeader,
  setVerificationKeyPairId
} from './helpers.js';

export class DidKeyDriver {
  constructor() {
    // used by did-io to register drivers
    this.method = 'key';
    this.allowedKeyTypeHandlers = new Map();
  }

  /**
   * Registers a multibase-multikey header and a key type handler that is
   * allowed to handle data using that header.
   *
   * @param {object} options - Options hashmap.
   *
   * @param {string} options.multibaseMultikeyHeader - The multibase-multikey
   *   header to register.
   * @param {object} options.keyTypeHandler - The `keyTypeHandler` to map
   *   the headers to.
   */
  use({multibaseMultikeyHeader, keyTypeHandler} = {}) {
    if(!(multibaseMultikeyHeader &&
      typeof multibaseMultikeyHeader === 'string')) {
      throw new TypeError('"multibaseMultikeyHeader" must be a string.');
    }
    if(!keyTypeHandler) {
      throw new TypeError('"keyTypeHandler" must be an object.');
    }
    this.allowedKeyTypeHandlers.set(multibaseMultikeyHeader, keyTypeHandler);
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

    const keyTypeHandler =
      this.allowedKeyTypeHandlers.get(multibaseMultikeyHeader);
    if(!keyTypeHandler) {
      throw new Error(
        `Unsupported "multibaseMultikeyHeader", "${multibaseMultikeyHeader}".`);
    }
    const keyPair = await keyTypeHandler.from({publicKeyMultibase});
    const {didDocument} = await this._keyPairToDidDocument({keyPair});

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
    const {didDocument} = await this._keyPairToDidDocument({
      keyPair: publicKeyDescription
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
    let {publicKeyMultibase} = keyPair;
    if(!publicKeyMultibase && keyPair.publicKeyBase58) {
      publicKeyMultibase = keyPair.fingerprint();
    }
    // get the multibaseMultikeyHeader from the public key value
    const multibaseMultikeyHeader = getMultibaseMultikeyHeader({
      value: publicKeyMultibase
    });
    const keyTypeHandler =
      this.allowedKeyTypeHandlers.get(multibaseMultikeyHeader);
    if(!keyTypeHandler) {
      throw new Error(
        `Unsupported "multibaseMultikeyHeader", "${multibaseMultikeyHeader}".`);
    }
    const verificationKeyPair =
      await keyTypeHandler.from({...keyPair});
    const did = getDid({verificationKeyPair});
    verificationKeyPair.controller = did;
    // Now set the source key's id
    setVerificationKeyPairId({verificationKeyPair, did});
    // get the keyAgreement keypair
    let contexts;
    if(!keyAgreementKeyPair) {
      ({keyAgreementKeyPair, contexts} = await getKeyAgreementKeyPair({
        verificationKeyPair
      }));
    }

    let publicDhKey;
    // get the public components of keyAgreement keypair
    if(keyAgreementKeyPair) {
      publicDhKey = await keyAgreementKeyPair.export({publicKey: true});
    }
    // get the public components of verification keypair
    const publicEdKey = await verificationKeyPair.export({publicKey: true});

    // Compose the DID Document
    const didDocument = {
      // Note that did:key does not have its own method-specific context,
      // and only uses the general DID Core context, and key-specific contexts.
      '@context': contexts,
      id: did,
      verificationMethod: [publicEdKey],
      authentication: [publicEdKey.id],
      assertionMethod: [publicEdKey.id],
      capabilityDelegation: [publicEdKey.id],
      capabilityInvocation: [publicEdKey.id],
    };
    if(publicDhKey) {
      didDocument.keyAgreement = [publicDhKey];
    }
    // create the key pairs map
    const keyPairs = new Map();
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

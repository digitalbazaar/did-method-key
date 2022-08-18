/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as didIo from '@digitalbazaar/did-io';
import {
  parseDidKey,
  validateDidDocument,
  validateDidKey,
  validatePublicKeyFormat
} from './validators.js';
import {DidResolverError} from '@digitalbazaar/did-io';
const DID_CONTEXT_URL = 'https://www.w3.org/ns/did/v1';
import {
  contextsBySuite,
  getEncryptionMethod,
  methodsByKeyFormat
} from './verificationMethods.js';

export class DidKeyDriver {
  /**
   * @param {object} options - Options to use.
   * @param {Map<string, object>} [options.verificationMethods] -
   *   A map of verification methods with the key as the publicKeyFormat.
   */
  constructor({
    verificationMethods = methodsByKeyFormat,
  } = {}) {
    // used by did-io to register drivers
    this.method = 'key';
    this.verificationMethods = verificationMethods;
  }

  /**
   * Generates a new `did:key` method DID Document (optionally, from a
   * deterministic seed value).
   *
   * @param {object} options - Options hashmap.
   * @param {Uint8Array} [options.seed] - A 32-byte array seed for a
   *   deterministic key.
   * @param {object} [options.options] - DID Document creation options.
   *
   * @returns {Promise<{didDocument: object, keyPairs: Map,
   *   methodFor: Function}>} Resolves with the generated DID Document, along
   *   with the corresponding key pairs used to generate it (for storage in a
   *   KMS).
   */
  async generate({seed, options = {}} = {}) {
    // Public/private key pair of the main did:key signing/verification key
    const verificationKeyPair = await this._getVerificationMethod(options).
      generate({seed});
    // keyPairs is a map of keyId to key pair instance, that includes
    // the verificationKeyPair above, but also the keyAgreementKey pair that
    // is derived from the verification key pair.
    const {didDocument, keyPairs} = await this._keyPairToDidDocument({
      keyPair: verificationKeyPair,
      options
    });

    // Convenience function that returns the public/private key pair instance
    // for a given purpose (authentication, assertionMethod, keyAgreement, etc).
    const methodFor = ({purpose}) => {
      const {id: methodId} = didIo.findVerificationMethod({
        doc: didDocument, purpose
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
   * @param {object} [options.options] - Options for didDocument creation.
   *
   * @returns {Promise<object>} Resolves to a DID Document or a
   *   public key node with context.
   */
  async get({did, url, options} = {}) {
    did = did || url;
    if(!did) {
      throw new TypeError('"did" must be a string.');
    }
    validateDidKey({did});

    const [didAuthority, keyIdFragment] = did.split('#');
    const {multibase: fingerprint} = parseDidKey({did: didAuthority});
    const keyPair = this._getVerificationMethod(options).
      fromFingerprint({fingerprint});

    const {didDocument} = await this._keyPairToDidDocument({keyPair, options});

    if(keyIdFragment) {
      // resolve an individual key
      return _getKey({didDocument, keyIdFragment});
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
   * @typedef LDKeyPair
   * @param {LDKeyPair|object} options.publicKeyDescription - Public key object
   *   used to generate the DID document (either an LDKeyPair instance
   *   containing public key material, or a "key description" plain object
   *   (such as that generated from a KMS)).
   * @param {object} [options.options] - Options for didDocument creation.
   *
   * @returns {Promise<object>} Resolves with the generated DID Document.
   */
  async publicKeyToDidDoc({publicKeyDescription, options} = {}) {
    const {didDocument} = await this._keyPairToDidDocument({
      keyPair: publicKeyDescription,
      options
    });
    return {didDocument};
  }

  /**
   * Converts an Ed25519KeyPair object to a `did:key` method DID Document.
   *
   * @param {object} options - Options hashmap.
   * @param {LDKeyPair|object} options.keyPair - Key used to generate the DID
   *   document (either an LDKeyPair instance containing public key material,
   *   or a "key description" plain object (such as that generated from a KMS)).
   * @param {object} [options.options = {}] - Options for didDocument creation.
   *
   * @returns {Promise<{didDocument: object, keyPairs: Map}>}
   *   Resolves with the generated DID Document, along with the corresponding
   *   key pairs used to generate it (for storage in a KMS).
   */
  async _keyPairToDidDocument({keyPair, options = {}} = {}) {
    const {
      publicKeyFormat = 'Ed25519VerificationKey2020',
      enableExperimentalPublicKeyTypes = false,
      defaultContext = [DID_CONTEXT_URL],
      enableEncryptionKeyDerivation = true
    } = options;
    const verificationKeyPair = await this._getVerificationMethod(
      {publicKeyFormat}).from({...keyPair});
    const did = `did:key:${verificationKeyPair.fingerprint()}`;
    verificationKeyPair.controller = did;

    const contexts = [...defaultContext];
    // Now set the source key's id
    verificationKeyPair.id = `${did}#${verificationKeyPair.fingerprint()}`;

    // get the public components of each keypair
    const publicEdKey = verificationKeyPair.export({publicKey: true});

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
      capabilityInvocation: [publicEdKey.id]
    };
    // create the key pairs map
    const keyPairs = new Map();
    keyPairs.set(verificationKeyPair.id, verificationKeyPair);

    // don't include an encryption verification method unless the option is true
    if(enableEncryptionKeyDerivation) {
      // The KAK pair will use the source key's controller, but will generate
      // its own .id
      const keyAgreementKeyPair = getEncryptionMethod({
        verificationKeyPair,
        contexts
      });
      keyPairs.set(keyAgreementKeyPair.id, keyAgreementKeyPair);
      const publicDhKey = keyAgreementKeyPair.export({publicKey: true});
      didDocument.keyAgreement = [publicDhKey];
    }
    validateDidDocument({
      didDocument,
      didOptions: {
        enableExperimentalPublicKeyTypes,
        enableEncryptionKeyDerivation
      }
    });

    return {didDocument, keyPairs};
  }
  _getVerificationMethod({
    publicKeyFormat = 'Ed25519VerificationKey2020'
  } = {}) {
    // ensure public key format is a format we have an implementation of
    validatePublicKeyFormat({publicKeyFormat});
    const verificationMethod = this.verificationMethods.get(publicKeyFormat);
    // if there is no verificationMethod then the method is not supported by
    // the `did:key` spec
    if(!verificationMethod) {
      throw new DidResolverError({
        message: `Unsupported public key type ${publicKeyFormat}`,
        code: 'unsupportedPublicKeyType'
      });
    }
    return verificationMethod;
  }
  /**
   * Computes and returns the id of a given key pair. Used by `did-io` drivers.
   *
   * @param {object} options - Options hashmap.
   * @param {LDKeyPair} options.keyPair - The key pair used when computing the
   *   identifier.
   *
   * @returns {string} Returns the key's id.
   */
  async computeId({keyPair}) {
    return `did:key:${keyPair.fingerprint()}#${keyPair.fingerprint()}`;
  }
}

/**
 * Returns the public key object for a given key id fragment.
 *
 * @param {object} options - Options hashmap.
 * @param {object} options.didDocument - The DID Document to use when generating
 *   the id.
 * @param {string} options.keyIdFragment - The key identifier fragment.
 *
 * @returns {object} Returns the public key node, with `@context`.
 */
export function _getKey({didDocument, keyIdFragment}) {
  // Determine if the key id fragment belongs to the "main" public key,
  // or the keyAgreement key
  const keyId = didDocument.id + '#' + keyIdFragment;
  let publicKey;

  if(didDocument.verificationMethod[0].id === keyId) {
    // Return the public key node for the main public key
    publicKey = didDocument.verificationMethod[0];
  } else {
    // Return the public key node for the X25519 key-agreement key
    publicKey = didDocument.keyAgreement[0];
  }

  return {
    '@context': contextsBySuite.get(publicKey.type),
    ...publicKey
  };
}

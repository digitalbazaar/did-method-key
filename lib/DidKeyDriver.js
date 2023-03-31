/*!
 * Copyright (c) 2021-2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {
  Ed25519VerificationKey2020
} from '@digitalbazaar/ed25519-verification-key-2020';
import {
  X25519KeyAgreementKey2020
} from '@digitalbazaar/x25519-key-agreement-key-2020';
import {
  X25519KeyAgreementKey2019
} from '@digitalbazaar/x25519-key-agreement-key-2019';

import * as didIo from '@digitalbazaar/did-io';

const DID_CONTEXT_URL = 'https://www.w3.org/ns/did/v1';
// For backwards compat only, not actually importing this suite
const ED25519_KEY_2018_CONTEXT_URL =
  'https://w3id.org/security/suites/ed25519-2018/v1';

const contextsBySuite = new Map([
  [Ed25519VerificationKey2020.suite, Ed25519VerificationKey2020.SUITE_CONTEXT],
  ['Ed25519VerificationKey2018', ED25519_KEY_2018_CONTEXT_URL],
  [X25519KeyAgreementKey2020.suite, X25519KeyAgreementKey2020.SUITE_CONTEXT],
  [X25519KeyAgreementKey2019.suite, X25519KeyAgreementKey2019.SUITE_CONTEXT]
]);

export class DidKeyDriver {
  /**
   * @param {object} options - Options hashmap.
   * @param {object} [options.verificationSuite=Ed25519VerificationKey2020] -
   *   Key suite for the signature verification key suite to use.
   */
  constructor({verificationSuite = Ed25519VerificationKey2020} = {}) {
    // used by did-io to register drivers
    this.method = 'key';
    this.verificationSuite = verificationSuite;
  }

  /**
   * Generates a new `did:key` method DID Document (optionally, from a
   * deterministic seed value).
   *
   * @param {object} options - Options hashmap.
   * @param {Uint8Array} [options.seed] - A 32-byte array seed for a
   *   deterministic key.
   *
   * @returns {Promise<{didDocument: object, keyPairs: Map,
   *   methodFor: Function}>} Resolves with the generated DID Document, along
   *   with the corresponding key pairs used to generate it (for storage in a
   *   KMS).
   */
  async generate({seed, ...keyPairOptions} = {}) {
    // Public/private key pair of the main did:key signing/verification key
    let verificationKeyPair;
    if(this.verificationSuite === EcdsaMultikey) {
      verificationKeyPair = await this.verificationSuite.generate({
        ...keyPairOptions
      });
    } else {
      verificationKeyPair = await this.verificationSuite.generate({seed});
    }

    // keyPairs is a map of keyId to key pair instance, that includes
    // the verificationKeyPair above, but also the keyAgreementKey pair that
    // is derived from the verification key pair.
    const {didDocument, keyPairs} = await this._keyPairToDidDocument({
      keyPair: verificationKeyPair
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
    let keyPair;
    if(this.verificationSuite === EcdsaMultikey) {
      keyPair = await this.verificationSuite.from({
        publicKeyMultibase: keyIdFragment
      });
    } else {
      const fingerprint = didAuthority.substring('did:key:'.length);
      keyPair = await this.verificationSuite.fromFingerprint({fingerprint});
    }
    const {didDocument} = await this._keyPairToDidDocument({keyPair});

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
   * @param {LDKeyPair|object} options.keyPair - Key used to generate the DID
   *   document (either an LDKeyPair instance containing public key material,
   *   or a "key description" plain object (such as that generated from a KMS)).
   *
   * @returns {Promise<{didDocument: object, keyPairs: Map}>}
   *   Resolves with the generated DID Document, along with the corresponding
   *   key pairs used to generate it (for storage in a KMS).
   */
  async _keyPairToDidDocument({keyPair} = {}) {
    const verificationKeyPair = await this.verificationSuite.from({...keyPair});
    let did;
    if(this.verificationSuite === EcdsaMultikey) {
      did = `did:key:${verificationKeyPair.publicKeyMultibase}`;
    } else {
      did = `did:key:${verificationKeyPair.fingerprint()}`;
    }
    verificationKeyPair.controller = did;

    const contexts = [DID_CONTEXT_URL];

    // The KAK pair will use the source key's controller, but will generate
    // its own .id
    let keyAgreementKeyPair;
    let publicDhKey;
    // FIXME: Add keyAgreementKeyPair interface for Multikey.
    if(verificationKeyPair.type !== 'Multikey') {
      if(verificationKeyPair.type === 'Ed25519VerificationKey2020') {
        keyAgreementKeyPair = X25519KeyAgreementKey2020
          .fromEd25519VerificationKey2020({keyPair: verificationKeyPair});
        contexts.push(Ed25519VerificationKey2020.SUITE_CONTEXT,
          X25519KeyAgreementKey2020.SUITE_CONTEXT);
      } else if(verificationKeyPair.type === 'Ed25519VerificationKey2018') {
        keyAgreementKeyPair = X25519KeyAgreementKey2019
          .fromEd25519VerificationKey2018({keyPair: verificationKeyPair});
        contexts.push(ED25519_KEY_2018_CONTEXT_URL,
          X25519KeyAgreementKey2019.SUITE_CONTEXT);
      } else {
        throw new Error(
          'Cannot derive key agreement key from verification key type "' +
            verificationKeyPair.type + '".'
        );
      }
      // get the public components of keyAgreement keypair
      publicDhKey = await keyAgreementKeyPair.export({publicKey: true});
    }
    // Now set the source key's id
    if(verificationKeyPair.type === 'Multikey') {
      verificationKeyPair.id =
        `${did}#${verificationKeyPair.publicKeyMultibase}`;
    } else {
      verificationKeyPair.id = `${did}#${verificationKeyPair.fingerprint()}`;
    }
    // get the public components of keypairs
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
    if(verificationKeyPair.type !== 'Multikey') {
      keyPairs.set(keyAgreementKeyPair.id, keyAgreementKeyPair);
    }

    return {didDocument, keyPairs};
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

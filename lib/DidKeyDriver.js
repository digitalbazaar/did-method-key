/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {
  Ed25519VerificationKey2020
} from '@digitalbazaar/ed25519-verification-key-2020';
import {
  X25519KeyAgreementKey2020
} from '@digitalbazaar/x25519-key-agreement-key-2020';

import didContext from 'did-context';
import {findVerificationMethod} from '@digitalbazaar/did-io';
import ed25519Context from 'ed25519-signature-2020-context';
import x25519Context from 'x25519-key-agreement-2020-context';

export class DidKeyDriver {
  /**
   * @param {object} options - Options hashmap.
   * @param {object} [options.verificationSuite=Ed25519VerificationKey2020] -
   *   Key suite for the signature verification key suite to use.
   * @param {Function} [options.convert] - An async function to convert a
   *   verification key pair (like ed25519) to a key-agreement key pair (such
   *   as x25519).
   */
  constructor({
    verificationSuite = Ed25519VerificationKey2020,
    convert = async verificationKeyPair => X25519KeyAgreementKey2020
      .fromEd25519VerificationKey2020({keyPair: verificationKeyPair})
  } = {}) {
    // used by did-io to register drivers
    this.method = 'key';
    this.verificationSuite = verificationSuite;
    this.convert = convert;
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
  async generate({seed} = {}) {
    const verificationKeyPair = await this.verificationSuite.generate({seed});

    const {didDocument, keyPairs} = await this._keyPairToDidDocument({
      keyPair: verificationKeyPair
    });

    // Convenience function that returns the key pair instance for a given
    // purpose (authentication, assertionMethod, etc).
    const methodFor = ({purpose}) => {
      const {id: methodId} = findVerificationMethod({
        doc: didDocument, purpose
      });
      return keyPairs.get(methodId);
    };

    return {didDocument, keyPairs, methodFor};
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

    const fingerprint = didAuthority.substr('did:key:'.length);
    const keyPair = this.verificationSuite.fromFingerprint({fingerprint});

    const {didDocument} = await this._keyPairToDidDocument({keyPair});

    if(keyIdFragment) {
      // resolve an individual key
      return _getKey({didDocument, keyIdFragment});
    }

    // Resolve the full DID Document
    return didDocument;
  }

  /**
   * Converts an Ed25519KeyPair object to a `did:key` method DID Document.
   *
   * @param {object} options - Options hashmap.
   * @typedef LDKeyPair
   * @param {LDKeyPair} options.keyPair - A verification key pair to use to
   *   generate the DID Document.
   *
   * @returns {Promise<{didDocument: object, keyPairs: Map}>}
   *   Resolves with the generated DID Document, along with the corresponding
   *   key pairs used to generate it (for storage in a KMS).
   */
  async _keyPairToDidDocument({keyPair} = {}) {
    const verificationKeyPair = await this.verificationSuite.from({...keyPair});
    const did = `did:key:${verificationKeyPair.fingerprint()}`;
    verificationKeyPair.controller = did;

    // The KAK pair will use the source key's controller, but will generate
    // its own .id
    const keyAgreementKeyPair = await this.convert(verificationKeyPair);

    // Now set the source key's id
    verificationKeyPair.id = `${did}#${verificationKeyPair.fingerprint()}`;

    // get the public components of each keypair
    const publicEdKey = verificationKeyPair.export({publicKey: true});
    const publicDhKey = keyAgreementKeyPair.export({publicKey: true});

    // Compose the DID Document
    const didDocument = {
      '@context': [
        didContext.constants.DID_CONTEXT_URL,
        ed25519Context.constants.CONTEXT_URL,
        x25519Context.constants.CONTEXT_URL
      ],
      id: did,
      verificationMethod: [publicEdKey],
      authentication: [publicEdKey.id],
      assertionMethod: [publicEdKey.id],
      capabilityDelegation: [publicEdKey.id],
      capabilityInvocation: [publicEdKey.id],
      keyAgreement: [publicDhKey]
    };

    // create the key pairs map
    const keyPairs = new Map();
    keyPairs.set(verificationKeyPair.id, verificationKeyPair);
    keyPairs.set(keyAgreementKeyPair.id, keyAgreementKeyPair);

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
  const publicKey = didDocument.verificationMethod[0];

  if(publicKey.id === keyId) {
    // Return the public key node for the main public key
    return {
      '@context': ed25519Context.constants.CONTEXT_URL,
      ...publicKey
    };
  }
  // Return the public key node for the X25519 key-agreement key
  return {
    '@context': x25519Context.constants.CONTEXT_URL,
    ...didDocument.keyAgreement[0]
  };
}

/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {Ed25519KeyPair, LDKeyPair} = require('crypto-ld');
const {X25519KeyPair} = require('x25519-key-pair');
const {constants: securityConstants} = require('security-context');
const LRU = require('lru-cache');

module.exports = class Driver {
  constructor({maxCacheSize = 100} = {}) {
    // used by did-io to register drivers
    this.method = 'key';
    this._cache = new LRU({max: maxCacheSize});
  }

  /**
   * Returns a `did:key` method DID Document for a given DID, or a key document
   * for a given DID URL (key id).
   * Note: This is async only to match the async `get()` signature of other
   * `did-io` drivers.
   *
   * Either a `did` or `url` param is required:
   * @param {string} [did] - DID URL or a key id (either an ed25519 key or an
   *   x25519 key-agreement key id).
   * @param {string} [url] - alias for the `did` url param, supported for better
   *   readability of invoking code.
   *
   * Usage:
   *
   *   ```
   *   await driver.get({did}); // -> did document
   *   await driver.get({url: keyId}); // -> public key node
   *   ```
   *
   * @throws Unsupported Fingerprint Type.
   * @throws Cannot get - missing DID.
   * @returns {Promise<DidDocument|object>} Resolves to a DID Document or a
   *   public key node with context.
   */
  async get({did, url} = {}) {
    did = did || url;
    if(!did) {
      throw new TypeError('"did" must be a string.');
    }

    const [didAuthority, keyIdFragment] = did.split('#');

    let addedToCache = false;
    let promise = this._cache.get(didAuthority);
    if(!promise) {
      const fingerprint = didAuthority.substr('did:key:'.length);
      const keyPair = LDKeyPair.fromFingerprint({fingerprint});

      promise = this.keyPairToDidDocument({keyPair});
      this._cache.set(didAuthority, promise);
      addedToCache = true;
    }

    let didDocument;
    try {
      ({didDocument} = await promise);
    } catch(e) {
      if(addedToCache) {
        this._cache.del(didAuthority);
      }
      throw e;
    }

    if(keyIdFragment) {
      // Resolve an individual key
      return _getKey({didDocument, keyIdFragment});
    }
    // Resolve the full DID Document
    return didDocument;
  }

  /**
   * Generates a new `did:key` method DID Document for a given key type.
   *
   * @param {string} [keyType='Ed25519VerificationKey2018']
   * @returns {Promise<DidDocument>}
   */
  async generate({keyType = 'Ed25519VerificationKey2018'} = {}) {
    const keyPair = await LDKeyPair.generate({type: keyType});
    return this.keyPairToDidDocument({keyPair});
  }

  /**
   * Converts an Ed25519KeyPair object to a `did:key` method DID Document.
   *
   * @param {Ed25519KeyPair} keyPair - The key pair to use to generate the
   *   DID Document.
   * @returns {object} - An object containing the `didDocument` and `keyPairs`.
   */
  async keyPairToDidDocument({keyPair} = {}) {
    const edKeyPair = new Ed25519KeyPair({
      publicKeyBase58: keyPair.publicKey,
      privateKeyBase58: keyPair.privateKey
    });
    const did = `did:key:${edKeyPair.fingerprint()}`;
    edKeyPair.id = `${did}#${edKeyPair.fingerprint()}`;
    edKeyPair.controller = did;

    const dhKeyPair = await X25519KeyPair.fromEdKeyPair(edKeyPair);
    dhKeyPair.id = `${did}#${dhKeyPair.fingerprint()}`;
    dhKeyPair.controller = did;

    // get the public components of each keypair
    const publicEdKey = _verificationMethodFromKeyPair({keyPair: edKeyPair});
    const publicDhKey = _verificationMethodFromKeyPair({keyPair: dhKeyPair});

    // generate the DID Document
    const didDocument = {
      '@context': ['https://w3id.org/did/v0.11'],
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
    keyPairs.set(edKeyPair.id, edKeyPair);
    keyPairs.set(dhKeyPair.id, dhKeyPair);

    return {didDocument, keyPairs};
  }

  /**
   * Computes and returns the id of a given key pair. Used by `did-io` drivers.
   *
   * @param {LDKeyPair} keyPair - the key pair to use when computing the
   *   identifier.
   *
   * @returns {string} Returns the key's id.
   */
  async computeId({keyPair}) {
    return `did:key:${keyPair.fingerprint()}#${keyPair.fingerprint()}`;
  }
};

/**
 * Generates a Linked Data verification method from a keypair that does not
 * contain any private data from the key pair.
 *
 * @param {LDKeyPair} keyPair - the keyPair to derive the verification method
 *   from.
 *
 * @returns {string} Returns a verification method.
 */
function _verificationMethodFromKeyPair({keyPair}) {
  const {id, type, controller, publicKeyBase58} = keyPair;

  return {id, type, controller, publicKeyBase58};
}

/**
 * Returns the public key object for a given key id fragment.
 *
 * @param {DidDocument} didDocument - The DID Document to use when generating
 *   the id.
 * @param {string} keyIdFragment - The key identifier fragment.
 *
 * @returns {object} public key node, with `@context`
 */
function _getKey({didDocument, keyIdFragment}) {
  // Determine if the key id fragment belongs to the "main" public key,
  // or the keyAgreement key
  const keyId = didDocument.id + '#' + keyIdFragment;
  const publicKey = didDocument.verificationMethod[0];

  if(publicKey.id === keyId) {
    // Return the public key node for the main public key
    return {
      '@context': securityConstants.SECURITY_CONTEXT_V2_URL,
      ...publicKey
    };
  }
  // Return the public key node for the X25519 key-agreement key
  return {
    '@context': securityConstants.SECURITY_CONTEXT_V2_URL,
    ...didDocument.keyAgreement[0]
  };
}

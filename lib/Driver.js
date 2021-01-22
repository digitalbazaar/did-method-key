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
      const publicKey = LDKeyPair.fromFingerprint({fingerprint});

      promise = this.keyToDidDoc(publicKey);
      this._cache.set(didAuthority, promise);
      addedToCache = true;
    }

    let didDoc;
    try {
      didDoc = await promise;
    } catch(e) {
      if(addedToCache) {
        this._cache.del(didAuthority);
      }
      throw e;
    }

    if(keyIdFragment) {
      // Resolve an individual key
      return getKey({didDoc, keyIdFragment});
    }
    // Resolve the full DID Document
    return didDoc;
  }

  /**
   * Generates a new `did:key` method DID Document for a given key type.
   *
   * @param {string} [keyType='Ed25519VerificationKey2018']
   * @returns {Promise<DidDocument>}
   */
  async generate({keyType = 'Ed25519VerificationKey2018'} = {}) {
    const publicKey = await LDKeyPair.generate({type: keyType});
    return this.keyToDidDoc(publicKey);
  }

  /**
   * Converts an Ed25519KeyPair object to a `did:key` method DID Document.
   *
   * @param {Ed25519KeyPair} ed25519Key
   * @returns {DidDocument}
   */
  async keyToDidDoc(ed25519Key) {
    const edKey = new Ed25519KeyPair({
      publicKeyBase58: ed25519Key.publicKey,
      privateKeyBase58: ed25519Key.privateKey,
    });
    const did = `did:key:${edKey.fingerprint()}`;
    edKey.id = `${did}#${edKey.fingerprint()}`;
    edKey.controller = did;

    const dhKey = await X25519KeyPair.fromEdKeyPair(edKey);
    dhKey.id = `${did}#${dhKey.fingerprint()}`;
    dhKey.controller = did;

    // get the public components of each keypair
    const publicEdKey = this.getPublicVerificationMethod({key: edKey});
    const publicDhKey = this.getPublicVerificationMethod({key: dhKey});

    // generate the DID Document
    const didDoc = {
      '@context': ['https://w3id.org/did/v0.11'],
      id: did,
      publicKey: [publicEdKey], // FIXME: publicKey is deprecated, remove
      verificationMethod: [publicEdKey],
      authentication: [publicEdKey.id],
      assertionMethod: [publicEdKey.id],
      capabilityDelegation: [publicEdKey.id],
      capabilityInvocation: [publicEdKey.id],
      keyAgreement: [publicDhKey],
    };
    // FIXME: 'keys' is misleading as devs might think 'public keys'; remove
    Object.defineProperty(didDoc, 'keys', {
      value: {
        [edKey.id]: edKey,
        [dhKey.id]: dhKey
      },
      enumerable: false
    });
    Object.defineProperty(didDoc, 'keypairs', {
      value: {
        [edKey.id]: edKey,
        [dhKey.id]: dhKey,
        publicKey: [edKey],
        verificationMethod: [edKey],
        authentication: [edKey],
        assertionMethod: [edKey],
        capabilityDelegation: [edKey],
        capabilityInvocation: [edKey],
        keyAgreement: [dhKey],
      },
      enumerable: false
    });

    return didDoc;
  }

  /**
   * Computes and returns the id of a given key. Used by `did-io` drivers.
   *
   * @param {LDKeyPair} key
   *
   * @returns {string} Returns the key's id.
   */
  computeKeyId({key}) {
    return `did:key:${key.fingerprint()}#${key.fingerprint()}`;
  }

  /**
   * Generates a public verification method from a keypair.
   *
   * @param {LDKeyPair} key
   *
   * @returns {string} Returns the key's id.
   */
  getPublicVerificationMethod({key}) {
    return (({id, type, controller, publicKeyBase58}) =>
      ({id, type, controller, publicKeyBase58}))(key);
  }
};

/**
 * Returns the public key object for a given key id fragment.
 *
 * @param {DidDocument} didDoc
 * @param {string} keyIdFragment
 *
 * @returns {object} public key node, with `@context`
 */
function getKey({didDoc, keyIdFragment}) {
  // Determine if the key id fragment belongs to the "main" public key,
  // or the keyAgreement key
  const keyId = didDoc.id + '#' + keyIdFragment;
  const publicKey = didDoc.publicKey[0];

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
    ...didDoc.keyAgreement[0]
  };
}

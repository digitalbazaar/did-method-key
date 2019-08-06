/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {LDKeyPair} = require('crypto-ld');
const {convertFromEdPublicKey} = require('x25519-key-pair');

/**
 * Returns a `did:key` method DID Document for a given DID.
 * Note: This is async only to match the async `get()` signature of other
 * `did-io` drivers.
 *
 * @param {string} did
 * @returns {Promise<DidDocument>}
 * @throws Unsupported Fingerprint Type.
 * @throws Cannot get - missing DID.
 */
async function get({did} = {}) {
  if(!did) {
    throw new Error('Cannot get - missing DID.');
  }

  const fingerprint = did.substr('did:key:'.length);
  const publicKey = LDKeyPair.fromFingerprint({fingerprint});

  return toDidKeyMethodDoc(publicKey);
}

/**
 * Generates a new `did:key` method DID Document for a given key type.
 *
 * @param [string='Ed25519VerificationKey2018'] keyType
 * @returns {Promise<DidDocument>}
 */
async function generate({keyType = 'Ed25519VerificationKey2018'} = {}) {
  const publicKey = await LDKeyPair.generate({type: keyType});
  return toDidKeyMethodDoc(publicKey);
}

/**
 * Converts an LDKeyPair object to a `did:key` method DID Document.
 *
 * @param {LDKeyPair} key
 * @returns {DidDocument}
 */
function toDidKeyMethodDoc(key) {
  const did = 'did:key:' + key.fingerprint();
  const {publicKeyBase58} = key;

  const dhPublicKeyBase58 = convertFromEdPublicKey(publicKeyBase58);

  return {
    '@context': 'https://w3id.org/did/v1',
    id: did,
    publicKey: [{
      id: did,
      type: key.type,
      controller: did,
      publicKeyBase58
    }],
    authentication: [did],
    assertionMethod: [did],
    capabilityDelegation: [did],
    capabilityInvocation: [did],
    keyAgreement: [{
      id: did,
      type: 'X25519KeyAgreementKey2019',
      controller: did,
      publicKeyBase58: dhPublicKeyBase58
    }]
  };
}

module.exports = {
  get,
  generate,
  toDidKeyMethodDoc
}

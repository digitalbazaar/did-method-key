/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {LDKeyPair} = require('crypto-ld');
const X25519KeyPair = require('x25519-key-pair');

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

  return keyToDidDoc(publicKey);
}

/**
 * Generates a new `did:key` method DID Document for a given key type.
 *
 * @param [string='Ed25519VerificationKey2018'] keyType
 * @returns {Promise<DidDocument>}
 */
async function generate({keyType = 'Ed25519VerificationKey2018'} = {}) {
  const publicKey = await LDKeyPair.generate({type: keyType});
  return keyToDidDoc(publicKey);
}

/**
 * Converts an Ed25519KeyPair object to a `did:key` method DID Document.
 *
 * @param {Ed25519KeyPair} edKey
 * @returns {DidDocument}
 */
function keyToDidDoc(edKey) {
  const did = `did:key:${edKey.fingerprint()}`;
  edKey.controller = did;

  const dhKey = X25519KeyPair.fromEdKeyPair(edKey);
  dhKey.id = `${did}#${dhKey.fingerprint()}`;

  return {
    '@context': 'https://w3id.org/did/v1',
    id: did,
    publicKey: [{
      id: did,
      type: edKey.type,
      controller: did,
      publicKeyBase58: edKey.publicKeyBase58
    }],
    authentication: [did],
    assertionMethod: [did],
    capabilityDelegation: [did],
    capabilityInvocation: [did],
    keyAgreement: [{
      id: dhKey.id,
      type: dhKey.type,
      controller: did,
      publicKeyBase58: dhKey.publicKeyBase58
    }]
  };
}

module.exports = {
  get,
  generate,
  keyToDidDoc
}

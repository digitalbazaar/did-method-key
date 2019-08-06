/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {LDKeyPair} = require('crypto-ld');
const base58 = require('bs58');

class DidKeyDriver {
  /**
   * @param {string} did
   * @returns {Promise<DidDocument>}
   * @throws Unsupported Fingerprint Type.
   */
  async get({did}) {
    const fingerprint = did.substr('did:key:'.length);
    const publicKey = LDKeyPair.fromFingerprint({fingerprint});

    return DidKeyDriver.didDoc({did, publicKey});
  }

  async generate({keyType = 'Ed25519VerificationKey2018'}) {
    const publicKey = await LDKeyPair.generate({type: keyType});
    const did = 'did:key:' + publicKey.fingerprint();
    return DidKeyDriver.didDoc({did, publicKey});
  }

  static didDoc({did, publicKey}) {
    const {publicKeyBase58} = publicKey;

    const edPublicKeyBuffer = base58.decode(publicKeyBase58);
    // Converts a 32-byte Ed25519 public key into a 32-byte Curve25519 key
    // Returns null if the given public key in not a valid Ed25519 public key.
    const dhPublicKeyBuffer = ed2curve.convertPublicKey(edPublicKeyBuffer);
    if(!dhPublicKeyBuffer) {
      throw new Error(
        'Error converting to Curve25519: Invalid Ed25519 public key.');
    }
    const kakPublicKeyBase58 = base58.encode(dhPublicKeyBuffer);

    return {
      '@context': 'https://w3id.org/did/v1',
      id: did,
      publicKey: [{
        id: did,
        type: publicKey.type,
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
        publicKeyBase58: kakPublicKeyBase58
      }]
    };
  }
}

module.exports = DidKeyDriver;

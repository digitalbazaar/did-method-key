/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const jsigs = require('jsonld-signatures');
const {LDKeyPair} = require('crypto-ld');

const defaultDocumentLoader = jsigs.extendContextLoader(
  require('./documentLoader'));

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

    return {
      '@context': 'https://w3id.org/security/v2',
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
      capabilityInvocation: [did]
      // keyAgreement: [did]
    };
  }
}

module.exports = DidKeyDriver;

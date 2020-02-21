/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const chai = require('chai');
chai.should();
const {expect} = chai;

const didKeyDriver = require('../lib/').driver();

describe('did:key method driver', () => {
  describe('get', () => {
    it('should get a did:key DID', async () => {
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const keyId = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const didDoc = await didKeyDriver.get({did});

      expect(didDoc.id).to.equal(did);
      expect(didDoc['@context']).to.eql(['https://w3id.org/did/v0.11']);
      expect(didDoc.authentication).to.eql([keyId]);
      expect(didDoc.assertionMethod).to.eql([keyId]);
      expect(didDoc.capabilityDelegation).to.eql([keyId]);
      expect(didDoc.capabilityInvocation).to.eql([keyId]);

      const [publicKey] = didDoc.publicKey;
      expect(publicKey.id).to.equal(keyId);
      expect(publicKey.type).to.equal('Ed25519VerificationKey2018');
      expect(publicKey.controller).to.equal(did);
      expect(publicKey.publicKeyBase58).to
        .equal('B12NYF8RrR3h41TDCTJojY59usg3mbtbjnFs7Eud1Y6u');

      const [kak] = didDoc.keyAgreement;
      expect(kak.id).to.equal(did +
        '#zBzoR5sqFgi6q3iFia8JPNfENCpi7RNSTKF7XNXX96SBY4');
      expect(kak.type).to.equal('X25519KeyAgreementKey2019');
      expect(kak.controller).to.equal(did);
      expect(kak.publicKeyBase58).to
        .equal('JhNWeSVLMYccCk7iopQW4guaSJTojqpMEELgSLhKwRr');
    })
  });

  describe('generate', () => {
    it('should generate and get round trip', async () => {
      const genDidDoc = await didKeyDriver.generate();
      const did = genDidDoc.id;

      const fetchedDidDoc = await didKeyDriver.get({did});

      expect(fetchedDidDoc).to.eql(genDidDoc);
    });
  });
});

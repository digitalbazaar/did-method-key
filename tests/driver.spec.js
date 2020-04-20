/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const chai = require('chai');
chai.should();
const {expect} = chai;

const didKeyDriver = require('../lib/').driver();

describe('did:key method driver', () => {
  describe('get', () => {
    it('should get the DID Document for a did:key DID', async () => {
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      // eslint-disable-next-line max-len
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
        '#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc');
      expect(kak.type).to.equal('X25519KeyAgreementKey2019');
      expect(kak.controller).to.equal(did);
      expect(kak.publicKeyBase58).to
        .equal('JhNWeSVLMYccCk7iopQW4guaSJTojqpMEELgSLhKwRr');
    });

    it('should resolve an individual key within the DID Doc', async () => {
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const keyId = did + '#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const key = await didKeyDriver.get({did: keyId});

      expect(key).to.eql({
        '@context': 'https://w3id.org/security/v2',
        // eslint-disable-next-line max-len
        id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        type: 'Ed25519VerificationKey2018',
        controller: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        publicKeyBase58: 'B12NYF8RrR3h41TDCTJojY59usg3mbtbjnFs7Eud1Y6u'
      });
    });

    it('should resolve an individual key agreement key', async () => {
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const kakKeyId =
        `${did}#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc`;
      const key = await didKeyDriver.get({did: kakKeyId});

      expect(key).to.eql({
        '@context': 'https://w3id.org/security/v2',
        // eslint-disable-next-line max-len
        id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
        type: 'X25519KeyAgreementKey2019',
        controller: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        publicKeyBase58: 'JhNWeSVLMYccCk7iopQW4guaSJTojqpMEELgSLhKwRr'
      });
    });
  });

  describe('generate', async () => {
    it('should generate and get round trip', async () => {
      const genDidDoc = await didKeyDriver.generate();
      const did = genDidDoc.id;
      const keyId = genDidDoc.authentication[0];

      expect(genDidDoc.keys[keyId].controller).to.equal(did);

      const fetchedDidDoc = await didKeyDriver.get({did});

      expect(fetchedDidDoc).to.eql(genDidDoc);
    });
  });

  describe('computeKeyId', async () => {
    const key = {
      fingerprint: () => '12345'
    };

    it('should set the key id based on fingerprint', async () => {
      key.id = await didKeyDriver.computeKeyId({key});

      expect(key.id).to.equal('did:key:12345#12345');
    });
  });

  describe('method', () => {
    it('should return did method id', async () => {
      expect(didKeyDriver.method).to.equal('key');
    });
  });
});

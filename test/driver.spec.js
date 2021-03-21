/*!
 * Copyright (c) 2019-20201 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
chai.should();
const {expect} = chai;

import {driver} from '../';

const didKeyDriver = driver();

describe('did:key method driver', () => {
  describe('get', () => {
    it('should get the DID Document for a did:key DID', async () => {
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      // eslint-disable-next-line max-len
      const keyId = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const didDocument = await didKeyDriver.get({did});

      expect(didDocument.id).to.equal(did);
      expect(didDocument['@context']).to.eql([
        'https://w3id.org/did/v0.11',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ]);
      expect(didDocument.authentication).to.eql([keyId]);
      expect(didDocument.assertionMethod).to.eql([keyId]);
      expect(didDocument.capabilityDelegation).to.eql([keyId]);
      expect(didDocument.capabilityInvocation).to.eql([keyId]);

      const [publicKey] = didDocument.verificationMethod;
      expect(publicKey.id).to.equal(keyId);
      expect(publicKey.type).to.equal('Ed25519VerificationKey2020');
      expect(publicKey.controller).to.equal(did);
      expect(publicKey.publicKeyMultibase).to
        .equal('zB12NYF8RrR3h41TDCTJojY59usg3mbtbjnFs7Eud1Y6u');

      const [kak] = didDocument.keyAgreement;
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
        '@context': 'https://w3id.org/security/suites/ed25519-2020/v1',
        // eslint-disable-next-line max-len
        id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        publicKeyMultibase: 'zB12NYF8RrR3h41TDCTJojY59usg3mbtbjnFs7Eud1Y6u'
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
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const did = didDocument.id;
      const keyId = didDocument.authentication[0];

      expect(keyPairs.get(keyId).controller).to.equal(did);
      expect(keyPairs.get(keyId).id).to.equal(keyId);

      const fetchedDidDoc = await didKeyDriver.get({did});
      expect(fetchedDidDoc).to.eql(didDocument);
    });
  });

  describe('computeId', async () => {
    const keyPair = {fingerprint: () => '12345'};

    it('should set the key id based on fingerprint', async () => {
      keyPair.id = await didKeyDriver.computeId({keyPair});

      expect(keyPair.id).to.equal('did:key:12345#12345');
    });
  });

  describe('method', () => {
    it('should return did method id', async () => {
      expect(didKeyDriver.method).to.equal('key');
    });
  });
});

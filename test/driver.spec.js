/*!
 * Copyright (c) 2019-20201 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
chai.should();
const {expect} = chai;

import {Ed25519VerificationKey2020} from
  '@digitalbazaar/ed25519-verification-key-2020';
import {Ed25519VerificationKey2018} from
  '@digitalbazaar/ed25519-verification-key-2018';
import {driver} from '../';

const didKeyDriver = driver();

describe('did:key method driver', () => {
  describe('get', () => {
    it('should get the DID Document for a did:key DID', async () => {
      const did = 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      const keyId =
        'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T#' +
        'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      const didDocument = await didKeyDriver.get({did});

      expect(didDocument.id).to.equal(did);
      expect(didDocument['@context']).to.eql([
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://w3id.org/security/suites/x25519-2020/v1'
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
        .equal('z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T');

      const [kak] = didDocument.keyAgreement;
      expect(kak.id).to.equal(did +
        '#z6LSotGbgPCJD2Y6TSvvgxERLTfVZxCh9KSrez3WNrNp7vKW');
      expect(kak.type).to.equal('X25519KeyAgreementKey2020');
      expect(kak.controller).to.equal(did);
      expect(kak.publicKeyMultibase).to
        .equal('z6LSotGbgPCJD2Y6TSvvgxERLTfVZxCh9KSrez3WNrNp7vKW');
    });

    it('should get the DID Doc in 2018 mode', async () => {
      const didKeyDriver2018 = driver({
        verificationSuite: Ed25519VerificationKey2018
      });
      // Note: Testing same keys as previous (2020 mode) test
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const didDocument = await didKeyDriver2018.get({did});

      const expectedDidDoc = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2018/v1',
          'https://w3id.org/security/suites/x25519-2019/v1'
        ],
        id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        verificationMethod: [
          {
            id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' +
              '#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
            type: 'Ed25519VerificationKey2018',
            controller:
              'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
            publicKeyBase58: 'B12NYF8RrR3h41TDCTJojY59usg3mbtbjnFs7Eud1Y6u'
          }
        ],
        authentication: [
          'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' +
          '#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH'
        ],
        assertionMethod: [
          'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' +
            '#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH'
        ],
        capabilityDelegation: [
          'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' +
            '#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH'
        ],
        capabilityInvocation: [
          'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' +
            '#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH'
        ],
        keyAgreement: [
          {
            id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' +
                '#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
            type: 'X25519KeyAgreementKey2019',
            controller:
              'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
            publicKeyBase58: 'JhNWeSVLMYccCk7iopQW4guaSJTojqpMEELgSLhKwRr'
          }
        ]
      };

      expect(didDocument).to.eql(expectedDidDoc);
    });

    it('should resolve an individual key within the DID Doc', async () => {
      const did = 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      const keyId = did + '#z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      const key = await didKeyDriver.get({did: keyId});

      expect(key).to.eql({
        '@context': 'https://w3id.org/security/suites/ed25519-2020/v1',
        id: 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T' +
          '#z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
        publicKeyMultibase: 'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T'
      });
    });

    it('should resolve an individual key in 2018 mode', async () => {
      const didKeyDriver2018 = driver({
        verificationSuite: Ed25519VerificationKey2018
      });
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const keyId = did + '#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const key = await didKeyDriver2018.get({did: keyId});

      expect(key).to.eql({
        '@context': 'https://w3id.org/security/suites/ed25519-2018/v1',
        id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' +
          '#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        type: 'Ed25519VerificationKey2018',
        controller: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        publicKeyBase58: 'B12NYF8RrR3h41TDCTJojY59usg3mbtbjnFs7Eud1Y6u'
      });
    });

    it('should resolve an individual key agreement key', async () => {
      const did = 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      const kakKeyId =
        `${did}#z6LSotGbgPCJD2Y6TSvvgxERLTfVZxCh9KSrez3WNrNp7vKW`;
      const key = await didKeyDriver.get({did: kakKeyId});

      expect(key).to.eql({
        '@context': 'https://w3id.org/security/suites/x25519-2020/v1',
        id: 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T' +
          '#z6LSotGbgPCJD2Y6TSvvgxERLTfVZxCh9KSrez3WNrNp7vKW',
        type: 'X25519KeyAgreementKey2020',
        controller: 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
        publicKeyMultibase: 'z6LSotGbgPCJD2Y6TSvvgxERLTfVZxCh9KSrez3WNrNp7vKW'
      });
    });

    it('should resolve an individual key agreement key (2018)', async () => {
      const didKeyDriver2018 = driver({
        verificationSuite: Ed25519VerificationKey2018
      });
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const kakKeyId =
        `${did}#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc`;
      const key = await didKeyDriver2018.get({did: kakKeyId});

      expect(key).to.eql({
        '@context': 'https://w3id.org/security/suites/x25519-2019/v1',
        id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' +
          '#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
        type: 'X25519KeyAgreementKey2019',
        controller: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        publicKeyBase58: 'JhNWeSVLMYccCk7iopQW4guaSJTojqpMEELgSLhKwRr'
      });
    });
  });

  describe('generate', () => {
    it('should generate and get round trip', async () => {
      const {
        didDocument, keyPairs, methodFor
      } = await didKeyDriver.generate();
      const did = didDocument.id;
      const keyId = didDocument.authentication[0];

      const verificationKeyPair = methodFor({purpose: 'assertionMethod'});
      const keyAgreementKeyPair = methodFor({purpose: 'keyAgreement'});

      expect(keyId).to.equal(verificationKeyPair.id);
      expect(keyAgreementKeyPair.type).to.equal('X25519KeyAgreementKey2020');

      expect(keyPairs.get(keyId).controller).to.equal(did);
      expect(keyPairs.get(keyId).id).to.equal(keyId);

      const fetchedDidDoc = await didKeyDriver.get({did});
      expect(fetchedDidDoc).to.eql(didDocument);
    });
  });

  describe('publicKeyToDidDoc', () => {
    it('should convert a key pair instance into a did doc', async () => {
      // Note that a freshly-generated key pair does not have a controller
      // or key id
      const keyPair = await Ed25519VerificationKey2020.generate();
      const {didDocument} = await didKeyDriver.publicKeyToDidDoc({
        publicKeyDescription: keyPair
      });

      expect(didDocument).to.exist;
      expect(didDocument).to.have.property('@context');
      expect(didDocument.id).to.equal(`did:key:${keyPair.fingerprint()}`);
    });

    it('should convert a plain object to a did doc', async () => {
      const publicKeyDescription = {
        '@context': 'https://w3id.org/security/suites/ed25519-2020/v1',
        id: 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T#' +
          'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
        publicKeyMultibase: 'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T'
      };
      const {didDocument} = await didKeyDriver
        .publicKeyToDidDoc({publicKeyDescription});

      expect(didDocument).to.exist;
      expect(didDocument).to.have.property('@context');
      expect(didDocument.id).to.equal(
        'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T'
      );
    });
  });

  describe('publicMethodFor', () => {
    it('should find a key for a did doc and purpose', async () => {
      const did = 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      // First, get the did document
      const didDocument = await didKeyDriver.get({did});
      // Then publicMethodFor can be used to fetch key data
      const keyAgreementData = didKeyDriver.publicMethodFor({
        didDocument, purpose: 'keyAgreement'
      });
      expect(keyAgreementData).to.have
        .property('type', 'X25519KeyAgreementKey2020');
      expect(keyAgreementData).to.have
        .property('publicKeyMultibase',
          'z6LSotGbgPCJD2Y6TSvvgxERLTfVZxCh9KSrez3WNrNp7vKW');

      const authKeyData = didKeyDriver.publicMethodFor({
        didDocument, purpose: 'authentication'
      });
      expect(authKeyData).to.have
        .property('type', 'Ed25519VerificationKey2020');
      expect(authKeyData).to.have
        .property('publicKeyMultibase',
          'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T');
    });

    it('should throw error if key is not found for purpose', async () => {
      const did = 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      // First, get the did document
      const didDocument = await didKeyDriver.get({did});

      let error;
      try {
        didKeyDriver.publicMethodFor({
          didDocument, purpose: 'invalidPurpose'
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.exist;
      expect(error.message).to
        .contain('No verification method found for purpose');
    });
  });

  describe('computeId', () => {
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

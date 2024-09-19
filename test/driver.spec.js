/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as Bls12381Multikey from '@digitalbazaar/bls12-381-multikey';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {createFromMultibase, driver} from '../lib/index.js';
import chai from 'chai';
import {Ed25519VerificationKey2018} from
  '@digitalbazaar/ed25519-verification-key-2018';
import {Ed25519VerificationKey2020} from
  '@digitalbazaar/ed25519-verification-key-2020';
import {
  X25519KeyAgreementKey2019
} from '@digitalbazaar/x25519-key-agreement-key-2019';
import {
  X25519KeyAgreementKey2020
} from '@digitalbazaar/x25519-key-agreement-key-2020';

chai.should();
const {expect} = chai;
const didKeyDriver = driver();
didKeyDriver.use({
  multibaseMultikeyHeader: 'z6Mk',
  fromMultibase: Ed25519VerificationKey2020.from
});

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

    it('should get the DID Document for an ecdsa multikey did', async () => {
      const did = 'did:key:zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR';
      const keyId =
        `${did}#zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR`;
      const didKeyDriverMultikey = driver();

      didKeyDriverMultikey.use({
        multibaseMultikeyHeader: 'zDna',
        fromMultibase: EcdsaMultikey.from
      });

      const didDocument = await didKeyDriverMultikey.get({did});

      expect(didDocument.id).to.equal(did);
      expect(didDocument['@context']).to.eql([
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/multikey/v1'
      ]);
      expect(didDocument.authentication).to.eql([keyId]);
      expect(didDocument.assertionMethod).to.eql([keyId]);
      expect(didDocument.capabilityDelegation).to.eql([keyId]);
      expect(didDocument.capabilityInvocation).to.eql([keyId]);

      const [publicKey] = didDocument.verificationMethod;
      expect(publicKey.id).to.equal(keyId);
      expect(publicKey.type).to.equal('Multikey');
      expect(publicKey.controller).to.equal(did);
      expect(publicKey.publicKeyMultibase).to
        .equal('zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR');
    });

    it('should get the DID Document for a BLS12-381 multikey did', async () => {
      // eslint-disable-next-line max-len
      const publicKeyMultibase = 'zUC7GMwWWkA5UMTx7Gg6sabmpchWgq8p1xGhUXwBiDytY8BgD6eq5AmxNgjwDbAz8Rq6VFBLdNjvXR4ydEdwDEN9L4vGFfLkxs8UsU3wQj9HQGjQb7LHWdRNJv3J1kGoA3BvnBv';
      const did = `did:key:${publicKeyMultibase}`;
      const keyId = `${did}#${publicKeyMultibase}`;
      const didKeyDriverMultikey = driver();

      didKeyDriverMultikey.use({
        multibaseMultikeyHeader: 'zUC6',
        fromMultibase: Bls12381Multikey.from
      });
      didKeyDriverMultikey.use({
        multibaseMultikeyHeader: 'zUC7',
        fromMultibase: Bls12381Multikey.from
      });

      const didDocument = await didKeyDriverMultikey.get({did});

      expect(didDocument.id).to.equal(did);
      expect(didDocument['@context']).to.eql([
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/multikey/v1'
      ]);
      expect(didDocument.authentication).to.eql([keyId]);
      expect(didDocument.assertionMethod).to.eql([keyId]);
      expect(didDocument.capabilityDelegation).to.eql([keyId]);
      expect(didDocument.capabilityInvocation).to.eql([keyId]);

      const [publicKey] = didDocument.verificationMethod;
      expect(publicKey.id).to.equal(keyId);
      expect(publicKey.type).to.equal('Multikey');
      expect(publicKey.controller).to.equal(did);
      expect(publicKey.publicKeyMultibase).to.equal(publicKeyMultibase);
    });

    it('should get the DID Document for a X25519-based DID', async () => {
      const did = 'did:key:z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc';
      const keyId =
        `${did}#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc`;
      const didKeyDriverKak = driver();

      didKeyDriverKak.use({
        multibaseMultikeyHeader: 'z6LS',
        fromMultibase: X25519KeyAgreementKey2020.from
      });

      const didDocument = await didKeyDriverKak.get({did});
      expect(didDocument.id).to.equal(did);
      expect(didDocument['@context']).to.eql([
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/x25519-2020/v1'
      ]);
      const [publicKey] = didDocument.keyAgreement;
      expect(publicKey.id).to.equal(keyId);
      expect(publicKey.type).to.equal('X25519KeyAgreementKey2020');
      expect(publicKey.controller).to.equal(did);
      expect(publicKey.publicKeyMultibase).to
        .equal('z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc');
    });

    it('should get the DID Doc in 2018 mode', async () => {
      const didKeyDriver2018 = driver();
      const multibaseMultikeyHeaders = ['z6Mk'];
      for(const header of multibaseMultikeyHeaders) {
        didKeyDriver2018.use({
          multibaseMultikeyHeader: header,
          fromMultibase: createFromMultibase(Ed25519VerificationKey2018)
        });
      }
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
      const didKeyDriver2018 = driver();

      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const publicKeyMultibase =
        'z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const keyId = `${did}#${publicKeyMultibase}`;
      didKeyDriver2018.use({
        multibaseMultikeyHeader: 'z6Mk',
        fromMultibase: createFromMultibase(Ed25519VerificationKey2018)
      });
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

    it('should resolve an individual X25519-based DID', async () => {
      const did = 'did:key:z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc';
      const keyId =
        `${did}#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc`;
      const didKeyDriverKak = driver();

      didKeyDriverKak.use({
        multibaseMultikeyHeader: 'z6LS',
        fromMultibase: X25519KeyAgreementKey2020.from
      });
      const key = await didKeyDriverKak.get({did: keyId});

      expect(key).to.eql({
        '@context': 'https://w3id.org/security/suites/x25519-2020/v1',
        id: 'did:key:z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc' +
          '#z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
        type: 'X25519KeyAgreementKey2020',
        controller: 'did:key:z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
        publicKeyMultibase: 'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc'
      });
    });

    it('should resolve an individual ecdsa multikey did', async () => {
      const did = 'did:key:zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR';
      const mutikeyDid =
        `${did}#zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR`;
      const didKeyDriverMultikey = driver();

      didKeyDriverMultikey.use({
        multibaseMultikeyHeader: 'zDna',
        fromMultibase: EcdsaMultikey.from
      });
      const key = await didKeyDriverMultikey.get({did: mutikeyDid});

      expect(key).to.eql({
        '@context': 'https://w3id.org/security/multikey/v1',
        id: 'did:key:zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR' +
          '#zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR',
        type: 'Multikey',
        controller: 'did:key:zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR',
        publicKeyMultibase: 'zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR'
      });
    });

    it('should resolve an individual key agreement key (2018)', async () => {
      const didKeyDriver2018 = driver();
      const did = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
      const publicKeyMultibase =
        'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc';
      const kakKeyId = `${did}#${publicKeyMultibase}`;
      didKeyDriver2018.use({
        multibaseMultikeyHeader: 'z6Mk',
        fromMultibase: createFromMultibase(Ed25519VerificationKey2018)
      });
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

  describe('fromKeyPair', () => {
    it('should generate DID document and get round trip', async () => {
      const publicKeyMultibase =
        'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      const keyPair = await Ed25519VerificationKey2020.from({
        publicKeyMultibase
      });
      const {
        didDocument, keyPairs, methodFor
      } = await didKeyDriver.fromKeyPair({verificationKeyPair: keyPair});

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
    it('should generate "EcdsaMultikey" DID document using keypair',
      async () => {
        const publicKeyMultibase =
          'zDnaeucDGfhXHoJVqot3p21RuupNJ2fZrs8Lb1GV83VnSo2jR';
        const keyPair = await EcdsaMultikey.from({publicKeyMultibase});
        const didKeyDriverMultikey = driver();
        didKeyDriverMultikey.use({
          multibaseMultikeyHeader: 'zDna',
          fromMultibase: EcdsaMultikey.from
        });
        const {
          didDocument, keyPairs, methodFor
        } = await didKeyDriverMultikey.fromKeyPair({
          verificationKeyPair: keyPair
        });
        const did = didDocument.id;
        const keyId = didDocument.authentication[0];

        const verificationKeyPair = methodFor({purpose: 'assertionMethod'});
        let err;
        let keyAgreementKeyPair;
        try {
          keyAgreementKeyPair = methodFor({purpose: 'keyAgreement'});
        } catch(e) {
          err = e;
        }
        expect(err).to.exist;
        expect(keyAgreementKeyPair).to.not.exist;

        expect(keyId).to.equal(verificationKeyPair.id);

        expect(keyPairs.get(keyId).controller).to.equal(did);
        expect(keyPairs.get(keyId).id).to.equal(keyId);
        const fetchedDidDoc = await didKeyDriverMultikey.get({did});
        expect(fetchedDidDoc).to.eql(didDocument);
      });
    it('should generate DID document with verificationKeyPair and ' +
      'keyAgreementKeyPair', async () => {
      const publicKeyMultibaseForVerificationKeyPair =
        'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T';
      const keyPairForVerification = await Ed25519VerificationKey2020.from({
        publicKeyMultibase: publicKeyMultibaseForVerificationKeyPair
      });
      const publicKeyMultibaseForKeyAgreementKeyPair =
        'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc';
      const keyPairForKeyAgreement = await X25519KeyAgreementKey2020.from({
        publicKeyMultibase: publicKeyMultibaseForKeyAgreementKeyPair
      });
      const didKeyDriver = driver();
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6Mk',
        fromMultibase: Ed25519VerificationKey2020.from
      });
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6LS',
        fromMultibase: X25519KeyAgreementKey2020.from
      });
      const {
        didDocument, keyPairs, methodFor
      } = await didKeyDriver.fromKeyPair({
        verificationKeyPair: keyPairForVerification,
        keyAgreementKeyPair: keyPairForKeyAgreement
      });
      const did = didDocument.id;
      const keyId = `did:key:${publicKeyMultibaseForVerificationKeyPair}` +
        `#${publicKeyMultibaseForVerificationKeyPair}`;
      const keyAgreementId =
        `did:key:${publicKeyMultibaseForKeyAgreementKeyPair}` +
        `#${publicKeyMultibaseForKeyAgreementKeyPair}`;
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
        .equal(publicKeyMultibaseForVerificationKeyPair);

      const [kak] = didDocument.keyAgreement;
      const kakDid = `did:key:${publicKeyMultibaseForKeyAgreementKeyPair}`;

      expect(kak.id).to.equal(keyAgreementId);
      expect(kak.type).to.equal('X25519KeyAgreementKey2020');
      expect(kak.controller).to.equal(kakDid);
      expect(kak.publicKeyMultibase).to
        .equal(publicKeyMultibaseForKeyAgreementKeyPair);

      const verificationKeyPair = methodFor({purpose: 'assertionMethod'});
      let err;
      let keyAgreementKeyPair;
      try {
        keyAgreementKeyPair = methodFor({purpose: 'keyAgreement'});
      } catch(e) {
        err = e;
      }
      expect(err).to.not.exist;
      expect(keyAgreementKeyPair).to.exist;
      expect(verificationKeyPair).to.exist;
      expect(verificationKeyPair.id).to.equal(keyId);
      expect(keyAgreementKeyPair.id).to.equal(keyAgreementId);
      expect(keyPairs.get(keyId).controller).to.equal(did);
      expect(keyPairs.get(keyAgreementId).controller).to.equal(kakDid);
    });
    it('should generate DID document from X25519 key', async () => {
      // eslint-disable-next-line max-len
      const publicKeyMultibase = 'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc';
      const keyPair = await X25519KeyAgreementKey2020.from({
        publicKeyMultibase
      });
      const didKeyDriverMultikey = driver();
      didKeyDriverMultikey.use({
        multibaseMultikeyHeader: 'z6LS',
        fromMultibase: X25519KeyAgreementKey2020.from
      });
      const {
        didDocument, keyPairs, methodFor
      } = await didKeyDriverMultikey.fromKeyPair({
        keyAgreementKeyPair: keyPair
      });
      const did = didDocument.id;
      const keyId = didDocument.keyAgreement[0].id;
      const keyAgreementKeyPair = methodFor({purpose: 'keyAgreement'});

      expect(keyId).to.equal(keyAgreementKeyPair.id);

      expect(keyPairs.get(keyId).controller).to.equal(did);
      expect(keyPairs.get(keyId).id).to.equal(keyId);

      const fetchedDidDoc = await didKeyDriverMultikey.get({did});
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
    it('should convert a 2019 X25519-based key to a did doc', async () => {
      const didKeyDriver = driver();
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6LS',
        fromMultibase: X25519KeyAgreementKey2019.from
      });
      const keyPair = await X25519KeyAgreementKey2019.generate();
      const {didDocument} = await didKeyDriver.publicKeyToDidDoc({
        publicKeyDescription: keyPair
      });
      expect(didDocument).to.exist;
      expect(didDocument).to.have.property('@context');
      expect(didDocument.id).to.equal(`did:key:${keyPair.fingerprint()}`);
      expect(didDocument['@context']).to.eql([
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/x25519-2019/v1'
      ]);
      const [publicKey] = didDocument.keyAgreement;
      expect(publicKey.type).to.equal('X25519KeyAgreementKey2019');
      expect(publicKey.controller).to.equal(`did:key:${keyPair.fingerprint()}`);
    });
    it('should convert a 2020 X25519-based key to a did doc', async () => {
      const didKeyDriver = driver();
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6LS',
        fromMultibase: X25519KeyAgreementKey2020.from
      });
      const keyPair = await X25519KeyAgreementKey2020.generate();
      const {didDocument} = await didKeyDriver.publicKeyToDidDoc({
        publicKeyDescription: keyPair
      });
      expect(didDocument).to.exist;
      expect(didDocument).to.have.property('@context');
      expect(didDocument.id).to.equal(`did:key:${keyPair.fingerprint()}`);
      expect(didDocument['@context']).to.eql([
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/x25519-2020/v1'
      ]);
      const [publicKey] = didDocument.keyAgreement;
      expect(publicKey.type).to.equal('X25519KeyAgreementKey2020');
      expect(publicKey.controller).to.equal(`did:key:${keyPair.fingerprint()}`);
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

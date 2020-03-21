/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const chai = require('chai');
chai.should();
const {expect} = chai;

const didKeyDriver = require('../lib/').driver();

describe.only('did:key EcdsaSecp256k1VerificationKey2019', () => {
  describe('generate', () => {
    it('should generate and get round trip', async () => {
      const genDidDoc = await didKeyDriver.generate({keyType: "EcdsaSecp256k1VerificationKey2019"});
      const did = genDidDoc.id;
      const fetchedDidDoc = await didKeyDriver.get({did});
      expect(fetchedDidDoc).to.eql(genDidDoc);
    });
  });
});

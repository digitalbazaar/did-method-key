'use strict';

const base58 = require('bs58');
const ed2curve = require('ed2curve');

module.exports = {
  convertToDhPublicKey(edPublicKeyBase58) {
    const edPublicKeyBuffer = base58.decode(edPublicKeyBase58);
    // Converts a 32-byte Ed25519 public key into a 32-byte Curve25519 key
    // Returns null if the given public key in not a valid Ed25519 public key.
    const dhPublicKeyBuffer = Buffer.from(ed2curve.convertPublicKey(edPublicKeyBuffer));
    if(!dhPublicKeyBuffer) {
      throw new Error(
        'Error converting to Curve25519: Invalid Ed25519 public key.');
    }
    return base58.encode(dhPublicKeyBuffer);
  }
};

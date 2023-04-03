/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * A utility function to create a verification suite.
 *
 * @param {object} options - Options hashmap.
 * @param {Function} options.generate - A method that generates a KeyPair with
 *   an optional deterministic seed.
 * @param {Function} options.from - A method that creates a verification KeyPair
 *   from an existing serialized key.
 *
 * @returns {object} - Verification suite.
 */
export function createVerificationSuite({generate, from}) {
  return {
    async from({...keyPair}) {
      return from({...keyPair});
    },
    async fromFingerprint({fingerprint}) {
      return from({publicKeyMultibase: fingerprint});
    },
    async generate({seed, ...keyPairOptions}) {
      return generate({seed, ...keyPairOptions});
    }
  };
}

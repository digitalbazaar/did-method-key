/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * A utility function to create a key type handler.
 *
 * @param {object} options - Options hashmap.
 * @param {Function} options.generate - A method that generates a KeyPair with
 *   an optional deterministic seed.
 * @param {Function} options.from - A method that creates a KeyPair
 *   from an existing serialized key.
 * @param {Function} options.fromFingerprint - A method that creates a KeyPair
 *   from a key fingerprint.
 *
 * @returns {object} - Keytype handler.
 */
export function createKeyTypeHandler({generate, from, fromFingerprint}) {
  return {
    async from({publicKeyMultibase, ...keyPair}) {
      if(publicKeyMultibase) {
        return fromFingerprint({fingerprint: publicKeyMultibase});
      } else {
        return from({...keyPair});
      }
    },
    async generate({seed, ...keyPairOptions}) {
      return generate({seed, ...keyPairOptions});
    }
  };
}

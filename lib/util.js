/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * A utility function to create a multibase-multikey deserializer function.
 *
 * @param {object} options - Options hashmap.
 * @param {Function} options.from - A method that creates a KeyPair
 *   from an existing serialized key.
 * @param {Function} options.fromFingerprint - A method that creates a KeyPair
 *   from a key fingerprint.
 *
 * @returns {Function} - Multibase-multikey deserializer.
 */
export function createFromMultibase({from, fromFingerprint}) {
  return async function fromMultibase({publicKeyMultibase, ...keyPair}) {
    if(publicKeyMultibase) {
      return fromFingerprint({fingerprint: publicKeyMultibase});
    } else {
      return from({...keyPair});
    }
  };
}

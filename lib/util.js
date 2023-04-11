/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * A utility function to create a multibase-multikey deserializer function.
 *
 * @param {object} options - Options hashmap.
 * @param {Function} options.fromFingerprint - A method that creates a KeyPair
 *   from a key fingerprint.
 *
 * @returns {Function} - Multibase-multikey deserializer.
 */
export function createFromMultibase({fromFingerprint}) {
  return async function fromMultibase({publicKeyMultibase}) {
    return fromFingerprint({fingerprint: publicKeyMultibase});
  };
}

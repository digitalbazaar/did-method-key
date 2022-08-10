/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

import {Ed25519VerificationKey2018} from
  '@digitalbazaar/ed25519-verification-key-2018';
import {
  Ed25519VerificationKey2020
} from '@digitalbazaar/ed25519-verification-key-2020';
import {
  X25519KeyAgreementKey2019
} from '@digitalbazaar/x25519-key-agreement-key-2019';
import {
  X25519KeyAgreementKey2020
} from '@digitalbazaar/x25519-key-agreement-key-2020';

// For backwards compat only, not actually importing this suite
const ED25519_KEY_2018_CONTEXT_URL =
  'https://w3id.org/security/suites/ed25519-2018/v1';

export const contextsBySuite = new Map([
  [Ed25519VerificationKey2020.suite, Ed25519VerificationKey2020.SUITE_CONTEXT],
  ['Ed25519VerificationKey2018', ED25519_KEY_2018_CONTEXT_URL],
  [X25519KeyAgreementKey2020.suite, X25519KeyAgreementKey2020.SUITE_CONTEXT],
  [X25519KeyAgreementKey2019.suite, X25519KeyAgreementKey2019.SUITE_CONTEXT]
]);

export const methodsByKeyFormat = new Map([
  ['Ed25519VerificationKey2018', Ed25519VerificationKey2018],
  ['Ed25519VerificationKey2020', Ed25519VerificationKey2020],
  ['X25519KeyAgreementKey2019', X25519KeyAgreementKey2019],
  ['X25519KeyAgreementKey2020', X25519KeyAgreementKey2020],
  // this is an exception where we convert an ed key to json web key
  ['JsonWebKey2020', Ed25519VerificationKey2020]
]);

/**
   * Gets the encryption method (which should be the keyAgreementKey).
   *
   * @param {object} options - Options to use.
   * @param {object} options.verificationKeyPair - The verification key Pair.
   * @param {Array<string>} options.contexts - The contexts for the did
   *   document and keys.
   *
   * @returns {object} The encryption key.
   */
export function getEncryptionMethod({verificationKeyPair, contexts}) {
  if(verificationKeyPair.type === 'Ed25519VerificationKey2020') {
    contexts.push(Ed25519VerificationKey2020.SUITE_CONTEXT,
      X25519KeyAgreementKey2020.SUITE_CONTEXT);
    return X25519KeyAgreementKey2020
      .fromEd25519VerificationKey2020({keyPair: verificationKeyPair});
  } else if(verificationKeyPair.type === 'Ed25519VerificationKey2018') {
    contexts.push(ED25519_KEY_2018_CONTEXT_URL,
      X25519KeyAgreementKey2019.SUITE_CONTEXT);
    return X25519KeyAgreementKey2019
      .fromEd25519VerificationKey2018({keyPair: verificationKeyPair});
  } else {
    throw new Error(
      'Cannot derive key agreement key from verification key type "' +
        verificationKeyPair.type + '".'
    );
  }
}


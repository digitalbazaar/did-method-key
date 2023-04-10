/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  Ed25519VerificationKey2020
} from '@digitalbazaar/ed25519-verification-key-2020';
import {
  X25519KeyAgreementKey2019
} from '@digitalbazaar/x25519-key-agreement-key-2019';
import {
  X25519KeyAgreementKey2020
} from '@digitalbazaar/x25519-key-agreement-key-2020';

const DID_CONTEXT_URL = 'https://www.w3.org/ns/did/v1';

// For backwards compat only, not actually importing this suite
const ED25519_KEY_2018_CONTEXT_URL =
  'https://w3id.org/security/suites/ed25519-2018/v1';

const contextsBySuite = new Map([
  [Ed25519VerificationKey2020.suite, Ed25519VerificationKey2020.SUITE_CONTEXT],
  ['Ed25519VerificationKey2018', ED25519_KEY_2018_CONTEXT_URL],
  [X25519KeyAgreementKey2020.suite, X25519KeyAgreementKey2020.SUITE_CONTEXT],
  [X25519KeyAgreementKey2019.suite, X25519KeyAgreementKey2019.SUITE_CONTEXT]
]);

/**
 * Returns the public key object for a given key id fragment.
 *
 * @param {object} options - Options hashmap.
 * @param {object} options.didDocument - The DID Document to use when generating
 *   the id.
 * @param {string} options.keyIdFragment - The key identifier fragment.
 *
 * @returns {object} Returns the public key node, with `@context`.
 */
export function getKey({didDocument, keyIdFragment}) {
  // Determine if the key id fragment belongs to the "main" public key,
  // or the keyAgreement key
  const keyId = didDocument.id + '#' + keyIdFragment;
  let publicKey;

  if(didDocument.verificationMethod[0].id === keyId) {
    // Return the public key node for the main public key
    publicKey = didDocument.verificationMethod[0];
  } else {
    // Return the public key node for the X25519 key-agreement key
    publicKey = didDocument.keyAgreement[0];
  }

  return {
    '@context': contextsBySuite.get(publicKey.type),
    ...publicKey
  };
}

export function getDid({verificationKeyPair}) {
  return verificationKeyPair.fingerprint ?
    `did:key:${verificationKeyPair.fingerprint()}` :
    `did:key:${verificationKeyPair.publicKeyMultibase}`;
}

export function setVerificationKeyPairId({verificationKeyPair, did}) {
  verificationKeyPair.id = verificationKeyPair.fingerprint ?
    `${did}#${verificationKeyPair.fingerprint()}` :
    `${did}#${verificationKeyPair.publicKeyMultibase}`;
}

export function getKeyAgreementKeyPair({verificationKeyPair}) {
  const contexts = [DID_CONTEXT_URL];
  // The KAK pair will use the source key's controller, but may generate
  // its own .id
  let keyAgreementKeyPair;

  switch(verificationKeyPair.type) {
    case 'Ed25519VerificationKey2018': {
      keyAgreementKeyPair = X25519KeyAgreementKey2019
        .fromEd25519VerificationKey2018({keyPair: verificationKeyPair});
      contexts.push(
        ED25519_KEY_2018_CONTEXT_URL,
        X25519KeyAgreementKey2019.SUITE_CONTEXT);
      break;
    }
    case 'Ed25519VerificationKey2020': {
      keyAgreementKeyPair = X25519KeyAgreementKey2020
        .fromEd25519VerificationKey2020({keyPair: verificationKeyPair});
      contexts.push(
        Ed25519VerificationKey2020.SUITE_CONTEXT,
        X25519KeyAgreementKey2020.SUITE_CONTEXT);
      break;
    }
    case 'Multikey': {
      // FIXME: Add keyAgreementKeyPair interface for Multikey.
      break;
    }
    default: {
      throw new Error(
        `Cannot derive key agreement key from verification key type
          "${verificationKeyPair.type}".`);
    }
  }
  return {keyAgreementKeyPair, contexts};
}

export function getMultibaseMultikeyHeader({value}) {
  if(!value) {
    throw new TypeError('"publicKeyMultibase" must be a string.');
  }
  return value.slice(0, 4);
}

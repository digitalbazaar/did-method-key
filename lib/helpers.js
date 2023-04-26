/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  X25519KeyAgreementKey2019
} from '@digitalbazaar/x25519-key-agreement-key-2019';
import {
  X25519KeyAgreementKey2020
} from '@digitalbazaar/x25519-key-agreement-key-2020';

const ED25519_KEY_2018_CONTEXT_URL =
  'https://w3id.org/security/suites/ed25519-2018/v1';
const ED25519_KEY_2020_CONTEXT_URL =
  'https://w3id.org/security/suites/ed25519-2020/v1';
const MULTIKEY_CONTEXT_V1_URL = 'https://w3id.org/security/multikey/v1';

const contextsBySuite = new Map([
  ['Ed25519VerificationKey2020', ED25519_KEY_2020_CONTEXT_URL],
  ['Ed25519VerificationKey2018', ED25519_KEY_2018_CONTEXT_URL],
  ['Multikey', MULTIKEY_CONTEXT_V1_URL],
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
  if(didDocument.verificationMethod &&
    didDocument.verificationMethod[0].id === keyId) {
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

export function getDid({keyPair}) {
  return keyPair.fingerprint ? `did:key:${keyPair.fingerprint()}` :
    `did:key:${keyPair.publicKeyMultibase}`;
}

export function setKeyPairId({keyPair, did}) {
  keyPair.id = keyPair.fingerprint ? `${did}#${keyPair.fingerprint()}` :
    `${did}#${keyPair.publicKeyMultibase}`;
}

export function getKeyAgreementKeyPair({contexts, verificationPublicKey}) {
  // The KAK pair will use the source key's controller, but may generate
  // its own .id
  let keyAgreementKeyPair;

  switch(verificationPublicKey.type) {
    case 'Ed25519VerificationKey2018': {
      keyAgreementKeyPair = X25519KeyAgreementKey2019
        .fromEd25519VerificationKey2018({keyPair: verificationPublicKey});
      contexts.push(X25519KeyAgreementKey2019.SUITE_CONTEXT);
      break;
    }
    case 'Ed25519VerificationKey2020': {
      keyAgreementKeyPair = X25519KeyAgreementKey2020
        .fromEd25519VerificationKey2020({keyPair: verificationPublicKey});
      contexts.push(X25519KeyAgreementKey2020.SUITE_CONTEXT);
      break;
    }
    case 'Multikey': {
      // FIXME: Add keyAgreementKeyPair interface for Multikey.
      break;
    }
    default: {
      throw new Error(
        `Cannot derive key agreement key from verification key type
          "${verificationPublicKey.type}".`);
    }
  }
  return {keyAgreementKeyPair};
}

export function getMultibaseMultikeyHeader({value}) {
  if(!value) {
    throw new TypeError('"publicKeyMultibase" must be a string.');
  }
  return value.slice(0, 4);
}

export function addX25519Context({contexts, keyAgreementKeyPair}) {
  const {type} = keyAgreementKeyPair;
  switch(type) {
    case 'X25519KeyAgreementKey2019': {
      if(!contexts.includes(X25519KeyAgreementKey2019.SUITE_CONTEXT)) {
        contexts.push(X25519KeyAgreementKey2019.SUITE_CONTEXT);
      }
      break;
    }
    case 'X25519KeyAgreementKey2020': {
      if(!contexts.includes(X25519KeyAgreementKey2020.SUITE_CONTEXT)) {
        contexts.push(X25519KeyAgreementKey2020.SUITE_CONTEXT);
      }
      break;
    }
    default: {
      throw new Error(`Unsupported key agreement key type, "${type}".`);
    }
  }
}

export async function getKeyPair({
  fromMultibase, publicKeyMultibase, publicKeyDescription
} = {}) {
  let keyPair;
  if(fromMultibase && publicKeyMultibase) {
    keyPair = await fromMultibase({publicKeyMultibase});
  } else {
    keyPair = publicKeyDescription;
  }
  const {type} = keyPair;
  let keyAgreementKeyPair;
  if(type && (type === 'X25519KeyAgreementKey2020' ||
    type === 'X25519KeyAgreementKey2019')) {
    keyAgreementKeyPair = keyPair;
    keyPair = null;
  }
  return {keyPair, keyAgreementKeyPair};
}

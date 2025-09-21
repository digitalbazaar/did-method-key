/*!
 * Copyright (c) 2023-2025 Digital Bazaar, Inc. All rights reserved.
 */
import * as base58btc from 'base58-universal';
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import {
  X25519KeyAgreementKey2020
} from '@digitalbazaar/x25519-key-agreement-key-2020';

const ED25519_KEY_2018_TYPE = 'Ed25519VerificationKey2018';
const ED25519_KEY_2018_CONTEXT_URL =
  'https://w3id.org/security/suites/ed25519-2018/v1';

const ED25519_KEY_2020_TYPE = 'Ed25519VerificationKey2020';
const ED25519_KEY_2020_CONTEXT_URL =
  'https://w3id.org/security/suites/ed25519-2020/v1';

const MULTIKEY_TYPE = 'Multikey';
const MULTIKEY_CONTEXT_V1_URL = 'https://w3id.org/security/multikey/v1';

const X25519_2019_TYPE = 'X25519KeyAgreementKey2019';
const X25519_2019_CONTEXT_URL =
  'https://w3id.org/security/suites/x25519-2019/v1';

const X25519_2020_TYPE = 'X25519KeyAgreementKey2020';
const X25519_2020_CONTEXT_URL =
  'https://w3id.org/security/suites/x25519-2020/v1';

const contextsBySuite = new Map([
  [ED25519_KEY_2020_TYPE, ED25519_KEY_2020_CONTEXT_URL],
  [ED25519_KEY_2018_TYPE, ED25519_KEY_2018_CONTEXT_URL],
  [MULTIKEY_TYPE, MULTIKEY_CONTEXT_V1_URL],
  [X25519_2020_TYPE, X25519_2020_CONTEXT_URL],
  [X25519_2019_TYPE, X25519_2019_CONTEXT_URL]
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
  if(didDocument.verificationMethod?.[0].id === keyId) {
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

export async function getKeyAgreementKeyPair({
  contexts, verificationPublicKey
}) {
  // The KAK pair will use the source key's controller, but may generate
  // its own .id
  let keyAgreementKeyPair;

  // note: a future x25519-multikey lib should handle all key types here
  let is2019 = false;
  if(verificationPublicKey.type === ED25519_KEY_2018_TYPE) {
    is2019 = true;
    contexts.push(X25519_2019_CONTEXT_URL);
    // convert to `ED25519_KEY_2020_TYPE` for conversion below
    verificationPublicKey = await Ed25519Multikey.from(verificationPublicKey);
    verificationPublicKey.type = ED25519_KEY_2020_TYPE;
  } else if(verificationPublicKey.type === ED25519_KEY_2020_TYPE) {
    contexts.push(X25519_2020_CONTEXT_URL);
  }

  switch(verificationPublicKey.type) {
    case ED25519_KEY_2020_TYPE: {
      keyAgreementKeyPair = X25519KeyAgreementKey2020
        .fromEd25519VerificationKey2020({keyPair: verificationPublicKey});
      break;
    }
    case MULTIKEY_TYPE: {
      // FIXME: Add keyAgreementKeyPair interface for Multikey.
      break;
    }
    default: {
      throw new Error(
        `Cannot derive key agreement key from verification key type
          "${verificationPublicKey.type}".`);
    }
  }

  if(is2019) {
    // modify 2020 x25519 key pair for 2019 legacy use...

    // update `type` and add `publicKeyBase58`
    keyAgreementKeyPair.type = X25519_2019_TYPE;
    const {publicKeyMultibase} = keyAgreementKeyPair;
    const multikey = base58btc.decode(publicKeyMultibase.slice(1));
    keyAgreementKeyPair.publicKeyBase58 = base58btc.encode(multikey.slice(2));

    // update `export` to output 2019 legacy version
    const previousExport = keyAgreementKeyPair.export;
    keyAgreementKeyPair.export = (...args) => {
      const exported = previousExport.apply(keyAgreementKeyPair, args);
      if(exported['@context']) {
        exported['@context'] = X25519_2019_CONTEXT_URL;
      }
      delete exported.publicKeyMultibase;
      exported.publicKeyBase58 = keyAgreementKeyPair.publicKeyBase58;
      return exported;
    };
  }

  return {keyAgreementKeyPair};
}

export function getMultibaseMultikeyHeader({value}) {
  if(!value) {
    throw new TypeError('"publicKeyMultibase" must be a string.');
  }
  return value.slice(0, 4);
}

export function addKeyAgreementKeyContext({contexts, keyAgreementKeyPair}) {
  const {type} = keyAgreementKeyPair;
  switch(type) {
    case X25519_2019_TYPE: {
      if(!contexts.includes(X25519_2019_CONTEXT_URL)) {
        contexts.push(X25519_2019_CONTEXT_URL);
      }
      break;
    }
    case X25519_2020_TYPE: {
      if(!contexts.includes(X25519_2020_CONTEXT_URL)) {
        contexts.push(X25519_2020_CONTEXT_URL);
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
  if(type === X25519_2020_TYPE || type === X25519_2019_TYPE) {
    keyAgreementKeyPair = keyPair;
    keyPair = null;
  }
  return {keyPair, keyAgreementKeyPair};
}

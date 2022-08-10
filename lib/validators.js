/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {DidResolverError} from '@digitalbazaar/did-io';

/**
 * General validation for did:keys independent
 * of key type specific validation.
 *
 * @param {object} options - Options to use.
 * @param {string} options.did - A did:key.
 *
 * @throws {DidResolverError} Throws general did:key errors.
 *
 * @returns {undefined} If the didKeyComponents are valid.
 */
export function validateDidKey({did}) {
  const {scheme, method, version, multibase} = parseDidKey({did});
  if(scheme !== 'did') {
    throw new DidResolverError({
      message: `Scheme must be "did" received "${scheme}"`,
      code: 'invalidDid'
    });
  }
  if(method !== 'key') {
    throw new DidResolverError({
      message: `Method must be "key" received "${method}"`,
      code: 'invalidDid'
    });
  }
  if(!multibase.startsWith('z')) {
    throw new DidResolverError({
      message: `Multibase must start with "z" received ${multibase[0]}`,
      code: 'invalidDid'
    });
  }
  _validateVersion({version});
}

/**
 * Public did:keys can be represented in multiple formats.
 * While we don't do any conversion in this library we still make
 * the check.
 *
 * @param {object} options - Options to use.
 * @param {object} options.didOptions - The didOptions from searchParams
 *   and headers.
 * @param {string} options.didOptions.enableExperimentalPublicKeyTypes - An
 *   option that can be passed in to allow experimental key types.
 * @param {boolean} options.didOptions.enableEncryptionKeyDerivation - If
 *   to add the encryption key to the didDocument.
 * @param {object} options.didDocument - The didDocument requred by the did
 *   or didUrl.
 *
 * @throws {Error} Throws UnsupportedPublicKeyType or InvalidPublicKeyType.
 *
 * @returns {undefined} Returns on sucess.
 */
export function validateDidDocument({
  didOptions: {
    enableExperimentalPublicKeyTypes,
    enableEncryptionKeyDerivation
  },
  didDocument,
}) {
  // all of the other did methods so far are signature verification
  if(!enableExperimentalPublicKeyTypes) {
    const verificationFormats = ['Multikey', 'JsonWebKey2020'];
    if(enableEncryptionKeyDerivation) {
      _validateEncryptionMethod({
        method: didDocument.keyAgreement,
        verificationFormats
      });
    }
    _validateSignatureMethod({
      method: didDocument.verificationMethod,
      verificationFormats
    });
  }
}

/**
 * A version must be convertible to a positive integer.
 *
 * @param {object} options - Options to use.
 * @param {string|number} options.version - A did:key:version.
 *
 * @throws {Error} Throws InvalidDid.
 *
 * @returns {undefined} Returns on success.
 */
function _validateVersion({version}) {
  try {
    const versionNumber = Number.parseInt(version);
    if(versionNumber <= 0) {
      throw new DidResolverError({
        message: 'Version must be a positive integer received ' +
          `"${versionNumber}"`,
        code: 'invalidDid'
      });
    }
  } catch(e) {
    throw new DidResolverError({
      message: `Version must be an integer received "${version}"`,
      code: 'invalidDid'
    });
  }
}

export function parseDidKey({did}) {
  const {
    scheme,
    method,
    version = '',
    multibase
  } = _getBaseDidKey({did});
  return {
    scheme,
    method,
    version: version.length === 0 ? '1' : version,
    multibase
  };
}

// if we have a did url we need to remove those components
// so we can correctly parse the identifier after the method
function _getBaseDidKey({did}) {
  const pchar = '[a-zA-Z0-9\\-\\._~]|%[0-9a-fA-F]{2}|[!$&\'()*+,;=:@]';
  const didKeyPattern = '(?<scheme>did):(?<method>key):?(?<version>\\d*)' +
    `:(?<multibase>z(${pchar})+)`;
  // this can return null if scheme, method, and multibase are not defined
  const {groups = {}} = (new RegExp(didKeyPattern).exec(did) || {});
  return groups;
}

function _validateEncryptionMethod({method, verificationFormats}) {
  //keyAgreement is an encryption verification method
  const encryptionFormats = [
    ...verificationFormats,
    'X25519KeyAgreementKey2020'
  ];
  for(const {type} of method) {
    if(!encryptionFormats.includes(type)) {
      throw new DidResolverError({
        message: `Invalid Public Key Type ${type}`,
        code: 'invalidPublicKeyType'
      });
    }
  }
}

function _validateSignatureMethod({method, verificationFormats}) {
  const signatureFormats = [
    ...verificationFormats,
    'Ed25519VerificationKey2020'
  ];
  for(const {type} of method) {
    if(!signatureFormats.includes(type)) {
      throw new DidResolverError({
        message: `Invalid Public Key Type ${method.type}`,
        code: 'invalidPublicKeyType'
      });
    }
  }
}

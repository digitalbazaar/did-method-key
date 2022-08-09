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

// FIXME while we do validate public key formats we do not
// convert to the requested public key format.
/**
 * Public did:keys can be represented in multiple formats.
 * While we don't do any conversion in this library we still make
 * the check.
 *
 * @param {object} options - Options to use.
 * @param {Array<string>} options.publicKeyFormats - A list of
 *   public key formats our did:key implementation supports.
 * @param {object} options.didOptions - The didOptions from searchParams
 *   and headers.
 * @param {string} options.didOptions.publicKeyFormat - The format
 *   the public key should be returned in.
 * @param {string} options.didOptions.enableExperimentalPublicKeyTypes - An
 *   option that can be passed in to allow experimental key types.
 * @param {object} options.didDocument - The didDocument requred by the did
 *   or didUrl.
 *
 * @throws {Error} Throws UnsupportedPublicKeyType or InvalidPublicKeyType.
 *
 * @returns {undefined} Returns on sucess.
 */
export function validateDidDocument({
  publicKeyFormats = [],
  didOptions: {
    publicKeyFormat,
    enableExperimentalPublicKeyTypes
  },
  didDocument,
}) {
  // if no publicKeyFormat was in the options just skip this check
  if(!publicKeyFormat) {
    return;
  }
  // supported public key formats are set manually on config
  if(!publicKeyFormats.includes(publicKeyFormat)) {
    throw new DidResolverError({
      message: `Unsupported public key type ${publicKeyFormat}`,
      code: 'unsupportedPublicKeyType'
    });
  }
  // all of the other did methods so far are signature verification
  if(!enableExperimentalPublicKeyTypes) {
    const verificationFormats = ['Multikey', 'JsonWebKey2020'];
    //keyAgreement is an encryption verification method
    if(didDocument.type === 'X25519KeyAgreementKey2020') {
      const encryptionFormats = [
        ...verificationFormats,
        'X25519KeyAgreementKey2020'
      ];
      if(!encryptionFormats.includes(publicKeyFormat)) {
        throw new DidResolverError({
          message: `Invalid Public Key Type ${publicKeyFormat}`,
          code: 'invalidPublicKeyType'
        });
      }
      // no further checks needed
      return;
    }
    const signatureFormats = [
      ...verificationFormats,
      'Ed25519VerificationKey2020'
    ];
    if(!signatureFormats.includes(publicKeyFormat)) {
      throw new DidResolverError({
        message: `Invalid Public Key Type ${publicKeyFormat}`,
        code: 'invalidPublicKeyType'
      });
    }
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

function _validateEncryptionMethod({}) {

}

function _validateSignatureMethod({}) {

}

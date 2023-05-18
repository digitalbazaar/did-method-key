/*!
* Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {DidResolverError} from '@digitalbazaar/did-io';

/**
 * Throws if the publicKeyFormat is in a format that this library
 * does not have an implementation for.
 *
 * @param {object} options - Options to use.
 * @param {string} options.publicKeyFormat - The publicKeyFormat.
 *
 * @throws {DidResolverError} If there is no supporting library
 *   for the public key format.
 *
 * @returns {undefined} Returns on success.
 */
export function validatePublicKeyFormat({publicKeyFormat}) {
  // FIXME add JsonWebKey2020 support
  const notSupported = new Set(['JsonWebKey2020']);
  if(notSupported.has(publicKeyFormat)) {
    throw new DidResolverError({
      message: `Representation NotSupported ${publicKeyFormat}`,
      code: 'representationNotSupported'
    });
  }
}

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
  // the parse step will throw if the did doesn't follow the format:
  // did:key or the multibase value doesn't start with z
  const {version} = parseDidKey({did});
  // so we just need to validate that the version
  // is convertible to a positive integer
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
  const versionNumber = Number.parseInt(version);
  if(Number.isNaN(versionNumber)) {
    throw new DidResolverError({
      message: 'Version must be a positive integer received ' +
        `"${version}"`,
      code: 'invalidDid'
    });
  }
  if(versionNumber <= 0) {
    throw new DidResolverError({
      message: 'Version must be a positive integer received ' +
        `"${version}"`,
      code: 'invalidDid'
    });
  }
}

export function parseDidKey({did}) {
  const pchar = '[a-zA-Z0-9\\-\\._~]|%[0-9a-fA-F]{2}|[!$&\'()*+,;=:@]';
  const didKeyPattern = '^(?<scheme>did):(?<method>key)' +
    `(:(?<version>\\d+))?:(?<multibase>z(${pchar})+)`;
  const match = new RegExp(didKeyPattern).exec(did);
  if(!match) {
    throw new DidResolverError({
      message: `Invalid DID ${did}`,
      code: 'invalidDid'
    });
  }
  const {
    groups: {
      scheme,
      method,
      version = '',
      multibase
    }
  } = match;
  return {
    scheme,
    method,
    version: version.length === 0 ? '1' : version,
    multibase
  };
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

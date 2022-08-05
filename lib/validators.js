/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {DidError} from './DidError.js';
export const validateDidKey = ({did}) => {

};

/**
 * General validation for did:keys independent
 * of key type specific validation.
 *
 * @param {object} options - Options to use.
 * @param {string} options.method - A did:method.
 * @param {string|number} options.version - A did:method:version.
 * @param {string} [options.multibase = ''] - The multibase value
 *   of the did:key.
 *
 * @throws {Error} Throws general did:key errors.
 *
 * @returns {undefined} If the didKeyComponents are valid.
 */
function _validateDidKey({
  method,
  version,
  multibase = '',
}) {
  if(method !== 'key') {
    throw new DidError({
      message: `Method must be "key" received "${method}"`,
      code: 'invalidDid'
    });
  }
  if(!multibase.startsWith('z')) {
    throw new DidError({
      message: `Multibase must start with "z" received ${multibase[0]}`,
      code: 'invalidDid'
    });
  }
  _validateVersion({version});
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
      throw new DidError({
        message: 'Version must be a positive integer received ' +
          `"${versionNumber}"`,
        code: 'invalidDid'
      });
    }
  } catch(e) {
    throw new DidError({
      message: `Version must be an integer received "${version}"`,
      code: 'invalidDid'
    });
  }
}


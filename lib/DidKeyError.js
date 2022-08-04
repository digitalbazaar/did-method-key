/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * Used to throw DidKeyErrors.
 *
 * @param {string} message - An error message.
 * @param {string} code - An error code from the did:key spec.
 *
 */
export class DidKeyError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DidKeyError';
    this.code = code;
  }
}

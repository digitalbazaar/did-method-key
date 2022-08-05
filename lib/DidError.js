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
export class DidError extends SyntaxError {
  constructor({message, code}) {
    super(message);
    this.name = 'DidError';
    this.code = code;
  }
}

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var DidKeyDriver = require('./DidKeyDriver.js');

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * Helper method to match the `.driver()` API of other `did-io` plugins.
 *
 * @param {object} options - Options hashmap.
 * @param {object} [options.verificationSuite=Ed25519VerificationKey2020] -
 *   Key suite for the signature verification key suite to use.
 * @param {Function} [options.convert] - An async function to convert a
 *   verification key pair (like ed25519) to a key-agreement key pair (such
 *   as x25519).
 *
 * @returns {DidKeyDriver} Returns an instance of a did:key resolver driver.
 */
function driver({verificationSuite, convert} = {}) {
  return new DidKeyDriver.DidKeyDriver({verificationSuite, convert});
}

exports.DidKeyDriver = DidKeyDriver.DidKeyDriver;
exports.driver = driver;

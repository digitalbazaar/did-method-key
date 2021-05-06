/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {DidKeyDriver} from './DidKeyDriver.js';

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
  return new DidKeyDriver({verificationSuite, convert});
}

export {driver, DidKeyDriver};

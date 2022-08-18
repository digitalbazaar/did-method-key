/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

import {DidKeyDriver} from './DidKeyDriver.js';

/**
 * Helper method to match the `.driver()` API of other `did-io` plugins.
 *
 * @param {object} options - Options object.
 * @param {Map<string, object>} [options.verificationMethods] -
 *   A map of verification methods with the key as the publicKeyFormat.
 *
 * @returns {DidKeyDriver} Returns an instance of a did:key resolver driver.
 */
function driver({verificationMethods} = {}) {
  return new DidKeyDriver({verificationMethods});
}

export {driver, DidKeyDriver};

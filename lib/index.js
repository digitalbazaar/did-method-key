/*!
 * Copyright (c) 2021-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {createFromMultibase} from './util.js';
import {DidKeyDriver} from './DidKeyDriver.js';

/**
 * Helper method to match the `.driver()` API of other `did-io` plugins.
 *
 * @returns {DidKeyDriver} Returns an instance of a did:key resolver driver.
 */
function driver() {
  return new DidKeyDriver();
}

export {createFromMultibase, driver, DidKeyDriver};

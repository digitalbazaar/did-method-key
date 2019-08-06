/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

module.exports = {
  /**
   * Helper method to match the `.driver()` API of other `did-io` plugins.
   * @returns {{get, toDidKeyMethodDoc, generate}}
   */
  driver: () => {
    return require('./driver');
  }
}

/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const DidKeyDriver = require('./DidKeyDriver');

module.exports = {
  driver: options => {
    return new DidKeyDriver(options);
  }
}

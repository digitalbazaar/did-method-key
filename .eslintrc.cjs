/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true
  },
  extends: [
    'digitalbazaar',
    'digitalbazaar/jsdoc',
    'digitalbazaar/module'
  ],
  rules: {
    'unicorn/prefer-node-protocol': 'error'
  }
};

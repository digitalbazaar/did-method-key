/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const jsigs = require('jsonld-signatures');
const defaultDocumentLoader = jsigs.extendContextLoader(
  require('./documentLoader'));

class DidKeyDriver {
}

module.exports = DidKeyDriver;

# did:key method driver _(did-io-key)_

> A [DID](https://w3c-ccg.github.io/did-spec/) (Decentralized Identifier) method driver for the `did-io` library

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Supported Drivers](#supported-drivers)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Security

TBD

## Background

A `did:key` method driver for the [`did-io`](https://github.com/digitalbazaar/did-io)
client library.

See also (related specs):

* [Decentralized Identifiers (DIDs) - Data Model and Syntaxes](https://w3c-ccg.github.io/did-spec/)
* [Veres One DID Method](https://w3c-ccg.github.io/didm-veres-one/)
* [Linked Data Cryptographic Suite Registry](https://w3c-ccg.github.io/ld-cryptosuite-registry/)
* [Linked Data Proofs](https://w3c-dvcg.github.io/ld-proofs/)

## Install

Requires Node.js 8.3+

To install locally (for development):

```
git clone https://github.com/digitalbazaar/did-key-driver.git
cd did-key-driver
npm install
```

## Usage

```js
const didKeyDriver = require('did-key-driver');


didKeyDriver.generate()
  .then(didDocument => {
    console.log(JSON.stringify(didDocument, null, 2));
  })
  .catch(console.error);
```

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)!

PRs accepted.

Small note: If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © Digital Bazaar

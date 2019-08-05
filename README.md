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

The did:key method is used to express public keys in a way that doesn't require 
a DID Registry of any kind. Its general format is:

```
did:key:<multibase encoded, multicodec identified, public key>
```

So, for example, the following DID would be derived from a base-58 encoded 
ed25519 public key:

```
did:key:z279zvWFCpJdqTuZtJRtyYMC1nJy5eb1rLfAMiv5FfPBiy3S
```

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

const didDocument = await didKeyDriver.generate();

JSON.stringify(didDocument, null, 2);
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

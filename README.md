# did:key method driver _(did-method-key)_

[![NPM Version](https://img.shields.io/npm/v/did-method-key.svg?style=flat-square)](https://npm.im/did-method-key)
![Node.js CI](https://github.com/digitalbazaar/did-method-key-js/workflows/Node.js%20CI/badge.svg)

> A [DID](https://w3c-ccg.github.io/did-spec/) (Decentralized Identifier) method driver for the `did-io` library and for standalone use

## Table of Contents

- [Background](#background)
  * [Example DID Document](#example-did-document)
- [Security](#security)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Background

See also (related specs):

* [Decentralized Identifiers (DIDs) - Data Model and Syntaxes](https://w3c-ccg.github.io/did-spec/)
* [Linked Data Cryptographic Suite Registry](https://w3c-ccg.github.io/ld-cryptosuite-registry/)
* [Linked Data Proofs](https://w3c-dvcg.github.io/ld-proofs/)

A `did:key` method driver for the [`did-io`](https://github.com/digitalbazaar/did-io)
client library and for standalone use.

The `did:key` method is used to express public keys in a way that doesn't
require a DID Registry of any kind. Its general format is:

```
did:key:<multibase encoded, multicodec identified, public key>
```

So, for example, the following DID would be derived from a base-58 encoded
ed25519 public key:

```
did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH
```

That DID would correspond to the following DID Document:

### Example DID Document

```json
{
  "@context": ["https://w3id.org/did/v0.11"],
  "id": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  "publicKey": [
    {
      "id": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "publicKeyBase58": "B12NYF8RrR3h41TDCTJojY59usg3mbtbjnFs7Eud1Y6u"
    }
  ],
  "authentication": [
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ],
  "assertionMethod": [
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ],
  "capabilityDelegation": [
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ],
  "capabilityInvocation": [
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ],
  "keyAgreement": [
    {
      "id": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#zBzoR5sqFgi6q3iFia8JPNfENCpi7RNSTKF7XNXX96SBY4",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "publicKeyBase58": "JhNWeSVLMYccCk7iopQW4guaSJTojqpMEELgSLhKwRr"
    }
  ]
}
```

## Security

The `keyAgreement` key is a Curve25519 public key (suitable for
Diffie-Hellman key exchange) that is deterministically _derived_ from the source
Ed25519 key, using  [`ed2curve-js`](https://github.com/dchest/ed2curve-js).

Note that this derived key is optional -- there's currently
[no proof](https://crypto.stackexchange.com/questions/3260/using-same-keypair-for-diffie-hellman-and-signing/3311#3311)
that this is safe to do.

## Install

Requires Node.js 8.3+

To install from `npm`:

```
npm install --save did-method-key
```

To install locally (for development):

```
git clone https://github.com/digitalbazaar/did-method-key.git
cd did-method-key
npm install
```

## Usage

To generate a new key and get its corresponding `did:key` method DID Document:

```js
const didKeyDriver = require('did-method-key').driver();

const didDocument = await didKeyDriver.generate(); // Ed25519 key type by default

console.log(JSON.stringify(didDocument, null, 2)); // see DID Document above

didDocument.keys
// ->
{
  "did:key:z6MkqPnSmWhrV28rjGkGjCuT5Fzxm5WwL6jgAiYc4PvTWVny#z6MkqPnSmWhrV28rjGkGjCuT5Fzxm5WwL6jgAiYc4PvTWVny": {
    "controller": "did:key:z6MkqPnSmWhrV28rjGkGjCuT5Fzxm5WwL6jgAiYc4PvTWVny",
    "type": "Ed25519VerificationKey2018",
    "privateKeyBase58": "3rACVtG71pbij7fvVenidrMjk9jDDMeBG7LeUt84cbyC5BCcAgyrpaDzGHAn38snSXbGKkNhaRKVMvSyt4bpAxgy",
    "publicKeyBase58": "BwXQBGTR9UePcmua3dwcEASxwWF5vDVKUhdgE7xSbH1b"
  },
  "did:key:z6MkqPnSmWhrV28rjGkGjCuT5Fzxm5WwL6jgAiYc4PvTWVny#z6LSjGzxwJ5CdYH1mFFAn8NUQkyXW7zAGcFrTP5pGifBr2Ve": {
    "id": "did:key:z6MkqPnSmWhrV28rjGkGjCuT5Fzxm5WwL6jgAiYc4PvTWVny#z6LSjGzxwJ5CdYH1mFFAn8NUQkyXW7zAGcFrTP5pGifBr2Ve",
    "controller": "did:key:z6MkqPnSmWhrV28rjGkGjCuT5Fzxm5WwL6jgAiYc4PvTWVny",
    "type": "X25519KeyAgreementKey2019",
    "privateKeyBase58": "BGi7pTP2JHo1odGw3mTWnM4hZmyGWWaAPDne2YHY3VEB",
    "publicKeyBase58": "8bpoQzGLY5ZGfrsQFUrX6Am3eyT3a15haQN8nG1f8eit"
  }
}
```

To get a DID Document for an existing `did:key` DID:

```js
const didDocument = await didKeyDriver.get({did: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH'});
```

(Results in the [example DID Doc](#example-did-document) above).

If you have an existing [`crypto-ld`](https://github.com/digitalbazaar/crypto-ld)
key pair, you can convert it to a `did:key` method DID Doc:

```js
const {Ed25519KeyPair} = require('crypto-ld');
const {keyToDidDoc} = require('did-method-key').driver();

const edKey = await Ed25519KeyPair.generate();

const didDoc = await keyToDidDoc(edKey);

// Returns a DID Document
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

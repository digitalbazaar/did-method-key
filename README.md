# did:key method driver _(did-method-key)_

> A [DID](https://w3c-ccg.github.io/did-spec/) (Decentralized Identifier) method driver for the `did-io` library and for standalone use

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
client library and for standalone use.

The `did:key` method is used to express public keys in a way that doesn't 
require a DID Registry of any kind. Its general format is:

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
* [Linked Data Cryptographic Suite Registry](https://w3c-ccg.github.io/ld-cryptosuite-registry/)
* [Linked Data Proofs](https://w3c-dvcg.github.io/ld-proofs/)

## Install

Requires Node.js 8.3+

To install locally (for development):

```
git clone https://github.com/digitalbazaar/did-method-key.git
cd did-method-key
npm install
```

## Usage

To generate a new key and get its corresponding `did:key` method DID Document:

```js
const didKeyDriver = require('did-method-key');

const didDocument = await didKeyDriver.generate(); // Ed25519 key type by default

JSON.stringify(didDocument, null, 2);
```

To get a DID Document for an existing `did:key` DID:

```js
const didDocument = await didKeyDriver.get({did: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH'});
```

Results in:

```json
{
  "@context": "https://w3id.org/did/v1",
  "id": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  "publicKey": [
    {
      "id": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "publicKeyBase58": "B12NYF8RrR3h41TDCTJojY59usg3mbtbjnFs7Eud1Y6u"
    }
  ],
  "authentication": [
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ],
  "assertionMethod": [
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ],
  "capabilityDelegation": [
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ],
  "capabilityInvocation": [
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ],
  "keyAgreement": [
    {
      "id": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "publicKeyBase58": "JhNWeSVLMYccCk7iopQW4guaSJTojqpMEELgSLhKwRr"
    }
  ]
}
```

If you have an existing [`crypto-ld`](https://github.com/digitalbazaar/crypto-ld) 
key pair, you can convert it to a `did:key` method DID Doc:

```js
const {toDidKeyMethodDoc} = require('did-method-key');

const key = await LDKeyPair.generate();

toDidKeyMethodDoc(key);

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

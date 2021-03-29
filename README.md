# did:key method driver _(@digitalbazaar/did-method-key)_

[![Node.js CI](https://github.com/digitalbazaar/did-method-key/workflows/Node.js%20CI/badge.svg)](https://github.com/digitalbazaar/did-method-key/actions?query=workflow%3A%22Node.js+CI%22)
[![Coverage status](https://img.shields.io/codecov/c/github/digitalbazaar/did-method-key)](https://codecov.io/gh/digitalbazaar/did-method-key)
[![NPM Version](https://img.shields.io/npm/v/digitalbazaar/did-method-key)](https://www.npmjs.com/package/@digitalbazaar/did-method-key)

> A [DID](https://w3c.github.io/did-core) (Decentralized Identifier) method driver for the `did-io` library and for standalone use

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

* [Decentralized Identifiers (DIDs)](https://w3c.github.io/did-core)
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
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop",
  "verificationMethod": [
    {
      "id": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop",
      "publicKeyMultibase": "zrS3jcoWtFYvEmdjKkYeXQqgzvTR3FwU3VTyL7gX2Z2S"
    }
  ],
  "authentication": [
    "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop"
  ],
  "assertionMethod": [
    "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop"
  ],
  "capabilityDelegation": [
    "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop"
  ],
  "capabilityInvocation": [
    "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop"
  ],
  "keyAgreement": [
    {
      "id": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6LSmNXTNXTkUPL6UHaBCDJhtvNTTzCgcUQ6kM6S7zngPFPj",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop",
      "publicKeyBase58": "AhMHrDetNvcMNuCQfZnkaL9ycqfZusDwsNNkdY99fscy"
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

Requires Node.js 12+

To install from `npm`:

```
npm install --save @digitalbazaar/did-method-key
```

To install locally (for development):

```
git clone https://github.com/digitalbazaar/did-method-key-js.git
cd did-method-key-js
npm install
```

## Usage

To generate a new key and get its corresponding `did:key` method DID Document:

```js
const didKeyDriver = require('@digitalbazaar/did-method-key').driver();

// generate did:key using Ed25519 key type by default
const {
  didDocument, keyPairs
} = await didKeyDriver.generate();

// print the DID Document above
console.log(JSON.stringify(didDocument, null, 2));

// keyPairs will be set like so ->
Map(
    {
      "id": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop",
      "publicKeyMultibase": "zrS3jcoWtFYvEmdjKkYeXQqgzvTR3FwU3VTyL7gX2Z2S",
      "privateKeyMultibase": "zAikBWSMGw5qsBZ5oz99dZhLUyheEamiKyeyJCMnchnFn1zXapmditR7NY317ajE5KrxGp7FpakADViDFeWhm8C2"
    },
    {
      "id": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6LSmNXTNXTkUPL6UHaBCDJhtvNTTzCgcUQ6kM6S7zngPFPj",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop",
      "publicKeyBase58": "AhMHrDetNvcMNuCQfZnkaL9ycqfZusDwsNNkdY99fscy",
      "privateKeyBase58": "HBxPbDj1ZteHV1t63bwwvEFsssG6u7pGzVEPsHMFyhGz"
    }
);
```

To get a DID Document for an existing `did:key` DID:

```js
const did = 'did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop';
const didDocument = await didKeyDriver.get({did});
```

(Results in the [example DID Doc](#example-did-document) above).

You can also use a `.get()` to retrieve an individual key (this is useful
for constructing `documentLoader`s for JSON-LD Signature libs, and the resulting
key does include the appropriate `@context`).

```js

const verificationKeyId = 'did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6LSmNXTNXTkUPL6UHaBCDJhtvNTTzCgcUQ6kM6S7zngPFPj';
await didKeyDriver.get({url: verificationKeyId});
// ->
{
  "@context": "https://w3id.org/security/v2",
  "id": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop#z6LSmNXTNXTkUPL6UHaBCDJhtvNTTzCgcUQ6kM6S7zngPFPj",
  "type": "X25519KeyAgreementKey2019",
  "controller": "did:key:z6MkfJh6Ks3xDo3PMGUS1KWVNWPgpVjGT9BpjWNuAPeXwmop",
  "publicKeyBase58": "AhMHrDetNvcMNuCQfZnkaL9ycqfZusDwsNNkdY99fscy"
}
```

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)!

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © Digital Bazaar

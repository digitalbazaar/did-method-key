# did:key driver ChangeLog

## 4.0.0 - 2023-TBD

### Added
- Added ECDSA Multikey support. Exports `createVerificationSuite()` utility
  function that can be used to create a `verificationSuite` when creating a
  a `DidKeyDriver` instance.

### Changed
- **BREAKING**: Remove support for node <= 14.

## 3.0.0 - 2022-06-02

### Changed
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Require Node.js >=14.
- Update dependencies.
- Lint module.

## 2.0.0 - 2021-06-19

### Changed
- **BREAKING**: Update 2020 cryptosuites to use multicodec encoding for keys.

## 1.2.0 - 2021-05-26

### Added
- Add backwards compatibility, allow returning the `did:key` document using
  the `Ed25519VerificationKey2018` and `X25519KeyAgreementKey2019` suites.

## 1.1.0 - 2021-05-04

### Added
- Add `didKeyDriver.publicKeyToDidDoc({keyPair})` method. (This used to be
  the `keyToDidDoc()` method, in `<= v0.7.0`, removed in v1.0 and brought back
  by popular demand.)

## 1.0.0 - 2021-04-09

### Changed
- **BREAKING**: Rename npm package from `did-method-key` to
  `@digitalbazaar/did-method-key`.
- **BREAKING**: Return `{didDocument, keyPairs, methodFor}` from `generate()`.
- **BREAKING**: Upgrade to `crypto-ld` v5.0 based key suites, update to use
  `Ed25519VerificationKey2020` and `X25519KeyAgreementKey2020` crypto suites.
- **BREAKING**: DID Document context changed from `'https://w3id.org/did/v0.11'`
  to the DID WG-published `https://www.w3.org/ns/did/v1`, plus the contexts
  for the `Ed25519VerificationKey2020` and `X25519KeyAgreementKey2020` crypto
  suites. See the "Example DID Document" section of the README.
- **BREAKING**: Rename `computeKeyId()` -> `computeId()`.
- Avoid mutation of ed25519 key passed into keyToDidDoc.
- Use underscores for utility functions.
- Add `methodFor` and `publicMethodFor` convenience functions.
- **BREAKING**: Move the lru-cache to `did-io`'s `CachedResolver` class.
- **BREAKING**: `keyToDidDoc` driver method removed. (See Upgrading notes
  for alternatives.)
- **BREAKING**: The `publicKey` property of the DID Document has been deprecated
  by the DID Data Model, and is now renamed to `verificationMethod`.

### Upgrading from <= v.0.7.0

**1)** Check for the changed `generate()` return signature. The usage is now:

```js
const {didDocument, keyPairs, methodFor} = await didKeyDriver.generate();
```

Note that `keyPairs` is a js `Map` instance containing the public/private key
pairs for both the signing key and the X25519 key agreement key.

And the `methodFor` convenience function allows you to fetch a particular
public/private key pair for a given purpose. For example:

```js
const {didDocument, keyPairs, methodFor} = await didKeyDriver.generate();
const authenticationKeyPair = methodFor({purpose: 'authentication'});
const keyAgreementKeyPair = methodFor({purpose: 'keyAgreement'});
```

**2)** Make sure to adjust your `documentLoader` to handle the new contexts.

**3)** The `keyToDidDoc` function has been renamed to `publicKeyToDidDoc()` (as
of v1.1), and the return signature has changed.

```js
// For example, if you have a key description object (such as that returned by
// a KMS system's "generate key" operation):
const publicKeyDescription = {
  "@context": "https://w3id.org/security/suites/ed25519-2020/v1",
  "id": "did:key:z6MkuBLrjSGt1PPADAvuv6rmvj4FfSAfffJotC6K8ZEorYmv#z6MkuBLrjSGt1PPADAvuv6rmvj4FfSAfffJotC6K8ZEorYmv",
  "type": "Ed25519VerificationKey2020",
  "controller": "did:key:z6MkuBLrjSGt1PPADAvuv6rmvj4FfSAfffJotC6K8ZEorYmv",
  "publicKeyMultibase": "zFj5p9C2Sfqth6g6DEXtw5dWFqrtpFn4TCBBPJHGnwKzY"
};
const {didDocument} = await didKeyDriver.publicKeyToDidDoc({publicKeyDescription});

// Or, you can start with an `LDKeyPair` instance:
const keyPair = await Ed25529VerificationKey2020.generate();
const {didDocument} = await didKeyDriver.publicKeyToDidDoc({publicKeyDescription: keyPair});
```

Don't forget that you can use the `didKeyDriver.publicMethodFor({purpose})`
method to fetch a particular key, after creating the DID Document.

```js
const keyAgreementKey = didKeyDriver.publicMethodFor({didDocument, purpose: 'keyAgreement'});
// Note that the resulting keyAgreementKey pair will only have the public key material, not private
```

## 0.7.0 - 2020-09-23

### Added
- Add cache with option to configure its max size.

### Changed
- **BREAKING**: Make `keyToDidDoc` asynchronous.

## 0.6.1 - 2020-04-20

### Changed
- Return public/private key pair from `generate()`, available on `didDoc.keys`.

## 0.6.0 - 2020-04-13

### Changed
- **BREAKING**: Use `x25519-key-pair` v2.0.0, changed fingerprint format
  for X25519 keys.
- Use `crypto-ld` v0.3.7.

### Added
- Add `computeKeyId()` and `method` to driver, to work with `did-io` downstream.

## 0.5.1 - 2020-02-27

### Changed
- Use x25519-key-pair@1.

## 0.5.0 - 2020-02-24

### Added
- `driver.get()` can now also resolve individual keys.

### Changed
- **BREAKING**: Undo previous change, using `https://w3id.org/did/v0.11` as
  `@context`, apologies for the confusion.

## 0.4.0 - 2020-01-29

### Changed
- **BREAKING**: Now using `'https://www.w3.org/ns/did/v1'` as context.

## 0.3.0 - 2020-01-08

### Changed
- **BREAKING**: Fix - Use fingerprint hash fragment as key id.

## 0.2.0 - 2019-08-22

### Added
- Add core files.

- See git history for changes previous to this release.

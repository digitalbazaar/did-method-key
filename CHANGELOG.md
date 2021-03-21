# did:key driver ChangeLog

## 1.0.0 - 

### Changed
- **BREAKING**: Rename npm package from `did-method-key` to 
  `@digitalbazaar/did-method-key`.
- **BREAKING**: Return {didDocument, keyPairs} from `generate()`.
- **BREAKING**: Upgrade to crypto-ld 5.0
- **BREAKING**: Rename `computeKeyId()` -> `computeId()`.
- Avoid mutation of ed25519 key passed into keyToDidDoc.
- Use underscores for utility functions.

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

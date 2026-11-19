# Changelog

Notable changes to three-zoo from 0.17.0 on. Versions follow semver; while the major is 0, a minor
release may break the API. Breaking changes are marked.

## Unreleased

### Added

- `SceneTraversal.getObjectByName` takes an optional type and then skips objects of other types
  with the name.

### Fixed

- `InstancedMeshInstance.isAlive` is false once its pool is destroyed. Before, the instance
  reported itself alive and its calls did nothing.
- `SceneResolver.resolveMeshByName` returns the first mesh with the name and skips other objects
  with that name. Before, it threw when the first object with the name was not a mesh.
- `SceneTraversal.filterObjects` and `filterMaterials` match every name with a global or sticky
  RegExp. Before, such a RegExp resumed at its `lastIndex` and skipped matches.

## 0.17.0 - 2026-11-16

### Added

- `TwoBoneIK.weight` blends the solved rotations of `root` and `middle` with their pose before
  `solve()`, as `AimChainIK.weight` does for its chain.

### Changed

- **Breaking:** `FovPolicyCover` and `FovPolicyFit` swap behavior to match CSS `object-fit` and
  laymur. `FovPolicyCover` now fills the view and crops the target rect, `FovPolicyFit` keeps the
  whole target rect visible. Code that used `FovPolicyCover` to show the whole target switches to
  `FovPolicyFit`, and the other way round.
- **Breaking:** `FovPolicy.calculateFov` is part of the published typings. A custom policy without
  it no longer compiles. Before, it compiled and the camera threw on creation.
- `Sun` and `SkyLight` decode half float HDR data, the default output of three's `RGBELoader`.
  They used to read the raw 16-bit codes, so a pixel of 1.0 gave an intensity of 15360. An
  `intensityScale` picked to compensate for that has to be reset. Float data reads as before, and
  8-bit RGBE data is still not supported.
- The `three` peer range is `>=0.157.0 <0.188.0`, up from `<0.180.0`. The library typechecks
  against the typings of three 0.181 and later, where `Texture.image` is `unknown`.
- `TwoBoneIK` warns about a pole axis parallel to the bone once per solver instead of on every
  `solve()`. The JSDoc of `rootPoleAxis` and `middlePoleAxis` explains the setup for Mixamo rigs,
  whose local Y runs along every bone.

### Fixed

- A new `InstancedMeshInstance` starts at the identity transform. It used to take the matrix of a
  removed instance whose slot it reused, and setting it to the origin had no effect.
- `InstancedMeshPool.sortInstances` reorders instances given in exactly reverse order. It used to
  leave them as they were.

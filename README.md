# three-zoo

[![npm](https://img.shields.io/npm/v/three-zoo.svg)](https://www.npmjs.com/package/three-zoo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Reusable Three.js utilities. WebGL 1 compatible.

## API

- **IK**: `TwoBoneIK` (analytical two-bone solver), `AimChainIK` (distributes aim across a bone chain with per-bone weights).
- **Instanced Mesh Pool**: `InstancedMeshPool`, `InstancedMeshInstance`, `InstancedMeshGroup`. Keyed by geometry+material, auto-grows capacity.
- **Lighting**: `Sun` (DirectionalLight with spherical positioning, shadow auto-config from bounding box or HDR), `SkyLight` (HemisphereLight that samples sky/ground from HDR).
- **Material Converters**: Standard to Basic/Lambert/Phong/Toon/Physical, Basic to Physical. Single static `convert()` call each.
- **DualFovCamera**: PerspectiveCamera with independent horizontal and vertical FOV. Can fit FOV to points, boxes, or skinned meshes.
- **EnhancedPerspectiveCamera**: PerspectiveCamera whose vertical FOV is derived from a `FovPolicy` and the current aspect ratio. Policies: `FovPolicyFixedVertical`, `FovPolicyFixedHorizontal`, `FovPolicyHybrid`, `FovPolicyHybridInverted`, `FovPolicyCover`, `FovPolicyFit`.
- **SceneTraversal**: static helpers for finding/filtering objects and materials by name, regex, or predicate.
- **SceneSorter**: assigns `renderOrder` by distance to a point (front-to-back or back-to-front).
- **SkinnedMeshBaker**: bakes a SkinnedMesh to static geometry at current pose or a specific animation frame.

## Install

```
npm install three-zoo
```

Peer dep: `three` >=0.157.0 <0.180.0

## License

MIT

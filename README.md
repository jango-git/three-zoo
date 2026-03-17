<p align="center">
  <h1 align="center">🦁 🐘 🦊 three-zoo</h1>
  <p align="center">Reusable Three.js utilities.</p>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/three-zoo"><img src="https://img.shields.io/npm/v/three-zoo.svg" alt="npm version"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-%5E5.8.0-blue" alt="TypeScript"></a>
<a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-%5E0.175.0-green" alt="Three.js"></a>
</p>

## Installation

```bash
npm install three-zoo
```

## Contents

- **IK** - `TwoBoneIK`, `AimChainIK`
- **Instanced Mesh Pool** - `InstancedMeshPool`, `InstancedMeshInstance`, `InstancedMeshGroup`
- **Lighting** - `Sun`, `SkyLight`
- **Material Converters** - Standard to Basic / Lambert / Phong / Toon / Physical, Basic to Physical
- **Miscellaneous** - `DualFovCamera`, `SceneTraversal`, `SceneSorter`, `SkinnedMeshBaker`

---

## IK

### TwoBoneIK

Analytical two-bone IK solver. Chain: `root -> middle -> end`. Pole controls bend direction. Writes local quaternions to `root` and `middle`.

```typescript
const ik = new TwoBoneIK(upperArm, foreArm, hand, poleObject, targetObject);

// call after AnimationMixer.update() each frame
ik.solve();

// tune pole twist per bone
ik.rootPoleAxis.set(0, 1, 0);
ik.middlePoleTwist = false;
```

### AimChainIK

Distributes aim rotation across a bone chain according to per-bone weights.

```typescript
const ik = new AimChainIK([spine1, spine2, spine3, head]);

ik.curve = [0.2, 0.5, 0.8, 1.0]; // root gets least, tip gets most
ik.weight = 0.8;                 // global blend

// sample directions before calling - mutates bone quaternions
ik.solve(currentForward, targetDirection);
```

---

## Instanced Mesh Pool

Manages `InstancedMesh` instances keyed by geometry+material. Grows capacity automatically.

```typescript
const pool = new InstancedMeshPool(scene, { initialCapacity: 32, capacityStep: 16 });

// allocate / update / release individual instances
const instance = new InstancedMeshInstance(pool, geometry, material);
instance.setPosition3f(1, 0, 0).setScale3f(2, 2, 2).flushTransform();
instance.destroy();

// group multiple instances under a shared Object3D transform
const group = new InstancedMeshGroup([instanceA, instanceB]);
scene.add(group);
group.position.set(10, 0, 0);
group.flushTransform(); // propagates group world matrix to all instances
group.destroy();
```

---

## Lighting

### Sun

`DirectionalLight` with spherical positioning and shadow auto-configuration.

```typescript
const sun = new Sun();
sun.elevation = Math.PI / 4;
sun.azimuth = Math.PI / 2;
sun.distance = 100;

sun.configureShadowsForBoundingBox(sceneBounds);
sun.setDirectionFromHDRTexture(hdrTexture, 50);
```

### SkyLight

`HemisphereLight` that extracts sky and ground colors from an HDR environment map.

```typescript
const skyLight = new SkyLight();
skyLight.setColorsFromHDRTexture(hdrTexture, {
  skySampleCount: 100,
  groundSampleCount: 100,
});
```

---

## Material Converters

All converters expose a single static `convert(material, options?)`. Common options:

| Option           | Default | Description                          |
|------------------|---------|--------------------------------------|
| `preserveName`   | `true`  | Copy `.name` to the new material     |
| `copyUserData`   | `true`  | Copy `.userData`                     |
| `disposeOriginal`| `false` | Dispose source material after conversion |

```typescript
// Standard -> unlit
const basic = StandardToBasicConverter.convert(mat, { brightnessFactor: 1.3, combineEmissive: true });

// Standard -> diffuse-only lit
const lambert = StandardToLambertConverter.convert(mat);
const phong   = StandardToPhongConverter.convert(mat);
const toon    = StandardToToonConverter.convert(mat);

// Standard <-> Physical
const physical = StandardToPhysicalConverter.convert(mat);
const standard = BasicToPhysicalConverter.convert(basicMat);
```

---

## Miscellaneous

### DualFovCamera

`PerspectiveCamera` with independent horizontal and vertical FOV.

```typescript
const camera = new DualFovCamera(90, 60);
camera.horizontalFov = 100;
camera.verticalFov = 70;

camera.fitVerticalFovToPoints(vertices);
camera.fitVerticalFovToBox(boundingBox);
camera.fitVerticalFovToMesh(skinnedMesh);
camera.lookAtMeshCenterOfMass(skinnedMesh);
```

### SceneTraversal

Static helpers for depth-first scene graph traversal.

```typescript
// find by name
const mesh = SceneTraversal.getObjectByName(scene, 'Player');
const mat  = SceneTraversal.getMaterialByName(scene, 'Metal');

// filter by regex or predicate
const enemies = SceneTraversal.filterObjects(scene, /^enemy_/);
const glass   = SceneTraversal.filterMaterials(scene, /glass/i);

// enumerate with callback
SceneTraversal.enumerateMaterials(scene, (material) => {
  material.needsUpdate = true;
});

// find meshes that use a given material
const users = SceneTraversal.findMaterialUsers(scene, /glass/i);
```

### SceneSorter

Assigns sequential `renderOrder` values sorted by distance to a point. Useful for transparent meshes.

```typescript
// front-to-back
SceneSorter.sortByDistanceToPoint(object, cameraPosition, 0);

// back-to-front (transparent objects)
SceneSorter.sortByDistanceToPoint(object, cameraPosition, 0, true);
```

### SkinnedMeshBaker

Bakes a `SkinnedMesh` to static geometry.

```typescript
// current pose
const staticMesh = SkinnedMeshBaker.bakePose(skinnedMesh);

// specific animation frame
const frameMesh = SkinnedMeshBaker.bakeAnimationFrame(armature, skinnedMesh, 1.5, clip);
```

---

## Requirements

- `three` >=0.157.0 <0.180.0 (peer dependency)

## License

MIT © [jango](https://github.com/jango-git)

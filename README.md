<p align="center">
  <h1 align="center">🦁 three-zoo</h1>
  <p align="center">
    A modest collection of Three.js utilities designed to simplify common 3D development tasks.
  </p>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/three-zoo"><img src="https://img.shields.io/npm/v/three-zoo.svg" alt="npm version"></a>
<a href="https://bundlephobia.com/package/three-zoo"><img src="https://badgen.net/bundlephobia/min/three-zoo" alt="bundle size (min)"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-%5E5.8.0-blue" alt="TypeScript"></a>
<a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-%5E0.175.0-green" alt="Three.js"></a>
</p>

## Features

- 📷 **DualFovCamera** - Independent horizontal and vertical FOV control with auto-fitting
- ☀️ **Sun** - Intuitive spherical positioning for directional lights with HDR integration
- 🔍 **SceneTraversal** - Find and manipulate objects and materials in scene graphs
- 🎭 **SkinnedMeshBaker** - Convert animated meshes to static geometry

## Installation

```bash
npm install three-zoo
```

## DualFovCamera

Advanced camera with independent horizontal and vertical field of view:

```typescript
const camera = new DualFovCamera(90, 60);

// Independent FOV control
camera.horizontalFov = 100;
camera.verticalFov = 70;

// Auto-fit objects in view
camera.fitVerticalFovToPoints(vertices);
camera.fitVerticalFovToBox(boundingBox);
camera.fitVerticalFovToMesh(skinnedMesh);

// Smart camera positioning
camera.lookAtMeshCenterOfMass(skinnedMesh);
```

## Sun

Directional light with spherical positioning:

```typescript
const sun = new Sun();

// Spherical coordinates
sun.elevation = Math.PI / 4;  // 45° above horizon
sun.azimuth = Math.PI / 2;    // 90° rotation
sun.distance = 100;           // Distance from origin

// Automatic shadow configuration
sun.configureShadowsForBoundingBox(sceneBounds);

// Position from HDR environment map
sun.setDirectionFromHDRTexture(hdrTexture, 50);
```

## SceneTraversal

Navigate and manipulate Three.js scene graphs:

```typescript
// Find by name
const player = SceneTraversal.getObjectByName(scene, 'Player');
const metal = SceneTraversal.getMaterialByName(scene, 'MetalMaterial');

// Filter with patterns
const enemies = SceneTraversal.filterObjects(scene, /^enemy_/);
const glassMats = SceneTraversal.filterMaterials(scene, /glass/i);

// Find material users
const glassObjects = SceneTraversal.findMaterialUsers(scene, /glass/i);

// Batch operations
SceneTraversal.enumerateMaterials(scene, (material) => {
  if ('roughness' in material) material.roughness = 0.8;
});
```

## SkinnedMeshBaker

Convert animated meshes to static geometry:

```typescript
// Bake current pose
const staticMesh = SkinnedMeshBaker.bakePose(skinnedMesh);

// Bake specific animation frame
const frameMesh = SkinnedMeshBaker.bakeAnimationFrame(
  armature,
  skinnedMesh,
  1.5,              // Time in seconds
  animationClip
);
```

## Requirements

- Three.js ^0.175.0 (peer dependency)
- TypeScript support included

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT © [jango](https://github.com/jango-git)

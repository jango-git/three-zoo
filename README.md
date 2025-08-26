<p align="center">
  <h1 align="center">🦁 three-zoo</h1>
  <p align="center">
    A small collection of Three.js utilities I use in my daily work with 3D development.
  </p>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/three-zoo"><img src="https://img.shields.io/npm/v/three-zoo.svg" alt="npm version"></a>
<a href="https://bundlephobia.com/package/three-zoo"><img src="https://badgen.net/bundlephobia/min/three-zoo" alt="bundle size (min)"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-%5E5.8.0-blue" alt="TypeScript"></a>
<a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-%5E0.175.0-green" alt="Three.js"></a>
</p>

## What's included

- 📷 **DualFovCamera** - Camera with separate horizontal and vertical FOV controls
- ☀️ **Sun** - Directional light with spherical positioning
- 🔍 **SceneTraversal** - Helper functions for finding objects and materials in scenes
- 🎭 **SkinnedMeshBaker** - Converts animated meshes to static geometry
- 🎨 **StandardToLambertConverter** - Converts PBR materials to Lambert materials
- ✨ **StandardToBasicConverter** - Converts PBR materials to Basic materials

## Installation

```bash
npm install three-zoo
```

## DualFovCamera

A camera that lets you control horizontal and vertical field of view separately:

```typescript
const camera = new DualFovCamera(90, 60);

// Set FOV values independently
camera.horizontalFov = 100;
camera.verticalFov = 70;

// Fit objects in view
camera.fitVerticalFovToPoints(vertices);
camera.fitVerticalFovToBox(boundingBox);
camera.fitVerticalFovToMesh(skinnedMesh);

// Position camera based on mesh center
camera.lookAtMeshCenterOfMass(skinnedMesh);
```

## Sun

A directional light with spherical positioning:

```typescript
const sun = new Sun();

// Position using spherical coordinates
sun.elevation = Math.PI / 4;  // 45° above horizon
sun.azimuth = Math.PI / 2;    // 90° rotation
sun.distance = 100;           // Distance from origin

// Set up shadows for a bounding box
sun.configureShadowsForBoundingBox(sceneBounds);

// Position based on HDR environment map
sun.setDirectionFromHDRTexture(hdrTexture, 50);
```

## SceneTraversal

Functions for working with Three.js scene graphs:

```typescript
// Find by name
const player = SceneTraversal.getObjectByName(scene, 'Player');
const metal = SceneTraversal.getMaterialByName(scene, 'MetalMaterial');

// Find with patterns
const enemies = SceneTraversal.filterObjects(scene, /^enemy_/);
const glassMats = SceneTraversal.filterMaterials(scene, /glass/i);

// Find objects using specific materials
const glassObjects = SceneTraversal.findMaterialUsers(scene, /glass/i);

// Process all materials in a scene
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

## Material Converters

Convert PBR materials to simpler types. Useful for performance optimization:

### StandardToLambertConverter

```typescript
// Basic conversion
const lambertMaterial = StandardToLambertConverter.convert(standardMaterial);

// With options
const lambertMaterial = StandardToLambertConverter.convert(standardMaterial, {
  preserveName: true,
  roughnessColorFactor: 0.9,
  disposeOriginal: true
});
```

### StandardToBasicConverter

```typescript
// Convert to unlit material
const basicMaterial = StandardToBasicConverter.convert(standardMaterial);

// With brightness adjustment
const basicMaterial = StandardToBasicConverter.convert(standardMaterial, {
  brightnessFactor: 1.5,
  combineEmissive: true,
  preserveName: true,
  disposeOriginal: false
});
```

## Requirements

- Three.js ^0.175.0 (peer dependency)
- TypeScript support included

## Contributing

Feel free to submit issues and pull requests if you find these utilities helpful.

## License

MIT © [jango](https://github.com/jango-git)

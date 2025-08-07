# three-zoo

A modest collection of Three.js utilities designed to simplify common 3D development tasks.

## Install

```bash
npm install three-zoo
```

## Overview

**three-zoo** provides focused solutions for recurring challenges in 3D web development:

- **Advanced camera controls** with independent FOV management and auto-fitting
- **Intuitive lighting** with spherical positioning and HDR integration
- **Scene graph utilities** for finding and manipulating objects and materials
- **Animation baking** to convert skinned meshes to static geometry

Each utility is designed to work seamlessly with existing Three.js workflows without imposing architectural constraints.

## Tools

### DualFovCamera

Camera with independent horizontal and vertical field of view control, plus advanced fitting capabilities:

```typescript
const camera = new DualFovCamera(90, 60); // hFov, vFov
camera.horizontalFov = 100; // Change horizontal FOV
camera.verticalFov = 70;    // Change vertical FOV

// Automatically adjust FOV to fit objects
camera.fitVerticalFovToPoints(vertices);
camera.fitVerticalFovToBox(boundingBox);
camera.fitVerticalFovToMesh(skinnedMesh);

// Point camera at mesh center of mass
camera.lookAtMeshCenterOfMass(skinnedMesh);

// Get actual FOV after aspect ratio calculations
const actualHFov = camera.getActualHorizontalFov();
const actualVFov = camera.getActualVerticalFov();
```

### Sun

Directional light with intuitive spherical positioning and automatic shadow configuration:

```typescript
const sun = new Sun();

// Spherical positioning
sun.elevation = Math.PI / 4;  // 45° above horizon
sun.azimuth = Math.PI / 2;    // 90° rotation
sun.distance = 100;           // Distance from origin

// Automatically configure shadows for optimal coverage
sun.configureShadowsForBoundingBox(sceneBounds);

// Position sun based on brightest point in HDR environment map
sun.setDirectionFromHDRTexture(hdrTexture, 50);
```

### SceneTraversal

Scene graph navigation and batch operations for finding and manipulating objects:

```typescript
// Find objects and materials by name
const obj = SceneTraversal.getObjectByName(scene, 'player');
const material = SceneTraversal.getMaterialByName(scene, 'metal');

// Filter with patterns or custom functions
const enemies = SceneTraversal.filterObjects(scene, /^enemy_/);
const glassMaterials = SceneTraversal.filterMaterials(scene, /glass/i);

// Find objects that use specific materials
const meshesWithGlass = SceneTraversal.findMaterialUsers(scene, /glass/i);

// Batch operations on specific object types
SceneTraversal.enumerateObjectsByType(scene, Mesh, (mesh) => {
  mesh.castShadow = true;
});

// Process all materials in the scene
SceneTraversal.enumerateMaterials(scene, (material) => {
  if ('roughness' in material) material.roughness = 0.8;
});
```

### SkinnedMeshBaker

Converts animated skinned meshes to static geometry:

```typescript
// Bake current pose to static mesh
const staticMesh = SkinnedMeshBaker.bakePose(skinnedMesh);

// Bake specific animation frame
const frameMesh = SkinnedMeshBaker.bakeAnimationFrame(
  armature,        // Root object with bones
  skinnedMesh,     // Mesh to bake
  1.5,             // Time in seconds
  animationClip    // Animation to sample
);
```

## Requirements

- Three.js >= 0.150.0
- TypeScript support included

## License

MIT

# three-zoo

A few Three.js utilities to handle common 3D tasks.

## Install

```bash
npm install three-zoo
```

## Tools

### BiFovCamera

Camera with separate horizontal and vertical FOV control:

```typescript
const camera = new BiFovCamera(90, 60); // hFov, vFov
camera.horizontalFov = 100; // Change horizontal FOV
camera.verticalFov = 70;    // Change vertical FOV
```

### Bounds

Extra bounding box calculations:

```typescript
const bounds = new Bounds(mesh);
console.log(bounds.width);         // x-axis length
console.log(bounds.depth);         // z-axis length
console.log(bounds.getVolume());   // volume
```

### InstanceAssembler

Combines identical meshes into instances:

```typescript
// Basic - combine all identical meshes
InstanceAssembler.assemble(scene);

// Custom - only specific meshes
InstanceAssembler.assemble(scene, {
  filter: mesh => mesh.name.startsWith('Tree_'),
  geometryTolerance: 0.001
});
```

### SceneProcessor

Sets up materials and shadows based on naming patterns:

```typescript
SceneProcessor.process(scene, {
  castShadowExpressions: [/^Tree_.*/],
  receiveShadwoExpressions: [/Ground/],
  transparentMaterialExpressions: [/Glass/],
});
```

### SceneTraversal

Scene graph utilities:

```typescript
// Find objects
const obj = SceneTraversal.getObjectByName(scene, 'player');
const objects = SceneTraversal.filterObjects(scene, /^enemy_/);

// Configure shadows
SceneTraversal.setShadowRecursive(scene, true, true);
```

### SkinnedMeshBaker

Converts skinned meshes to static geometry:

```typescript
// Bake current pose
const staticMesh = SkinnedMeshBaker.bakePose(skinnedMesh);

// Bake animation frame
const frameMesh = SkinnedMeshBaker.bakeAnimationFrame(
  armature,
  skinnedMesh,
  1.5,  // time
  clip   // animation
);
```

### Sun

Directional light with spherical positioning:

```typescript
const sun = new Sun();
sun.elevation = Math.PI / 4;  // 45°
sun.azimuth = Math.PI / 2;    // 90°

// Set up shadows
sun.setShadowMapFromBox3(new Bounds().setFromObject(scene));
```

## Requirements

- three >= 0.150.0

## License

MIT

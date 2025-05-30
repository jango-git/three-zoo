import type { Material, Object3D } from "three";
import { InstancedMesh, Mesh } from "three";
import { GeometryHasher } from "./GeometryHasher";
import { SceneTraversal } from "./SceneTraversal";

interface IMeshDescriptor {
  meshes: Mesh[];
  materials: Material[];
  castShadow: boolean;
  receiveShadow: boolean;
}

interface IOptions {
  container: Object3D;
  filter?: (child: Mesh) => boolean;
  geometryTolerance?: number;
}

export class InstanceAssembler {
  public static assemble(options: IOptions): void {
    const dictionary = new Map<string, IMeshDescriptor>();
    const instancedMeshes: InstancedMesh[] = [];
    const tolerance = options.geometryTolerance ?? 1e-6;
    const geometryHashCache = new Map<string, string>();

    SceneTraversal.enumerateObjectsByType(
      options.container,
      Mesh,
      (child: Mesh) => {
        if (
          child.children.length === 0 &&
          (!options.filter || options.filter(child))
        ) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          let geometryHash = geometryHashCache.get(child.geometry.uuid);
          if (!geometryHash) {
            geometryHash = GeometryHasher.getGeometryHash(
              child.geometry,
              tolerance,
            );
            geometryHashCache.set(child.geometry.uuid, geometryHash);
          }

          const materialKey = materials.map((m) => m.uuid).join(",");
          const compositeKey = `${geometryHash}|${materialKey}`;

          const entry = dictionary.get(compositeKey) ?? {
            meshes: [],
            materials: materials,
            castShadow: false,
            receiveShadow: false,
          };

          if (child.castShadow) {
            entry.castShadow = true;
          }
          if (child.receiveShadow) {
            entry.receiveShadow = true;
          }

          entry.meshes.push(child);
          dictionary.set(compositeKey, entry);
        }
      },
    );

    for (const descriptor of dictionary.values()) {
      if (descriptor.meshes.length < 2) {
        continue;
      }
      const { meshes, materials, castShadow, receiveShadow } = descriptor;

      const sortedMeshes = meshes.sort((a, b) => a.name.localeCompare(b.name));
      const defaultMesh = sortedMeshes[0];

      const instancedMesh = new InstancedMesh(
        defaultMesh.geometry,
        materials.length === 1 ? materials[0] : materials,
        sortedMeshes.length,
      );

      instancedMesh.name = defaultMesh.name;
      instancedMesh.castShadow = castShadow;
      instancedMesh.receiveShadow = receiveShadow;

      for (let i = 0; i < sortedMeshes.length; i++) {
        const mesh = sortedMeshes[i];
        mesh.updateWorldMatrix(true, false);
        instancedMesh.setMatrixAt(i, mesh.matrixWorld);
        instancedMesh.userData[mesh.uuid] = mesh.userData;
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMeshes.push(instancedMesh);

      for (const mesh of sortedMeshes) {
        mesh.parent?.remove(mesh);
      }
    }

    if (instancedMeshes.length > 0) {
      options.container.add(...instancedMeshes);
    }
  }
}

import type { Material, Object3D } from "three";
import { InstancedMesh, Mesh } from "three";
import { GeometryHasher } from "./GeometryHasher";
import { SceneTraversal } from "./SceneTraversal";

const MIN_INSTANCE_COUNT = 2;
const DEFAULT_TOLERANCE = 1e-6;

/** A group of meshes that can be instanced together */
interface MeshDescription {
  /** List of meshes */
  meshes: Mesh[];
  /** Materials to use */
  materials: Material[];
  /** Should cast shadows */
  castShadow: boolean;
  /** Should receive shadows */
  receiveShadow: boolean;
}

/** Configuration for instance assembly */
export interface InstanceAssemblerOptions {
  /** Filter which meshes to include */
  filter: (child: Mesh) => boolean;

  /** How close vertices need to be to count as identical */
  geometryTolerance: number;
}

/**
 * Combines identical meshes into instanced versions for better performance.
 * Meshes are considered identical if they share the same geometry and materials.
 */
export class InstanceAssembler {
  /**
   * Find meshes that can be instanced and combine them.
   * Only processes meshes that:
   * - Have no children
   * - Pass the filter function (if any)
   * - Share geometry with at least one other mesh
   *
   * @param container - Object containing meshes to process
   * @param options - Optional settings
   */
  public static assemble(
    container: Object3D,
    options: Partial<InstanceAssemblerOptions> = {},
  ): void {
    const dictionary = new Map<string, MeshDescription>();
    const instances: InstancedMesh[] = [];

    const tolerance = options.geometryTolerance ?? DEFAULT_TOLERANCE;
    const geometryHashes = new Map<string, string>();

    SceneTraversal.enumerateObjectsByType(container, Mesh, (child: Mesh) => {
      if (
        child.children.length === 0 &&
        (!options.filter || options.filter(child))
      ) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        let geometryHash = geometryHashes.get(child.geometry.uuid);
        if (!geometryHash) {
          geometryHash = GeometryHasher.getGeometryHash(
            child.geometry,
            tolerance,
          );
          geometryHashes.set(child.geometry.uuid, geometryHash);
        }

        const materialKey = materials.map((m) => m.uuid).join(",");
        const compositeKey = `${geometryHash}|${materialKey}`;

        const entry = dictionary.get(compositeKey) ?? {
          meshes: [],
          materials,
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
    });

    for (const descriptor of dictionary.values()) {
      if (descriptor.meshes.length < MIN_INSTANCE_COUNT) {
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
      instances.push(instancedMesh);

      for (const mesh of sortedMeshes) {
        mesh.parent?.remove(mesh);
      }
    }

    if (instances.length > 0) {
      container.add(...instances);
    }
  }
}

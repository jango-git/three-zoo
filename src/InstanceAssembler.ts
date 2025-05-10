import { InstancedMesh, Material, Mesh, Object3D } from "three";
import { Enumerator } from "./Enumerator";

interface IMeshDescriptor {
  meshes: Mesh[];
  materials: Material[];
  castShadow: boolean;
  receiveShadow: boolean;
}

interface IOptions {
  container: Object3D;
  filter?: (child: Mesh) => boolean;
  disposeOriginal?: boolean;
}

export class InstanceAssembler {
  public static assemble(options: IOptions): void {
    const dictionary = new Map<string, IMeshDescriptor>();
    const instancedMeshes: InstancedMesh[] = [];

    Enumerator.enumerateObjectsByType(
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

          const key = `${child.geometry.uuid}|${materials.map((m) => m.uuid).join(",")}`;
          const entry = dictionary.get(key) ?? {
            meshes: [],
            materials: materials,
            castShadow: false,
            receiveShadow: false,
          };

          if (child.castShadow) entry.castShadow = true;
          if (child.receiveShadow) entry.receiveShadow = true;

          dictionary.set(key, entry);
        }
      },
    );

    for (const descriptor of dictionary.values()) {
      if (descriptor.meshes.length < 2) continue;
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

      if (options.disposeOriginal === true) {
        for (const material of materials) {
          material.dispose();
        }
      }
    }

    options.container.add(...instancedMeshes);
  }
}

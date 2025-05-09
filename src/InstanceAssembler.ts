import { BufferGeometry, InstancedMesh, Material, Mesh, Object3D } from "three";

interface IOptions {
  container: Object3D;
  filter?: (child: Object3D) => boolean;
}

export class InstanceAssembler {
  public static assemble(options: IOptions): void {
    const dictionary = new Map<BufferGeometry, Mesh[]>();
    const instancedMeshes: InstancedMesh[] = [];

    options.container.traverse((child: Object3D) => {
      if (
        child instanceof Mesh &&
        child.material instanceof Material &&
        child.children.length === 0 &&
        (!options.filter || options.filter(child))
      ) {
        const entry = dictionary.get(child.geometry) ?? [];
        dictionary.set(child.geometry, entry);
        entry.push(child);
      }
    });

    for (const [geometry, meshes] of dictionary) {
      if (meshes.length < 2) continue;

      const sortedMeshes = meshes.sort((a, b) => a.name.localeCompare(b.name));
      const defaultMesh = sortedMeshes[0] as Mesh;

      const instancedMesh = new InstancedMesh(
        geometry,
        defaultMesh.material,
        sortedMeshes.length,
      );

      instancedMesh.name = defaultMesh.name;

      for (let i = 0; i < sortedMeshes.length; i++) {
        const mesh = sortedMeshes[i] as Mesh;
        mesh.updateMatrix();
        mesh.updateMatrixWorld(true);
        instancedMesh.setMatrixAt(i, mesh.matrixWorld);
      }

      instancedMeshes.push(instancedMesh);

      for (const mesh of sortedMeshes) {
        mesh.parent?.remove(mesh);
      }
    }

    options.container.add(...instancedMeshes);
  }
}

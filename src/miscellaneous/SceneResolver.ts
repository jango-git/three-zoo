import { Material, Mesh, Object3D } from "three";

import { SceneTraversal } from "./SceneTraversal.js";

export class SceneResolver {
  public static resolveObject3DByName(scene: Object3D, name: string): Object3D {
    const result = SceneTraversal.getObjectByName(scene, name);
    if (result instanceof Object3D) {
      return result;
    }

    throw new Error(`Object3D with name "${name}" not found.`);
  }

  /** Returns the first mesh with the name; objects of other types with the name are skipped. */
  public static resolveMeshByName(scene: Object3D, name: string): Mesh {
    const result = SceneTraversal.getObjectByName(scene, name, Mesh);
    if (result !== undefined) {
      return result;
    }

    throw new Error(`Mesh with name "${name}" not found.`);
  }

  public static resolveMaterialByName(scene: Object3D, name: string): Material {
    const result = SceneTraversal.getMaterialByName(scene, name);
    if (result instanceof Material) {
      return result;
    }

    throw new Error(`Material with name "${name}" not found.`);
  }
}

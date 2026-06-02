import { Material, Mesh, Object3D } from "three";
import { SceneTraversal } from "./SceneTraversal";

export class SceneResolver {
  public static resolveObject3DByName(scene: Object3D, name: string): Object3D {
    const result = SceneTraversal.getObjectByName(scene, name);
    if (result instanceof Object3D) {
      return result;
    }

    throw new Error(`Object3D with name "${name}" not found.`);
  }

  public static resolveMeshByName(scene: Object3D, name: string): Mesh {
    const result = SceneTraversal.getObjectByName(scene, name);
    if (result instanceof Mesh) {
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

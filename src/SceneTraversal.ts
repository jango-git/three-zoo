import type { Material, Object3D } from "three";
import { Mesh } from "three";

/** Constructor type for type-safe scene traversal */
export type Constructor<T> = abstract new (...args: never[]) => T;

/** Find and modify objects in a Three.js scene */
export class SceneTraversal {
  /** Find first object with exact name match */
  public static getObjectByName(
    object: Object3D,
    name: string,
  ): Object3D | null {
    if (object.name === name) {
      return object;
    }

    for (const child of object.children) {
      const result = SceneTraversal.getObjectByName(child, name);
      if (result) {
        return result;
      }
    }

    return null;
  }

  /** Find first material with exact name match */
  public static getMaterialByName(
    object: Object3D,
    name: string,
  ): Material | null {
    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material.name === name) {
            return material;
          }
        }
      } else if (object.material.name === name) {
        return object.material;
      }
    }

    for (const child of object.children) {
      const material = SceneTraversal.getMaterialByName(child, name);
      if (material) {
        return material;
      }
    }

    return null;
  }

  /** Process all objects of a specific type */
  public static enumerateObjectsByType<T>(
    object: Object3D,
    type: Constructor<T>,
    callback: (instance: T) => void,
  ): void {
    if (object instanceof type) {
      callback(object);
    }

    for (const child of object.children) {
      SceneTraversal.enumerateObjectsByType(child, type, callback);
    }
  }

  /** Process all materials in meshes */
  public static enumerateMaterials(
    object: Object3D,
    callback: (material: Material) => void,
  ): void {
    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          callback(material);
        }
      } else {
        callback(object.material);
      }
    }

    for (const child of object.children) {
      SceneTraversal.enumerateMaterials(child, callback);
    }
  }

  /** Find all objects whose names match a pattern */
  public static filterObjects(object: Object3D, name: RegExp): Object3D[] {
    let result: Object3D[] = [];

    if (object.name && name.test(object.name)) {
      result.push(object);
    }

    for (const child of object.children) {
      result = result.concat(SceneTraversal.filterObjects(child, name));
    }

    return result;
  }

  /** Find all materials whose names match a pattern */
  public static filterMaterials(object: Object3D, name: RegExp): Material[] {
    let result: Material[] = [];

    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material.name && name.test(material.name)) {
            result.push(material);
          }
        }
      } else {
        if (object.material.name && name.test(object.material.name)) {
          result.push(object.material);
        }
      }
    }

    for (const child of object.children) {
      result = result.concat(SceneTraversal.filterMaterials(child, name));
    }

    return result;
  }

  /** Set shadow properties on meshes */
  public static setShadowRecursive(
    object: Object3D,
    castShadow = true,
    receiveShadow = true,
    filter?: (object: Object3D) => boolean,
  ): void {
    if (object instanceof Mesh || "isMesh" in object) {
      (object as Mesh).castShadow = castShadow;
      (object as Mesh).receiveShadow = receiveShadow;
    }

    for (const child of object.children) {
      SceneTraversal.setShadowRecursive(
        child,
        castShadow,
        receiveShadow,
        filter,
      );
    }
  }
}
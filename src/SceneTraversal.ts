import type { Material, Object3D } from "three";
import { Mesh } from "three";

/**
 * Constructor type for runtime type checking.
 *
 * @template T - The type that the constructor creates
 */
export type Constructor<T> = abstract new (...args: never[]) => T;

/**
 * Static methods for traversing Three.js scene hierarchies.
 *
 * All methods use depth-first traversal.
 */
export class SceneTraversal {
  /**
   * Finds first object with exact name match.
   *
   * @param object - Root object to start from
   * @param name - Name to search for (case-sensitive)
   * @returns First matching object or undefined
   */
  public static getObjectByName(
    object: Object3D,
    name: string,
  ): Object3D | undefined {
    if (object.name === name) {
      return object;
    }

    for (const child of object.children) {
      const result = SceneTraversal.getObjectByName(child, name);
      if (result) {
        return result;
      }
    }

    return undefined;
  }

  /**
   * Finds first material with exact name match from mesh objects.
   *
   * @param object - Root object to start from
   * @param name - Material name to search for (case-sensitive)
   * @returns First matching material or undefined
   */
  public static getMaterialByName(
    object: Object3D,
    name: string,
  ): Material | undefined {
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

    return undefined;
  }

  /**
   * Executes callback for all objects of specified type.
   *
   * @template T - Type of objects to process
   * @param object - Root object to start from
   * @param type - Constructor to filter by
   * @param callback - Function to execute for each matching object
   */
  public static enumerateObjectsByType<T extends Object3D>(
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

  /**
   * Executes callback for all materials of specified type from mesh objects.
   *
   * @template T - Type of materials to process
   * @param object - Root object to start from
   * @param type - Constructor to filter by
   * @param callback - Function to execute for each matching material
   */
  public static enumerateMaterialsByType<T extends Material>(
    object: Object3D,
    type: Constructor<T>,
    callback: (material: T) => void,
  ): void {
    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material instanceof type) {
            callback(material);
          }
        }
      } else if (object.material instanceof type) {
        callback(object.material);
      }
    }

    for (const child of object.children) {
      SceneTraversal.enumerateMaterialsByType(child, type, callback);
    }
  }

  /**
   * Executes callback for all objects in hierarchy.
   *
   * @param object - Root object to start from
   * @param callback - Function to execute for each object
   */
  public static enumerateObjects(
    object: Object3D,
    callback: (object: Object3D) => void,
  ): void {
    callback(object);

    for (const child of object.children) {
      SceneTraversal.enumerateObjects(child, callback);
    }
  }

  /**
   * Executes callback for all materials from mesh objects.
   * If callback returns a material, replaces the original material.
   *
   * @param object - Root object to start from
   * @param callback - Function to execute for each material. Return a material to replace.
   */
  public static enumerateMaterials(
    object: Object3D,
    callback: (material: Material, mesh: Mesh) => Material | undefined,
  ): void {
    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (let i = 0; i < object.material.length; i++) {
          object.material[i] =
            callback(object.material[i], object) ?? object.material[i];
        }
      } else {
        object.material = callback(object.material, object) ?? object.material;
      }
    }

    for (const child of object.children) {
      SceneTraversal.enumerateMaterials(child, callback);
    }
  }

  /**
   * Returns all objects matching filter criteria.
   *
   * @param object - Root object to start from
   * @param filter - RegExp for object names or predicate function
   * @returns Array of matching objects
   */
  public static filterObjects(
    object: Object3D,
    filter: RegExp | ((object: Object3D) => boolean),
  ): Object3D[] {
    let result: Object3D[] = [];

    if (typeof filter === "function") {
      if (filter(object)) {
        result.push(object);
      }
    } else {
      if (object.name && filter.test(object.name)) {
        result.push(object);
      }
    }

    for (const child of object.children) {
      result = result.concat(SceneTraversal.filterObjects(child, filter));
    }

    return result;
  }

  /**
   * Returns all materials matching filter criteria from mesh objects.
   *
   * @param object - Root object to start from
   * @param filter - RegExp for material names or predicate function
   * @returns Array of matching materials
   */
  public static filterMaterials(
    object: Object3D,
    filter: RegExp | ((object: Material) => boolean),
  ): Material[] {
    let result: Material[] = [];

    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (typeof filter === "function") {
            if (filter(material)) {
              result.push(material);
            }
          } else if (filter.test(material.name)) {
            result.push(material);
          }
        }
      } else if (typeof filter === "function") {
        if (filter(object.material)) {
          result.push(object.material);
        }
      } else if (filter.test(object.material.name)) {
        result.push(object.material);
      }
    }

    for (const child of object.children) {
      result = result.concat(SceneTraversal.filterMaterials(child, filter));
    }

    return result;
  }

  /**
   * Returns all mesh objects that use any of the specified materials.
   *
   * @param object - Root object to start from
   * @param materials - Array of materials to search for
   * @returns Array of mesh objects using the materials
   */
  public static findMaterialUsers(
    object: Object3D,
    materials: Material[],
  ): Mesh[] {
    let result: Mesh[] = [];

    if (object instanceof Mesh) {
      let hasMatchingMaterial = false;

      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (materials.includes(material)) {
            hasMatchingMaterial = true;
            break;
          }
        }
      } else {
        if (materials.includes(object.material)) {
          hasMatchingMaterial = true;
        }
      }

      if (hasMatchingMaterial) {
        result.push(object);
      }
    }

    for (const child of object.children) {
      result = result.concat(
        SceneTraversal.findMaterialUsers(child, materials),
      );
    }

    return result;
  }

  /**
   * Clones material by name and replaces all instances with the clone.
   *
   * @param object - Root object to start from
   * @param name - Material name to search for (case-sensitive)
   * @returns Cloned material or undefined if not found
   */
  public static cloneMaterialByName(
    object: Object3D,
    name: string,
  ): Material | undefined {
    const originalMaterial = SceneTraversal.getMaterialByName(object, name);

    if (!originalMaterial) {
      return undefined;
    }

    const clonedMaterial = originalMaterial.clone();

    SceneTraversal.replaceMaterial(object, originalMaterial, clonedMaterial);

    return clonedMaterial;
  }

  /**
   * Replaces all instances of a material with another material.
   *
   * @param object - Root object to start from
   * @param oldMaterial - Material to replace
   * @param newMaterial - Material to use as replacement
   */
  private static replaceMaterial(
    object: Object3D,
    oldMaterial: Material,
    newMaterial: Material,
  ): void {
    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        object.material = object.material.map((material) =>
          material === oldMaterial ? newMaterial : material,
        );
      } else if (object.material === oldMaterial) {
        object.material = newMaterial;
      }
    }

    for (const child of object.children) {
      SceneTraversal.replaceMaterial(child, oldMaterial, newMaterial);
    }
  }
}

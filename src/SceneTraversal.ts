import type { Material, Object3D } from "three";
import { Mesh } from "three";

/**
 * Constructor type for scene traversal operations.
 *
 * Represents a constructor function that creates instances of type T.
 * Used for runtime type checking when filtering objects by constructor type.
 *
 * @template T - The type that the constructor creates
 */
export type Constructor<T> = abstract new (...args: never[]) => T;

/**
 * Utility class for finding and modifying objects in a Three.js scene graph.
 *
 * Provides static methods for traversing Three.js scene hierarchies,
 * searching for objects or materials, and performing batch operations.
 *
 * All methods perform depth-first traversal starting from the provided
 * root object and recursively processing all children.
 */
export class SceneTraversal {
  /**
   * Finds the first object in the scene hierarchy with an exact name match.
   *
   * Performs depth-first search through the scene graph starting from the
   * root object. Returns the first object whose name property matches
   * the search string.
   *
   * @param object - The root Object3D to start searching from
   * @param name - The exact name to search for (case-sensitive)
   * @returns The first matching Object3D, or null if no match is found
   */
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

  /**
   * Finds the first material in the scene hierarchy with an exact name match.
   *
   * Performs depth-first search through the scene graph, examining materials
   * attached to Mesh objects. Handles both single materials and material arrays.
   * Returns the first material whose name property matches the search string.
   *
   * @param object - The root Object3D to start searching from
   * @param name - The exact material name to search for (case-sensitive)
   * @returns The first matching Material, or null if no match is found
   */
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

  /**
   * Processes all objects of a specific type in the scene hierarchy.
   *
   * Performs depth-first traversal and executes the callback function
   * for every object that is an instance of the specified type.
   *
   * @template T - The type of objects to process
   * @param object - The root Object3D to start searching from
   * @param type - The constructor/class to filter by (e.g., DirectionalLight, Mesh)
   * @param callback - Function to execute for each matching object instance
   */
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

  /**
   * Processes all materials found in mesh objects within the scene hierarchy.
   *
   * Performs depth-first traversal, finding all Mesh objects and executing
   * the callback function for each material. Handles both single
   * materials and material arrays.
   *
   * @param object - The root Object3D to start searching from
   * @param callback - Function to execute for each material found
   */
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

  /**
   * Finds all objects in the scene hierarchy that match filter criteria.
   *
   * Performs depth-first search and collects all objects that either match
   * a regular expression pattern (applied to object names) or satisfy
   * a predicate function.
   *
   * @param object - The root Object3D to start searching from
   * @param filter - Either a RegExp to test against object names, or a predicate function
   * @returns Array of all matching Object3D instances
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
   * Finds all materials in the scene hierarchy whose names match a pattern.
   *
   * Performs depth-first search through all Mesh objects and collects materials
   * whose name property matches the regular expression. Handles both
   * single materials and material arrays.
   *
   * @param object - The root Object3D to start searching from
   * @param name - Regular expression pattern to test against material names
   * @returns Array of all matching Material instances
   */
  public static filterMaterials(object: Object3D, name: RegExp): Material[] {
    let result: Material[] = [];

    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material.name !== undefined && name.test(material.name)) {
            result.push(material);
          }
        }
      } else {
        if (
          object.material.name !== undefined &&
          name.test(object.material.name)
        ) {
          result.push(object.material);
        }
      }
    }

    for (const child of object.children) {
      result = result.concat(SceneTraversal.filterMaterials(child, name));
    }

    return result;
  }

  /**
   * Finds all mesh objects that use materials with names matching a pattern.
   *
   * Performs depth-first search through all Mesh objects and collects mesh objects
   * whose materials have names that match the regular expression.
   *
   * @param object - The root Object3D to start searching from
   * @param materialName - Regular expression pattern to test against material names
   * @returns Array of all Mesh objects that use materials with matching names
   */
  public static findMaterialUsers(
    object: Object3D,
    materialName: RegExp,
  ): Mesh[] {
    let result: Mesh[] = [];

    if (object instanceof Mesh) {
      let hasMatchingMaterial = false;

      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material.name !== undefined && materialName.test(material.name)) {
            hasMatchingMaterial = true;
            break;
          }
        }
      } else {
        if (
          object.material.name !== undefined &&
          materialName.test(object.material.name)
        ) {
          hasMatchingMaterial = true;
        }
      }

      if (hasMatchingMaterial) {
        result.push(object);
      }
    }

    for (const child of object.children) {
      result = result.concat(
        SceneTraversal.findMaterialUsers(child, materialName),
      );
    }

    return result;
  }
}

import type { Material, Object3D } from "three";
import { Mesh } from "three";

/**
 * Constructor type for type-safe scene traversal operations.
 *
 * This type represents any constructor function that can be used to create instances of type T.
 * It's used for runtime type checking when filtering objects by their constructor type.
 *
 * @template T - The type that the constructor creates
 */
export type Constructor<T> = abstract new (...args: never[]) => T;

/**
 * Utility class for finding and modifying objects in a Three.js scene graph.
 *
 * This class provides static methods for traversing Three.js scene hierarchies,
 * searching for specific objects or materials, and performing batch operations
 * on collections of scene objects.
 *
 * All methods perform depth-first traversal of the scene graph starting from
 * the provided root object and recursively processing all children.
 */
export class SceneTraversal {
  /**
   * Finds the first object in the scene hierarchy with an exact name match.
   *
   * Performs a depth-first search through the scene graph starting from the provided
   * root object. Returns the first object encountered whose name property exactly
   * matches the search string.
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
   * Performs a depth-first search through the scene graph, examining materials
   * attached to Mesh objects. Handles both single materials and material arrays.
   * Returns the first material encountered whose name property exactly matches
   * the search string.
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
   * Performs a depth-first traversal and executes the provided callback function
   * for every object that is an instance of the specified type. This is useful
   * for batch operations on specific object types (e.g., all lights, all meshes, etc.).
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
   * Performs a depth-first traversal, finding all Mesh objects and executing
   * the provided callback function for each material. Handles both single
   * materials and material arrays properly.
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
   * Finds all objects in the scene hierarchy that match the specified filter criteria.
   *
   * Performs a depth-first search and collects all objects that either match
   * a regular expression pattern (applied to the object's name) or satisfy
   * a custom predicate function.
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
   * Finds all materials in the scene hierarchy whose names match a regular expression pattern.
   *
   * Performs a depth-first search through all Mesh objects and collects materials
   * whose name property matches the provided regular expression. Handles both
   * single materials and material arrays properly.
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

  /**
   * Finds all objects (mesh users) that use materials with names matching a regular expression pattern.
   *
   * Performs a depth-first search through all Mesh objects and collects the mesh objects
   * whose materials have names that match the provided regular expression. This is useful
   * for finding all objects that use specific material types or naming patterns.
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
          if (material.name && materialName.test(material.name)) {
            hasMatchingMaterial = true;
            break;
          }
        }
      } else {
        if (object.material.name && materialName.test(object.material.name)) {
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

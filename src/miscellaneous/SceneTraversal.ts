import type { Material, Object3D } from "three";
import { Mesh } from "three";

/** Abstract constructor type, used for `instanceof` filtering. */
export type Constructor<T> = abstract new (...args: never[]) => T;

/** All methods use depth-first traversal. */
export class SceneTraversal {
  /** @param name - Case-sensitive. */
  public static getObjectByName(object: Object3D, name: string): Object3D | undefined {
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

  /** @param name - Case-sensitive. */
  public static getMaterialByName(object: Object3D, name: string): Material | undefined {
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

  /** Only visits materials on `Mesh` nodes. */
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

  public static enumerateObjects(object: Object3D, callback: (object: Object3D) => void): void {
    callback(object);

    for (const child of object.children) {
      SceneTraversal.enumerateObjects(child, callback);
    }
  }

  /**
   * Only visits materials on `Mesh` nodes.
   * Returning a material from the callback replaces the original.
   */
  public static enumerateMaterials(
    object: Object3D,
    callback: (material: Material, mesh: Mesh) => Material | undefined,
  ): void {
    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (let i = 0; i < object.material.length; i++) {
          object.material[i] = callback(object.material[i], object) ?? object.material[i];
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
   * Deduplicates materials before invoking the callback.
   * Replacements returned by the callback are applied after all callbacks complete.
   */
  public static enumerateMaterialsUnique(
    object: Object3D,
    callback: (material: Material, owners: Mesh[]) => Material | undefined,
  ): void {
    const materialOwners = new Map<Material, Set<Mesh>>();

    SceneTraversal.enumerateObjectsByType(object, Mesh, (mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      for (const material of materials) {
        let owners = materialOwners.get(material);
        if (!owners) {
          owners = new Set<Mesh>();
          materialOwners.set(material, owners);
        }
        owners.add(mesh);
      }
    });

    if (materialOwners.size === 0) {
      return;
    }

    const replacements = new Map<Material, Material>();

    for (const [material, ownersSet] of materialOwners) {
      const owners = Array.from(ownersSet);
      const replacement = callback(material, owners);

      if (replacement && replacement !== material) {
        replacements.set(material, replacement);
      }
    }

    if (replacements.size === 0) {
      return;
    }

    for (const [oldMaterial, newMaterial] of replacements) {
      const ownersSet = materialOwners.get(oldMaterial);
      if (!ownersSet) {
        continue;
      }

      for (const mesh of ownersSet) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => (m === oldMaterial ? newMaterial : m));
        } else if (mesh.material === oldMaterial) {
          mesh.material = newMaterial;
        }
      }
    }
  }

  /** @param filter - RegExp tested against `object.name`, or a predicate. */
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

  /** @param filter - RegExp tested against `material.name`, or a predicate. */
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

  public static findMaterialUsers(object: Object3D, materials: Material[]): Mesh[] {
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
      result = result.concat(SceneTraversal.findMaterialUsers(child, materials));
    }

    return result;
  }

  /**
   * Replaces all instances of the named material in the hierarchy with the clone.
   *
   * @param name - Case-sensitive.
   */
  public static cloneMaterialByName(object: Object3D, name: string): Material | undefined {
    const originalMaterial = SceneTraversal.getMaterialByName(object, name);

    if (!originalMaterial) {
      return undefined;
    }

    const clonedMaterial = originalMaterial.clone();

    SceneTraversal.replaceMaterial(object, originalMaterial, clonedMaterial);

    return clonedMaterial;
  }

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

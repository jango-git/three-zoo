import { Material, Mesh, Object3D } from "three";

type Constructor<T> = abstract new (...args: never[]) => T;

export class Enumerator {
  public static getObjectByName(
    object: Object3D,
    name: string,
  ): Object3D | null {
    if (object.name === name) return object;

    for (const child of object.children) {
      const result = Enumerator.getObjectByName(child, name);
      if (result) return result;
    }

    return null;
  }

  public static getMaterialByName(
    object: Object3D,
    name: string,
  ): Material | null {
    if (object instanceof Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material.name === name) return material;
        }
      } else if (object.material.name === name) {
        return object.material;
      }
    }

    for (const child of object.children) {
      const material = Enumerator.getMaterialByName(child, name);
      if (material) return material;
    }

    return null;
  }

  public static enumerateObjectsByType<T>(
    object: Object3D,
    type: Constructor<T>,
    callback: (instance: T) => void,
  ): void {
    if (object instanceof type) {
      callback(object);
    }

    for (const child of object.children) {
      Enumerator.enumerateObjectsByType(child, type, callback);
    }
  }

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
      Enumerator.enumerateMaterials(child, callback);
    }
  }

  public static filterObjects(object: Object3D, name: RegExp): Object3D[] {
    let result: Object3D[] = [];

    if (object.name && name.test(object.name)) {
      result.push(object);
    }

    for (const child of object.children) {
      result = result.concat(Enumerator.filterObjects(child, name));
    }

    return result;
  }

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
      result = result.concat(Enumerator.filterMaterials(child, name));
    }

    return result;
  }

  public static setShadowRecursive(
    object: Object3D,
    castShadow = true,
    receiveShadow = true,
  ): void {
    if (object instanceof Mesh || "isMesh" in object) {
      (object as Mesh).castShadow = castShadow;
      (object as Mesh).receiveShadow = receiveShadow;
    }

    for (const child of object.children) {
      Enumerator.setShadowRecursive(child, castShadow, receiveShadow);
    }
  }
}

import { Box3, Material, Mesh, Object3D, Vector3 } from "three";

export class Object3DToolbox {
  private static tempBox3 = new Box3();
  private static tempVector3 = new Vector3();

  public static getObjectByName(
    object: Object3D,
    name: string,
  ): Object3D | null {
    if (object.name === name) return object;

    for (const child of object.children) {
      const result = Object3DToolbox.getObjectByName(child, name);
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
      const material = Object3DToolbox.getMaterialByName(child, name);
      if (material) return material;
    }

    return null;
  }

  public static enumerateObjectsByType<T>(
    object: Object3D,
    type: new (...args: any[]) => T,
    callback: (instance: T) => void,
  ): void {
    if (object instanceof type) {
      callback(object);
    }

    for (const child of object.children) {
      Object3DToolbox.enumerateObjectsByType(child, type, callback);
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
      Object3DToolbox.enumerateMaterials(child, callback);
    }
  }

  public static calculateBounds(object: Object3D) {
    Object3DToolbox.tempBox3.setFromObject(object);
    return {
      get box() {
        return Object3DToolbox.tempBox3.clone();
      },

      get center() {
        return Object3DToolbox.tempBox3
          .getCenter(Object3DToolbox.tempVector3)
          .clone();
      },

      get size() {
        return Object3DToolbox.tempBox3
          .getSize(Object3DToolbox.tempVector3)
          .clone();
      },

      get width() {
        return Object3DToolbox.tempBox3.max.x - Object3DToolbox.tempBox3.min.x;
      },

      get height() {
        return Object3DToolbox.tempBox3.max.y - Object3DToolbox.tempBox3.min.y;
      },

      get depth() {
        return Object3DToolbox.tempBox3.max.z - Object3DToolbox.tempBox3.min.z;
      },

      get localWidth() {
        const worldWidth =
          Object3DToolbox.tempBox3.max.x - Object3DToolbox.tempBox3.min.x;
        if (!object.parent) return worldWidth;

        object.parent.getWorldScale(Object3DToolbox.tempVector3);
        return worldWidth / Object3DToolbox.tempVector3.x;
      },

      get localHeight() {
        const worldHeight =
          Object3DToolbox.tempBox3.max.y - Object3DToolbox.tempBox3.min.y;
        if (!object.parent) return worldHeight;

        object.parent.getWorldScale(Object3DToolbox.tempVector3);
        return worldHeight / Object3DToolbox.tempVector3.y;
      },

      get localDepth() {
        const worldDepth =
          Object3DToolbox.tempBox3.max.z - Object3DToolbox.tempBox3.min.z;
        if (!object.parent) return worldDepth;

        object.parent.getWorldScale(Object3DToolbox.tempVector3);
        return worldDepth / Object3DToolbox.tempVector3.z;
      },
    };
  }

  public static setShadowRecursive(
    object: Object3D,
    castShadow = true,
    receiveShadow = true,
  ) {
    if ("isMesh" in object) {
      (object as Mesh).castShadow = castShadow;
      (object as Mesh).receiveShadow = receiveShadow;
    }
    object.traverse((child) => {
      if ("isMesh" in child) {
        (child as Mesh).castShadow = castShadow;
        (child as Mesh).receiveShadow = receiveShadow;
      }
    });
  }
}

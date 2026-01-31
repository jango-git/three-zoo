import type { Object3D } from "three";
import { Box3, Mesh, Vector3 } from "three";
import { SceneTraversal } from "./SceneTraversal";

const TEMP_VECTOR = new Vector3();
const TEMP_BOX3 = new Box3();

/**
 * Static utilities for sorting scene objects.
 */
export class SceneSorter {
  /**
   * Sorts all meshes in the hierarchy by distance to a point,
   * assigning sequential `renderOrder` values starting from `baseRenderOrder`.
   *
   * @param object - Root object to start from
   * @param point - Reference point to measure distances against
   * @param baseRenderOrder - Starting render order value
   */
  public static sortByDistanceToPoint(
    object: Object3D,
    point: Vector3,
    baseRenderOrder: number,
  ): void {
    object.updateWorldMatrix(true, true);

    const meshes: Mesh[] = [];
    SceneTraversal.enumerateObjectsByType(object, Mesh, (mesh) =>
      meshes.push(mesh),
    );

    if (meshes.length === 0) {
      return;
    }

    meshes.sort((a, b) => {
      const distanceA = TEMP_BOX3.setFromObject(a)
        .getCenter(TEMP_VECTOR)
        .distanceToSquared(point);
      const distanceB = TEMP_BOX3.setFromObject(b)
        .getCenter(TEMP_VECTOR)
        .distanceToSquared(point);
      return distanceA - distanceB;
    });

    for (let i = 0; i < meshes.length; i++) {
      meshes[i].renderOrder = baseRenderOrder + i;
    }
  }
}

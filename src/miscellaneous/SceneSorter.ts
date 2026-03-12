import type { Object3D } from "three";
import { Box3, Mesh, Vector3 } from "three";
import { SceneTraversal } from "./SceneTraversal";

const TEMP_VECTOR = new Vector3();
const TEMP_BOX3 = new Box3();

export class SceneSorter {
  /**
   * Assigns sequential `renderOrder` values to all meshes in the hierarchy,
   * sorted by distance from their bounding-box center to `point`.
   * Calls `updateWorldMatrix` on the whole hierarchy before sorting.
   *
   * @param reverseOrder - Closer objects get higher `renderOrder` (back-to-front, for transparent meshes).
   */
  public static sortByDistanceToPoint(
    object: Object3D,
    point: Vector3,
    baseRenderOrder: number,
    reverseOrder = false,
  ): void {
    object.updateWorldMatrix(true, true);

    const meshes: Mesh[] = [];
    SceneTraversal.enumerateObjectsByType(object, Mesh, (mesh) => meshes.push(mesh));

    if (meshes.length === 0) {
      return;
    }

    meshes.sort((a, b) => {
      const distanceA = TEMP_BOX3.setFromObject(a).getCenter(TEMP_VECTOR).distanceToSquared(point);
      const distanceB = TEMP_BOX3.setFromObject(b).getCenter(TEMP_VECTOR).distanceToSquared(point);
      return reverseOrder ? distanceB - distanceA : distanceA - distanceB;
    });

    for (let i = 0; i < meshes.length; i++) {
      meshes[i].renderOrder = baseRenderOrder + i;
    }
  }
}

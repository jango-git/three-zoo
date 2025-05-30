import type { AnimationClip, Object3D, SkinnedMesh } from "three";
import { AnimationMixer, BufferAttribute, Mesh, Vector3 } from "three";

/**
 * Utilities for baking poses and animations from SkinnedMesh into a regular static Mesh.
 */
export class SkinnedMeshBaker {
  /**
   * Bakes the current pose of a SkinnedMesh into a regular geometry.
   * Transforms all vertices according to the current skeleton state.
   *
   * @param skinnedMesh - SkinnedMesh from which to bake the geometry
   * @returns A new Mesh with positions corresponding to the current bone positions
   */
  public static bakePose(skinnedMesh: SkinnedMesh): Mesh {
    const bakedGeometry = skinnedMesh.geometry.clone();
    const position = bakedGeometry.attributes["position"] as BufferAttribute;
    const newPositions = new Float32Array(position.count * 3);
    const target = new Vector3();

    for (let i = 0; i < position.count; i++) {
      target.fromBufferAttribute(position, i);
      skinnedMesh.applyBoneTransform(i, target);
      newPositions[i * 3 + 0] = target.x;
      newPositions[i * 3 + 1] = target.y;
      newPositions[i * 3 + 2] = target.z;
    }

    bakedGeometry.setAttribute(
      "position",
      new BufferAttribute(newPositions, 3),
    );
    bakedGeometry.computeVertexNormals();
    bakedGeometry.deleteAttribute("skinIndex");
    bakedGeometry.deleteAttribute("skinWeight");

    const mesh = new Mesh(bakedGeometry, skinnedMesh.material);
    mesh.name = skinnedMesh.name;
    return mesh;
  }

  /**
   * Bakes a SkinnedMesh in a specific pose derived from an AnimationClip at the given timestamp.
   *
   * @param armature - The parent object (typically an armature from GLTF) containing the bones
   * @param skinnedMesh - The SkinnedMesh to be baked
   * @param timeOffset - The animation time in seconds to set
   * @param clip - The animation clip
   * @returns A new Mesh with geometry matching the specified animation frame
   */
  public static bakeAnimationFrame(
    armature: Object3D,
    skinnedMesh: SkinnedMesh,
    timeOffset: number,
    clip: AnimationClip,
  ): Mesh {
    const mixer = new AnimationMixer(armature);
    const action = mixer.clipAction(clip);
    action.play();
    mixer.setTime(timeOffset);

    armature.updateWorldMatrix(true, true);
    skinnedMesh.skeleton.update();

    return this.bakePose(skinnedMesh);
  }
}

import type { AnimationClip, Object3D, SkinnedMesh } from "three";
import { AnimationMixer, BufferAttribute, Mesh, Vector3 } from "three";

/** Number of components per vertex */
const COMPONENT_COUNT = 3;

/** Converts skinned meshes to static meshes */
export class SkinnedMeshBaker {
  /**
   * Converts a skinned mesh to a static mesh in its current pose.
   * The resulting mesh has no bones but looks identical.
   *
   * @param skinnedMesh - Mesh to convert
   * @returns Static mesh with baked vertex positions
   */
  public static bakePose(skinnedMesh: SkinnedMesh): Mesh {
    const bakedGeometry = skinnedMesh.geometry.clone();
    const position = bakedGeometry.attributes["position"] as BufferAttribute;
    const newPositions = new Float32Array(position.count * COMPONENT_COUNT);
    const target = new Vector3();

    for (let i = 0; i < position.count; i++) {
      target.fromBufferAttribute(position, i);
      skinnedMesh.applyBoneTransform(i, target);
      newPositions[i * COMPONENT_COUNT + 0] = target.x;
      newPositions[i * COMPONENT_COUNT + 1] = target.y;
      newPositions[i * COMPONENT_COUNT + 2] = target.z;
    }

    bakedGeometry.setAttribute(
      "position",
      new BufferAttribute(newPositions, COMPONENT_COUNT),
    );
    bakedGeometry.computeVertexNormals();
    bakedGeometry.deleteAttribute("skinIndex");
    bakedGeometry.deleteAttribute("skinWeight");

    const mesh = new Mesh(bakedGeometry, skinnedMesh.material);
    mesh.name = skinnedMesh.name;
    return mesh;
  }

  /**
   * Bakes a single frame from an animation into a static mesh.
   *
   * @param armature - Root object with bones
   * @param skinnedMesh - Mesh to convert
   * @param timeOffset - Time in seconds within the animation
   * @param clip - Animation to get the pose from
   * @returns Static mesh with baked vertex positions
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

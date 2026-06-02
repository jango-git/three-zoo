import type { BufferAttribute, SkinnedMesh } from "three";
import { PerspectiveCamera, Vector3 } from "three";
import { clampFov } from "./fovPolicies/fovMath";
import type { FovPolicy } from "./fovPolicies/FovPolicy";

const DEFAULT_ASPECT = 1;
const DEFAULT_NEAR = 1;
const DEFAULT_FAR = 1000;

/**
 * PerspectiveCamera whose vertical FOV is derived from a {@link FovPolicy} and the current aspect
 * ratio. The policy is applied on every `updateProjectionMatrix()` call, so the standard resize
 * flow (`camera.aspect = w / h; camera.updateProjectionMatrix()`) is all that is needed.
 */
export class EnhancedPerspectiveCamera extends PerspectiveCamera {
  private fovPolicyInternal: FovPolicy;

  constructor(
    fovPolicy: FovPolicy,
    aspect = DEFAULT_ASPECT,
    near = DEFAULT_NEAR,
    far = DEFAULT_FAR,
  ) {
    super(clampFov(fovPolicy.calculateFov(aspect)), aspect, near, far);
    this.fovPolicyInternal = fovPolicy;
    this.updateProjectionMatrix();
  }

  public get fovPolicy(): FovPolicy {
    return this.fovPolicyInternal;
  }

  /** Replacing the policy re-applies it immediately. */
  public set fovPolicy(value: FovPolicy) {
    this.fovPolicyInternal = value;
    this.updateProjectionMatrix();
  }

  /** @override */
  public override updateProjectionMatrix(): void {
    // The PerspectiveCamera constructor calls this before fovPolicyInternal is assigned, so the
    // field may briefly be undefined despite its declared type.
    const policy = this.fovPolicyInternal as FovPolicy | undefined;
    if (policy !== undefined) {
      this.fov = clampFov(policy.calculateFov(this.aspect));
    }

    super.updateProjectionMatrix();
  }

  /**
   * Orients the camera toward the mesh's vertex centroid (mean of the skinned vertices in world
   * space). Calls `skeleton.update()` internally before sampling vertices.
   */
  public lookAtMeshCenterOfMass(skinnedMesh: SkinnedMesh): void {
    skinnedMesh.updateWorldMatrix(true, true);
    skinnedMesh.skeleton.update();

    const position = skinnedMesh.geometry.attributes["position"] as BufferAttribute;
    if (position.count === 0) {
      return;
    }

    const vertex = new Vector3();
    const centroid = new Vector3();

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      skinnedMesh.applyBoneTransform(i, vertex);
      vertex.applyMatrix4(skinnedMesh.matrixWorld);
      centroid.add(vertex);
    }

    centroid.divideScalar(position.count);
    this.lookAt(centroid);
  }

  public override clone(): this {
    const camera = new EnhancedPerspectiveCamera(
      this.fovPolicyInternal.clone(),
      this.aspect,
      this.near,
      this.far,
    ) as this;

    camera.copy(this, true);
    camera.updateProjectionMatrix();
    return camera;
  }
}

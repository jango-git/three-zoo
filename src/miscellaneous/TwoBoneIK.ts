import type { Object3D } from "three";
import { MathUtils, Quaternion, Vector3 } from "three";

/**
 * Analytical two-bone IK solver operating in world space.
 *
 * Solves a three-bone chain (root → middle → end) so that the end bone
 * reaches the target position, with the pole controlling middle-joint
 * bend direction.
 *
 * Writes local quaternions to `root` and `middle` bones.
 * Does not modify the `end` bone.
 *
 * Call `solve()` after AnimationMixer update each frame.
 */
export class TwoBoneIK {
  /** Solve target. When undefined, `solve()` is a no-op. */
  public target?: Object3D;

  /** Numerical stability threshold. */
  public epsilon = 1e-5;

  /**
   * When enabled, twists the root bone around its aim axis so that
   * the axis specified by `rootPoleAxis` aligns toward the pole.
   */
  public rootPoleTwist = true;

  /**
   * Local-space axis of the root bone that is twisted toward the pole
   * when `rootPoleTwist` is enabled. Defaults to local +Y `(0, 1, 0)`.
   */
  public rootPoleAxis: Vector3 = new Vector3(0, 1, 0);

  /**
   * When enabled, twists the middle bone around its aim axis so that
   * the axis specified by `middlePoleAxis` aligns toward the pole.
   */
  public middlePoleTwist = true;

  /**
   * Local-space axis of the middle bone that is twisted toward the pole
   * when `middlePoleTwist` is enabled. Defaults to local +Y `(0, 1, 0)`.
   */
  public middlePoleAxis: Vector3 = new Vector3(0, 1, 0);

  private readonly rootPosition: Vector3 = new Vector3();
  private readonly middlePosition: Vector3 = new Vector3();
  private readonly endPosition: Vector3 = new Vector3();
  private readonly targetPosition: Vector3 = new Vector3();
  private readonly polePosition: Vector3 = new Vector3();

  private readonly chainDirection: Vector3 = new Vector3();
  private readonly perpendicularDirection: Vector3 = new Vector3();
  private readonly middleTarget: Vector3 = new Vector3();

  private readonly currentDirection: Vector3 = new Vector3();
  private readonly desiredDirection: Vector3 = new Vector3();
  private readonly bonePosition: Vector3 = new Vector3();
  private readonly childPosition: Vector3 = new Vector3();

  private readonly aimAxis: Vector3 = new Vector3();
  private readonly currentUp: Vector3 = new Vector3();
  private readonly desiredUp: Vector3 = new Vector3();

  private readonly deltaRotation: Quaternion = new Quaternion();
  private readonly boneWorldQuaternion: Quaternion = new Quaternion();
  private readonly parentWorldQuaternion: Quaternion = new Quaternion();
  private readonly twistRotation: Quaternion = new Quaternion();

  constructor(
    /** First bone in the chain (e.g. upper leg, upper arm). */
    public readonly root: Object3D,
    /** Second bone in the chain (e.g. lower leg, forearm). */
    public readonly middle: Object3D,
    /** Terminal bone (e.g. foot, hand). Not rotated by the solver. */
    public readonly end: Object3D,
    /** Controls the bend direction of the middle joint. */
    public readonly pole: Object3D,
    target?: Object3D,
  ) {
    this.target = target;
  }

  /**
   * Solve IK for the current frame.
   * No-op when `target` is undefined.
   */
  public solve(): void {
    if (!this.target) {
      return;
    }

    const epsilon = this.epsilon;

    this.target.getWorldPosition(this.targetPosition);
    this.pole.getWorldPosition(this.polePosition);
    this.root.getWorldPosition(this.rootPosition);
    this.middle.getWorldPosition(this.middlePosition);
    this.end.getWorldPosition(this.endPosition);

    const upperLength = this.rootPosition.distanceTo(this.middlePosition);
    const lowerLength = this.middlePosition.distanceTo(this.endPosition);
    const chainLength = upperLength + lowerLength;

    this.chainDirection.subVectors(this.targetPosition, this.rootPosition);
    const targetDistance = MathUtils.clamp(
      this.chainDirection.length(),
      Math.abs(upperLength - lowerLength) + epsilon,
      chainLength - epsilon,
    );
    this.chainDirection.normalize();

    // Law of cosines: angle at root joint
    const cosineRoot =
      (upperLength * upperLength +
        targetDistance * targetDistance -
        lowerLength * lowerLength) /
      (2 * upperLength * targetDistance);
    const angleRoot = Math.acos(MathUtils.clamp(cosineRoot, -1, 1));

    const middleAlongChain = upperLength * Math.cos(angleRoot);
    const middlePerpendicular = upperLength * Math.sin(angleRoot);

    // Project pole onto plane perpendicular to chain
    this.perpendicularDirection.subVectors(
      this.polePosition,
      this.rootPosition,
    );
    this.perpendicularDirection.addScaledVector(
      this.chainDirection,
      -this.perpendicularDirection.dot(this.chainDirection),
    );

    // Guard: pole collinear with chain — perpendicular is degenerate.
    // Pick an arbitrary axis perpendicular to chain.
    if (this.perpendicularDirection.lengthSq() < epsilon) {
      this.perpendicularDirection.set(0, 1, 0);
      this.perpendicularDirection.addScaledVector(
        this.chainDirection,
        -this.perpendicularDirection.dot(this.chainDirection),
      );
      if (this.perpendicularDirection.lengthSq() < epsilon) {
        this.perpendicularDirection.set(1, 0, 0);
      }
    }

    this.perpendicularDirection.normalize();

    // Ideal middle-joint world position
    this.middleTarget
      .copy(this.rootPosition)
      .addScaledVector(this.chainDirection, middleAlongChain)
      .addScaledVector(this.perpendicularDirection, middlePerpendicular);

    // Aim root bone → middle target
    this.aimBone(this.root, this.middle, this.middleTarget);

    if (this.rootPoleTwist) {
      this.twistBoneTowardPole(this.root, this.middle, this.rootPoleAxis);
    }

    // Aim middle bone → end target
    this.aimBone(this.middle, this.end, this.targetPosition);

    if (this.middlePoleTwist) {
      this.twistBoneTowardPole(this.middle, this.end, this.middlePoleAxis);
    }
  }

  /**
   * Twist `bone` around its aim axis (bone→child) so that `poleAxis`
   * (in the bone's local space) points as close to the pole as possible.
   *
   * Resolves the roll ambiguity left by `aimBone`,
   * which constrains aim direction but not roll.
   */
  private twistBoneTowardPole(
    bone: Object3D,
    child: Object3D,
    poleAxis: Vector3,
  ): void {
    const epsilon = this.epsilon;

    bone.getWorldPosition(this.bonePosition);
    child.getWorldPosition(this.childPosition);

    this.aimAxis.subVectors(this.childPosition, this.bonePosition);
    if (this.aimAxis.lengthSq() < epsilon) {
      return;
    }
    this.aimAxis.normalize();

    bone.getWorldQuaternion(this.boneWorldQuaternion);

    this.currentUp.copy(poleAxis).applyQuaternion(this.boneWorldQuaternion);

    this.desiredUp.subVectors(this.polePosition, this.bonePosition);
    this.desiredUp.addScaledVector(
      this.aimAxis,
      -this.desiredUp.dot(this.aimAxis),
    );

    if (this.desiredUp.lengthSq() < epsilon) {
      return;
    }
    this.desiredUp.normalize();

    this.currentUp.addScaledVector(
      this.aimAxis,
      -this.currentUp.dot(this.aimAxis),
    );

    if (this.currentUp.lengthSq() < epsilon) {
      console.warn(
        `TwoBoneIK: poleAxis is parallel to bone's aim axis - twist is undefined.`,
      );
    }
    this.currentUp.normalize();

    let angle = Math.acos(
      MathUtils.clamp(this.currentUp.dot(this.desiredUp), -1, 1),
    );

    this.currentDirection.crossVectors(this.currentUp, this.desiredUp);
    if (this.currentDirection.dot(this.aimAxis) < 0) {
      angle = -angle;
    }

    if (Math.abs(angle) < epsilon) {
      return;
    }

    this.twistRotation.setFromAxisAngle(this.aimAxis, angle);
    bone.getWorldQuaternion(this.boneWorldQuaternion);
    this.twistRotation.multiply(this.boneWorldQuaternion);

    if (bone.parent) {
      bone.parent.getWorldQuaternion(this.parentWorldQuaternion);
      bone.quaternion.copy(
        this.parentWorldQuaternion.invert().multiply(this.twistRotation),
      );
    } else {
      bone.quaternion.copy(this.twistRotation);
    }
  }

  /**
   * Rotate `bone` so that `child` points toward `worldTarget`.
   * Writes `bone.quaternion` in local space.
   */
  private aimBone(bone: Object3D, child: Object3D, worldTarget: Vector3): void {
    bone.getWorldPosition(this.bonePosition);
    child.getWorldPosition(this.childPosition);

    this.currentDirection.subVectors(this.childPosition, this.bonePosition);
    this.desiredDirection.subVectors(worldTarget, this.bonePosition);

    if (
      this.currentDirection.lengthSq() < this.epsilon ||
      this.desiredDirection.lengthSq() < this.epsilon
    ) {
      return;
    }

    this.currentDirection.normalize();
    this.desiredDirection.normalize();

    this.deltaRotation.setFromUnitVectors(
      this.currentDirection,
      this.desiredDirection,
    );

    bone.getWorldQuaternion(this.boneWorldQuaternion);
    this.deltaRotation.multiply(this.boneWorldQuaternion);

    if (bone.parent) {
      bone.parent.getWorldQuaternion(this.parentWorldQuaternion);
      bone.quaternion.copy(
        this.parentWorldQuaternion.invert().multiply(this.deltaRotation),
      );
    } else {
      bone.quaternion.copy(this.deltaRotation);
    }
  }
}

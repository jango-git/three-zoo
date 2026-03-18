import type { Object3D } from "three";
import { MathUtils, Quaternion, Vector3 } from "three";

/**
 * Distributes aim rotation across a chain of bones.
 *
 * Computes the swing rotation from `currentDirection` to `targetDirection`
 * and splits it across bones according to `curve` weights.
 *
 * Mutates `bone.quaternion` directly. Call after AnimationMixer update.
 */
export class AimChainIK {
  /** Numerical stability threshold. */
  public epsilon = 1e-5;

  /**
   * Global blend weight. 0 = solver has no effect, 1 = full effect.
   * Clamped to 0–1 internally.
   */
  public weight = 1;

  /**
   * Per-bone rotation weights. Normalized internally so their sum equals 1.
   *
   * `[1, 1, 1, 1]` = uniform. `[0.2, 0.5, 0.8, 1.0]` = root gets least, tip gets most.
   *
   * Compared by reference — mutating values in-place won't trigger
   * renormalization. Assign a new array to update.
   *
   * Length must match bone count; mismatches throw on `solve()`.
   */
  public curve: readonly number[];

  private readonly swingAxis: Vector3 = new Vector3();
  private readonly deltaRotation: Quaternion = new Quaternion();
  private readonly boneWorldQuaternion: Quaternion = new Quaternion();
  private readonly parentWorldQuaternion: Quaternion = new Quaternion();

  private normalizedCurve: number[] = [];
  private lastCurveReference: readonly number[] | undefined = undefined;

  /**
   * @param bones - Ordered from root to tip. Must contain at least one bone.
   */
  constructor(public readonly bones: readonly Object3D[]) {
    if (bones.length === 0) {
      throw new Error("AimChainIK requires at least one bone.");
    }

    const uniform: number[] = Array(bones.length).fill(1);
    this.curve = uniform;
  }

  /**
   * Rotate the chain so that `currentDirection` aligns with `targetDirection`.
   *
   * Both vectors are in world space and are not mutated.
   *
   * Sample directions **before** calling — this method mutates bone quaternions,
   * so any direction derived from the chain will be stale after the call.
   *
   * @param currentDirection - Where the chain currently aims.
   * @param targetDirection - Where it should aim.
   */
  public solve(currentDirection: Vector3, targetDirection: Vector3): void {
    const effectiveWeight = MathUtils.clamp(this.weight, 0, 1);
    if (effectiveWeight < this.epsilon) {
      return;
    }

    const currentLength = currentDirection.length();
    const targetLength = targetDirection.length();

    if (currentLength < this.epsilon || targetLength < this.epsilon) {
      return;
    }

    const dotProduct = MathUtils.clamp(
      currentDirection.dot(targetDirection) / (currentLength * targetLength),
      -1,
      1,
    );

    const totalAngle = Math.acos(dotProduct);
    if (totalAngle < this.epsilon) {
      return;
    }

    this.swingAxis.copy(currentDirection).cross(targetDirection).normalize();

    // Near-opposite directions: pick an arbitrary perpendicular axis.
    if (this.swingAxis.lengthSq() < this.epsilon) {
      this.swingAxis.set(0, 1, 0);
      this.swingAxis.addScaledVector(
        currentDirection,
        -this.swingAxis.dot(currentDirection) / (currentLength * currentLength),
      );
      if (this.swingAxis.lengthSq() < this.epsilon) {
        this.swingAxis.set(1, 0, 0);
      }
      this.swingAxis.normalize();
    }

    const curve = this.getNormalizedCurve();
    const weightedAngle = totalAngle * effectiveWeight;

    for (let index = 0; index < this.bones.length; index++) {
      const bone = this.bones[index];
      const boneAngle = weightedAngle * curve[index];

      if (boneAngle < this.epsilon) {
        continue;
      }

      this.deltaRotation.setFromAxisAngle(this.swingAxis, boneAngle);

      if (bone.parent) {
        bone.parent.getWorldQuaternion(this.parentWorldQuaternion);
      } else {
        this.parentWorldQuaternion.identity();
      }

      // localDelta = parentInverse * worldDelta * parentWorld
      this.boneWorldQuaternion
        .copy(this.parentWorldQuaternion)
        .invert()
        .multiply(this.deltaRotation)
        .multiply(this.parentWorldQuaternion);

      bone.quaternion.premultiply(this.boneWorldQuaternion);
    }
  }

  /**
   * Returns normalized curve (sums to 1).
   * Rebuilds only when the `curve` reference changes.
   */
  private getNormalizedCurve(): readonly number[] {
    if (this.lastCurveReference === this.curve) {
      return this.normalizedCurve;
    }

    if (this.curve.length !== this.bones.length) {
      throw new Error(
        `AimChainIK: curve length (${this.curve.length}) must match bone count (${this.bones.length}).`,
      );
    }

    let sum = 0;
    for (const value of this.curve) {
      sum += value;
    }

    if (this.normalizedCurve.length !== this.curve.length) {
      this.normalizedCurve = new Array(this.curve.length);
    }

    if (sum < this.epsilon) {
      const uniform = 1 / this.bones.length;
      for (let index = 0; index < this.normalizedCurve.length; index++) {
        this.normalizedCurve[index] = uniform;
      }
    } else {
      const inverseSum = 1 / sum;
      for (let index = 0; index < this.curve.length; index++) {
        this.normalizedCurve[index] = this.curve[index] * inverseSum;
      }
    }

    this.lastCurveReference = this.curve;
    return this.normalizedCurve;
  }
}

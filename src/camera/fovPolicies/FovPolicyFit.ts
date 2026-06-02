import { clampFov, verticalFovFromHorizontal } from "./fovMath";
import { FovPolicy } from "./FovPolicy";

/**
 * Fills the viewport with the target frustum at any aspect ratio.
 *
 * Takes the narrower of the two vertical FOVs implied by the horizontal and vertical targets, so
 * neither target angle is ever exceeded (content outside the target rect is cropped).
 */
export class FovPolicyFit extends FovPolicy {
  private fovHorizontalInternal: number;
  private fovVerticalInternal: number;

  /**
   * @param fovHorizontal - Target horizontal FOV. Clamped to 1-179 degrees.
   * @param fovVertical - Target vertical FOV. Clamped to 1-179 degrees.
   */
  constructor(fovHorizontal: number, fovVertical: number) {
    super();
    this.fovHorizontalInternal = clampFov(fovHorizontal);
    this.fovVerticalInternal = clampFov(fovVertical);
  }

  /** Target horizontal FOV. */
  public get fovHorizontal(): number {
    return this.fovHorizontalInternal;
  }

  /** Target vertical FOV. */
  public get fovVertical(): number {
    return this.fovVerticalInternal;
  }

  /** Clamped to 1-179 degrees. */
  public set fovHorizontal(value: number) {
    this.fovHorizontalInternal = clampFov(value);
  }

  /** Clamped to 1-179 degrees. */
  public set fovVertical(value: number) {
    this.fovVerticalInternal = clampFov(value);
  }

  public calculateFov(aspect: number): number {
    return Math.min(
      this.fovVerticalInternal,
      verticalFovFromHorizontal(this.fovHorizontalInternal, aspect),
    );
  }

  public clone(): FovPolicyFit {
    return new FovPolicyFit(this.fovHorizontalInternal, this.fovVerticalInternal);
  }
}

import { clampFov, verticalFovFromHorizontal } from "./fovMath";
import { FovPolicy } from "./FovPolicy";

/**
 * Guarantees the target frustum is fully visible at any aspect ratio.
 *
 * Takes the wider of the two vertical FOVs implied by the horizontal and vertical targets, so
 * both target angles are always contained (the view may show more than the target rect).
 */
export class FovPolicyCover extends FovPolicy {
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
    return Math.max(
      this.fovVerticalInternal,
      verticalFovFromHorizontal(this.fovHorizontalInternal, aspect),
    );
  }

  public clone(): FovPolicyCover {
    return new FovPolicyCover(this.fovHorizontalInternal, this.fovVerticalInternal);
  }
}

import { clampFov, verticalFovFromHorizontal } from "./fovMath.js";
import { FovPolicy } from "./FovPolicy.js";

/**
 * Preserves the horizontal FOV in landscape (aspect > 1) and the vertical FOV in portrait.
 * At aspect 1 both FOVs are the same angle, so the FOV changes smoothly across a square view
 * only when `fovHorizontal` equals `fovVertical`; otherwise it jumps between them there.
 */
export class FovPolicyHybrid extends FovPolicy {
  private fovHorizontalInternal: number;
  private fovVerticalInternal: number;

  /**
   * @param fovHorizontal - Preserved in landscape. Clamped to 1-179 degrees.
   * @param fovVertical - Preserved in portrait. Clamped to 1-179 degrees.
   */
  constructor(fovHorizontal: number, fovVertical: number) {
    super();
    this.fovHorizontalInternal = clampFov(fovHorizontal);
    this.fovVerticalInternal = clampFov(fovVertical);
  }

  /** Horizontal FOV preserved in landscape. */
  public get fovHorizontal(): number {
    return this.fovHorizontalInternal;
  }

  /** Vertical FOV preserved in portrait. */
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
    return aspect > 1
      ? verticalFovFromHorizontal(this.fovHorizontalInternal, aspect)
      : this.fovVerticalInternal;
  }

  public clone(): FovPolicyHybrid {
    return new FovPolicyHybrid(this.fovHorizontalInternal, this.fovVerticalInternal);
  }
}

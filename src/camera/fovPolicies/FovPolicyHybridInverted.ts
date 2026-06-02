import { clampFov, verticalFovFromHorizontal } from "./fovMath";
import { FovPolicy } from "./FovPolicy";

/** Preserves the vertical FOV in landscape (aspect > 1) and the horizontal FOV in portrait. */
export class FovPolicyHybridInverted extends FovPolicy {
  private fovHorizontalInternal: number;
  private fovVerticalInternal: number;

  /**
   * @param fovHorizontal - Preserved in portrait. Clamped to 1-179 degrees.
   * @param fovVertical - Preserved in landscape. Clamped to 1-179 degrees.
   */
  constructor(fovHorizontal: number, fovVertical: number) {
    super();
    this.fovHorizontalInternal = clampFov(fovHorizontal);
    this.fovVerticalInternal = clampFov(fovVertical);
  }

  /** Horizontal FOV preserved in portrait. */
  public get fovHorizontal(): number {
    return this.fovHorizontalInternal;
  }

  /** Vertical FOV preserved in landscape. */
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
      ? this.fovVerticalInternal
      : verticalFovFromHorizontal(this.fovHorizontalInternal, aspect);
  }

  public clone(): FovPolicyHybridInverted {
    return new FovPolicyHybridInverted(this.fovHorizontalInternal, this.fovVerticalInternal);
  }
}

import { clampFov, verticalFovFromHorizontal } from "./fovMath";
import { FovPolicy } from "./FovPolicy";

/** Keeps the horizontal FOV constant; derives the vertical FOV from the aspect ratio. */
export class FovPolicyFixedHorizontal extends FovPolicy {
  private fovHorizontalInternal: number;

  /** @param fovHorizontal - Clamped to 1-179 degrees. */
  constructor(fovHorizontal: number) {
    super();
    this.fovHorizontalInternal = clampFov(fovHorizontal);
  }

  /** Target horizontal FOV. */
  public get fovHorizontal(): number {
    return this.fovHorizontalInternal;
  }

  /** Clamped to 1-179 degrees. */
  public set fovHorizontal(value: number) {
    this.fovHorizontalInternal = clampFov(value);
  }

  public calculateFov(aspect: number): number {
    return verticalFovFromHorizontal(this.fovHorizontalInternal, aspect);
  }

  public clone(): FovPolicyFixedHorizontal {
    return new FovPolicyFixedHorizontal(this.fovHorizontalInternal);
  }
}

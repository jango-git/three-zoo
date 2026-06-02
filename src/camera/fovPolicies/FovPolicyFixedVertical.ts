import { clampFov } from "./fovMath";
import { FovPolicy } from "./FovPolicy";

/** Keeps the vertical FOV constant regardless of aspect (default three.js behavior). */
export class FovPolicyFixedVertical extends FovPolicy {
  private fovVerticalInternal: number;

  /** @param fovVertical - Clamped to 1-179 degrees. */
  constructor(fovVertical: number) {
    super();
    this.fovVerticalInternal = clampFov(fovVertical);
  }

  /** Target vertical FOV. */
  public get fovVertical(): number {
    return this.fovVerticalInternal;
  }

  /** Clamped to 1-179 degrees. */
  public set fovVertical(value: number) {
    this.fovVerticalInternal = clampFov(value);
  }

  public calculateFov(): number {
    return this.fovVerticalInternal;
  }

  public clone(): FovPolicyFixedVertical {
    return new FovPolicyFixedVertical(this.fovVerticalInternal);
  }
}

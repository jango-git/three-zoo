import type { Object3D } from "three";
import { Box3, Vector3 } from "three";

/**
 * Box3 with additional convenience methods for width, height, depth, etc.
 */
export class Bounds extends Box3 {
  /** Temporary vector for calculations */
  private readonly tempVector3A: Vector3 = new Vector3();

  constructor(object?: Object3D) {
    super();
    if (object) {
      this.setFromObject(object);
    }
  }

  /** Width (x-axis length) */
  public get width(): number {
    return this.max.x - this.min.x;
  }

  /** Height (y-axis length) */
  public get height(): number {
    return this.max.y - this.min.y;
  }

  /** Depth (z-axis length) */
  public get depth(): number {
    return this.max.z - this.min.z;
  }

  /** Length of the box's diagonal */
  public get diagonal(): number {
    return this.tempVector3A.subVectors(this.max, this.min).length();
  }

  /** Volume (width * height * depth) */
  public getVolume(): number {
    return this.width * this.height * this.depth;
  }

  /** Surface area (sum of all six faces) */
  public getSurfaceArea(): number {
    const w = this.width;
    const h = this.height;
    const d = this.depth;
    return 2 * (w * h + h * d + d * w);
  }
}

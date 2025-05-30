import { Box3, Vector3 } from "three";

export class Bounds extends Box3 {
  private readonly tempVector3A: Vector3 = new Vector3();

  /**
   * Gets the width (x-axis length) of the bounding box
   */
  public get width(): number {
    return this.max.x - this.min.x;
  }

  /**
   * Gets the height (y-axis length) of the bounding box
   */
  public get height(): number {
    return this.max.y - this.min.y;
  }

  /**
   * Gets the depth (z-axis length) of the bounding box
   */
  public get depth(): number {
    return this.max.z - this.min.z;
  }

  /**
   * Gets the length of the box's diagonal
   */
  public get diagonal(): number {
    return this.tempVector3A.subVectors(this.max, this.min).length();
  }

  /**
   * Gets the volume of the bounding box
   */
  public getVolume(): number {
    return this.width * this.height * this.depth;
  }

  /**
   * Gets the surface area of the bounding box
   */
  public getSurfaceArea(): number {
    const w = this.width;
    const h = this.height;
    const d = this.depth;
    return 2 * (w * h + h * d + d * w);
  }
}

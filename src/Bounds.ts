import { Box3, Vector3 } from "three";

export class Bounds extends Box3 {
  private readonly tempVector3: Vector3 = new Vector3();

  public get width(): number {
    return this.max.x - this.min.x;
  }

  public get height(): number {
    return this.max.y - this.min.y;
  }

  public get depth(): number {
    return this.max.z - this.min.z;
  }

  public get diagonal(): number {
    this.tempVector3.subVectors(this.max, this.min);
    return this.tempVector3.length();
  }
}

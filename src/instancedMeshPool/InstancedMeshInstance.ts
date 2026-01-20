import type { BufferGeometry, Material } from "three";
import { Matrix4, Quaternion, Vector3 } from "three";
import type { InstancedMeshPool } from "./InstancedMeshPool";

export class InstancedMeshInstance {
  private readonly position = new Vector3();
  private readonly quaternion = new Quaternion();
  private readonly scale = new Vector3(1, 1, 1);
  private readonly matrix = new Matrix4();

  private needsUpdateMatrixFromTransform = false;
  private needsUpdateTransformFromMatrix = false;
  private needsUpdateInstancedMatrixFromLocalMatrix = false;

  private handler: number;

  constructor(
    private readonly pool: InstancedMeshPool,
    geometry: BufferGeometry,
    material: Material,
    tag = "",
  ) {
    this.handler = this.pool["allocate"](geometry, material, tag);
  }

  public destroy(): void {
    if (this.handler >= 0) {
      this.pool["deallocate"](this.handler);
      this.handler = -1;
    }
  }

  public isDestroyed(): boolean {
    return this.handler < 0;
  }

  public setPosition(source: Vector3, flushTransform = false): this {
    this.updateTransformFromMatrix();

    if (!this.position.equals(source)) {
      this.position.copy(source);
      this.needsUpdateMatrixFromTransform = true;

      if (flushTransform) {
        this.flushTransform();
      }
    }

    return this;
  }

  public setPosition3f(
    x: number,
    y: number,
    z: number,
    flushTransform = false,
  ): this {
    this.updateTransformFromMatrix();

    if (
      this.position.x !== x ||
      this.position.y !== y ||
      this.position.z !== z
    ) {
      this.position.set(x, y, z);
      this.needsUpdateMatrixFromTransform = true;

      if (flushTransform) {
        this.flushTransform();
      }
    }

    return this;
  }

  public setQuaternion(source: Quaternion, flushTransform = false): this {
    this.updateTransformFromMatrix();

    if (!this.quaternion.equals(source)) {
      this.quaternion.copy(source);
      this.needsUpdateMatrixFromTransform = true;

      if (flushTransform) {
        this.flushTransform();
      }
    }

    return this;
  }

  public setQuaternion4f(
    x: number,
    y: number,
    z: number,
    w: number,
    flushTransform = false,
  ): this {
    this.updateTransformFromMatrix();

    if (
      this.quaternion.x !== x ||
      this.quaternion.y !== y ||
      this.quaternion.z !== z ||
      this.quaternion.w !== w
    ) {
      this.quaternion.set(x, y, z, w);
      this.needsUpdateMatrixFromTransform = true;

      if (flushTransform) {
        this.flushTransform();
      }
    }

    return this;
  }

  public setScale(source: Vector3, flushTransform = false): this {
    this.updateTransformFromMatrix();

    if (!this.scale.equals(source)) {
      this.scale.copy(source);
      this.needsUpdateMatrixFromTransform = true;

      if (flushTransform) {
        this.flushTransform();
      }
    }

    return this;
  }

  public setScale3f(
    x: number,
    y: number,
    z: number,
    flushTransform = false,
  ): this {
    this.updateTransformFromMatrix();

    if (this.scale.x !== x || this.scale.y !== y || this.scale.z !== z) {
      this.scale.set(x, y, z);
      this.needsUpdateMatrixFromTransform = true;

      if (flushTransform) {
        this.flushTransform();
      }
    }

    return this;
  }

  public setTransform(source: Matrix4, flushTransform = false): this {
    this.updateMatrixFromTransform();

    if (!this.matrix.equals(source)) {
      this.matrix.copy(source);
      this.needsUpdateTransformFromMatrix = true;
      this.needsUpdateInstancedMatrixFromLocalMatrix = true;

      if (flushTransform) {
        this.flushTransform();
      }
    }
    return this;
  }

  public flushTransform(): void {
    if (this.handler < 0) {
      return;
    }

    this.updateMatrixFromTransform();

    if (this.needsUpdateInstancedMatrixFromLocalMatrix) {
      this.pool["setTransformMatrix"](this.handler, this.matrix);
      this.needsUpdateInstancedMatrixFromLocalMatrix = false;
    }
  }

  private updateTransformFromMatrix(): void {
    if (this.needsUpdateTransformFromMatrix) {
      this.matrix.decompose(this.position, this.quaternion, this.scale);
      this.needsUpdateTransformFromMatrix = false;
    }
  }

  private updateMatrixFromTransform(): void {
    if (this.needsUpdateMatrixFromTransform) {
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.needsUpdateMatrixFromTransform = false;
      this.needsUpdateInstancedMatrixFromLocalMatrix = true;
    }
  }
}

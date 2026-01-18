import { Matrix4, Quaternion, Vector3 } from "three";
import { InstancedMeshPool, InstancedMeshPoolEntry } from "./InstancedMeshPool";

export class InstancedMeshInstance {
  public index: number;
  private readonly pool: InstancedMeshPool;
  readonly ["entry"]: InstancedMeshPoolEntry;
  private readonly matrix: Matrix4;
  private readonly position: Vector3;
  private readonly quaternion: Quaternion;
  private readonly scale: Vector3;

  constructor(pool: InstancedMeshPool, entry: InstancedMeshPoolEntry, index: number) {
    this.pool = pool;
    this["entry"] = entry;
    this.index = index;
    this.matrix = new Matrix4();
    this.position = new Vector3();
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
  }

  setPosition(v: Vector3): this {
    this.position.copy(v);
    this.apply();
    return this;
  }

  setPosition3f(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    this.apply();
    return this;
  }

  setQuaternion(q: Quaternion): this {
    this.quaternion.copy(q);
    this.apply();
    return this;
  }

  setQuaternion4f(x: number, y: number, z: number, w: number): this {
    this.quaternion.set(x, y, z, w);
    this.apply();
    return this;
  }

  setScale(v: Vector3): this {
    this.scale.copy(v);
    this.apply();
    return this;
  }

  setScale3f(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    this.apply();
    return this;
  }

  setTransform(m: Matrix4): this {
    m.decompose(this.position, this.quaternion, this.scale);
    this.apply();
    return this;
  }

  destroy(): void {
    if (this.index === -1) return;
    this.pool.deallocate(this);
  }

  private apply(): void {
    if (this.index === -1) return;
    this.matrix.compose(this.position, this.quaternion, this.scale);
    this["entry"].mesh.setMatrixAt(this.index, this.matrix);
    this.pool["notifyUpdate"](this["entry"]);
  }
}

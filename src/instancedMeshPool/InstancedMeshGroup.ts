import { Object3D } from "three";
import type { InstancedMeshInstance } from "./InstancedMeshInstance";

export class InstancedMeshGroup extends Object3D {
  constructor(private readonly instances: InstancedMeshInstance[]) {
    super();
  }

  public flushTransform(): void {
    this.updateWorldMatrix(true, false);
    for (const instance of this.instances) {
      instance.setTransform(this.matrixWorld, true);
    }
  }

  public destroy(): void {
    for (const instance of this.instances) {
      instance.destroy();
    }
  }
}

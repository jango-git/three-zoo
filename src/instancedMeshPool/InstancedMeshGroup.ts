import { Object3D } from "three";
import { InstancedMeshInstance } from "./InstancedMeshInstance";

export class InstancedMeshGroup extends Object3D {
  constructor(private readonly instances: InstancedMeshInstance[]) {
    super();
  }

  flushTransform(): void {
    this.updateWorldMatrix(true, false);

    for (const instance of this.instances) {
      instance.setTransform(this.matrixWorld);
    }
  }

  destroy() {
    for (const instance of this.instances) {
      instance.destroy();
    }
  }
}

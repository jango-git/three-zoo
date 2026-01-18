import { BufferGeometry, InstancedMesh, Material, Matrix4, Scene } from "three";
import { InstancedMeshInstance } from "./InstancedMeshInstance";

export interface InstancedMeshPoolOptions {
  scene: Scene;
  initialCapacity?: number;
  capacityStep?: number;
}

export interface InstancedMeshPoolEntry {
  mesh: InstancedMesh;
  geometry: BufferGeometry;
  material: Material;
  capacity: number;
  instances: Set<InstancedMeshInstance>;
  freeIndices: number[];
}

const TEMP_ZERO_MATRIX = new Matrix4().makeScale(0, 0, 0);

export class InstancedMeshPool {
  private readonly scene: Scene;
  private readonly initialCapacity: number;
  private readonly capacityStep: number;
  private readonly meshes: Map<string, InstancedMeshPoolEntry>;

  constructor(options: InstancedMeshPoolOptions) {
    this.scene = options.scene;
    this.initialCapacity = options.initialCapacity ?? 16;
    this.capacityStep = options.capacityStep ?? this.initialCapacity;
    this.meshes = new Map();
  }

  allocate(
    geometry: BufferGeometry,
    material: Material,
  ): InstancedMeshInstance {
    const entry = this.getOrCreateEntry(geometry, material);

    if (entry.freeIndices.length === 0) {
      this.growEntry(entry);
    }

    const index = entry.freeIndices.pop()!;
    const instance = new InstancedMeshInstance(this, entry, index);

    // identity transform
    instance.setScale3f(1, 1, 1);

    entry.instances.add(instance);
    this.updateMeshCount(entry);

    return instance;
  }

  deallocate(instance: InstancedMeshInstance): void {
    if (instance.index === -1) return;

    const entry = instance["entry"];

    entry.instances.delete(instance);
    entry.freeIndices.push(instance.index);

    // hide instance
    entry.mesh.setMatrixAt(instance.index, TEMP_ZERO_MATRIX);

    instance.index = -1;

    this.updateMeshCount(entry);
    this["notifyUpdate"](entry);
  }

  private getOrCreateEntry(
    geometry: BufferGeometry,
    material: Material,
  ): InstancedMeshPoolEntry {
    const key = `${geometry.uuid}:${material.uuid}`;
    let entry = this.meshes.get(key);

    if (!entry) {
      const mesh = new InstancedMesh(geometry, material, this.initialCapacity);
      mesh.count = 0;
      mesh.frustumCulled = false;

      this.scene.add(mesh);

      entry = {
        mesh,
        geometry,
        material,
        capacity: this.initialCapacity,
        instances: new Set(),
        freeIndices: this.createIndexRange(0, this.initialCapacity),
      };

      this.meshes.set(key, entry);
    }

    return entry;
  }

  private growEntry(entry: InstancedMeshPoolEntry): void {
    const newCapacity = entry.capacity + this.capacityStep;
    const newMesh = new InstancedMesh(
      entry.geometry,
      entry.material,
      newCapacity,
    );
    newMesh.frustumCulled = false;

    // copy existing matrix data
    const oldArray = entry.mesh.instanceMatrix.array;
    const newArray = newMesh.instanceMatrix.array;
    newArray.set(oldArray);
    newMesh.instanceMatrix.needsUpdate = true;

    // swap meshes
    this.scene.remove(entry.mesh);
    entry.mesh.dispose();
    this.scene.add(newMesh);

    // add new free indices
    entry.freeIndices.push(
      ...this.createIndexRange(entry.capacity, newCapacity),
    );

    entry.mesh = newMesh;
    entry.capacity = newCapacity;

    this.updateMeshCount(entry);
  }

  private updateMeshCount(entry: InstancedMeshPoolEntry): void {
    if (entry.instances.size === 0) {
      entry.mesh.count = 0;
      return;
    }

    let maxIndex = -1;
    for (const inst of entry.instances) {
      if (inst.index > maxIndex) {
        maxIndex = inst.index;
      }
    }

    entry.mesh.count = maxIndex + 1;
  }

  private createIndexRange(start: number, end: number): number[] {
    const result: number[] = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  }

  protected ["notifyUpdate"](entry: InstancedMeshPoolEntry): void {
    entry.mesh.instanceMatrix.needsUpdate = true;
  }
}

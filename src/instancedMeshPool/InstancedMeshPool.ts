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
  count: number;
  instances: Map<number, InstancedMeshInstance>;
}

const TEMP_MATRIX = new Matrix4();

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

    if (entry.count === entry.capacity) {
      this.growEntry(entry);
    }

    const index = entry.count;
    entry.count++;

    const instance = new InstancedMeshInstance(this, entry, index);
    instance.setScale3f(1, 1, 1);

    entry.instances.set(index, instance);
    entry.mesh.count = entry.count;

    return instance;
  }

  deallocate(instance: InstancedMeshInstance): void {
    if (instance.index === -1) return;

    const entry = instance["entry"];
    const removedIndex = instance.index;
    const lastIndex = entry.count - 1;

    entry.instances.delete(removedIndex);

    if (removedIndex !== lastIndex) {
      // swap: move last to removed position
      const lastInstance = entry.instances.get(lastIndex)!;

      entry.mesh.getMatrixAt(lastIndex, TEMP_MATRIX);
      entry.mesh.setMatrixAt(removedIndex, TEMP_MATRIX);

      lastInstance.index = removedIndex;
      entry.instances.delete(lastIndex);
      entry.instances.set(removedIndex, lastInstance);
    }

    entry.count--;
    entry.mesh.count = entry.count;
    instance.index = -1;

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
        count: 0,
        instances: new Map(),
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

    const oldArray = entry.mesh.instanceMatrix.array;
    const newArray = newMesh.instanceMatrix.array;
    newArray.set(oldArray);
    newMesh.instanceMatrix.needsUpdate = true;

    this.scene.remove(entry.mesh);
    entry.mesh.dispose();
    this.scene.add(newMesh);

    entry.mesh = newMesh;
    entry.capacity = newCapacity;
    entry.mesh.count = entry.count;
  }

  protected ["notifyUpdate"](entry: InstancedMeshPoolEntry): void {
    entry.mesh.instanceMatrix.needsUpdate = true;
  }
}

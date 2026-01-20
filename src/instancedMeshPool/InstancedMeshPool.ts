import type { BufferGeometry, Material, Scene } from "three";
import { InstancedMesh, Matrix4 } from "three";

const DEFAULT_INITIAL_CAPACITY = 16;
const DEFAULT_CAPACITY_STEP = 8;
const MATRIX_SIZE = 16;

export interface InstancedMeshPoolOptions {
  initialCapacity?: number;
  capacityStep?: number;
}

interface InstanceDescriptor {
  entry: InstancedMeshPoolEntry;
  index: number;
}

interface InstancedMeshPoolEntry {
  mesh: InstancedMesh;
  geometry: BufferGeometry;
  material: Material;
  tag: string;
  capacity: number;
  count: number;
  handlers: number[];
}

const TEMP_MATRIX_A = new Matrix4();
const TEMP_MATRIX_B = new Matrix4();

export class InstancedMeshPool {
  private readonly initialCapacity: number;
  private readonly capacityStep: number;

  private readonly entries: Map<string, InstancedMeshPoolEntry> = new Map();
  private readonly descriptors: Map<number, InstanceDescriptor> = new Map();
  private nextHandler = 1;

  constructor(
    private readonly scene: Scene,
    options: Partial<InstancedMeshPoolOptions> = {},
  ) {
    this.initialCapacity = options.initialCapacity ?? DEFAULT_INITIAL_CAPACITY;
    this.capacityStep = options.capacityStep ?? DEFAULT_CAPACITY_STEP;
  }

  public isValidHandler(handler: number): boolean {
    return this.descriptors.has(handler);
  }

  public sortMeshes(
    baseRenderOrder: number,
    compare: (
      a: InstancedMesh,
      aTag: string,
      b: InstancedMesh,
      bTag: string,
    ) => number,
  ): void {
    const sorted: InstancedMeshPoolEntry[] = [];
    for (const entry of this.entries.values()) {
      sorted.push(entry);
    }
    sorted.sort((a, b) => compare(a.mesh, a.tag, b.mesh, b.tag));

    let currentRenderOrder = baseRenderOrder;
    for (const entry of sorted) {
      entry.mesh.renderOrder = currentRenderOrder++;
    }
  }

  public sortInstances(
    compare: (matrixA: Matrix4, matrixB: Matrix4, tag: string) => number,
  ): void {
    for (const entry of this.entries.values()) {
      this.sortEntryInstances(entry, compare);
    }
  }

  public dispose(): void {
    for (const entry of this.entries.values()) {
      this.scene.remove(entry.mesh);
      entry.mesh.dispose();
    }
    this.entries.clear();
    this.descriptors.clear();
  }

  protected allocate(
    geometry: BufferGeometry,
    material: Material,
    tag: string,
  ): number {
    const entry = this.getOrCreateEntry(geometry, material, tag);

    if (entry.count === entry.capacity) {
      this.growEntry(entry);
    }

    const index = entry.count;
    const handler = this.nextHandler++;

    entry.handlers[index] = handler;
    entry.count++;
    entry.mesh.count = entry.count;

    this.descriptors.set(handler, { entry, index });

    return handler;
  }

  protected deallocate(handler: number): void {
    const descriptor = this.descriptors.get(handler);
    if (descriptor === undefined) {
      return;
    }

    const { entry, index: removedIndex } = descriptor;
    const lastIndex = entry.count - 1;

    this.descriptors.delete(handler);

    if (removedIndex !== lastIndex) {
      const lastHandler = entry.handlers[lastIndex];
      const lastDescriptor = this.descriptors.get(lastHandler);

      if (lastDescriptor !== undefined) {
        entry.mesh.getMatrixAt(lastIndex, TEMP_MATRIX_A);
        entry.mesh.setMatrixAt(removedIndex, TEMP_MATRIX_A);

        lastDescriptor.index = removedIndex;
        entry.handlers[removedIndex] = lastHandler;
      }
    }

    entry.count--;
    entry.mesh.count = entry.count;
    entry.mesh.instanceMatrix.needsUpdate = true;
  }

  protected setTransformMatrix(handler: number, matrix: Matrix4): void {
    const descriptor = this.descriptors.get(handler);
    if (descriptor === undefined) {
      return;
    }

    descriptor.entry.mesh.setMatrixAt(descriptor.index, matrix);
    descriptor.entry.mesh.instanceMatrix.needsUpdate = true;
  }

  protected getTransformMatrix(
    handler: number,
    target: Matrix4,
  ): Matrix4 | undefined {
    const descriptor = this.descriptors.get(handler);
    if (descriptor === undefined) {
      return undefined;
    }

    descriptor.entry.mesh.getMatrixAt(descriptor.index, target);
    return target;
  }

  private getOrCreateEntry(
    geometry: BufferGeometry,
    material: Material,
    tag: string,
  ): InstancedMeshPoolEntry {
    const key = `${geometry.uuid}:${material.uuid}`;
    let entry = this.entries.get(key);

    if (entry === undefined) {
      const mesh = new InstancedMesh(geometry, material, this.initialCapacity);
      mesh.count = 0;
      mesh.frustumCulled = false;
      this.scene.add(mesh);

      entry = {
        mesh,
        geometry,
        material,
        tag,
        capacity: this.initialCapacity,
        count: 0,
        handlers: [],
      };
      this.entries.set(key, entry);
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
    newMesh.renderOrder = entry.mesh.renderOrder;

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

  private sortEntryInstances(
    entry: InstancedMeshPoolEntry,
    compare: (matrixA: Matrix4, matrixB: Matrix4, tag: string) => number,
  ): void {
    if (entry.count <= 1) {
      return;
    }

    const items: { originalIndex: number; handler: number }[] = [];
    for (let i = 0; i < entry.count; i++) {
      items.push({ originalIndex: i, handler: entry.handlers[i] });
    }

    let needsReorder = false;

    items.sort((a, b) => {
      entry.mesh.getMatrixAt(a.originalIndex, TEMP_MATRIX_A);
      entry.mesh.getMatrixAt(b.originalIndex, TEMP_MATRIX_B);
      const result = compare(TEMP_MATRIX_A, TEMP_MATRIX_B, entry.tag);
      if (result > 0) {
        needsReorder = true;
      }
      return result;
    });

    if (!needsReorder) {
      return;
    }

    const matricesData = new Float32Array(entry.count * MATRIX_SIZE);
    for (let i = 0; i < items.length; i++) {
      entry.mesh.getMatrixAt(items[i].originalIndex, TEMP_MATRIX_A);
      matricesData.set(TEMP_MATRIX_A.elements, i * MATRIX_SIZE);
    }

    for (let i = 0; i < entry.count; i++) {
      TEMP_MATRIX_A.fromArray(matricesData, i * MATRIX_SIZE);
      entry.mesh.setMatrixAt(i, TEMP_MATRIX_A);
    }

    for (let i = 0; i < items.length; i++) {
      const handler = items[i].handler;
      entry.handlers[i] = handler;

      const descriptor = this.descriptors.get(handler);
      if (descriptor !== undefined) {
        descriptor.index = i;
      }
    }

    entry.mesh.instanceMatrix.needsUpdate = true;
  }
}

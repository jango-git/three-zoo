import type { Box3, BufferAttribute, SkinnedMesh } from "three";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

const DEFAULT_HORIZONTAL_FOV = 90;
const DEFAULT_VERTICAL_FOV = 90;
const DEFAULT_ASPECT = 1;
const DEFAULT_NEAR = 1;
const DEFAULT_FAR = 1000;

const MIN_FOV = 1;
const MAX_FOV = 179;

/**
 * A camera that supports independent horizontal and vertical FOV settings.
 * Extends Three.js PerspectiveCamera to allow separate control over horizontal
 * and vertical fields of view.
 */
export class BiFovCamera extends PerspectiveCamera {
  private horizontalFovInternal: number;
  private verticalFovInternal: number;

  /**
   * @param horizontalFov - Horizontal FOV in degrees (90° default)
   * @param verticalFov - Vertical FOV in degrees (90° default)
   * @param aspect - Width/height ratio (1 default)
   * @param near - Near clipping plane (1 default)
   * @param far - Far clipping plane (1000 default)
   */
  constructor(
    horizontalFov = DEFAULT_HORIZONTAL_FOV,
    verticalFov = DEFAULT_VERTICAL_FOV,
    aspect = DEFAULT_ASPECT,
    near = DEFAULT_NEAR,
    far = DEFAULT_FAR,
  ) {
    super(verticalFov, aspect, near, far);
    this.horizontalFovInternal = horizontalFov;
    this.verticalFovInternal = verticalFov;
    this.updateProjectionMatrix();
  }

  /** Current horizontal FOV in degrees */
  public get horizontalFov(): number {
    return this.horizontalFovInternal;
  }

  /** Current vertical FOV in degrees */
  public get verticalFov(): number {
    return this.verticalFovInternal;
  }

  /** Set horizontal FOV in degrees (clamped between 1° and 179°) */
  public set horizontalFov(value: number) {
    this.horizontalFovInternal = MathUtils.clamp(value, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /** Set vertical FOV in degrees (clamped between 1° and 179°) */
  public set verticalFov(value: number) {
    this.verticalFovInternal = MathUtils.clamp(value, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /**
   * Update both horizontal and vertical FOV
   * @param horizontal - Horizontal FOV in degrees
   * @param vertical - Vertical FOV in degrees
   */
  public setFov(horizontal: number, vertical: number): void {
    this.horizontalFovInternal = MathUtils.clamp(horizontal, MIN_FOV, MAX_FOV);
    this.verticalFovInternal = MathUtils.clamp(vertical, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /**
   * Copy FOV settings from another BiFovCamera
   * @param source - Camera to copy from
   */
  public copyFovSettings(source: BiFovCamera): void {
    this.horizontalFovInternal = source.horizontalFov;
    this.verticalFovInternal = source.verticalFov;
    this.updateProjectionMatrix();
  }

  /**
   * Updates the projection matrix based on FOV settings and aspect ratio.
   * In landscape: preserves horizontal FOV
   * In portrait: preserves vertical FOV
   */
  public override updateProjectionMatrix(): void {
    if (this.aspect > 1) {
      // Landscape orientation: preserve horizontal FOV
      const radians = MathUtils.degToRad(this.horizontalFovInternal);
      this.fov = MathUtils.radToDeg(
        Math.atan(Math.tan(radians / 2) / this.aspect) * 2,
      );
    } else {
      // Portrait orientation: preserve vertical FOV
      this.fov = this.verticalFovInternal;
    }

    super.updateProjectionMatrix();
  }

  /** Get actual horizontal FOV after aspect ratio adjustments */
  public getEffectiveHorizontalFov(): number {
    if (this.aspect >= 1) {
      return this.horizontalFovInternal;
    }
    const verticalRadians = MathUtils.degToRad(this.verticalFovInternal);
    return MathUtils.radToDeg(
      Math.atan(Math.tan(verticalRadians / 2) * this.aspect) * 2,
    );
  }

  /** Get actual vertical FOV after aspect ratio adjustments */
  public getEffectiveVerticalFov(): number {
    if (this.aspect < 1) {
      return this.verticalFovInternal;
    }
    const horizontalRadians = MathUtils.degToRad(this.horizontalFovInternal);
    return MathUtils.radToDeg(
      Math.atan(Math.tan(horizontalRadians / 2) / this.aspect) * 2,
    );
  }

  public fitPointsVerticalFov(vertices: Vector3[]): void {
    const up = new Vector3(0, 1, 0).applyQuaternion(this.quaternion);

    let maxVerticalAngle = 0;

    for (const vertex of vertices) {
      const vertexToCam = this.position.clone().sub(vertex);
      const vertexDirection = vertexToCam.normalize();

      const verticalAngle =
        Math.asin(Math.abs(vertexDirection.dot(up))) *
        Math.sign(vertexDirection.dot(up));

      if (Math.abs(verticalAngle) > maxVerticalAngle) {
        maxVerticalAngle = Math.abs(verticalAngle);
      }
    }

    const requiredFov = MathUtils.radToDeg(2 * maxVerticalAngle);

    this.verticalFovInternal = MathUtils.clamp(requiredFov, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  public fitBoxVerticalFov(box: Box3): void {
    this.fitPointsVerticalFov([
      new Vector3(box.min.x, box.min.y, box.min.z),
      new Vector3(box.min.x, box.min.y, box.max.z),
      new Vector3(box.min.x, box.max.y, box.min.z),
      new Vector3(box.min.x, box.max.y, box.max.z),
      new Vector3(box.max.x, box.min.y, box.min.z),
      new Vector3(box.max.x, box.min.y, box.max.z),
      new Vector3(box.max.x, box.max.y, box.min.z),
      new Vector3(box.max.x, box.max.y, box.max.z),
    ]);
  }

  public fitSkinnedMeshVerticalFov(skinnedMesh: SkinnedMesh): void {
    skinnedMesh.updateWorldMatrix(true, true);
    skinnedMesh.skeleton.update();

    const bakedGeometry = skinnedMesh.geometry;
    const position = bakedGeometry.attributes["position"] as BufferAttribute;
    const target = new Vector3();

    const points = [];

    for (let i = 0; i < position.count; i++) {
      target.fromBufferAttribute(position, i);
      skinnedMesh.applyBoneTransform(i, target);
      points.push(target.clone());
    }

    this.fitPointsVerticalFov(points);
  }

  public lookAtCenterOfMass(skinnedMesh: SkinnedMesh): void {
    skinnedMesh.updateWorldMatrix(true, true);
    skinnedMesh.skeleton.update();

    const bakedGeometry = skinnedMesh.geometry;
    const position = bakedGeometry.attributes.position as BufferAttribute;
    const target = new Vector3();
    const points: Vector3[] = [];

    for (let i = 0; i < position.count; i++) {
      target.fromBufferAttribute(position, i);
      skinnedMesh.applyBoneTransform(i, target);
      points.push(target.clone());
    }

    const findMainCluster = (points: Vector3[], iterations = 3): Vector3 => {
      if (points.length === 0) {
        return new Vector3();
      }

      let center = points[Math.floor(points.length / 2)].clone();

      for (let i = 0; i < iterations; i++) {
        let total = new Vector3();
        let count = 0;

        for (const point of points) {
          if (
            point.distanceTo(center) < point.distanceTo(total) ||
            count === 0
          ) {
            total.add(point);
            count++;
          }
        }

        if (count > 0) {
          center = total.divideScalar(count);
        }
      }

      return center;
    };

    const centerOfMass = findMainCluster(points);
    this.lookAt(centerOfMass);
  }

  public override clone(): this {
    const camera = new BiFovCamera(
      this.horizontalFovInternal,
      this.verticalFovInternal,
      this.aspect,
      this.near,
      this.far,
    ) as this;

    camera.copy(this, true);
    return camera;
  }
}

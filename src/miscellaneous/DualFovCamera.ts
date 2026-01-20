import type { Box3, BufferAttribute, SkinnedMesh } from "three";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

/** Default horizontal field of view in degrees */
const DEFAULT_HORIZONTAL_FOV = 90;
/** Default vertical field of view in degrees */
const DEFAULT_VERTICAL_FOV = 90;
/** Default aspect ratio (width/height) */
const DEFAULT_ASPECT = 1;
/** Default near clipping plane distance */
const DEFAULT_NEAR = 1;
/** Default far clipping plane distance */
const DEFAULT_FAR = 1000;

/** Minimum allowed field of view in degrees */
const MIN_FOV = 1;
/** Maximum allowed field of view in degrees */
const MAX_FOV = 179;

/**
 * Camera with independent horizontal and vertical FOV settings.
 */
export class DualFovCamera extends PerspectiveCamera {
  /** Internal storage for horizontal field of view in degrees */
  private horizontalFovInternal: number;
  /** Internal storage for vertical field of view in degrees */
  private verticalFovInternal: number;

  /**
   * @param horizontalFov - Horizontal FOV in degrees (clamped 1-179°)
   * @param verticalFov - Vertical FOV in degrees (clamped 1-179°)
   * @param aspect - Aspect ratio (width/height)
   * @param near - Near clipping plane distance
   * @param far - Far clipping plane distance
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

  /**
   * @returns Horizontal FOV in degrees
   */
  public get horizontalFov(): number {
    return this.horizontalFovInternal;
  }

  /**
   * @returns Vertical FOV in degrees
   */
  public get verticalFov(): number {
    return this.verticalFovInternal;
  }

  /**
   * @param value - Horizontal FOV in degrees (clamped 1-179°)
   */
  public set horizontalFov(value: number) {
    this.horizontalFovInternal = MathUtils.clamp(value, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /**
   * @param value - Vertical FOV in degrees (clamped 1-179°)
   */
  public set verticalFov(value: number) {
    this.verticalFovInternal = MathUtils.clamp(value, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /**
   * Sets both FOV values.
   *
   * @param horizontal - Horizontal FOV in degrees (clamped 1-179°)
   * @param vertical - Vertical FOV in degrees (clamped 1-179°)
   */
  public setFov(horizontal: number, vertical: number): void {
    this.horizontalFovInternal = MathUtils.clamp(horizontal, MIN_FOV, MAX_FOV);
    this.verticalFovInternal = MathUtils.clamp(vertical, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /**
   * Copies FOV settings from another DualFovCamera.
   *
   * @param source - Source camera to copy from
   */
  public copyFovSettings(source: DualFovCamera): void {
    this.horizontalFovInternal = source.horizontalFov;
    this.verticalFovInternal = source.verticalFov;
    this.updateProjectionMatrix();
  }

  /**
   * Updates projection matrix based on FOV and aspect ratio.
   *
   * Landscape (aspect > 1): preserves horizontal FOV.
   * Portrait (aspect ≤ 1): preserves vertical FOV.
   *
   * @override
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

  /**
   * Gets actual horizontal FOV after aspect ratio adjustments.
   *
   * @returns Horizontal FOV in degrees
   */
  public getActualHorizontalFov(): number {
    if (this.aspect >= 1) {
      return this.horizontalFovInternal;
    }
    const verticalRadians = MathUtils.degToRad(this.verticalFovInternal);
    return MathUtils.radToDeg(
      Math.atan(Math.tan(verticalRadians / 2) * this.aspect) * 2,
    );
  }

  /**
   * Gets actual vertical FOV after aspect ratio adjustments.
   *
   * @returns Vertical FOV in degrees
   */
  public getActualVerticalFov(): number {
    if (this.aspect < 1) {
      return this.verticalFovInternal;
    }
    const horizontalRadians = MathUtils.degToRad(this.horizontalFovInternal);
    return MathUtils.radToDeg(
      Math.atan(Math.tan(horizontalRadians / 2) / this.aspect) * 2,
    );
  }

  /**
   * Adjusts vertical FOV to fit points within camera view.
   *
   * @param vertices - Array of 3D points in world coordinates
   */
  public fitVerticalFovToPoints(vertices: Vector3[]): void {
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

  /**
   * Adjusts vertical FOV to fit bounding box within camera view.
   *
   * @param box - 3D bounding box in world coordinates
   */
  public fitVerticalFovToBox(box: Box3): void {
    this.fitVerticalFovToPoints([
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

  /**
   * Adjusts vertical FOV to fit skinned mesh within camera view.
   * Updates skeleton and applies bone transformations.
   *
   * @param skinnedMesh - Skinned mesh with active skeleton
   */
  public fitVerticalFovToMesh(skinnedMesh: SkinnedMesh): void {
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

    this.fitVerticalFovToPoints(points);
  }

  /**
   * Points camera to look at skinned mesh center of mass.
   * Uses iterative clustering to find main vertex concentration.
   *
   * @param skinnedMesh - Skinned mesh with active skeleton
   */
  public lookAtMeshCenterOfMass(skinnedMesh: SkinnedMesh): void {
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

    /**
     * Finds main cluster center using iterative refinement.
     *
     * @param points - Array of 3D points to cluster
     * @param iterations - Number of refinement iterations
     * @returns Center point of main cluster
     */
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

  /**
   * Creates a copy of this camera with identical settings.
   *
   * @returns New DualFovCamera instance
   * @override
   */
  public override clone(): this {
    const camera = new DualFovCamera(
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

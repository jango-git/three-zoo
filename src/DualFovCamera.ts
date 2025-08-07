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
 * A camera that supports independent horizontal and vertical FOV settings.
 * Extends Three.js PerspectiveCamera to allow separate control over horizontal
 * and vertical fields of view.
 */
export class DualFovCamera extends PerspectiveCamera {
  /** Internal storage for horizontal field of view in degrees */
  private horizontalFovInternal: number;
  /** Internal storage for vertical field of view in degrees */
  private verticalFovInternal: number;

  /**
   * Creates a new DualFovCamera instance with independent horizontal and vertical FOV control.
   *
   * @param horizontalFov - Horizontal field of view in degrees. Must be between 1° and 179°. Defaults to 90°.
   * @param verticalFov - Vertical field of view in degrees. Must be between 1° and 179°. Defaults to 90°.
   * @param aspect - Camera aspect ratio (width/height). Defaults to 1.
   * @param near - Near clipping plane distance. Must be greater than 0. Defaults to 1.
   * @param far - Far clipping plane distance. Must be greater than near plane. Defaults to 1000.
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
   * Gets the current horizontal field of view in degrees.
   *
   * @returns The horizontal FOV value between 1° and 179°
   */
  public get horizontalFov(): number {
    return this.horizontalFovInternal;
  }

  /**
   * Gets the current vertical field of view in degrees.
   *
   * @returns The vertical FOV value between 1° and 179°
   */
  public get verticalFov(): number {
    return this.verticalFovInternal;
  }

  /**
   * Sets the horizontal field of view in degrees.
   *
   * @param value - The horizontal FOV value in degrees. Will be clamped between 1° and 179°.
   */
  public set horizontalFov(value: number) {
    this.horizontalFovInternal = MathUtils.clamp(value, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /**
   * Sets the vertical field of view in degrees.
   *
   * @param value - The vertical FOV value in degrees. Will be clamped between 1° and 179°.
   */
  public set verticalFov(value: number) {
    this.verticalFovInternal = MathUtils.clamp(value, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /**
   * Updates both horizontal and vertical field of view values simultaneously.
   *
   * @param horizontal - Horizontal FOV in degrees. Will be clamped between 1° and 179°.
   * @param vertical - Vertical FOV in degrees. Will be clamped between 1° and 179°.
   */
  public setFov(horizontal: number, vertical: number): void {
    this.horizontalFovInternal = MathUtils.clamp(horizontal, MIN_FOV, MAX_FOV);
    this.verticalFovInternal = MathUtils.clamp(vertical, MIN_FOV, MAX_FOV);
    this.updateProjectionMatrix();
  }

  /**
   * Copies the field of view settings from another DualFovCamera instance.
   *
   * @param source - The DualFovCamera instance to copy FOV settings from.
   */
  public copyFovSettings(source: DualFovCamera): void {
    this.horizontalFovInternal = source.horizontalFov;
    this.verticalFovInternal = source.verticalFov;
    this.updateProjectionMatrix();
  }

  /**
   * Updates the projection matrix based on current FOV settings and aspect ratio.
   *
   * The behavior differs based on orientation:
   * - **Landscape mode (aspect > 1)**: Preserves horizontal FOV, calculates vertical FOV
   * - **Portrait mode (aspect ≤ 1)**: Preserves vertical FOV, calculates horizontal FOV
   *
   * This method is automatically called when FOV values or aspect ratio changes.
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
   * Gets the actual horizontal field of view after aspect ratio adjustments.
   *
   * In landscape mode, this returns the set horizontal FOV.
   * In portrait mode, this calculates the actual horizontal FOV based on the vertical FOV and aspect ratio.
   *
   * @returns The actual horizontal FOV in degrees
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
   * Gets the actual vertical field of view after aspect ratio adjustments.
   *
   * In portrait mode, this returns the set vertical FOV.
   * In landscape mode, this calculates the actual vertical FOV based on the horizontal FOV and aspect ratio.
   *
   * @returns The actual vertical FOV in degrees
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
   * Adjusts the vertical field of view to fit all specified points within the camera's view.
   *
   * This method calculates the required vertical FOV to ensure all provided vertices
   * are visible within the vertical bounds of the camera's frustum.
   *
   * @param vertices - Array of 3D points (in world coordinates) that should fit within the camera's vertical view
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
   * Adjusts the vertical field of view to fit a bounding box within the camera's view.
   *
   * This method calculates the required vertical FOV to ensure the entire bounding box
   * is visible within the vertical bounds of the camera's frustum.
   *
   * @param box - The 3D bounding box (in world coordinates) that should fit within the camera's vertical view
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
   * Adjusts the vertical field of view to fit a skinned mesh within the camera's view.
   *
   * This method updates the mesh's skeleton, applies bone transformations to all vertices,
   * and then calculates the required vertical FOV to ensure the entire deformed mesh
   * is visible within the vertical bounds of the camera's frustum.
   *
   * @param skinnedMesh - The skinned mesh (with active skeleton) that should fit within the camera's vertical view
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
   * Points the camera to look at the center of mass of a skinned mesh.
   *
   * This method updates the mesh's skeleton, applies bone transformations to all vertices,
   * calculates the center of mass using a clustering algorithm, and then orients the camera
   * to look at that point.
   *
   * The center of mass calculation uses an iterative clustering approach to find the
   * main concentration of vertices, which provides better results than a simple average
   * for complex meshes.
   *
   * @param skinnedMesh - The skinned mesh (with active skeleton) whose center of mass should be the camera's target
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
     * Finds the main cluster center of a set of 3D points using iterative refinement.
     *
     * @param points - Array of 3D points to cluster
     * @param iterations - Number of refinement iterations to perform
     * @returns The calculated center point of the main cluster
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
   * Creates a deep copy of this DualFovCamera instance.
   *
   * The cloned camera will have identical FOV settings, position, rotation,
   * and all other camera properties.
   *
   * @returns A new DualFovCamera instance that is an exact copy of this one
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

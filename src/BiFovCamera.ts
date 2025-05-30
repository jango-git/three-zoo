import { MathUtils, PerspectiveCamera } from "three";

/**
 * Default camera settings
 */
const DEFAULT_HORIZONTAL_FOV = 90;
const DEFAULT_VERTICAL_FOV = 90;
const DEFAULT_ASPECT = 1;
const DEFAULT_NEAR = 1;
const DEFAULT_FAR = 1000;

/**
 * BiFovCamera - A specialized PerspectiveCamera that supports independent horizontal and vertical FOV settings
 *
 * This camera extends Three.js PerspectiveCamera to provide better control over the field of view,
 * allowing separate horizontal and vertical FOV values. The camera automatically adjusts its projection
 * matrix based on the aspect ratio to maintain proper perspective.
 *
 * @extends PerspectiveCamera
 */
export class BiFovCamera extends PerspectiveCamera {
  private horizontalFovInternal: number;
  private verticalFovInternal: number;

  /**
   * Creates a new BiFovCamera instance
   *
   * @param horizontalFov - Horizontal field of view in degrees (default: 90)
   * @param verticalFov - Vertical field of view in degrees (default: 90)
   * @param aspect - Aspect ratio (width/height) of the viewport (default: 1)
   * @param near - Near clipping plane distance (default: 1)
   * @param far - Far clipping plane distance (default: 1000)
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
   * Gets the horizontal field of view in degrees
   */
  public get horizontalFov(): number {
    return this.horizontalFovInternal;
  }

  /**
   * Gets the vertical field of view in degrees
   */
  public get verticalFov(): number {
    return this.verticalFovInternal;
  }

  /**
   * Sets the horizontal field of view in degrees
   * @param value - The new horizontal FOV value
   */
  public set horizontalFov(value: number) {
    this.horizontalFovInternal = MathUtils.clamp(value, 1, 179);
    this.updateProjectionMatrix();
  }

  /**
   * Sets the vertical field of view in degrees
   * @param value - The new vertical FOV value
   */
  public set verticalFov(value: number) {
    this.verticalFovInternal = MathUtils.clamp(value, 1, 179);
    this.updateProjectionMatrix();
  }

  /**
   * Updates both horizontal and vertical FOV simultaneously
   * @param horizontal - New horizontal FOV in degrees
   * @param vertical - New vertical FOV in degrees
   */
  public setFov(horizontal: number, vertical: number): void {
    this.horizontalFovInternal = MathUtils.clamp(horizontal, 1, 179);
    this.verticalFovInternal = MathUtils.clamp(vertical, 1, 179);
    this.updateProjectionMatrix();
  }

  /**
   * Copies FOV settings from another BiFovCamera
   * @param source - The camera to copy settings from
   */
  public copyFovSettings(source: BiFovCamera): void {
    this.horizontalFovInternal = source.horizontalFov;
    this.verticalFovInternal = source.verticalFov;
    this.updateProjectionMatrix();
  }

  /**
   * Updates the projection matrix based on current FOV settings and aspect ratio
   * For aspect ratios >= 1 (landscape), horizontal FOV is preserved
   * For aspect ratios < 1 (portrait), vertical FOV is preserved
   */
  public override updateProjectionMatrix(): void {
    if (this.aspect >= 1) {
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
   * Returns the actual horizontal FOV after aspect ratio adjustments
   */
  public getEffectiveHorizontalFov(): number {
    if (this.aspect >= 1) {
      return this.horizontalFovInternal;
    }
    const verticalRadians = MathUtils.degToRad(this.verticalFovInternal);
    return MathUtils.radToDeg(
      Math.atan(Math.tan(verticalRadians / 2) * this.aspect) * 2,
    );
  }

  /**
   * Returns the actual vertical FOV after aspect ratio adjustments
   */
  public getEffectiveVerticalFov(): number {
    if (this.aspect < 1) {
      return this.verticalFovInternal;
    }
    const horizontalRadians = MathUtils.degToRad(this.horizontalFovInternal);
    return MathUtils.radToDeg(
      Math.atan(Math.tan(horizontalRadians / 2) / this.aspect) * 2,
    );
  }

  /**
   * Creates a clone of this camera with the same properties
   */
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

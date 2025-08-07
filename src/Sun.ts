import type { Texture } from "three";
import { Box3, DirectionalLight, RGBAFormat, Spherical, Vector3 } from "three";

/** Number of color channels in RGBA format */
const RGBA_CHANNEL_COUNT = 4;
/** Number of color channels in RGB format */
const RGB_CHANNEL_COUNT = 3;

/** Red channel weight for luminance calculation (ITU-R BT.709) */
const LUMINANCE_R = 0.2126;
/** Green channel weight for luminance calculation (ITU-R BT.709) */
const LUMINANCE_G = 0.7152;
/** Blue channel weight for luminance calculation (ITU-R BT.709) */
const LUMINANCE_B = 0.0722;

/**
 * A directional light with spherical positioning controls and advanced shadow mapping.
 *
 * Extends Three.js DirectionalLight to provide intuitive spherical coordinate control
 * (distance, elevation, azimuth) and automatic shadow map configuration for bounding boxes.
 * Also supports automatic sun direction calculation from HDR environment maps.
 */
export class Sun extends DirectionalLight {
  /** Internal vectors to avoid garbage collection during calculations */
  private readonly tempVector3D0 = new Vector3();
  private readonly tempVector3D1 = new Vector3();
  private readonly tempVector3D2 = new Vector3();
  private readonly tempVector3D3 = new Vector3();
  private readonly tempVector3D4 = new Vector3();
  private readonly tempVector3D5 = new Vector3();
  private readonly tempVector3D6 = new Vector3();
  private readonly tempVector3D7 = new Vector3();
  private readonly tempBox3 = new Box3();
  private readonly tempSpherical = new Spherical();

  /**
   * Gets the distance from the light to its target (origin).
   *
   * @returns The distance in world units
   */
  public get distance(): number {
    return this.position.length();
  }

  /**
   * Gets the elevation angle (vertical angle from the horizontal plane).
   *
   * @returns The elevation angle in radians (0 = horizontal, π/2 = directly above)
   */
  public get elevation(): number {
    return this.tempSpherical.setFromVector3(this.position).phi;
  }

  /**
   * Gets the azimuth angle (horizontal rotation around the target).
   *
   * @returns The azimuth angle in radians (0 = positive X axis, π/2 = positive Z axis)
   */
  public get azimuth(): number {
    return this.tempSpherical.setFromVector3(this.position).theta;
  }

  /**
   * Sets the distance while preserving current elevation and azimuth angles.
   *
   * @param value - The new distance in world units
   */
  public set distance(value: number) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      value,
      this.tempSpherical.phi,
      this.tempSpherical.theta,
    );
  }

  /**
   * Sets the elevation angle while preserving current distance and azimuth.
   *
   * @param value - The new elevation angle in radians (0 = horizontal, π/2 = directly above)
   */
  public set elevation(value: number) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      this.tempSpherical.radius,
      value,
      this.tempSpherical.theta,
    );
  }

  /**
   * Sets the azimuth angle while preserving current distance and elevation.
   *
   * @param value - The new azimuth angle in radians (0 = positive X axis, π/2 = positive Z axis)
   */
  public set azimuth(value: number) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      this.tempSpherical.radius,
      this.tempSpherical.phi,
      value,
    );
  }

  /**
   * Configures the shadow camera to optimally cover a bounding box.
   *
   * This method automatically adjusts the directional light's shadow camera frustum
   * to perfectly encompass the provided bounding box, ensuring efficient shadow map
   * usage and eliminating shadow clipping issues.
   *
   * @param box3 - The 3D bounding box to cover with shadows
   */
  public configureShadowsForBoundingBox(box3: Box3): void {
    const camera = this.shadow.camera;

    this.target.updateWorldMatrix(true, false);
    this.lookAt(this.target.getWorldPosition(this.tempVector3D0));

    this.updateWorldMatrix(true, false);

    const points: Vector3[] = [
      this.tempVector3D0.set(box3.min.x, box3.min.y, box3.min.z),
      this.tempVector3D1.set(box3.min.x, box3.min.y, box3.max.z),
      this.tempVector3D2.set(box3.min.x, box3.max.y, box3.min.z),
      this.tempVector3D3.set(box3.min.x, box3.max.y, box3.max.z),
      this.tempVector3D4.set(box3.max.x, box3.min.y, box3.min.z),
      this.tempVector3D5.set(box3.max.x, box3.min.y, box3.max.z),
      this.tempVector3D6.set(box3.max.x, box3.max.y, box3.min.z),
      this.tempVector3D7.set(box3.max.x, box3.max.y, box3.max.z),
    ];

    const inverseMatrix = this.matrixWorld.clone().invert();

    for (const point of points) {
      point.applyMatrix4(inverseMatrix);
    }

    const newBox3 = this.tempBox3.setFromPoints(points);

    camera.left = newBox3.min.x;
    camera.bottom = newBox3.min.y;
    camera.near = -newBox3.max.z;

    camera.right = newBox3.max.x;
    camera.top = newBox3.max.y;
    camera.far = -newBox3.min.z;

    camera.updateWorldMatrix(true, false);
    camera.updateProjectionMatrix();
  }

  /**
   * Sets the sun's direction based on the brightest point in an HDR environment map.
   *
   * This method analyzes an HDR texture to find the pixel with the highest luminance
   * value and positions the sun to shine from that direction. This is useful for
   * creating realistic lighting that matches HDR environment maps.
   *
   * @param texture - The HDR texture to analyze (must have image data available)
   * @param distance - The distance to place the sun from the origin (defaults to 1)
   */
  public setDirectionFromHDRTexture(texture: Texture, distance = 1): void {
    const data = texture.image.data;
    const width = texture.image.width;
    const height = texture.image.height;

    let maxLuminance = 0;
    let maxIndex = 0;

    // Find brightest pixel

    const step =
      texture.format === RGBAFormat ? RGBA_CHANNEL_COUNT : RGB_CHANNEL_COUNT;
    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = LUMINANCE_R * r + LUMINANCE_G * g + LUMINANCE_B * b;
      if (luminance > maxLuminance) {
        maxLuminance = luminance;
        maxIndex = i;
      }
    }

    // Convert to spherical coordinates
    const pixelIndex = maxIndex / step;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const u = x / width;
    const v = y / height;

    const elevation = v * Math.PI;
    const azimuth = u * -Math.PI * 2 - Math.PI / 2;

    this.position.setFromSphericalCoords(distance, elevation, azimuth);
  }
}

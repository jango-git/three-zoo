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
 * Directional light with spherical positioning and HDR environment support.
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
   * @returns Distance from light position to origin
   */
  public get distance(): number {
    return this.position.length();
  }

  /**
   * @returns Elevation angle in radians (phi angle)
   */
  public get elevation(): number {
    return this.tempSpherical.setFromVector3(this.position).phi;
  }

  /**
   * @returns Azimuth angle in radians (theta angle)
   */
  public get azimuth(): number {
    return this.tempSpherical.setFromVector3(this.position).theta;
  }

  /**
   * @param value - New distance in world units
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
   * @param value - New elevation angle in radians (phi angle)
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
   * @param value - New azimuth angle in radians (theta angle)
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
   * Sets spherical position of the sun.
   *
   * @param elevation - Elevation angle in radians (phi angle)
   * @param azimuth - Azimuth angle in radians (theta angle)
   * @param distance - Distance from origin in world units
   */
  public setPosition(elevation: number, azimuth: number, distance = 1): void {
    this.position.setFromSphericalCoords(distance, elevation, azimuth);
  }

  /**
   * Configures shadow camera frustum to cover bounding box.
   *
   * @param box3 - 3D bounding box to cover with shadows
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
   * Sets sun direction based on brightest point in HDR environment map.
   *
   * @param texture - HDR texture to analyze (must have image data)
   * @param distance - Distance to place sun from origin
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

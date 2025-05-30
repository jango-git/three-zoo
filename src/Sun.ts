import type { Texture } from "three";
import { Box3, DirectionalLight, RGBAFormat, Spherical, Vector3 } from "three";

/**
 * Sun extends Three.js DirectionalLight to provide a specialized light source that simulates
 * sunlight with advanced positioning and shadow controls.
 * 
 * Features:
 * - Spherical coordinate control (distance, elevation, azimuth)
 * - Automatic shadow map configuration based on bounding boxes
 * - HDR environment map-based positioning
 * - Efficient temporary vector management for calculations
 * 
 * @extends DirectionalLight
 */
export class Sun extends DirectionalLight {
  // Temporary vectors for calculations to avoid garbage collection
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
   * Gets the distance of the sun from its target (radius in spherical coordinates)
   * @returns The distance in world units
   */
  public get distance(): number {
    return this.position.length();
  }

  /**
   * Gets the elevation angle of the sun (phi in spherical coordinates)
   * @returns The elevation in radians
   */
  public get elevation(): number {
    return this.tempSpherical.setFromVector3(this.position).phi;
  }

  /**
   * Gets the azimuth angle of the sun (theta in spherical coordinates)
   * @returns The azimuth in radians
   */
  public get azimuth(): number {
    return this.tempSpherical.setFromVector3(this.position).theta;
  }

  /**
   * Sets the distance of the sun from its target while maintaining current angles
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
   * Sets the elevation angle of the sun while maintaining current distance and azimuth
   * @param value - The new elevation in radians
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
   * Sets the azimuth angle of the sun while maintaining current distance and elevation
   * @param value - The new azimuth in radians
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
   * Configures the shadow camera's frustum to encompass the given bounding box
   * This ensures that shadows are cast correctly for objects within the box
   * 
   * @param box3 - The bounding box to configure shadows for
   */
  public setShadowMapFromBox3(box3: Box3): void {
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
   * Sets the sun's direction based on the brightest point in an HDR texture
   * This is useful for matching the sun's position to an environment map
   * 
   * @param texture - The HDR texture to analyze (must be loaded and have valid image data)
   * @param distance - Optional distance to position the sun from its target (default: 1)
   */
  public setDirectionFromHDR(texture: Texture, distance = 1): void {
    const data = texture.image.data;
    const width = texture.image.width;
    const height = texture.image.height;

    let maxLuminance = 0;
    let maxIndex = 0;

    // Find the brightest pixel in the HDR texture
    const step = texture.format === RGBAFormat ? 4 : 3;
    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Calculate luminance using the Rec. 709 coefficients
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luminance > maxLuminance) {
        maxLuminance = luminance;
        maxIndex = i;
      }
    }

    // Convert pixel coordinates to spherical coordinates
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
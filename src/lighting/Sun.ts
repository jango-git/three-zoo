import type { OrthographicCamera, Texture } from "three";
import {
  Box3,
  DirectionalLight,
  PerspectiveCamera,
  RGBAFormat,
  Spherical,
  Vector3,
} from "three";

/** Radians-per-degree conversion factor */
const DEG2RAD = Math.PI / 180;

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
   * Configures shadow camera frustum to cover the visible volume of a scene camera.
   * Supports both perspective (frustum) and orthographic (box) cameras.
   *
   * @param sceneCamera - PerspectiveCamera or OrthographicCamera whose visible volume defines the shadow region
   */
  public configureShadowsForCamera(
    sceneCamera: PerspectiveCamera | OrthographicCamera,
  ): void {
    const shadowCamera = this.shadow.camera;

    this.target.updateWorldMatrix(true, false);
    this.lookAt(this.target.getWorldPosition(this.tempVector3D0));
    this.updateWorldMatrix(true, false);

    sceneCamera.updateWorldMatrix(true, false);
    if (sceneCamera instanceof PerspectiveCamera) {
      this.computeFrustumPoints(sceneCamera);
    } else {
      this.computeOrthographicPoints(sceneCamera);
    }

    const inverseMatrix = this.matrixWorld.clone().invert();

    const points: Vector3[] = [
      this.tempVector3D0,
      this.tempVector3D1,
      this.tempVector3D2,
      this.tempVector3D3,
      this.tempVector3D4,
      this.tempVector3D5,
      this.tempVector3D6,
      this.tempVector3D7,
    ];

    for (const point of points) {
      point.applyMatrix4(inverseMatrix);
    }

    const newBox3 = this.tempBox3.setFromPoints(points);

    shadowCamera.left = newBox3.min.x;
    shadowCamera.bottom = newBox3.min.y;
    shadowCamera.near = -newBox3.max.z;

    shadowCamera.right = newBox3.max.x;
    shadowCamera.top = newBox3.max.y;
    shadowCamera.far = -newBox3.min.z;

    shadowCamera.updateWorldMatrix(true, false);
    shadowCamera.updateProjectionMatrix();
  }

  /**
   * Sets sun direction, color and intensity based on brightest point in HDR environment map.
   *
   * @param texture - HDR texture to analyze (must have image data)
   * @param distance - Distance to place sun from origin
   * @param intensityScale - Multiplier for intensity derived from luminance (default: 1)
   */
  public setFromHDRTexture(
    texture: Texture,
    intensityScale = 1,
    distance = 1,
  ): void {
    this.setColorFromHDRTexture(texture);
    this.setIntensityFromHDRTexture(texture, intensityScale);
    this.setDirectionFromHDRTexture(texture, distance);
  }

  /**
   * Sets sun color based on brightest point in HDR environment map.
   *
   * @param texture - HDR texture to analyze (must have image data)
   */
  public setColorFromHDRTexture(texture: Texture): void {
    const { index } = this.findBrightestPixel(texture);
    const data = texture.image.data;

    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const maxChannel = Math.max(r, g, b, 1);

    this.color.setRGB(r / maxChannel, g / maxChannel, b / maxChannel);
  }

  /**
   * Sets sun intensity based on luminance of brightest point in HDR environment map.
   *
   * @param texture - HDR texture to analyze (must have image data)
   * @param scale - Multiplier for intensity (default: 1)
   */
  public setIntensityFromHDRTexture(texture: Texture, scale = 1): void {
    const { luminance } = this.findBrightestPixel(texture);
    this.intensity = luminance * scale;
  }

  /**
   * Sets sun direction based on brightest point in HDR environment map.
   *
   * @param texture - HDR texture to analyze (must have image data)
   * @param distance - Distance to place sun from origin
   */
  public setDirectionFromHDRTexture(texture: Texture, distance = 1): void {
    const { index } = this.findBrightestPixel(texture);

    const width = texture.image.width;
    const height = texture.image.height;
    const step =
      texture.format === RGBAFormat ? RGBA_CHANNEL_COUNT : RGB_CHANNEL_COUNT;

    // Convert to spherical coordinates
    const pixelIndex = index / step;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const u = x / width;
    const v = y / height;

    const elevation = v * Math.PI;
    const azimuth = u * -Math.PI * 2 - Math.PI / 2;

    this.position.setFromSphericalCoords(distance, elevation, azimuth);
  }

  /**
   * Finds the brightest pixel in an HDR texture.
   *
   * @param texture - HDR texture to analyze
   * @returns Index and luminance of brightest pixel
   */
  private findBrightestPixel(texture: Texture): {
    index: number;
    luminance: number;
  } {
    const data = texture.image.data;

    let maxLuminance = 0;
    let maxIndex = 0;

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

    return { index: maxIndex, luminance: maxLuminance };
  }

  /**
   * Computes the 8 frustum corner points of a perspective camera in world space,
   * storing them in the temporary Vector3 members.
   *
   * @param camera - The perspective camera to compute frustum points for
   */
  private computeFrustumPoints(camera: PerspectiveCamera): void {
    const fovRad = camera.fov * DEG2RAD;
    const halfTanFov = Math.tan(fovRad / 2);

    const nearHalfH = camera.near * halfTanFov;
    const nearHalfW = nearHalfH * camera.aspect;
    const farHalfH = camera.far * halfTanFov;
    const farHalfW = farHalfH * camera.aspect;

    this.tempVector3D0.set(-nearHalfW, -nearHalfH, -camera.near);
    this.tempVector3D1.set(nearHalfW, -nearHalfH, -camera.near);
    this.tempVector3D2.set(-nearHalfW, nearHalfH, -camera.near);
    this.tempVector3D3.set(nearHalfW, nearHalfH, -camera.near);

    this.tempVector3D4.set(-farHalfW, -farHalfH, -camera.far);
    this.tempVector3D5.set(farHalfW, -farHalfH, -camera.far);
    this.tempVector3D6.set(-farHalfW, farHalfH, -camera.far);
    this.tempVector3D7.set(farHalfW, farHalfH, -camera.far);

    this.tempVector3D0.applyMatrix4(camera.matrixWorld);
    this.tempVector3D1.applyMatrix4(camera.matrixWorld);
    this.tempVector3D2.applyMatrix4(camera.matrixWorld);
    this.tempVector3D3.applyMatrix4(camera.matrixWorld);
    this.tempVector3D4.applyMatrix4(camera.matrixWorld);
    this.tempVector3D5.applyMatrix4(camera.matrixWorld);
    this.tempVector3D6.applyMatrix4(camera.matrixWorld);
    this.tempVector3D7.applyMatrix4(camera.matrixWorld);
  }

  /**
   * Computes the 8 corner points of an orthographic camera's visible box in world space,
   * storing them in the temporary Vector3 members.
   *
   * @param camera - The orthographic camera to compute box points for
   */
  private computeOrthographicPoints(camera: OrthographicCamera): void {
    this.tempVector3D0.set(camera.left, camera.bottom, -camera.near);
    this.tempVector3D1.set(camera.right, camera.bottom, -camera.near);
    this.tempVector3D2.set(camera.left, camera.top, -camera.near);
    this.tempVector3D3.set(camera.right, camera.top, -camera.near);

    this.tempVector3D4.set(camera.left, camera.bottom, -camera.far);
    this.tempVector3D5.set(camera.right, camera.bottom, -camera.far);
    this.tempVector3D6.set(camera.left, camera.top, -camera.far);
    this.tempVector3D7.set(camera.right, camera.top, -camera.far);

    this.tempVector3D0.applyMatrix4(camera.matrixWorld);
    this.tempVector3D1.applyMatrix4(camera.matrixWorld);
    this.tempVector3D2.applyMatrix4(camera.matrixWorld);
    this.tempVector3D3.applyMatrix4(camera.matrixWorld);
    this.tempVector3D4.applyMatrix4(camera.matrixWorld);
    this.tempVector3D5.applyMatrix4(camera.matrixWorld);
    this.tempVector3D6.applyMatrix4(camera.matrixWorld);
    this.tempVector3D7.applyMatrix4(camera.matrixWorld);
  }
}

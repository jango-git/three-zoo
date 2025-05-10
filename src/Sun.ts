import {
  Box3,
  DirectionalLight,
  RGBAFormat,
  Spherical,
  Texture,
  Vector3,
} from "three";

export class Sun extends DirectionalLight {
  private tempVector3D0 = new Vector3();
  private tempVector3D1 = new Vector3();
  private tempVector3D2 = new Vector3();
  private tempVector3D3 = new Vector3();
  private tempVector3D4 = new Vector3();
  private tempVector3D5 = new Vector3();
  private tempVector3D6 = new Vector3();
  private tempVector3D7 = new Vector3();

  private tempBox3 = new Box3();
  private tempSpherical = new Spherical();

  public get distance(): number {
    return this.position.length();
  }

  public get elevation(): number {
    return this.tempSpherical.setFromVector3(this.position).phi;
  }

  public get azimuth(): number {
    return this.tempSpherical.setFromVector3(this.position).theta;
  }

  public set distance(value: number) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      value,
      this.tempSpherical.phi,
      this.tempSpherical.theta,
    );
  }

  public set elevation(value: number) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      this.tempSpherical.radius,
      value,
      this.tempSpherical.theta,
    );
  }

  public set azimuth(value: number) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      this.tempSpherical.radius,
      this.tempSpherical.phi,
      value,
    );
  }

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

  public setDirectionFromHDR(texture: Texture, distance = 1): void {
    const data = texture.image.data;
    const width = texture.image.width;
    const height = texture.image.height;

    let maxLuminance = 0;
    let maxIndex = 0;

    const step = texture.format === RGBAFormat ? 4 : 3;
    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luminance > maxLuminance) {
        maxLuminance = luminance;
        maxIndex = i;
      }
    }

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

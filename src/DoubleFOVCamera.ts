import { MathUtils, PerspectiveCamera } from "three";

export class DoubleFOVCamera extends PerspectiveCamera {
  constructor(
    public horizontalFov = 90,
    public verticalFov = 90,
    aspect = 1,
    near = 1,
    far = 1000,
  ) {
    super(verticalFov, aspect, near, far);
  }

  public override updateProjectionMatrix(): void {
    if (this.aspect >= 1) {
      const radians = MathUtils.degToRad(this.horizontalFov);
      this.fov = MathUtils.radToDeg(
        Math.atan(Math.tan(radians / 2) / this.aspect) * 2,
      );
    } else {
      this.fov = this.verticalFov;
    }

    super.updateProjectionMatrix();
  }
}

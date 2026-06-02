import { MathUtils } from "three";

export const MIN_FOV = 1;
export const MAX_FOV = 179;

export function clampFov(value: number): number {
  return MathUtils.clamp(value, MIN_FOV, MAX_FOV);
}

/** Vertical FOV (degrees) that yields the given horizontal FOV (degrees) at aspect = width / height. */
export function verticalFovFromHorizontal(horizontalFov: number, aspect: number): number {
  const radians = MathUtils.degToRad(horizontalFov);
  return MathUtils.radToDeg(Math.atan(Math.tan(radians / 2) / aspect) * 2);
}

/** Base class for FOV policies that derive a vertical FOV from the current aspect ratio. */
export abstract class FovPolicy {
  /**
   * @internal
   * Vertical FOV in degrees for the given aspect ratio (width / height).
   *
   * The result is not clamped; the camera clamps it to a valid range before use.
   */
  public abstract calculateFov(aspect: number): number;

  public abstract clone(): FovPolicy;
}

import type { BufferGeometry } from "three";

const POSITION_COMPONENT_COUNT = 3;
const NORMAL_COMPONENT_COUNT = 3;

/**
 * Internal utility to identify identical geometries.
 * @internal
 */
export class GeometryHasher {
  /**
   * Creates a hash for a geometry based on its vertex data.
   * Vertices that differ by less than tolerance are considered the same.
   *
   * @param geometry - Geometry to hash
   * @param tolerance - How close vertices need to be to count as identical
   * @returns Hash string that's the same for matching geometries
   * @internal
   */
  public static getGeometryHash(
    geometry: BufferGeometry,
    tolerance: number,
  ): string {
    const position = geometry.attributes["position"];

    const positionArray = position.array;
    const positionHashParts: string[] = [];

    // Sample vertex positions with tolerance
    for (let i = 0; i < positionArray.length; i += POSITION_COMPONENT_COUNT) {
      const x = Math.round(positionArray[i] / tolerance);
      const y = Math.round(positionArray[i + 1] / tolerance);
      const z = Math.round(positionArray[i + 2] / tolerance);
      positionHashParts.push(`${x},${y},${z}`);
    }

    // Hash normal data if available
    const normal = geometry.attributes["normal"];
    const normalHashParts: string[] = [];

    const normalArray = normal.array;
    for (let i = 0; i < normalArray.length; i += NORMAL_COMPONENT_COUNT) {
      const x = Math.round(normalArray[i] / tolerance);
      const y = Math.round(normalArray[i + 1] / tolerance);
      const z = Math.round(normalArray[i + 2] / tolerance);
      normalHashParts.push(`${x},${y},${z}`);
    }

    // Combine position and normal hashes
    const positionHash = positionHashParts.join("|");
    const normalHash = normalHashParts.join("|");

    return `${positionHash}#${normalHash}`;
  }
}

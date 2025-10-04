import type { BufferGeometry } from "three";

const POSITION_COMPONENT_COUNT = 3;
const NORMAL_COMPONENT_COUNT = 3;

/**
 * Utility for identifying identical geometries.
 * @internal
 */
export class GeometryHasher {
  /**
   * Creates geometry hash based on vertex data.
   * Vertices within tolerance are considered identical.
   *
   * @param geometry - Geometry to hash
   * @param tolerance - Distance tolerance for vertex comparison
   * @returns Hash string
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

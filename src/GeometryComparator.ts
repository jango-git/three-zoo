import {
  BufferAttribute,
  BufferGeometry,
  InterleavedBufferAttribute,
} from "three";

type AnySuitableAttribute = BufferAttribute | InterleavedBufferAttribute;

/**
 * Utility class for comparing and hashing BufferGeometry instances with tolerance support.
 */
export class GeometryComparator {
  /**
   * Generates a consistent hash for a BufferGeometry based on its contents and tolerance.
   *
   * @param geometry - The geometry to hash
   * @param tolerance - Precision level for number comparison (values within tolerance are considered equal)
   * @returns A string hash that will be identical for geometrically equivalent geometries
   */
  public static getGeometryHash(
    geometry: BufferGeometry,
    tolerance = 1e-6,
  ): string {
    const hashParts: string[] = [];

    // Process attributes
    const attributes = geometry.attributes;
    const attributeNames = Object.keys(attributes).sort(); // Sort for consistent order

    for (const name of attributeNames) {
      const attribute = attributes[name] as AnySuitableAttribute;
      hashParts.push(
        `${name}:${attribute.itemSize}:${this.getAttributeHash(attribute, tolerance)}`,
      );
    }

    // Process index if present
    if (geometry.index) {
      hashParts.push(
        `index:${this.getAttributeHash(geometry.index, tolerance)}`,
      );
    }

    return hashParts.join("|");
  }

  /**
   * Compares two BufferGeometry instances for approximate equality.
   * Early exit if UUIDs match (same object or cloned geometry).
   */
  public static compare(
    firstGeometry: BufferGeometry,
    secondGeometry: BufferGeometry,
    tolerance = 1e-6,
  ): boolean {
    if (firstGeometry.uuid === secondGeometry.uuid) {
      return true;
    }

    // Use hash comparison for consistent results
    return (
      this.getGeometryHash(firstGeometry, tolerance) ===
      this.getGeometryHash(secondGeometry, tolerance)
    );
  }

  /**
   * Generates a hash for a buffer attribute with tolerance.
   */
  private static getAttributeHash(
    attribute: AnySuitableAttribute,
    tolerance: number,
  ): string {
    const array = attribute.array;
    const itemSize = "itemSize" in attribute ? attribute.itemSize : 1;
    const hashParts: string[] = [];

    // Group values by their "tolerance buckets"
    for (let i = 0; i < array.length; i += itemSize) {
      const itemValues = [];
      for (let j = 0; j < itemSize; j++) {
        const val = array[i + j];
        // Round to nearest tolerance multiple to group similar values
        itemValues.push(Math.round(val / tolerance) * tolerance);
      }
      hashParts.push(itemValues.join(","));
    }

    return hashParts.join(";");
  }

  /**
   * Compares two buffer attributes with tolerance.
   */
  private static compareBufferAttributes(
    firstAttribute: AnySuitableAttribute,
    secondAttribute: AnySuitableAttribute,
    tolerance: number,
  ): boolean {
    return (
      this.getAttributeHash(firstAttribute, tolerance) ===
      this.getAttributeHash(secondAttribute, tolerance)
    );
  }
}

// import {
//   BufferAttribute,
//   BufferGeometry,
//   InterleavedBufferAttribute,
// } from "three";

// type AnySuitableAttribute = BufferAttribute | InterleavedBufferAttribute;

// /**
//  * Utility class for comparing two BufferGeometry instances with tolerance support.
//  * Checks geometry attributes (positions, normals, UVs, etc.) and indices (if present).
//  */
// export class GeometryComparator {
//   /**
//    * Compares two BufferGeometry instances for approximate equality.
//    * Early exit if UUIDs match (same object or cloned geometry).
//    *
//    * @param firstGeometry - The first geometry to compare.
//    * @param secondGeometry - The second geometry to compare.
//    * @param tolerance - Maximum allowed difference between numeric values (default: 1e-6).
//    * @returns `true` if geometries are equivalent within tolerance, otherwise `false`.
//    */
//   public static compare(
//     firstGeometry: BufferGeometry,
//     secondGeometry: BufferGeometry,
//     tolerance = 1e-6,
//   ): boolean {
//     if (firstGeometry.uuid === secondGeometry.uuid) {
//       return true;
//     }

//     const firstAttributes = firstGeometry.attributes;
//     const secondAttributes = secondGeometry.attributes;

//     const firstAttributeNames = Object.keys(firstAttributes);
//     const secondAttributeNames = Object.keys(secondAttributes);

//     if (firstAttributeNames.length !== secondAttributeNames.length) {
//       return false;
//     }

//     for (const attributeName of firstAttributeNames) {
//       if (!secondAttributes[attributeName]) {
//         return false;
//       }

//       const firstAttribute = firstAttributes[
//         attributeName
//       ] as AnySuitableAttribute;
//       const secondAttribute = secondAttributes[
//         attributeName
//       ] as AnySuitableAttribute;

//       if (
//         firstAttribute.count !== secondAttribute.count ||
//         firstAttribute.itemSize !== secondAttribute.itemSize ||
//         !this.compareBufferAttributes(
//           firstAttribute,
//           secondAttribute,
//           tolerance,
//         )
//       ) {
//         return false;
//       }
//     }

//     if (firstGeometry.index || secondGeometry.index) {
//       if (!firstGeometry.index || !secondGeometry.index) {
//         return false;
//       }

//       if (
//         !this.compareBufferAttributes(
//           firstGeometry.index,
//           secondGeometry.index,
//           tolerance,
//         )
//       ) {
//         return false;
//       }
//     }

//     return true;
//   }

//   /**
//    * Compares two buffer attributes (or index buffers) with tolerance.
//    *
//    * @param firstAttribute - First attribute/indices to compare.
//    * @param secondAttribute - Second attribute/indices to compare.
//    * @param tolerance - Maximum allowed difference between array elements.
//    * @returns `true` if arrays are equal within tolerance, otherwise `false`.
//    */
//   private static compareBufferAttributes(
//     firstAttribute: AnySuitableAttribute,
//     secondAttribute: AnySuitableAttribute,
//     tolerance: number,
//   ): boolean {
//     const firstArray = firstAttribute.array;
//     const secondArray = secondAttribute.array;

//     if (firstArray.length !== secondArray.length) {
//       return false;
//     }

//     for (let index = 0; index < firstArray.length; index++) {
//       if (Math.abs(firstArray[index] - secondArray[index]) > tolerance) {
//         return false;
//       }
//     }

//     return true;
//   }
// }

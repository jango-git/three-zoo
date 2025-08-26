import type { MeshStandardMaterial } from "three";
import { MeshLambertMaterial } from "three";

/** Factor for metalness darkness adjustment */
const METALNESS_DARKNESS_FACTOR = 0.3;
/** Roughness threshold for additional darkening */
const ROUGHNESS_THRESHOLD = 0.5;
/** Factor for roughness color adjustment */
const ROUGHNESS_COLOR_ADJUSTMENT = 0.2;
/** Minimum reflectivity boost for environment maps */
const REFLECTIVITY_BOOST = 0.1;

/**
 * Configuration options for the StandardToLambertConverter.
 */
export interface StandardToLambertConverterOptions {
  /**
   * Whether to preserve the original material's name
   * @defaultValue true
   */
  preserveName: boolean;
  /**
   * Whether to copy user data from the original material
   * @defaultValue true
   */
  copyUserData: boolean;
  /**
   * Whether to dispose the original material after conversion
   * @defaultValue false
   */
  disposeOriginal: boolean;
  /**
   * Custom color adjustment factor for roughness compensation
   * @defaultValue 0.8
   */
  roughnessColorFactor: number;
}

/**
 * Converts Three.js MeshStandardMaterial to MeshLambertMaterial.
 *
 * Handles translation between PBR properties of StandardMaterial and
 * the Lambertian reflectance model used by LambertMaterial. Applies
 * color compensation based on metalness and roughness values.
 */
export class StandardToLambertConverter {
  /**
   * Converts a MeshStandardMaterial to MeshLambertMaterial.
   *
   * Performs conversion from PBR StandardMaterial to Lambert lighting model
   * with color compensation based on metalness and roughness values.
   *
   * @param material - The source MeshStandardMaterial to convert
   * @param options - Configuration options for the conversion
   * @returns A new MeshLambertMaterial with properties mapped from the standard material
   *
   * @example
   * ```typescript
   * const standardMaterial = new MeshStandardMaterial({
   *   color: 0xff0000,
   *   metalness: 0.8,
   *   roughness: 0.2
   * });
   *
   * const lambertMaterial = StandardToLambertConverter.convert(standardMaterial);
   * ```
   */
  public static convert(
    material: MeshStandardMaterial,
    options: Partial<StandardToLambertConverterOptions> = {},
  ): MeshLambertMaterial {
    const config = {
      preserveName: true,
      copyUserData: true,
      disposeOriginal: false,
      roughnessColorFactor: 0.8,
      ...options,
    };

    // Create new Lambert material
    const lambertMaterial = new MeshLambertMaterial();

    // Copy basic material properties
    this.copyBasicProperties(material, lambertMaterial, config);

    // Handle color properties with roughness compensation
    this.convertColorProperties(material, lambertMaterial, config);

    // Handle texture maps
    this.convertTextureMaps(material, lambertMaterial);

    // Handle transparency and alpha
    this.convertTransparencyProperties(material, lambertMaterial);

    // Cleanup if requested
    if (config.disposeOriginal) {
      material.dispose();
    }

    lambertMaterial.needsUpdate = true;
    return lambertMaterial;
  }

  /**
   * Copies basic material properties from source to target material.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshLambertMaterial
   * @param config - The resolved configuration options
   * @internal
   */
  private static copyBasicProperties(
    source: MeshStandardMaterial,
    target: MeshLambertMaterial,
    config: Required<StandardToLambertConverterOptions>,
  ): void {
    if (config.preserveName) {
      target.name = source.name;
    }

    target.side = source.side;
    target.visible = source.visible;
    target.fog = source.fog;
    target.wireframe = source.wireframe;
    target.wireframeLinewidth = source.wireframeLinewidth;
    target.vertexColors = source.vertexColors;
    target.flatShading = source.flatShading;

    if (config.copyUserData) {
      target.userData = { ...source.userData };
    }
  }

  /**
   * Converts color-related properties with PBR compensation.
   *
   * Applies color adjustments to compensate for the loss of metalness and
   * roughness information when converting to Lambert material.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshLambertMaterial
   * @param config - The resolved configuration options
   * @internal
   */
  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshLambertMaterial,
    config: Required<StandardToLambertConverterOptions>,
  ): void {
    target.color = source.color.clone();

    // Adjust color based on metalness and roughness for better visual match
    if (source.metalness > 0) {
      // Metallic materials tend to be darker in Lambert shading
      const metalnessFactor = 1 - source.metalness * METALNESS_DARKNESS_FACTOR;
      target.color.multiplyScalar(metalnessFactor);
    }

    if (source.roughness > ROUGHNESS_THRESHOLD) {
      // Rough materials appear slightly darker
      const roughnessFactor =
        config.roughnessColorFactor +
        source.roughness * ROUGHNESS_COLOR_ADJUSTMENT;
      target.color.multiplyScalar(roughnessFactor);
    }

    target.emissive = source.emissive.clone();
    target.emissiveIntensity = source.emissiveIntensity;
  }

  /**
   * Converts and maps texture properties from Standard to Lambert material.
   *
   * Transfers compatible texture maps including diffuse, normal, emissive,
   * AO, light maps, and environment maps.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshLambertMaterial
   * @internal
   */
  private static convertTextureMaps(
    source: MeshStandardMaterial,
    target: MeshLambertMaterial,
  ): void {
    // Diffuse/Albedo map
    if (source.map) {
      target.map = source.map;
    }

    // Emissive map
    if (source.emissiveMap) {
      target.emissiveMap = source.emissiveMap;
    }

    // Normal map (Lambert materials support normal mapping)
    if (source.normalMap) {
      target.normalMap = source.normalMap;
      target.normalScale = source.normalScale.clone();
    }

    // Light map
    if (source.lightMap) {
      target.lightMap = source.lightMap;
      target.lightMapIntensity = source.lightMapIntensity;
    }

    // AO map
    if (source.aoMap) {
      target.aoMap = source.aoMap;
      target.aoMapIntensity = source.aoMapIntensity;
    }

    // Environment map (for reflections)
    if (source.envMap) {
      target.envMap = source.envMap;
      target.reflectivity = Math.min(
        source.metalness + REFLECTIVITY_BOOST,
        1.0,
      );
    }

    // Alpha map
    if (source.alphaMap) {
      target.alphaMap = source.alphaMap;
    }

    // Copy UV transforms
    this.copyUVTransforms(source, target);
  }

  /**
   * Copies UV transformation properties for texture maps.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshLambertMaterial
   * @internal
   */
  private static copyUVTransforms(
    source: MeshStandardMaterial,
    target: MeshLambertMaterial,
  ): void {
    // Main texture UV transform
    if (source.map && target.map) {
      target.map.offset.copy(source.map.offset);
      target.map.repeat.copy(source.map.repeat);
      target.map.rotation = source.map.rotation;
      target.map.center.copy(source.map.center);
    }
  }

  /**
   * Converts transparency and rendering properties.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshLambertMaterial
   * @internal
   */
  private static convertTransparencyProperties(
    source: MeshStandardMaterial,
    target: MeshLambertMaterial,
  ): void {
    target.transparent = source.transparent;
    target.opacity = source.opacity;
    target.alphaTest = source.alphaTest;
    target.depthTest = source.depthTest;
    target.depthWrite = source.depthWrite;
    target.blending = source.blending;
  }
}

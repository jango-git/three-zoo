import type { MeshStandardMaterial } from "three";
import { MeshBasicMaterial } from "three";

/** Factor for metalness brightness adjustment */
const METALNESS_BRIGHTNESS_FACTOR = 0.3;
/** Factor for emissive color contribution when combining with base color */
const EMISSIVE_CONTRIBUTION_FACTOR = 0.5;

/**
 * Configuration options for the StandardToBasicConverter.
 */
export interface StandardToBasicConverterOptions {
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
   * Whether to apply emissive color to the base color for brightness compensation
   * @defaultValue true
   */
  combineEmissive: boolean;
  /**
   * Factor for brightness adjustment to compensate for loss of lighting
   * @defaultValue 1.3
   */
  brightnessFactor: number;
}

/**
 * Converts Three.js MeshStandardMaterial to MeshBasicMaterial.
 *
 * Handles translation from PBR StandardMaterial to unlit BasicMaterial.
 * Since BasicMaterial doesn't respond to lighting, applies compensation
 * techniques including brightness adjustments and emissive color combination.
 */
export class StandardToBasicConverter {
  /**
   * Converts a MeshStandardMaterial to MeshBasicMaterial.
   *
   * Performs conversion from PBR StandardMaterial to unlit BasicMaterial
   * with brightness compensation and property mapping.
   *
   * @param standardMaterial - The source MeshStandardMaterial to convert
   * @param options - Configuration options for the conversion
   * @returns A new MeshBasicMaterial with properties mapped from the standard material
   *
   * @example
   * ```typescript
   * const standardMaterial = new MeshStandardMaterial({
   *   color: 0x00ff00,
   *   metalness: 0.5,
   *   emissive: 0x111111,
   *   emissiveIntensity: 0.2
   * });
   *
   * const basicMaterial = StandardToBasicConverter.convert(standardMaterial, {
   *   brightnessFactor: 1.4,
   *   combineEmissive: true
   * });
   * ```
   */
  public static convert(
    standardMaterial: MeshStandardMaterial,
    options: Partial<StandardToBasicConverterOptions> = {},
  ): MeshBasicMaterial {
    const config = {
      preserveName: true,
      copyUserData: true,
      disposeOriginal: false,
      combineEmissive: true,
      brightnessFactor: 1.3,
      ...options,
    };

    // Create new Basic material
    const basicMaterial = new MeshBasicMaterial();

    // Copy basic material properties
    this.copyBasicProperties(standardMaterial, basicMaterial, config);

    // Handle color properties with lighting compensation
    this.convertColorProperties(standardMaterial, basicMaterial, config);

    // Handle texture maps
    this.convertTextureMaps(standardMaterial, basicMaterial);

    // Handle transparency and alpha
    this.convertTransparencyProperties(standardMaterial, basicMaterial);

    // Cleanup if requested
    if (config.disposeOriginal) {
      standardMaterial.dispose();
    }

    basicMaterial.needsUpdate = true;
    return basicMaterial;
  }

  /**
   * Copies basic material properties from source to target material.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshBasicMaterial
   * @param config - The resolved configuration options
   * @internal
   */
  private static copyBasicProperties(
    source: MeshStandardMaterial,
    target: MeshBasicMaterial,
    config: Required<StandardToBasicConverterOptions>,
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

    if (config.copyUserData) {
      target.userData = { ...source.userData };
    }
  }

  /**
   * Converts color-related properties with lighting compensation.
   *
   * Applies brightness compensation and optional emissive color combination
   * to account for BasicMaterial's lack of lighting response.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshBasicMaterial
   * @param config - The resolved configuration options
   * @internal
   */
  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshBasicMaterial,
    config: Required<StandardToBasicConverterOptions>,
  ): void {
    // Base color conversion with brightness compensation
    target.color = source.color.clone();

    // Apply brightness compensation since BasicMaterial doesn't respond to lighting
    target.color.multiplyScalar(config.brightnessFactor);

    // Adjust for metalness - metallic materials tend to be darker without lighting
    if (source.metalness > 0) {
      const metalnessBrightness =
        1 + source.metalness * METALNESS_BRIGHTNESS_FACTOR;
      target.color.multiplyScalar(metalnessBrightness);
    }

    // Combine emissive color if requested
    if (config.combineEmissive) {
      const emissiveContribution = source.emissive
        .clone()
        .multiplyScalar(
          source.emissiveIntensity * EMISSIVE_CONTRIBUTION_FACTOR,
        );
      target.color.add(emissiveContribution);
    }

    // Ensure color doesn't exceed valid range
    target.color.r = Math.min(target.color.r, 1.0);
    target.color.g = Math.min(target.color.g, 1.0);
    target.color.b = Math.min(target.color.b, 1.0);
  }

  /**
   * Converts and maps texture properties from Standard to Basic material.
   *
   * Transfers compatible texture maps including diffuse, alpha, environment,
   * light, and AO maps.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshBasicMaterial
   * @internal
   */
  private static convertTextureMaps(
    source: MeshStandardMaterial,
    target: MeshBasicMaterial,
  ): void {
    // Main diffuse/albedo map
    if (source.map) {
      target.map = source.map;
    }

    // Alpha map
    if (source.alphaMap) {
      target.alphaMap = source.alphaMap;
    }

    // Environment map (BasicMaterial supports this for reflections)
    if (source.envMap) {
      target.envMap = source.envMap;
      // Use metalness to determine reflectivity
      target.reflectivity = source.metalness;
    }

    // Light map (BasicMaterial supports this)
    if (source.lightMap) {
      target.lightMap = source.lightMap;
      target.lightMapIntensity = source.lightMapIntensity;
    }

    // AO map (BasicMaterial supports this)
    if (source.aoMap) {
      target.aoMap = source.aoMap;
      target.aoMapIntensity = source.aoMapIntensity;
    }

    // Specular map (BasicMaterial supports this)
    if (source.metalnessMap) {
      // Use metalness map as specular map for some reflective effect
      target.specularMap = source.metalnessMap;
    }

    // Copy UV transforms
    this.copyUVTransforms(source, target);
  }

  /**
   * Copies UV transformation properties for texture maps.
   *
   * @param source - The source MeshStandardMaterial
   * @param target - The target MeshBasicMaterial
   * @internal
   */
  private static copyUVTransforms(
    source: MeshStandardMaterial,
    target: MeshBasicMaterial,
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
   * @param target - The target MeshBasicMaterial
   * @internal
   */
  private static convertTransparencyProperties(
    source: MeshStandardMaterial,
    target: MeshBasicMaterial,
  ): void {
    target.transparent = source.transparent;
    target.opacity = source.opacity;
    target.alphaTest = source.alphaTest;
    target.depthTest = source.depthTest;
    target.depthWrite = source.depthWrite;
    target.blending = source.blending;
  }
}

export default StandardToBasicConverter;

import type { MeshStandardMaterial } from "three";
import { MeshBasicMaterial } from "three";

/** Factor for metalness brightness adjustment */
const METALNESS_BRIGHTNESS_FACTOR = 0.3;
/** Factor for emissive color contribution when combining with base color */
const EMISSIVE_CONTRIBUTION_FACTOR = 0.5;

/**
 * Configuration options for material conversion.
 */
export interface StandardToBasicConverterOptions {
  /**
   * Preserve original material name.
   * @defaultValue true
   */
  preserveName: boolean;
  /**
   * Copy user data from original material.
   * @defaultValue true
   */
  copyUserData: boolean;
  /**
   * Dispose original material after conversion.
   * @defaultValue false
   */
  disposeOriginal: boolean;
  /**
   * Apply emissive color to base color for brightness compensation.
   * @defaultValue true
   */
  combineEmissive: boolean;
  /**
   * Brightness adjustment factor to compensate for loss of lighting.
   * @defaultValue 1.3
   */
  brightnessFactor: number;
}

/**
 * Converts MeshStandardMaterial to MeshBasicMaterial with brightness compensation.
 */
export class StandardToBasicConverter {
  /**
   * Converts MeshStandardMaterial to MeshBasicMaterial.
   *
   * @param standardMaterial - Source material to convert
   * @param options - Conversion options
   * @returns New MeshBasicMaterial with mapped properties
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
   * Copies basic material properties.
   *
   * @param source - Source material
   * @param target - Target material
   * @param config - Configuration options
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

    if (config.copyUserData && source.userData) {
      target.userData = { ...source.userData };
    }
  }

  /**
   * Converts color properties with lighting compensation.
   *
   * @param source - Source material
   * @param target - Target material
   * @param config - Configuration options
   * @internal
   */
  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshBasicMaterial,
    config: Required<StandardToBasicConverterOptions>,
  ): void {
    // Base color conversion with brightness compensation
    if (source.color) {
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
      if (config.combineEmissive && source.emissive) {
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
  }

  /**
   * Converts texture properties from Standard to Basic material.
   *
   * @param source - Source material
   * @param target - Target material
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
  }

  /**
   * Converts transparency and rendering properties.
   *
   * @param source - Source material
   * @param target - Target material
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

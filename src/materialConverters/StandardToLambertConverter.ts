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
 * Configuration options for material conversion.
 */
export interface StandardToLambertConverterOptions {
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
   * Color adjustment factor for roughness compensation.
   * @defaultValue 0.8
   */
  roughnessColorFactor: number;
}

/**
 * Converts MeshStandardMaterial to MeshLambertMaterial with PBR compensation.
 */
export class StandardToLambertConverter {
  /**
   * Converts MeshStandardMaterial to MeshLambertMaterial.
   *
   * @param material - Source material to convert
   * @param options - Conversion options
   * @returns New MeshLambertMaterial with mapped properties
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
   * Copies basic material properties.
   *
   * @param source - Source material
   * @param target - Target material
   * @param config - Configuration options
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

    if (config.copyUserData && source.userData) {
      target.userData = { ...source.userData };
    }
  }

  /**
   * Converts color properties with PBR compensation.
   *
   * @param source - Source material
   * @param target - Target material
   * @param config - Configuration options
   * @internal
   */
  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshLambertMaterial,
    config: Required<StandardToLambertConverterOptions>,
  ): void {
    if (source.color) {
      target.color = source.color.clone();

      // Adjust color based on metalness and roughness for better visual match
      if (source.metalness > 0) {
        // Metallic materials tend to be darker in Lambert shading
        const metalnessFactor =
          1 - source.metalness * METALNESS_DARKNESS_FACTOR;
        target.color.multiplyScalar(metalnessFactor);
      }

      if (source.roughness > ROUGHNESS_THRESHOLD) {
        // Rough materials appear slightly darker
        const roughnessFactor =
          config.roughnessColorFactor +
          source.roughness * ROUGHNESS_COLOR_ADJUSTMENT;
        target.color.multiplyScalar(roughnessFactor);
      }
    }

    if (source.emissive) {
      target.emissive = source.emissive.clone();
    }
    target.emissiveIntensity = source.emissiveIntensity;
  }

  /**
   * Converts texture properties from Standard to Lambert material.
   *
   * @param source - Source material
   * @param target - Target material
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
      if (source.normalScale) {
        target.normalScale = source.normalScale.clone();
      }
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

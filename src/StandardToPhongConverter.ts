import type { MeshStandardMaterial } from "three";
import { Color, MeshPhongMaterial } from "three";

/** Maximum shininess value for Phong material */
const MAX_SHININESS = 100;
/** Factor for metalness darkness adjustment */
const METALNESS_DARKNESS_FACTOR = 0.3;
/** Minimum reflectivity boost for environment maps */
const REFLECTIVITY_BOOST = 0.1;

/**
 * Configuration options for material conversion.
 */
export interface StandardToPhongConverterOptions {
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
   * Maximum shininess value when roughness is 0.
   * @defaultValue 100
   */
  maxShininess: number;
  /**
   * Specular intensity multiplier.
   * @defaultValue 0.5
   */
  specularIntensity: number;
}

/**
 * Converts MeshStandardMaterial to MeshPhongMaterial with PBR compensation.
 */
export class StandardToPhongConverter {
  /**
   * Converts MeshStandardMaterial to MeshPhongMaterial.
   *
   * @param material - Source material to convert
   * @param options - Conversion options
   * @returns New MeshPhongMaterial with mapped properties
   */
  public static convert(
    material: MeshStandardMaterial,
    options: Partial<StandardToPhongConverterOptions> = {},
  ): MeshPhongMaterial {
    const config = {
      preserveName: true,
      copyUserData: true,
      disposeOriginal: false,
      maxShininess: MAX_SHININESS,
      specularIntensity: 0.5,
      ...options,
    };

    // Create new Phong material
    const phongMaterial = new MeshPhongMaterial();

    // Copy basic material properties
    this.copyBasicProperties(material, phongMaterial, config);

    // Handle color properties with PBR compensation
    this.convertColorProperties(material, phongMaterial, config);

    // Handle texture maps
    this.convertTextureMaps(material, phongMaterial);

    // Handle transparency and alpha
    this.convertTransparencyProperties(material, phongMaterial);

    // Cleanup if requested
    if (config.disposeOriginal) {
      material.dispose();
    }

    phongMaterial.needsUpdate = true;
    return phongMaterial;
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
    target: MeshPhongMaterial,
    config: Required<StandardToPhongConverterOptions>,
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
   * Converts color properties with PBR compensation.
   *
   * @param source - Source material
   * @param target - Target material
   * @param config - Configuration options
   * @internal
   */
  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshPhongMaterial,
    config: Required<StandardToPhongConverterOptions>,
  ): void {
    target.color = source.color.clone();

    // Adjust color based on metalness
    if (source.metalness > 0) {
      const metalnessFactor = 1 - source.metalness * METALNESS_DARKNESS_FACTOR;
      target.color.multiplyScalar(metalnessFactor);
    }

    // Convert roughness to shininess (inverse relationship)
    // Roughness 0 = max shininess, Roughness 1 = shininess 0
    target.shininess = (1 - source.roughness) * config.maxShininess;

    // Calculate specular color from metalness and base color
    if (source.metalness > 0) {
      // Metallic materials have tinted specular
      target.specular = source.color
        .clone()
        .multiplyScalar(source.metalness * config.specularIntensity);
    } else {
      // Non-metallic materials have white/gray specular
      const specularValue = config.specularIntensity * (1 - source.roughness);
      target.specular = new Color(specularValue, specularValue, specularValue);
    }

    target.emissive = source.emissive.clone();
    target.emissiveIntensity = source.emissiveIntensity;
  }

  /**
   * Converts texture properties from Standard to Phong material.
   *
   * @param source - Source material
   * @param target - Target material
   * @internal
   */
  private static convertTextureMaps(
    source: MeshStandardMaterial,
    target: MeshPhongMaterial,
  ): void {
    // Diffuse/Albedo map
    if (source.map) {
      target.map = source.map;
    }

    // Emissive map
    if (source.emissiveMap) {
      target.emissiveMap = source.emissiveMap;
    }

    // Normal map
    if (source.normalMap) {
      target.normalMap = source.normalMap;
      target.normalScale = source.normalScale.clone();
    }

    // Bump map
    if (source.bumpMap) {
      target.bumpMap = source.bumpMap;
      target.bumpScale = source.bumpScale;
    }

    // Displacement map
    if (source.displacementMap) {
      target.displacementMap = source.displacementMap;
      target.displacementScale = source.displacementScale;
      target.displacementBias = source.displacementBias;
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

    // Environment map
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

    // Use metalness map as specular map
    if (source.metalnessMap) {
      target.specularMap = source.metalnessMap;
    }

    // Copy UV transforms
    this.copyUVTransforms(source, target);
  }

  /**
   * Copies UV transformation properties.
   *
   * @param source - Source material
   * @param target - Target material
   * @internal
   */
  private static copyUVTransforms(
    source: MeshStandardMaterial,
    target: MeshPhongMaterial,
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
   * @param source - Source material
   * @param target - Target material
   * @internal
   */
  private static convertTransparencyProperties(
    source: MeshStandardMaterial,
    target: MeshPhongMaterial,
  ): void {
    target.transparent = source.transparent;
    target.opacity = source.opacity;
    target.alphaTest = source.alphaTest;
    target.depthTest = source.depthTest;
    target.depthWrite = source.depthWrite;
    target.blending = source.blending;
  }
}

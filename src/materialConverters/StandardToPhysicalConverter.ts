import type { MeshStandardMaterial } from "three";
import { MeshPhysicalMaterial } from "three";

/**
 * Configuration options for material conversion.
 */
export interface StandardToPhysicalConverterOptions {
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
   * Default clearcoat value for the physical material.
   * @defaultValue 0
   */
  clearcoat: number;
  /**
   * Default clearcoat roughness value.
   * @defaultValue 0
   */
  clearcoatRoughness: number;
  /**
   * Default sheen value for the physical material.
   * @defaultValue 0
   */
  sheen: number;
  /**
   * Default transmission value (0 = opaque, 1 = fully transmissive).
   * @defaultValue 0
   */
  transmission: number;
  /**
   * Default index of refraction.
   * @defaultValue 1.5
   */
  ior: number;
}

/**
 * Converts MeshStandardMaterial to MeshPhysicalMaterial.
 *
 * MeshPhysicalMaterial extends MeshStandardMaterial with additional
 * physically-based properties like clearcoat, sheen, and transmission.
 * This converter copies all Standard properties and allows setting
 * Physical-specific defaults.
 */
export class StandardToPhysicalConverter {
  /**
   * Converts MeshStandardMaterial to MeshPhysicalMaterial.
   *
   * @param material - Source material to convert
   * @param options - Conversion options
   * @returns New MeshPhysicalMaterial with mapped properties
   */
  public static convert(
    material: MeshStandardMaterial,
    options: Partial<StandardToPhysicalConverterOptions> = {},
  ): MeshPhysicalMaterial {
    const config = {
      preserveName: true,
      copyUserData: true,
      disposeOriginal: false,
      clearcoat: 0,
      clearcoatRoughness: 0,
      sheen: 0,
      transmission: 0,
      ior: 1.5,
      ...options,
    };

    // Create new Physical material
    const physicalMaterial = new MeshPhysicalMaterial();

    // Copy basic material properties
    this.copyBasicProperties(material, physicalMaterial, config);

    // Copy Standard material properties (Physical extends Standard)
    this.copyStandardProperties(material, physicalMaterial);

    // Handle texture maps
    this.convertTextureMaps(material, physicalMaterial);

    // Handle transparency and alpha
    this.convertTransparencyProperties(material, physicalMaterial);

    // Apply Physical-specific properties from config
    this.applyPhysicalProperties(physicalMaterial, config);

    // Cleanup if requested
    if (config.disposeOriginal) {
      material.dispose();
    }

    physicalMaterial.needsUpdate = true;
    return physicalMaterial;
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
    target: MeshPhysicalMaterial,
    config: Required<StandardToPhysicalConverterOptions>,
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
   * Copies MeshStandardMaterial-specific properties.
   *
   * @param source - Source material
   * @param target - Target material
   * @internal
   */
  private static copyStandardProperties(
    source: MeshStandardMaterial,
    target: MeshPhysicalMaterial,
  ): void {
    // Color properties
    if (source.color) {
      target.color = source.color.clone();
    }
    if (source.emissive) {
      target.emissive = source.emissive.clone();
    }
    target.emissiveIntensity = source.emissiveIntensity;

    // PBR properties
    target.metalness = source.metalness;
    target.roughness = source.roughness;

    // Environment map properties
    target.envMapIntensity = source.envMapIntensity;
  }

  /**
   * Converts texture properties from Standard to Physical material.
   *
   * @param source - Source material
   * @param target - Target material
   * @internal
   */
  private static convertTextureMaps(
    source: MeshStandardMaterial,
    target: MeshPhysicalMaterial,
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
      target.normalMapType = source.normalMapType;
      if (source.normalScale) {
        target.normalScale = source.normalScale.clone();
      }
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

    // Roughness map
    if (source.roughnessMap) {
      target.roughnessMap = source.roughnessMap;
    }

    // Metalness map
    if (source.metalnessMap) {
      target.metalnessMap = source.metalnessMap;
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
    target: MeshPhysicalMaterial,
  ): void {
    target.transparent = source.transparent;
    target.opacity = source.opacity;
    target.alphaTest = source.alphaTest;
    target.depthTest = source.depthTest;
    target.depthWrite = source.depthWrite;
    target.blending = source.blending;
  }

  /**
   * Applies Physical-specific properties from configuration.
   *
   * @param target - Target material
   * @param config - Configuration options
   * @internal
   */
  private static applyPhysicalProperties(
    target: MeshPhysicalMaterial,
    config: Required<StandardToPhysicalConverterOptions>,
  ): void {
    target.clearcoat = config.clearcoat;
    target.clearcoatRoughness = config.clearcoatRoughness;
    target.sheen = config.sheen;
    target.transmission = config.transmission;
    target.ior = config.ior;
  }
}

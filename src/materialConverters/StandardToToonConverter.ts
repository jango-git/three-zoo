import type { MeshStandardMaterial, Texture } from "three";
import { MeshToonMaterial } from "three";

/**
 * Configuration options for material conversion.
 */
export interface StandardToToonConverterOptions {
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
   * Optional gradient map for toon shading steps.
   * If not provided, uses Three.js default 3-step gradient.
   * @defaultValue null
   */
  gradientMap: Texture | null;
}

/**
 * Converts MeshStandardMaterial to MeshToonMaterial.
 *
 * MeshToonMaterial provides a cel-shaded/cartoon appearance with
 * discrete lighting steps. This converter maps Standard material
 * properties to Toon material, preserving color and texture information
 * while applying toon shading characteristics.
 *
 * Note: Some PBR properties (metalness, roughness) are not supported
 * by MeshToonMaterial and will be ignored.
 */
export class StandardToToonConverter {
  /**
   * Converts MeshStandardMaterial to MeshToonMaterial.
   *
   * @param material - Source material to convert
   * @param options - Conversion options
   * @returns New MeshToonMaterial with mapped properties
   */
  public static convert(
    material: MeshStandardMaterial,
    options: Partial<StandardToToonConverterOptions> = {},
  ): MeshToonMaterial {
    const config = {
      preserveName: true,
      copyUserData: true,
      disposeOriginal: false,
      gradientMap: null,
      ...options,
    };

    // Create new Toon material
    const toonMaterial = new MeshToonMaterial();

    // Copy basic material properties
    this.copyBasicProperties(material, toonMaterial, config);

    // Handle color properties
    this.convertColorProperties(material, toonMaterial);

    // Handle texture maps
    this.convertTextureMaps(material, toonMaterial);

    // Handle transparency and alpha
    this.convertTransparencyProperties(material, toonMaterial);

    // Apply toon-specific properties
    this.applyToonProperties(toonMaterial, config);

    // Cleanup if requested
    if (config.disposeOriginal) {
      material.dispose();
    }

    toonMaterial.needsUpdate = true;
    return toonMaterial;
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
    target: MeshToonMaterial,
    config: Required<StandardToToonConverterOptions>,
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
   * Converts color properties from Standard to Toon material.
   *
   * @param source - Source material
   * @param target - Target material
   * @internal
   */
  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshToonMaterial,
  ): void {
    if (source.color) {
      target.color = source.color.clone();
    }
    if (source.emissive) {
      target.emissive = source.emissive.clone();
    }
    target.emissiveIntensity = source.emissiveIntensity;
  }

  /**
   * Converts texture properties from Standard to Toon material.
   *
   * Note: MeshToonMaterial does not support roughnessMap, metalnessMap,
   * or envMap. These properties are intentionally skipped.
   *
   * @param source - Source material
   * @param target - Target material
   * @internal
   */
  private static convertTextureMaps(
    source: MeshStandardMaterial,
    target: MeshToonMaterial,
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
    target: MeshToonMaterial,
  ): void {
    target.transparent = source.transparent;
    target.opacity = source.opacity;
    target.alphaTest = source.alphaTest;
    target.depthTest = source.depthTest;
    target.depthWrite = source.depthWrite;
    target.blending = source.blending;
  }

  /**
   * Applies Toon-specific properties from configuration.
   *
   * @param target - Target material
   * @param config - Configuration options
   * @internal
   */
  private static applyToonProperties(
    target: MeshToonMaterial,
    config: Required<StandardToToonConverterOptions>,
  ): void {
    if (config.gradientMap) {
      target.gradientMap = config.gradientMap;
    }
  }
}

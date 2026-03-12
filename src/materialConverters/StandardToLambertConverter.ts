import type { MeshStandardMaterial } from "three";
import { MeshLambertMaterial } from "three";

const METALNESS_DARKNESS_FACTOR = 0.3;
const ROUGHNESS_THRESHOLD = 0.5;
const ROUGHNESS_COLOR_ADJUSTMENT = 0.2;
const REFLECTIVITY_BOOST = 0.1;

export interface StandardToLambertConverterOptions {
  preserveName: boolean;
  copyUserData: boolean;
  disposeOriginal: boolean;
  roughnessColorFactor: number;
}

export class StandardToLambertConverter {
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

    const lambertMaterial = new MeshLambertMaterial();

    this.copyBasicProperties(material, lambertMaterial, config);
    this.convertColorProperties(material, lambertMaterial, config);
    this.convertTextureMaps(material, lambertMaterial);
    this.convertTransparencyProperties(material, lambertMaterial);

    if (config.disposeOriginal) {
      material.dispose();
    }

    lambertMaterial.needsUpdate = true;
    return lambertMaterial;
  }

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

  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshLambertMaterial,
    config: Required<StandardToLambertConverterOptions>,
  ): void {
    if (source.color) {
      target.color = source.color.clone();

      if (source.metalness > 0) {
        const metalnessFactor = 1 - source.metalness * METALNESS_DARKNESS_FACTOR;
        target.color.multiplyScalar(metalnessFactor);
      }

      if (source.roughness > ROUGHNESS_THRESHOLD) {
        const roughnessFactor =
          config.roughnessColorFactor + source.roughness * ROUGHNESS_COLOR_ADJUSTMENT;
        target.color.multiplyScalar(roughnessFactor);
      }
    }

    if (source.emissive) {
      target.emissive = source.emissive.clone();
    }
    target.emissiveIntensity = source.emissiveIntensity;
  }

  private static convertTextureMaps(
    source: MeshStandardMaterial,
    target: MeshLambertMaterial,
  ): void {
    if (source.map) {
      target.map = source.map;
    }

    if (source.emissiveMap) {
      target.emissiveMap = source.emissiveMap;
    }

    if (source.normalMap) {
      target.normalMap = source.normalMap;
      if (source.normalScale) {
        target.normalScale = source.normalScale.clone();
      }
    }

    if (source.lightMap) {
      target.lightMap = source.lightMap;
      target.lightMapIntensity = source.lightMapIntensity;
    }

    if (source.aoMap) {
      target.aoMap = source.aoMap;
      target.aoMapIntensity = source.aoMapIntensity;
    }

    if (source.envMap) {
      target.envMap = source.envMap;
      target.reflectivity = Math.min(source.metalness + REFLECTIVITY_BOOST, 1.0);
    }

    if (source.alphaMap) {
      target.alphaMap = source.alphaMap;
    }
  }

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

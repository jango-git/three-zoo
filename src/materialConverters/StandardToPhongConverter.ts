import type { MeshStandardMaterial } from "three";
import { Color, MeshPhongMaterial } from "three";

const MAX_SHININESS = 100;
const METALNESS_DARKNESS_FACTOR = 0.3;
const REFLECTIVITY_BOOST = 0.1;

export interface StandardToPhongConverterOptions {
  preserveName: boolean;
  copyUserData: boolean;
  disposeOriginal: boolean;
  maxShininess: number;
  specularIntensity: number;
}

export class StandardToPhongConverter {
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

    const phongMaterial = new MeshPhongMaterial();

    this.copyBasicProperties(material, phongMaterial, config);
    this.convertColorProperties(material, phongMaterial, config);
    this.convertTextureMaps(material, phongMaterial);
    this.convertTransparencyProperties(material, phongMaterial);

    if (config.disposeOriginal) {
      material.dispose();
    }

    phongMaterial.needsUpdate = true;
    return phongMaterial;
  }

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

    if (config.copyUserData && source.userData) {
      target.userData = { ...source.userData };
    }
  }

  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshPhongMaterial,
    config: Required<StandardToPhongConverterOptions>,
  ): void {
    if (source.color) {
      target.color = source.color.clone();

      if (source.metalness > 0) {
        const metalnessFactor = 1 - source.metalness * METALNESS_DARKNESS_FACTOR;
        target.color.multiplyScalar(metalnessFactor);
      }
    }

    target.shininess = (1 - source.roughness) * config.maxShininess;

    if (source.metalness > 0 && source.color) {
      target.specular = source.color
        .clone()
        .multiplyScalar(source.metalness * config.specularIntensity);
    } else {
      const specularValue = config.specularIntensity * (1 - source.roughness);
      target.specular = new Color(specularValue, specularValue, specularValue);
    }

    if (source.emissive) {
      target.emissive = source.emissive.clone();
    }
    target.emissiveIntensity = source.emissiveIntensity;
  }

  private static convertTextureMaps(source: MeshStandardMaterial, target: MeshPhongMaterial): void {
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

    if (source.bumpMap) {
      target.bumpMap = source.bumpMap;
      target.bumpScale = source.bumpScale;
    }

    if (source.displacementMap) {
      target.displacementMap = source.displacementMap;
      target.displacementScale = source.displacementScale;
      target.displacementBias = source.displacementBias;
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

    if (source.metalnessMap) {
      target.specularMap = source.metalnessMap;
    }
  }

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

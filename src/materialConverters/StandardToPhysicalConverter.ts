import type { MeshStandardMaterial } from "three";
import { MeshPhysicalMaterial } from "three";

export interface StandardToPhysicalConverterOptions {
  preserveName: boolean;
  copyUserData: boolean;
  disposeOriginal: boolean;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  transmission: number;
  ior: number;
}

export class StandardToPhysicalConverter {
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

    const physicalMaterial = new MeshPhysicalMaterial();

    this.copyBasicProperties(material, physicalMaterial, config);
    this.copyStandardProperties(material, physicalMaterial);
    this.convertTextureMaps(material, physicalMaterial);
    this.convertTransparencyProperties(material, physicalMaterial);
    this.applyPhysicalProperties(physicalMaterial, config);

    if (config.disposeOriginal) {
      material.dispose();
    }

    physicalMaterial.needsUpdate = true;
    return physicalMaterial;
  }

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

  private static copyStandardProperties(
    source: MeshStandardMaterial,
    target: MeshPhysicalMaterial,
  ): void {
    if (source.color) {
      target.color = source.color.clone();
    }
    if (source.emissive) {
      target.emissive = source.emissive.clone();
    }
    target.emissiveIntensity = source.emissiveIntensity;

    target.metalness = source.metalness;
    target.roughness = source.roughness;

    target.envMapIntensity = source.envMapIntensity;
  }

  private static convertTextureMaps(
    source: MeshStandardMaterial,
    target: MeshPhysicalMaterial,
  ): void {
    if (source.map) {
      target.map = source.map;
    }

    if (source.emissiveMap) {
      target.emissiveMap = source.emissiveMap;
    }

    if (source.normalMap) {
      target.normalMap = source.normalMap;
      target.normalMapType = source.normalMapType;
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

    if (source.roughnessMap) {
      target.roughnessMap = source.roughnessMap;
    }

    if (source.metalnessMap) {
      target.metalnessMap = source.metalnessMap;
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
    }

    if (source.alphaMap) {
      target.alphaMap = source.alphaMap;
    }
  }

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

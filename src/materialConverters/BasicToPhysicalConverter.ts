import type { MeshBasicMaterial } from "three";
import { Color, MeshPhysicalMaterial } from "three";

export interface BasicToPhysicalConverterOptions {
  preserveName: boolean;
  copyUserData: boolean;
  disposeOriginal: boolean;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  transmission: number;
  ior: number;
  metalness: number;
  roughness: number;
  emissive: Color | string | number;
  emissiveIntensity: number;
}

export class BasicToPhysicalConverter {
  public static convert(
    material: MeshBasicMaterial,
    options: Partial<BasicToPhysicalConverterOptions> = {},
  ): MeshPhysicalMaterial {
    const config: Partial<BasicToPhysicalConverterOptions> = {
      preserveName: true,
      copyUserData: true,
      disposeOriginal: false,
      ...options,
    };

    const physicalMaterial = new MeshPhysicalMaterial();

    this.copyBasicProperties(material, physicalMaterial, config);
    this.convertColorAndPBRProperties(material, physicalMaterial, config);
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
    source: MeshBasicMaterial,
    target: MeshPhysicalMaterial,
    config: Partial<BasicToPhysicalConverterOptions>,
  ): void {
    if (config.preserveName) {
      target.name = source.name;
    }

    target.side = source.side;
    target.visible = source.visible;
    target.fog = source.fog;
    target.wireframe = source.wireframe;
    target.wireframeLinewidth = source.wireframeLinewidth;
    target.wireframeLinecap = source.wireframeLinecap;
    target.wireframeLinejoin = source.wireframeLinejoin;
    target.vertexColors = source.vertexColors;

    if (config.copyUserData && source.userData) {
      target.userData = { ...source.userData };
    }
  }

  private static convertColorAndPBRProperties(
    source: MeshBasicMaterial,
    target: MeshPhysicalMaterial,
    config: Partial<BasicToPhysicalConverterOptions>,
  ): void {
    if (source.color) {
      target.color = source.color.clone();
    }

    if (config.emissive !== undefined) {
      if (config.emissive instanceof Color) {
        target.emissive.copy(config.emissive);
      } else {
        target.emissive.set(config.emissive);
      }
    }

    if (config.emissiveIntensity !== undefined) {
      target.emissiveIntensity = config.emissiveIntensity;
    }

    if (config.metalness !== undefined) {
      target.metalness = config.metalness;
    }

    if (config.roughness !== undefined) {
      target.roughness = config.roughness;
    }
  }

  private static convertTextureMaps(
    source: MeshBasicMaterial,
    target: MeshPhysicalMaterial,
  ): void {
    if (source.map) {
      target.map = source.map;
    }

    if (source.alphaMap) {
      target.alphaMap = source.alphaMap;
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
  }

  private static convertTransparencyProperties(
    source: MeshBasicMaterial,
    target: MeshPhysicalMaterial,
  ): void {
    target.transparent = source.transparent;
    target.opacity = source.opacity;
    target.alphaTest = source.alphaTest;
    target.depthTest = source.depthTest;
    target.depthWrite = source.depthWrite;
    target.blending = source.blending;
    target.blendSrc = source.blendSrc;
    target.blendDst = source.blendDst;
    target.blendEquation = source.blendEquation;
    target.blendSrcAlpha = source.blendSrcAlpha;
    target.blendDstAlpha = source.blendDstAlpha;
    target.blendEquationAlpha = source.blendEquationAlpha;
  }

  private static applyPhysicalProperties(
    target: MeshPhysicalMaterial,
    config: Partial<BasicToPhysicalConverterOptions>,
  ): void {
    if (config.clearcoat !== undefined) {
      target.clearcoat = config.clearcoat;
    }

    if (config.clearcoatRoughness !== undefined) {
      target.clearcoatRoughness = config.clearcoatRoughness;
    }

    if (config.sheen !== undefined) {
      target.sheen = config.sheen;
    }

    if (config.transmission !== undefined) {
      target.transmission = config.transmission;
    }

    if (config.ior !== undefined) {
      target.ior = config.ior;
    }
  }
}

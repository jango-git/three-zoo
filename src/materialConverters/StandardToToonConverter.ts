import type { MeshStandardMaterial, Texture } from "three";
import { MeshToonMaterial } from "three";

export interface StandardToToonConverterOptions {
  preserveName: boolean;
  copyUserData: boolean;
  disposeOriginal: boolean;
  gradientMap: Texture | null;
}

export class StandardToToonConverter {
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

    const toonMaterial = new MeshToonMaterial();

    this.copyBasicProperties(material, toonMaterial, config);
    this.convertColorProperties(material, toonMaterial);
    this.convertTextureMaps(material, toonMaterial);
    this.convertTransparencyProperties(material, toonMaterial);
    this.applyToonProperties(toonMaterial, config);

    if (config.disposeOriginal) {
      material.dispose();
    }

    toonMaterial.needsUpdate = true;
    return toonMaterial;
  }

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

  private static convertTextureMaps(source: MeshStandardMaterial, target: MeshToonMaterial): void {
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

    if (source.lightMap) {
      target.lightMap = source.lightMap;
      target.lightMapIntensity = source.lightMapIntensity;
    }

    if (source.aoMap) {
      target.aoMap = source.aoMap;
      target.aoMapIntensity = source.aoMapIntensity;
    }

    if (source.alphaMap) {
      target.alphaMap = source.alphaMap;
    }
  }

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

  private static applyToonProperties(
    target: MeshToonMaterial,
    config: Required<StandardToToonConverterOptions>,
  ): void {
    if (config.gradientMap) {
      target.gradientMap = config.gradientMap;
    }
  }
}

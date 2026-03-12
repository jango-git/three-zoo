import type { MeshStandardMaterial } from "three";
import { MeshBasicMaterial } from "three";

const METALNESS_BRIGHTNESS_FACTOR = 0.3;
const EMISSIVE_CONTRIBUTION_FACTOR = 0.5;

export interface StandardToBasicConverterOptions {
  preserveName: boolean;
  copyUserData: boolean;
  disposeOriginal: boolean;
  combineEmissive: boolean;
  brightnessFactor: number;
}

export class StandardToBasicConverter {
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

    const basicMaterial = new MeshBasicMaterial();

    this.copyBasicProperties(standardMaterial, basicMaterial, config);
    this.convertColorProperties(standardMaterial, basicMaterial, config);
    this.convertTextureMaps(standardMaterial, basicMaterial);
    this.convertTransparencyProperties(standardMaterial, basicMaterial);

    if (config.disposeOriginal) {
      standardMaterial.dispose();
    }

    basicMaterial.needsUpdate = true;
    return basicMaterial;
  }

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

  private static convertColorProperties(
    source: MeshStandardMaterial,
    target: MeshBasicMaterial,
    config: Required<StandardToBasicConverterOptions>,
  ): void {
    if (source.color) {
      target.color = source.color.clone();
      target.color.multiplyScalar(config.brightnessFactor);

      if (source.metalness > 0) {
        const metalnessBrightness = 1 + source.metalness * METALNESS_BRIGHTNESS_FACTOR;
        target.color.multiplyScalar(metalnessBrightness);
      }

      if (config.combineEmissive && source.emissive) {
        const emissiveContribution = source.emissive
          .clone()
          .multiplyScalar(source.emissiveIntensity * EMISSIVE_CONTRIBUTION_FACTOR);
        target.color.add(emissiveContribution);
      }

      target.color.r = Math.min(target.color.r, 1.0);
      target.color.g = Math.min(target.color.g, 1.0);
      target.color.b = Math.min(target.color.b, 1.0);
    }
  }

  private static convertTextureMaps(source: MeshStandardMaterial, target: MeshBasicMaterial): void {
    if (source.map) {
      target.map = source.map;
    }

    if (source.alphaMap) {
      target.alphaMap = source.alphaMap;
    }

    if (source.envMap) {
      target.envMap = source.envMap;
      target.reflectivity = source.metalness;
    }

    if (source.lightMap) {
      target.lightMap = source.lightMap;
      target.lightMapIntensity = source.lightMapIntensity;
    }

    if (source.aoMap) {
      target.aoMap = source.aoMap;
      target.aoMapIntensity = source.aoMapIntensity;
    }

    if (source.metalnessMap) {
      target.specularMap = source.metalnessMap;
    }
  }

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

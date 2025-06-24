import type { Material, Object3D } from "three";
import { FrontSide, Mesh } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { InstanceAssembler } from "./InstanceAssembler";
import { SceneTraversal } from "./SceneTraversal";

/** Options for scene post-processing */
export interface SceneProcessorOptions {
  /** Clone the input asset before processing? */
  cloneAsset: boolean;

  /** Combine identical meshes into instances? */
  assembleInstances: boolean;

  /** Names matching these patterns will cast shadows */
  castShadowRegExp: RegExp;

  /** Names matching these patterns will receive shadows */
  receiveShadowRegExp: RegExp;

  /** Names matching these patterns will be transparent */
  transparentMaterialRegExp: RegExp;

  /** Names matching these patterns won't write to depth buffer */
  noDepthWriteMaterialRegExp: RegExp;

  /** Names matching these patterns will be alpha tested */
  alphaTestMaterialRegExp: RegExp;

  /** Names matching these patterns will be alpha hashed */
  alphaHashMaterialRegExp: RegExp;
}

/** Post-processes a scene based on name patterns */
export class SceneProcessor {
  /**
   * Process a scene to set up materials and shadows.
   *
   * @param object - Scene to process
   * @param options - How to process the scene
   * @returns Processed scene root objects
   */
  public static process(
    object: Object3D,
    options: Partial<SceneProcessorOptions>,
  ): Object3D[] {
    const container = options.cloneAsset !== false ? clone(object) : object;

    if (options.assembleInstances !== false) {
      InstanceAssembler.assemble(container);
    }

    SceneTraversal.enumerateMaterials(container, (material: Material) => {
      material.transparent =
        options.transparentMaterialRegExp?.test(material.name) ?? false;
      material.depthWrite = !(
        options.noDepthWriteMaterialRegExp?.test(material.name) ?? false
      );
      material.alphaTest = options.alphaTestMaterialRegExp?.test(material.name)
        ? 0.5
        : 0;
      material.alphaHash =
        options.alphaHashMaterialRegExp?.test(material.name) ?? false;
      material.side = FrontSide;
      material.forceSinglePass = true;
      material.depthTest = true;
    });

    SceneTraversal.enumerateObjectsByType(container, Mesh, (child: Mesh) => {
      child.castShadow = options.castShadowRegExp?.test(child.name) ?? false;
      child.receiveShadow =
        options.receiveShadowRegExp?.test(child.name) ?? false;
    });

    return container.children;
  }
}

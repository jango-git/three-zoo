import type { Material, Object3D } from "three";
import { FrontSide, Mesh } from "three";
import { InstanceAssembler } from "./InstanceAssembler";
import { SceneTraversal } from "./SceneTraversal";

/** Options for scene post-processing */
export interface SceneProcessorOptions {
  /** Clone the input asset before processing? */
  cloneAsset: boolean;

  /** Combine identical meshes into instances? */
  assembleInstances: boolean;

  /** Names matching these patterns will cast shadows */
  castShadowExpressions: RegExp[];

  /** Names matching these patterns will receive shadows */
  receiveShadwoExpressions: RegExp[];

  /** Names matching these patterns will be transparent */
  transparentMaterialExpressions: RegExp[];

  /** Names matching these patterns won't write to depth buffer */
  noDepthWriteMaterialExpressions: RegExp[];
}

/** Post-processes a scene based on name patterns */
export class SceneProcessor {
  /**
   * Process a scene to set up materials and shadows.
   * 
   * @param asset - Scene to process
   * @param options - How to process the scene
   * @returns Processed scene root objects
   */
  public static process(
    asset: Object3D,
    options: Partial<SceneProcessorOptions>,
  ): Object3D[] {
    const container = options.cloneAsset !== false ? asset.clone() : asset;

    if (options.assembleInstances !== false) {
      InstanceAssembler.assemble(container);
    }

    SceneTraversal.enumerateMaterials(container, (material: Material) => {
      material.transparent = SceneProcessor.matchesAny(
        material.name,
        options.transparentMaterialExpressions,
      );
      material.depthWrite = !SceneProcessor.matchesAny(
        material.name,
        options.noDepthWriteMaterialExpressions,
      );
      material.side = FrontSide;
      material.forceSinglePass = true;
      material.depthTest = true;
    });

    SceneTraversal.enumerateObjectsByType(container, Mesh, (child: Mesh) => {
      child.castShadow = SceneProcessor.matchesAny(
        child.name,
        options.castShadowExpressions,
      );
      child.receiveShadow = SceneProcessor.matchesAny(
        child.name,
        options.receiveShadwoExpressions,
      );
    });

    return container.children;
  }

  /** Does the string match any of the patterns? */
  private static matchesAny(
    value: string,
    expressions: RegExp[] = [],
  ): boolean {
    return expressions.some((p) => p.test(value));
  }
}
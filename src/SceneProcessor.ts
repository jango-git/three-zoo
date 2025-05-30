import type { Material, Object3D } from "three";
import { FrontSide, Mesh } from "three";
import { InstanceAssembler } from "./InstanceAssembler";
import { SceneTraversal } from "./SceneTraversal";

type IPattern = string | RegExp;

interface IOptions {
  asset: Object3D;
  castShadowMeshNames?: IPattern[];
  receiveShadowMeshNames?: IPattern[];
  transparentMaterialNames?: IPattern[];
  noDepthWriteMaterialNames?: IPattern[];
}

export class SceneProcessor {
  public static process(options: IOptions): Object3D[] {
    const container = options.asset.clone();
    InstanceAssembler.assemble({ container: container });

    SceneTraversal.enumerateMaterials(container, (material: Material) => {
      material.transparent = SceneProcessor.matchesAny(
        material.name,
        options.transparentMaterialNames,
      );
      material.depthWrite = !SceneProcessor.matchesAny(
        material.name,
        options.noDepthWriteMaterialNames,
      );
      material.side = FrontSide;
      material.forceSinglePass = true;
      material.depthTest = true;
    });

    SceneTraversal.enumerateObjectsByType(container, Mesh, (child: Mesh) => {
      child.castShadow = SceneProcessor.matchesAny(
        child.name,
        options.castShadowMeshNames,
      );
      child.receiveShadow = SceneProcessor.matchesAny(
        child.name,
        options.receiveShadowMeshNames,
      );
    });

    return container.children;
  }

  private static matchesAny(value: string, patterns: IPattern[] = []): boolean {
    return patterns.some((p) =>
      typeof p === "string" ? value === p : p.test(value),
    );
  }
}

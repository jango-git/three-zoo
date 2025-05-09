import { FrontSide, Material, Mesh, Object3D } from "three";
import { InstanceAssembler } from "./InstanceAssembler";
import { Object3DToolbox } from "./Object3DToolbox";

type IPattern = string | RegExp;

interface IOptions {
  asset: Object3D;
  castShadowNames?: IPattern[];
  receiveShadowNames?: IPattern[];
  transparentMaterialNames?: IPattern[];
}

export class SceneProcessor {
  public static process(options: IOptions): Object3D[] {
    const container = options.asset.clone();
    InstanceAssembler.assemble({ container: container });

    Object3DToolbox.enumerateMaterials(container, (material: Material) => {
      material.transparent = SceneProcessor.matchesAny(
        material.name,
        options.transparentMaterialNames,
      );
      material.side = FrontSide;
      material.forceSinglePass = true;
      material.depthTest = true;
      material.depthWrite = true;
    });

    Object3DToolbox.enumerateObjectsByType(container, Mesh, (child: Mesh) => {
      child.castShadow = SceneProcessor.matchesAny(
        child.name,
        options.castShadowNames,
      );
      child.receiveShadow = SceneProcessor.matchesAny(
        child.name,
        options.receiveShadowNames,
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

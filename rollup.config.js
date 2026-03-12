import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import minifyPrivatesTransformer from "ts-transformer-minify-privates";

export default {
  input: {
    index: "src/index.ts",
  },
  output: {
    dir: "dist",
    format: "esm",
    preserveModules: true,
    preserveModulesRoot: "src",
  },
  external: ["three"],
  plugins: [
    nodeResolve({ extensions: [".js", ".ts"] }),
    typescript({
      tsconfig: "tsconfig.json",
      useTsconfigDeclarationDir: true,
      transformers: [
        (service) => ({
          before: [minifyPrivatesTransformer.default(service.getProgram())],
          after: [],
        }),
      ],
    }),
  ],
};

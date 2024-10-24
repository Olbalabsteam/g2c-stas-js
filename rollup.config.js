import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
// import globals from "rollup-plugin-node-globals";
import json from "@rollup/plugin-json";
import builtins from "rollup-plugin-polyfill-node";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

const config = {
  input: "index.js",
  output: [
    //  {
    //    globals: {
    //      bsv: "bsv",
    //    },
    //    format: "umd",
    //    name: "stas",
    //    file: "dist/stas-umd.js",
    //  },
    //  {
    //    globals: {
    //      bsv: "bsv",
    //    },
    //    dir: "./dist",
    //    format: "esm",
    //    sourcemap: true,
    //  },
    {
      globals: {
        bsv: "bsv",
      },
      format: "iife",
      name: "stas",
      file: "dist/stas-iife.js",
      //sourcemap: "inline",
    },
  ],
  plugins: [
    commonjs(),
    peerDepsExternal(),
   // globals(),
    builtins(),
    nodeResolve(),
    terser(),
    json(),
  ],
};

export default config;

/* eslint-disable no-console */

import ts from "typescript";

console.time("prebuild");
await Bun.$`rm -rf dist`;
console.timeEnd("prebuild");

console.time("build");
await Bun.build({
  entrypoints: ["src/css.ts", "src/dom.ts", "src/extend.ts", "src/html.ts", "src/spy.ts"],
  outdir: "dist",
  target: "bun",
  external: ["@maxmilton/html-parser", "happy-dom", "stylis"],
  minify: true,
  sourcemap: "linked",
});
console.timeEnd("build");

console.time("dts");
const config: ts.CompilerOptions = {
  emitDeclarationOnly: true,
  declaration: true,
  declarationMap: true,
  declarationDir: "dist",
  skipLibCheck: true,
};
const { emitSkipped, diagnostics } = ts
  .createProgram(["src/css.ts", "src/dom.ts", "src/extend.ts", "src/html.ts", "src/spy.ts"], config)
  .emit(undefined, undefined, undefined, true);
if (emitSkipped) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, ts.createCompilerHost(config)),
  );
  process.exitCode = 1;
}
console.timeEnd("dts");

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
await Bun.$`bunx tsc --project tsconfig.dts.json`;
console.timeEnd("dts");

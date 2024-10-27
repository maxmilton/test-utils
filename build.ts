/* eslint-disable no-console */

console.time('prebuild');
await Bun.$`rm -rf dist`;
console.timeEnd('prebuild');

console.time('build');
const out = await Bun.build({
  entrypoints: [
    // 'src/index.ts',
    'src/css.ts',
    'src/dom.ts',
    'src/extend.ts',
    'src/spy.ts',
  ],
  outdir: 'dist',
  target: 'bun',
  external: ['happy-dom', 'stylis'],
  minify: true,
  sourcemap: 'linked',
});
console.timeEnd('build');
console.log(out);

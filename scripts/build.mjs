import { mkdir, writeFile } from 'node:fs/promises';
import { transformAsync } from '@babel/core';
import { build, transform } from 'esbuild';

// Bundle into a single script that sets window.WsClientEvented
const bundled = await build({
  bundle: true,
  entryPoints: ['lib/browser.js'],
  format: 'iife',
  legalComments: 'none',
  target: 'es2015',
  write: false,
});

// esbuild can't lower classes to ES5, which the bundle needs for IE 10 and 11
const transpiled = await transformAsync(bundled.outputFiles[0].text, {
  // Without these, the class helpers need Symbol, which doesn't exist in IE
  assumptions: { setClassMethods: true, setComputedProperties: true },
  babelrc: false,
  configFile: false,
  presets: [['@babel/preset-env', { modules: false, targets: { ie: '10' } }]],
  sourceType: 'script',
});

const minified = await transform(transpiled.code, { minify: true, target: 'es5' });

await mkdir('dist', { recursive: true });
await writeFile('dist/wsclientevented.js', minified.code);

console.log(`dist/wsclientevented.js: ${(minified.code.length / 1024).toFixed(1)} kB`);

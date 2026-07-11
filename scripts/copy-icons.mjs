// Copies node/credential icon assets into the compiled `dist` tree.
//
// `tsc` only emits the TypeScript files; it does not copy non-code
// assets. Each node references its icon with `icon: 'file:<name>.svg'`,
// and n8n resolves that relative to the compiled `.node.js` — so the
// `.svg` must sit next to it under `dist/`. This script mirrors every
// icon from `nodes/**` and `credentials/**` into the matching `dist/`
// path. It runs after `tsc` in the `build` script and uses only Node
// builtins (no dependency), so it is safe for a zero-runtime-dep
// community node.

import { cpSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOTS = ['nodes', 'credentials'];
const ICON_EXTS = ['.svg', '.png'];

function copyIconsIn(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      copyIconsIn(full);
    } else if (ICON_EXTS.some((ext) => full.endsWith(ext))) {
      const dest = join('dist', full);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(full, dest);
      console.log(`copied ${full} -> ${dest}`);
    }
  }
}

for (const root of ROOTS) {
  try {
    copyIconsIn(root);
  } catch (err) {
    // A root may legitimately not exist (e.g. no credential icons).
    if (!err || err.code !== 'ENOENT') throw err;
  }
}

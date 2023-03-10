// @ts-check

import { writeFileSync } from "node:fs";
import { builtinModules as _builtins } from "node:module";

const builtinModules = _builtins.filter((name) => !name.startsWith("_"));

const builtins = builtinModules.concat(
  builtinModules.map((name) => `node:${name}`)
);

writeFileSync(
  "src/builtins.ts",
  `// This file is generated by scripts/generate-builtins.mjs\n\nexport const builtins = ${JSON.stringify(builtins, null, 2)};\n`
);

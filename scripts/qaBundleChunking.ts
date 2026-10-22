// scripts/qaBundleChunking.ts
// QA de v0.25.1: los datos históricos de plantillas van en su propio fragmento para
// que el bundle principal quede por debajo del aviso de 500 kB de Vite.

import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

const viteConfig = readFileSync("vite.config.ts", "utf8");

assert(viteConfig.includes("manualChunks"), "vite.config.ts debe partir el bundle con manualChunks.");
assert(viteConfig.includes("'athletic-data'") || viteConfig.includes('"athletic-data"'), "Los datos de plantillas deben ir en el fragmento athletic-data.");
assert(viteConfig.includes("/src/data/athletic/"), "El fragmento debe incluir solo src/data/athletic/.");
logOk("Los datos históricos de plantillas van en su propio fragmento");

console.log("QA bundle chunking OK");

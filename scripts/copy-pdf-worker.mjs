import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const assets = [
  {
    source: join(root, "node_modules", "pdfjs-dist", "build", "pdf.mjs"),
    target: join(root, "public", "pdf.mjs")
  },
  {
    source: join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
    target: join(root, "public", "pdf.worker.min.mjs")
  }
];

for (const asset of assets) {
  mkdirSync(dirname(asset.target), { recursive: true });
  copyFileSync(asset.source, asset.target);
}

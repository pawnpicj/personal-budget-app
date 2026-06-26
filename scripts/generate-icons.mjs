import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "../public/icons/logo.svg");
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

const svg = readFileSync(svgPath, "utf-8");

const sizes = [
  { name: "icon-512.png",  size: 512 },
  { name: "icon-192.png",  size: 192 },
  { name: "icon-120.png",  size: 120 },
  { name: "favicon-32.png", size: 32 },
];

for (const { name, size } of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "transparent",
  });
  const png = resvg.render().asPng();
  writeFileSync(join(outDir, name), png);
  console.log(`✓ ${name} (${size}×${size})`);
}

import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";

// Decorative mini-heatmap so the card reads as "data viz" at a glance.
const COLS = 22;
const ROWS = 7;
const cell = 26;
const gap = 6;
const gridX = 1200 - (COLS * (cell + gap)) - 40;
const gridY = 360;
let cells = "";
let seed = 7;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed >>> 8) / 0x7fffff;
};
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const v = rnd();
    const wave = Math.sin((c / COLS) * Math.PI); // brighter in the middle
    const op = v < 0.25 ? 0.05 : 0.12 + 0.75 * v * wave;
    cells += `<rect x="${gridX + c * (cell + gap)}" y="${gridY + r * (cell + gap)}" width="${cell}" height="${cell}" rx="6" fill="rgba(167,139,250,${op.toFixed(3)})"/>`;
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#38bdf8"/>
      <stop offset="0.5" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#f472b6"/>
    </linearGradient>
    <radialGradient id="glow" cx="18%" cy="0%" r="70%">
      <stop offset="0" stop-color="#a78bfa" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="#0b0b12"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${cells}

  <!-- wordmark -->
  <g transform="translate(64,68)">
    <rect width="44" height="44" rx="11" fill="url(#brand)"/>
    <path d="M10 11h24v15H18l-7 7z" fill="#0b0b12"/>
    <text x="60" y="31" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#e7e7f0">ChatRecap</text>
  </g>

  <!-- headline -->
  <text x="64" y="250" font-family="Arial, sans-serif" font-size="78" font-weight="800" fill="#ffffff">See your year in</text>
  <text x="64" y="345" font-family="Arial, sans-serif" font-size="78" font-weight="800" fill="url(#brand)">ChatGPT.</text>

  <!-- subtitle -->
  <text x="66" y="470" font-family="Arial, sans-serif" font-size="30" fill="#b9b9c9">Your AI chat history, visualized.</text>

  <!-- privacy badge -->
  <g transform="translate(64,520)">
    <circle cx="9" cy="13" r="6" fill="#34d399"/>
    <text x="26" y="20" font-family="Arial, sans-serif" font-size="24" fill="#8a8a9e">100% in your browser · nothing is uploaded</text>
  </g>
</svg>`;

mkdirSync("public", { recursive: true });
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  font: { loadSystemFonts: true, defaultFontFamily: "Arial" },
  background: "#0b0b12",
});
writeFileSync("public/og.png", resvg.render().asPng());
console.log("Wrote public/og.png");

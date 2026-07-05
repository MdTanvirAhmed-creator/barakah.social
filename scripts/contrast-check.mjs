/**
 * WCAG AA verification for the design-language token pairs (§9).
 * Run: node scripts/contrast-check.mjs — exits 1 if any pair fails.
 */
const L = (h) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [label, fg, bg, minimum]
const pairs = [
  ["night: text / bg", "#ECE7DA", "#0B0F1A", 4.5],
  ["night: muted / bg", "#9AA3B8", "#0B0F1A", 4.5],
  ["night: muted / card", "#9AA3B8", "#121826", 4.5],
  ["night: tertiary / bg", "#8A93A8", "#0B0F1A", 4.5],
  ["night: primary button text", "#FBF8F0", "#3E6DB5", 4.5],
  ["night: link (lapis-300) / bg", "#6E9BD8", "#0B0F1A", 4.5],
  ["night: leaf / bg", "#C9A24B", "#0B0F1A", 4.5],
  ["night: danger button text", "#FBF8F0", "#B5514E", 4.5],
  ["night: focus ring / bg (non-text)", "#6E9BD8", "#0B0F1A", 3],
  ["day: text / bg", "#1B1F2A", "#F4EFE1", 4.5],
  ["day: muted / bg", "#5A6072", "#F4EFE1", 4.5],
  ["day: primary button text", "#FBF8F0", "#33599A", 4.5],
  ["day: link (lapis-600) / bg", "#33599A", "#F4EFE1", 4.5],
  ["day: leaf-700 / bg", "#86682B", "#F4EFE1", 3],
  ["day: focus ring / bg (non-text)", "#3E6DB5", "#F4EFE1", 3],
];

let fail = 0;
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail = 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}  (min ${min})  ${label}`);
}
process.exit(fail);

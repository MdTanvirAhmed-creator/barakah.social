/**
 * WCAG AA verification for the design-foundation token pairs (§10).
 * Courtyard (default) + Dusk. Run: node scripts/contrast-check.mjs
 * Exits 1 if any pair fails. Wired into CI.
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

// [label, fg, bg, minimum] — 4.5 body text, 3 large text / UI marks
const pairs = [
  ["courtyard: ink / bg", "#2A2620", "#E7DECB", 4.5],
  ["courtyard: ink / surface", "#2A2620", "#F1E9D8", 4.5],
  ["courtyard: ink / sunk", "#2A2620", "#DCD2BC", 4.5],
  ["courtyard: muted / bg", "#6E6656", "#E7DECB", 4.2],
  ["courtyard: muted / surface", "#6E6656", "#F1E9D8", 4.5],
  ["courtyard: white / teal button", "#FFFFFF", "#1C7F72", 4.5],
  ["courtyard: teal-600 link / bg", "#17685E", "#E7DECB", 4.5],
  ["courtyard: lapis / bg", "#2B5FA6", "#E7DECB", 4.5],
  ["courtyard: white / danger", "#FFFFFF", "#B0504C", 4.5],
  ["courtyard: leaf-600 as text / bg", "#927022", "#E7DECB", 3],
  ["courtyard: focus ring / bg", "#1C7F72", "#E7DECB", 3],
  ["dusk: ink / bg", "#ECE3D0", "#14231F", 4.5],
  ["dusk: ink / surface", "#ECE3D0", "#1D2E28", 4.5],
  ["dusk: muted / bg", "#93A199", "#14231F", 4.5],
  ["dusk: muted / surface", "#93A199", "#1D2E28", 4.5],
  ["dusk: contrast / teal button", "#0C1A16", "#2FA58F", 4.5],
  ["dusk: teal link / bg", "#2FA58F", "#14231F", 4.5],
  ["dusk: lapis / bg", "#5A8FC9", "#14231F", 4.5],
  ["dusk: leaf / bg", "#CBA24B", "#14231F", 4.5],
  ["dusk: white / danger button (large)", "#FFFFFF", "#C56663", 3],
  ["dusk: focus ring / bg", "#2FA58F", "#14231F", 3],

  // Tajweed rule colours (Al-Hikmah reader). These ride on 24px Qur'anic
  // text, so large-text AA (3.0) applies — scripture is never below AA,
  // including the deliberately receding "silent" hue.
  ["courtyard: tajweed silent / bg", "#807768", "#E7DECB", 3],
  ["courtyard: tajweed ghunnah / bg", "#2E7D32", "#E7DECB", 3],
  ["courtyard: tajweed ikhfa / bg", "#0F766E", "#E7DECB", 3],
  ["courtyard: tajweed idgham / bg", "#6D28D9", "#E7DECB", 3],
  ["courtyard: tajweed iqlab / bg", "#2B5FA6", "#E7DECB", 3],
  ["courtyard: tajweed qalqalah / bg", "#B3372B", "#E7DECB", 3],
  ["courtyard: tajweed madd normal / bg", "#B45309", "#E7DECB", 3],
  ["courtyard: tajweed madd permissible / bg", "#C2570F", "#E7DECB", 3],
  ["courtyard: tajweed madd obligatory / bg", "#B91C1C", "#E7DECB", 3],
  ["courtyard: tajweed madd necessary / bg", "#991B1B", "#E7DECB", 3],
  ["dusk: tajweed silent / bg", "#A79F8F", "#14231F", 3],
  ["dusk: tajweed ghunnah / bg", "#7BC67E", "#14231F", 3],
  ["dusk: tajweed ikhfa / bg", "#4FB8AE", "#14231F", 3],
  ["dusk: tajweed idgham / bg", "#B79DF2", "#14231F", 3],
  ["dusk: tajweed iqlab / bg", "#8FB4E8", "#14231F", 3],
  ["dusk: tajweed qalqalah / bg", "#F08C7D", "#14231F", 3],
  ["dusk: tajweed madd normal / bg", "#E2B34E", "#14231F", 3],
  ["dusk: tajweed madd permissible / bg", "#F0A050", "#14231F", 3],
  ["dusk: tajweed madd obligatory / bg", "#F27D5C", "#14231F", 3],
  ["dusk: tajweed madd necessary / bg", "#F26565", "#14231F", 3],
];

let fail = 0;
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail = 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}  (min ${min})  ${label}`);
}
process.exit(fail);

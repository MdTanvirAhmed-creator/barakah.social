/**
 * Self-hosted, subsetted fonts (next/font downloads at build time and
 * serves from our origin — no network fonts at runtime).
 *
 * Roles:
 *   sans            Hanken Grotesk — UI, controls, labels (never Inter)
 *   display         Fraunces — headings and arrival moments, with restraint
 *   reading         Newsreader — long-form reading (Al-Hikmah)
 *   arabic          Amiri — Arabic reading text
 *   arabic-display  Reem Kufi — Arabic display; rhymes with the girih motifs
 *   arabic-ui       Noto Naskh Arabic — dense Arabic UI
 *   quran           Amiri Quran — the ONLY face Qur'anic text may render in
 *
 * Only the two critical faces preload; the rest swap in.
 */
import {
  Hanken_Grotesk,
  Fraunces,
  Newsreader,
  Amiri,
  Reem_Kufi,
  Noto_Naskh_Arabic,
  Amiri_Quran,
} from "next/font/google";

export const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
  variable: "--font-sans",
});

export const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--font-display",
});

export const reading = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  variable: "--font-reading",
});

export const arabic = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
  variable: "--font-arabic",
});

export const arabicDisplay = Reem_Kufi({
  subsets: ["arabic"],
  weight: ["500"],
  display: "swap",
  preload: false,
  variable: "--font-arabic-display",
});

export const arabicUi = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--font-arabic-ui",
});

export const quran = Amiri_Quran({
  subsets: ["arabic"],
  weight: ["400"],
  display: "swap",
  preload: false,
  variable: "--font-quran",
});

export const fontVariables = [
  sans.variable,
  display.variable,
  reading.variable,
  arabic.variable,
  arabicDisplay.variable,
  arabicUi.variable,
  quran.variable,
].join(" ");

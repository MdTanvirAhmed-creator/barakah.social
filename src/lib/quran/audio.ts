/**
 * Verse-by-verse recitation URLs.
 *
 * EveryAyah names files by zero-padded surah and ayah (001001.mp3), so a
 * URL is pure arithmetic — no API call, no lookup table. The template lives
 * in quran_sources so the reciter and its terms stay on the record even
 * though the audio itself is linked rather than rehosted.
 *
 *   https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3
 */
export function buildAyahAudioUrl(
  template: string,
  surah: number,
  ayah: number
): string {
  return template.replace(/\{(surah|ayah):(\d+)\}/g, (_m, field, width) => {
    const value = field === "surah" ? surah : ayah;
    return String(value).padStart(Number(width), "0");
  });
}

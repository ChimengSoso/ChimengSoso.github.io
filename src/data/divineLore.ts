export interface DivineLoreEntry {
  /** Directory-style path relative to /divine-lore/ (e.g. 'global-workspace/'). */
  href: string;
  /** Short category label shown as a pill on the card. */
  tag: string;
  title: string;
  desc: string;
  /** Publish date in ISO 8601 (YYYY-MM-DD). */
  dateISO: string;
  /** Estimated reading time in minutes. */
  readingMinutes: number;
}

export const divineLoreEntries: DivineLoreEntry[] = [
  {
    href: 'global-workspace/',
    tag: 'บันทึกวิจัย',
    title: 'Anthropic อ่าน "ความคิดในหัว" ของ AI ได้แล้ว',
    desc: 'เปิดกล่องดำ AI ได้จริง — อ่านความคิดเงียบ ๆ ก่อนมันพิมพ์คำตอบ แก้ความคิดนั้นได้ และจับได้ตั้งแต่ในหัวว่ามันกำลังจะโกหก',
    dateISO: '2026-07-12',
    readingMinutes: 12,
  },
];

export function getDivineLoreEntry(href: string): DivineLoreEntry | undefined {
  return divineLoreEntries.find((e) => e.href === href);
}

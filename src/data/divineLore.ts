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
    href: 'icpc-warmup-2026/',
    tag: 'เฉลยโจทย์แข่ง',
    title: 'ICPC 2026 ไทย รอบย่อย — สรุปโจทย์ + เฉลยแบบเข้าใจง่าย',
    desc: 'เล่าและเฉลยโจทย์รอบย่อย ICPC 2026 แบบเข้าใจง่าย',
    dateISO: '2026-07-19',
    readingMinutes: 17,
  },
  {
    href: 'global-workspace/',
    tag: 'บันทึกวิจัย',
    title: 'Anthropic ส่องเห็น "ห้องคิดกลาง" ในหัว AI ได้แล้ว',
    desc: 'เปิดกล่องดำ AI ได้จริง — Anthropic เจอโครงสร้างในโมเดลที่ทำหน้าที่เหมือนการรู้ตัวของสมองคน อ่านความคิดเงียบ ๆ ได้ แก้มันได้ และเห็นสัญญาณเจตนาที่ซ่อนอยู่ก่อนมันจะลงมือ',
    dateISO: '2026-07-12',
    readingMinutes: 17,
  },
];

export function getDivineLoreEntry(href: string): DivineLoreEntry | undefined {
  return divineLoreEntries.find((e) => e.href === href);
}

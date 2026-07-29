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
    href: 'options-101/',
    tag: 'บันทึกการเงิน',
    title: 'Options 101: หุ้นอยู่ที่เดิม เราก็ขาดทุนได้',
    desc: 'สรุป Webull Master Class ตอน Zero to Options Trader แบบละเอียด พร้อมภาพ payoff ทุกท่า ตั้งแต่ Call/Put, Covered Call, Cash Secured Put ไปจนถึงการหาโซนราคาด้วย Reverse DCF',
    dateISO: '2026-07-27',
    readingMinutes: 22,
  },
  {
    href: 'llm-cheese-types/',
    tag: 'บันทึกวิจัย',
    title: 'LLM ชอบ "หลบด่าน" ที่เราตั้งไว้',
    desc: 'สรุปบทความ LLMs Will Cheese Your Types ของ Justin Le รวมท่าที่ AI ใช้เลี่ยงกฎ type ทั้งที่คอมไพล์ผ่านหมด ยกโค้ดมาครบทุกตัวอย่าง พร้อมเวอร์ชัน Scala 3 (cats, cats-effect, fs2, Pekko) และ TypeScript (Effect-TS) คู่กันทุกท่า',
    dateISO: '2026-07-26',
    readingMinutes: 18,
  },
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

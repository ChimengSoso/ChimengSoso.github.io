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
    href: 'bitcoin-from-zero/',
    tag: 'บันทึกการเงิน',
    title: 'บิตคอยน์ตั้งแต่ศูนย์: เงินที่ไม่มีใครเป็นเจ้าของทำงานยังไง',
    desc: 'เห็นคำว่าบิตคอยน์มาสิบกว่าปี แต่พอมีคนถามว่ามันทำงานยังไง ก็ยังตอบไม่ได้สักที บทนี้เริ่มจากศูนย์ ไม่ต้องรู้อะไรมาก่อน มีของให้กดเล่นแปดชิ้นระหว่างทาง',
    dateISO: '2026-08-30',
    readingMinutes: 51,
  },
  {
    href: 'ascii-donut/',
    tag: 'บันทึกวิจัย',
    title: 'เข้าใจ donut.c ตั้งแต่ศูนย์',
    desc: 'โค้ดโดนัทหมุนของ Andy Sloane ถูกแชร์มาสิบกว่าปี แต่คำอธิบายทุกอันเริ่มที่เมทริกซ์หมุน บทนี้เริ่มจากศูนย์จริง ๆ ปูไซน์กับโคไซน์ด้วยสามเหลี่ยมมุมฉาก ปูเปอร์สเปกทีฟด้วยสามเหลี่ยมคล้าย แล้วต่อทีละชั้นจนครบ 6 ชั้น พร้อมบทพิสูจน์ทุกสูตรและโดนัทที่ถอดชิ้นส่วนเล่นได้ในหน้า',
    dateISO: '2026-08-27',
    readingMinutes: 33,
  },
  {
    href: 'forex-3d/',
    tag: 'บันทึกการเงิน',
    title: 'Forex-3D: คุก 49,110 ปี กับเลขที่ไม่มีวันจริง',
    desc: 'แกะคดี Forex-3D ทั้งเครื่อง ตั้งแต่ Forex คือตลาดอะไร โบรกเกอร์กินเงินตรงไหน ทำไมไทยไม่เคยออกใบอนุญาตให้ใคร เลขคณิตที่บอกว่าแชร์ลูกโซ่ต้องพังเดือนไหน การจดบริษัทให้อะไรกับคนตั้งจริง ๆ ภาษีบุคคลกับนิติบุคคลต่างกันแค่ไหน ทำไมคนมีเงินถึงโดนหลอก พร้อมไทม์ไลน์ 11 ปีจนถึงคำพิพากษาวันที่ 13 สิงหาคม 2026',
    dateISO: '2026-08-13',
    readingMinutes: 32,
  },
  {
    href: 'rich-people-mortgage/',
    tag: 'บันทึกการเงิน',
    title: 'คนรวยก็กู้ซื้อบ้าน: แกะดอกเบี้ยทีละบาท',
    desc: 'เกร็ดการเงินชิ้นแรก แกะโพสต์ยอดนิยมเรื่องมหาเศรษฐีที่ยังกู้แบงก์ซื้อบ้าน ว่าดอกเบี้ยลดต้นลดดอกทำงานยังไง ประวัติของ Buffett, Zuckerberg, Musk, Griffin, Jay-Z จริงแค่ไหน ทำไมจุดคุ้มทุนคืออัตราดอกเบี้ยพอดี และส่วนไหนของวิธีคิดนี้ใช้ในไทยไม่ได้เลย',
    dateISO: '2026-07-30',
    readingMinutes: 16,
  },
  {
    href: 'options-101/',
    tag: 'บันทึกการเงิน',
    title: 'Options 101: หุ้นอยู่ที่เดิม เราก็ขาดทุนได้',
    desc: 'สรุป Webull Master Class ตอน Zero to Options Trader แบบละเอียด พร้อมภาพ payoff ทุกท่า ตั้งแต่ Call/Put, Covered Call, Cash Secured Put ไปจนถึงการหาโซนราคาด้วย Reverse DCF',
    dateISO: '2026-07-27',
    readingMinutes: 29,
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

export interface Article {
  /** Directory-style path relative to /knowledge/ (e.g. 'claude-intro/', not '.html'). */
  href: string;
  /** Short category label shown as a pill on the card and OG image. */
  tag: string;
  title: string;
  desc: string;
  /** Publish date in ISO 8601 (YYYY-MM-DD). Omitted on `soon` placeholders. */
  dateISO?: string;
  /** Last-updated date in ISO 8601 (YYYY-MM-DD). Omitted when not updated after publish. */
  updatedISO?: string;
  /** Estimated reading time in minutes (shown on the listing card). Omitted on `soon` placeholders. */
  readingMinutes?: number;
  /** true = "เร็วๆ นี้" placeholder with no real page; excluded from prev/next. */
  soon: boolean;
}

export const articles: Article[] = [
  {
    href: 'claude-intro/',
    tag: 'แนะนำเบื้องต้น',
    title: 'Claude คืออะไร ใช้ยังไง',
    desc: 'ถ้ายังไม่รู้จัก Claude เลยสักนิด บทความนี้คือจุดเริ่มที่ไม่ควรข้าม',
    dateISO: '2026-07-01',
    updatedISO: '2026-07-09',
    readingMinutes: 16,
    soon: false,
  },
  {
    href: 'claude-code-workflow/',
    tag: 'Claude Code',
    title: 'ความลับที่ทำให้ Claude Code ได้ผลจริง',
    desc: 'แชร์สิ่งที่ทำมาแล้วจริง 9 ข้อ ตั้งแต่ Plan Mode ยันปุ่มลัดที่ควรรู้ — ถ้าไม่รู้ = เสียเวลาไปอีกนาน',
    dateISO: '2026-07-01',
    updatedISO: '2026-07-02',
    readingMinutes: 7,
    soon: false,
  },
  {
    href: 'handoff/',
    tag: 'Claude Code',
    title: 'ส่งงานต่อข้ามแชทแบบไม่เสีย Context',
    desc: 'พอแชทยาวจน AI เริ่มเอ๋อ อย่าเพิ่งเปิดแชทใหม่แล้วเล่าใหม่ทั้งหมด — สกิล /handoff สรุปงานให้ Agent ตัวใหม่รับช่วงต่อได้ใน 3 ขั้นตอน',
    dateISO: '2026-07-05',
    readingMinutes: 6,
    soon: false,
  },
  {
    href: 'grill-and-loop/',
    tag: 'Claude Code',
    title: 'ให้ AI ซักจนงานชัด ด้วย /grill-me กับ /loop-me',
    desc: 'AI ไม่ได้พังเพราะเขียนโค้ดไม่เป็น แต่เพราะเราบอกงานไม่ครบ — 2 สกิลนี้กลับด้าน ให้ AI ซักถามเราจนสเปกชัดก่อนลงมือ',
    dateISO: '2026-07-05',
    readingMinutes: 7,
    soon: false,
  },
  {
    href: 'context-pollution/',
    tag: 'Claude Code',
    title: 'Context Pollution: เมื่อ Agent วางยาพิษใส่ตัวเอง',
    desc: 'นั่ง debug กับ AI นาน ๆ แล้วมันเริ่มเพี้ยน ลืมสิ่งที่ตกลงกันไว้ เพราะ Agent เอาขยะถมใส่ context ตัวเอง — มาดูว่าทำไม แล้วใช้ sub-agent กั้นห้องความเลอะยังไง',
    dateISO: '2026-07-06',
    readingMinutes: 8,
    soon: false,
  },
  {
    href: 'model-memory/',
    tag: 'Claude Code',
    title: 'ติดอาวุธให้ Claude ตอนที่ 1: เลือกโมเดล + วางระบบความจำ',
    desc: 'จ่ายค่าโมเดลแรงมาเต็ม ๆ แต่ใช้เกียร์ 2 ตลอดทาง แถมสอนเท่าไหร่ก็ไม่จำ — จับคู่โมเดลให้ถูกงาน แล้ววางความจำเป็นชั้น Hot / Cold / learning.md ให้ AI เลิกลืม',
    dateISO: '2026-07-10',
    readingMinutes: 8,
    soon: false,
  },
  {
    href: 'claude-toolbox/',
    tag: 'Claude Code',
    title: 'ติดอาวุธให้ Claude ตอนที่ 2: ของเสริมนอกกล่องที่ควรมี',
    desc: 'ตัวโมเดลเก่งอย่างเดียวยังไม่พอ — รวม "ของเสริม" นอกกล่องที่คนใช้จริงแอบติดกัน ตั้งแต่คุมเบราว์เซอร์ สแกนช่องโหว่ ยันสกิลลดโทเคนและจัดสายพานงาน',
    dateISO: '2026-07-10',
    readingMinutes: 14,
    soon: false,
  },
  {
    href: 'ai-taste/',
    tag: 'มุมมอง',
    title: 'ถ้า AI เก่งขนาดนี้ แล้วเราจะอยู่ไปทำไม',
    desc: 'ทึ่งกับ AI แต่ก็ใจหายว่าเราจะเหลืออะไร — งานวิจัยเศรษฐศาสตร์ชิ้นล่าสุดกับสุนทรพจน์ที่ชี้ว่าความใจหายนั้นวางอยู่บนความเข้าใจผิด 2 ข้อ',
    dateISO: '2026-07-07',
    readingMinutes: 21,
    soon: false,
  },
];

export interface AdjacentArticles {
  prev: Article | null;
  next: Article | null;
}

// Only published (soon: false) articles count for prev/next — placeholders
// have no real page to link to.
export function getAdjacentArticles(href: string): AdjacentArticles {
  const published = articles.filter((a) => !a.soon);
  const index = published.findIndex((a) => a.href === href);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? published[index - 1] : null,
    next: index < published.length - 1 ? published[index + 1] : null,
  };
}

export function getArticle(href: string): Article | undefined {
  return articles.find((a) => a.href === href);
}

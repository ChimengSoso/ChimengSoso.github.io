export const articles = [
  {
    href: 'claude-intro/',
    tag: 'แนะนำเบื้องต้น',
    title: 'Claude คืออะไร ใช้ยังไง',
    desc: 'ถ้ายังไม่รู้จัก Claude เลยสักนิด บทความนี้คือจุดเริ่มที่ไม่ควรข้าม',
    soon: false,
  },
  {
    href: 'claude-code-workflow/',
    tag: 'Claude Code',
    title: 'ความลับที่ทำให้ Claude Code ได้ผลจริง',
    desc: 'แชร์สิ่งที่ทำมาแล้วจริง 9 ข้อ ตั้งแต่ Plan Mode ยันปุ่มลัดที่ควรรู้ — ถ้าไม่รู้ = เสียเวลาไปอีกนาน',
    soon: false,
  },
  {
    href: 'handoff/',
    tag: 'Claude Code',
    title: 'ส่งงานต่อข้ามแชทแบบไม่เสีย Context',
    desc: 'พอแชทยาวจน AI เริ่มเอ๋อ อย่าเพิ่งเปิดแชทใหม่แล้วเล่าใหม่ทั้งหมด — สกิล /handoff สรุปงานให้ Agent ตัวใหม่รับช่วงต่อได้ใน 3 ขั้นตอน',
    soon: false,
  },
  {
    href: 'grill-and-loop/',
    tag: 'Claude Code',
    title: 'ให้ AI ซักจนงานชัด ด้วย /grill-me กับ /loop-me',
    desc: 'AI ไม่ได้พังเพราะเขียนโค้ดไม่เป็น แต่เพราะเราบอกงานไม่ครบ — 2 สกิลนี้กลับด้าน ให้ AI ซักถามเราจนสเปกชัดก่อนลงมือ',
    soon: false,
  },
];

// Only published (soon: false) articles count for prev/next — placeholders
// have no real page to link to.
export function getAdjacentArticles(href) {
  const published = articles.filter((a) => !a.soon);
  const index = published.findIndex((a) => a.href === href);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? published[index - 1] : null,
    next: index < published.length - 1 ? published[index + 1] : null,
  };
}

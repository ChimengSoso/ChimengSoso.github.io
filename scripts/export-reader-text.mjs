// แปลงหน้า /cp/<slug>/ ที่ build แล้วเป็นข้อความตามลำดับการอ่าน ให้ subagent อ่านแทนการเปิดเบราว์เซอร์
//
// ใช้ตอนส่ง "ผู้อ่านหน้าใหม่" (ดู skill cp-solution-story) เพราะ subagent เปิดหน้าเว็บเองไม่ได้
// และถ้าให้อ่าน .astro ตรง ๆ จะเจอ frontmatter, CSS, สคริปต์ปนกับเนื้อหาจนอ่านไม่เหมือนผู้อ่านจริง
// รูปกลายเป็น [ภาพ: aria-label] ปุ่มกลายเป็น [ปุ่ม: ...] โค้ดถูกละ และเครื่องเดินทีละขั้นถูกกางข้อความทุกขั้นออกมา
//
// กับดักที่แก้ไว้แล้ว: data-steps ฝัง JSON ด้วย entity แบบตัวเลข (&#34;) ต้องถอดก่อน JSON.parse
//
// วิธีใช้:  npm run build
//          node scripts/export-reader-text.mjs tears <ไฟล์ปลายทาง.txt>
import fs from 'node:fs';

const [slug, out] = process.argv.slice(2);
if (!slug || !out) {
  console.error('usage: node scripts/export-reader-text.mjs <slug> <out.txt>');
  process.exit(1);
}

const dec = (t) => t
  .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
  .replace(/&#(\d+);/g, (_, x) => String.fromCodePoint(+x))
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&middot;/g, '·').replace(/&amp;/g, '&');

let h = fs.readFileSync(`dist/cp/${slug}/index.html`, 'utf8');
h = h.slice(h.indexOf('<h1'));
const end = h.indexOf('<footer');
if (end > 0) h = h.slice(0, end);
h = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
h = h.replace(/<div class="dpsim"[^>]*data-steps="([^"]*)"[\s\S]*?class="dps-say"[^>]*>[^<]*<\/div>\s*<\/div>/g, (m, js) => {
  const steps = JSON.parse(dec(js));
  const lines = steps.map((s, i) => `  ขั้น ${i}: ${String(s.note ?? '').replace(/<[^>]+>/g, ' ')}`);
  return `\n[เครื่องเดินทีละขั้น ${steps.length} ขั้น ข้อความแต่ละขั้น:]\n${lines.join('\n')}\n[จบเครื่องเดิน]\n`;
});
h = h.replace(/<svg[\s\S]*?<\/svg>/g, (m) => `[ภาพ: ${(m.match(/aria-label="([^"]*)"/) || [])[1] || ''}]`);
h = h.replace(/<figcaption[^>]*>/g, '\n[คำบรรยาย] ').replace(/<caption[^>]*>/g, '\n[ตาราง] ');
h = h.replace(/<\/(td|th)>/g, ' | ').replace(/<\/tr>/g, '\n');
h = h.replace(/<pre[\s\S]*?<\/pre>/g, '[โค้ด ละไว้]');
h = h.replace(/<h([1-4])[^>]*>/g, (m, n) => `\n\n${'#'.repeat(+n)} `).replace(/<\/h[1-4]>/g, '\n');
h = h.replace(/<button[^>]*class="spoiler-reveal"[^>]*>[\s\S]*?<\/button>/g, '\n[ปุ่ม แตะเพื่อดูเฉลย: ข้างล่างนี้เบลออยู่จนกว่าจะกด]\n');
h = h.replace(/<button[^>]*>/g, ' [ปุ่ม: ').replace(/<\/button>/g, '] ');
h = h.replace(/<summary[^>]*>/g, '\n[กดเปิด: ').replace(/<\/summary>/g, ']\n');
h = h.replace(/<(p|li|div|ul|ol|br)[^>]*>/g, '\n');
h = dec(h.replace(/<[^>]+>/g, ''));
h = h.replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n');
fs.writeFileSync(out, h);
console.log(`${out}: ${h.length} ตัวอักษร`);

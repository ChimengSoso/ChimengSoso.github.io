// ดึงโค้ดที่หน้า /cp/<slug>/ ship จริงออกมาจาก dist แล้วเขียนเป็นไฟล์แยกทีละบล็อก
//
// ทำไมต้องมี: หน้าโจทย์ทุกหน้าเขียนโดยวางไฟล์ .cpp ที่เทสต์แล้วลงไปในเทมเพลตสตริง
// ซึ่งเป็นขั้นที่โค้ดเพี้ยนได้เงียบ ๆ มาแล้วหลายครั้ง (เคยมีบรรทัดหายไปหนึ่งบรรทัด
// และเคยมีตัวแปรถูกลบทิ้ง) สิ่งที่ต้องคอมไพล์ซ้ำจึงเป็นโค้ดในหน้า ไม่ใช่ไฟล์ที่เทสต์
//
// วิธีใช้:
//   npm run build
//   node scripts/extract-cp-code.mjs tears [outDir]
//   แล้วเอาไฟล์ที่ได้ไปคอมไพล์ และ diff กับไฟล์ที่เทสต์ไว้
//   ต้องต่างกันไม่เกินบรรทัดว่างท้ายไฟล์ ถ้าต่างมากกว่านั้นแปลว่าหน้ากำลัง ship ของที่ไม่เคยรัน
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
const outDir = process.argv[3] ?? '.';
if (!slug) {
  console.error('usage: node scripts/extract-cp-code.mjs <slug> [outDir]');
  process.exit(1);
}

const file = path.join('dist', 'cp', slug, 'index.html');
if (!fs.existsSync(file)) {
  console.error(`ไม่พบ ${file} (ลืมรัน npm run build หรือเปล่า)`);
  process.exit(1);
}
const html = fs.readFileSync(file, 'utf8');

/** ถอด entity ให้ครบ โดยเฉพาะแบบตัวเลข
 *  shiki เขียน < เป็น &#x3C; ถ้าถอดแค่ &lt; ไฟล์ที่ได้จะเต็มไปด้วย "N &#x3C;= 1e5"
 *  แล้วคอมไพล์พังเป็นพรืดโดยที่ error ไม่ได้บอกสาเหตุจริง */
const unescapeHtml = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

// แต่ละบล็อกขึ้นต้นด้วยป้ายชื่อไฟล์ใน <span> แล้วตามด้วย <pre class="astro-code...">
// ต้องผูกกับ <span ไม่ใช่แค่ชื่อคลาสลอย ๆ เพราะชื่อคลาสเดียวกันโผล่ใน <style> ก่อนหน้าด้วย
// ถ้าจับหลวม ๆ regex จะไปแมตช์กฎ CSS แล้วได้ชื่อไฟล์เป็นค่าว่าง (ส่วนโค้ดยังถูก จึงหลอกตาได้)
const re = /<span[^>]*code-window-label[^>]*>([^<]*)<\/span>[\s\S]*?<pre class="astro-code[\s\S]*?>([\s\S]*?)<\/pre>/g;
let m;
let n = 0;
fs.mkdirSync(outDir, { recursive: true });
while ((m = re.exec(html)) !== null) {
  const title = m[1].trim() || `block${n}.cpp`;
  const code = unescapeHtml(m[2]);
  const out = path.join(outDir, `shipped_${title.replace(/[^\w.]/g, '_')}`);
  fs.writeFileSync(out, code, 'utf8');
  console.log(`${title}  ->  ${out}  (${code.split('\n').length} บรรทัด)`);
  n++;
}
console.log(`พบโค้ด ${n} บล็อกในหน้า /cp/${slug}/`);
if (n === 0) process.exit(1);

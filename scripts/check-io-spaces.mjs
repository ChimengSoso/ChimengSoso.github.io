// ตรวจว่าตาราง EXAMPLE ของหน้าไหนกำลังทำช่องว่างหาย
//
// อาการ: ช่องว่างที่เขียนคั่นระหว่างสอง {expr} ภายใน fragment <>...</> ถูกกลืนตอน render
//        "4 9 3 6" จึงออกมาเป็น "4936" และ "1999999 2000000" ออกมาเป็น "19999992000000"
//        ซึ่งอ่านผิดความหมายไปเลย โดยที่ check, lint และ build เขียวทั้งหมด
// ขอบเขต: พังเฉพาะใน fragment ส่วนที่เขียนตรง ๆ ใน <td> เช่น {N} {M} เรนเดอร์ถูกอยู่แล้ว
//        อย่าไล่แก้ทุกที่ที่ grep เจอ } { เพราะเคยนับได้ 115 จุดใน 40 ไฟล์ ทั้งที่พังจริง 36 จุดใน 22 ไฟล์
// วิธีแก้: รวมทั้งบรรทัดเป็นสตริงเดียว {[a, b, c].join(' ')}
//
// วิธีใช้:  node scripts/check-io-spaces.mjs          ตรวจจาก source (เร็ว ใช้กันของใหม่หลุด)
//          node scripts/check-io-spaces.mjs --dist   ตรวจจาก dist ว่าเรนเดอร์ออกมาจริงเป็นยังไง
import fs from 'node:fs';
import path from 'node:path';

const useDist = process.argv.includes('--dist');
const IO_TABLE = /<table class="io"[\s\S]*?<\/table>/g;
const FRAGMENT = /<>[\s\S]*?<\/>/g;
const RUN = /\{([^{}]*)\}(?:[ ]\{([^{}]*)\})+/g;

function sourceScan() {
  const dirs = ['src/pages/cp', 'src/pages/divine-lore'];
  let files = 0;
  let spots = 0;
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.astro'))) {
      const src = fs.readFileSync(path.join(dir, name), 'utf8');
      let hits = 0;
      for (const t of src.match(IO_TABLE) ?? []) {
        for (const frag of t.match(FRAGMENT) ?? []) {
          RUN.lastIndex = 0;
          if (RUN.test(frag)) hits++;
        }
      }
      if (hits) {
        files++;
        spots += hits;
        console.log(`${name}: ${hits} fragment ที่ช่องว่างจะหาย`);
      }
    }
  }
  console.log(`\nไฟล์ที่ต้องแก้ ${files} ไฟล์ รวม ${spots} จุด`);
  return spots;
}

function distScan() {
  const base = 'dist/cp';
  if (!fs.existsSync(base)) {
    console.error('ไม่พบ dist/cp (ลืมรัน npm run build หรือเปล่า)');
    process.exit(1);
  }
  let n = 0;
  for (const dir of fs.readdirSync(base)) {
    const f = path.join(base, dir, 'index.html');
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    for (const t of html.match(IO_TABLE) ?? []) {
      const cell = t
        .replace(/<br\s*\/?>/g, ' ⏎ ')
        .replace(/<[^>]+>/g, '|')
        .replace(/\|+/g, '|')
        .replace(/\s+/g, ' ')
        .trim();
      console.log(`${dir}: ${cell.slice(0, 160)}`);
      n++;
    }
  }
  console.log(`\nตาราง EXAMPLE ทั้งหมด ${n} ตาราง อ่านด้วยตาว่าตัวเลขในบรรทัดเดียวกันมีช่องว่างคั่นครบไหม`);
  return 0;
}

const bad = useDist ? distScan() : sourceScan();
process.exit(bad > 0 ? 1 : 0);

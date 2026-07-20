# Handoff prompt — เขียนบทความ "ทำให้ Claude ทำงานเป็นทีม"

> วิธีใช้: ก๊อปเนื้อในบล็อกด้านล่างทั้งก้อน วางเป็นข้อความแรกให้ agent ตัวถัดไป
> (แก้ `[...]` ที่ยังว่างก่อนวางได้ตามต้องการ)

---

```
ถ้ามีไฟล์ C:\Users\chi.cm\work\work-vault\working-with-chi.md ให้อ่านก่อนตอบ (ไกด์วิธีสื่อสารกับ Chi)
ถ้าไม่มี (เครื่อง/บัญชีอื่น) ข้ามไปได้ — กติกาเดียวกันอยู่ใน CLAUDE.local.md ของ repo นี้แล้ว (ดูข้อ 0 ด้านล่าง)

## บริบทงาน
เรากำลังเขียนบทความ /knowledge ภาษาไทยเรื่อง "ทำให้ Claude ทำงานเป็นทีม"
(หัวหน้าสั่ง → dev เขียน → QA ตรวจ → ลูป feedback → เด้งถามมนุษย์เมื่อโจทย์กำกวม → ส่งมอบ)
งานวางแผน + สร้างวัตถุดิบ + prototype เสร็จหมดแล้ว เหลือ "เขียนเนื้อบทความจริง"

## อ่านก่อนเริ่ม (สำคัญ ตามลำดับ)
0. CLAUDE.local.md (root ของ repo, ไม่ checked in — ถ้าไม่มีไฟล์นี้ในเครื่องที่รัน ให้บอก Chi ก่อนเริ่ม) — สไตล์ไกด์ตัวจริงของซีรีส์ /knowledge: โครง pain→หักมุม→สอน→ฮุกปิด, กติกา "ห้ามเฉลยก่อนคนอ่านมีคำถาม", กติกา diagram (ต้องเรนเดอร์ดูจริง ห้ามเคลมจากอ่านโค้ด), ลิสต์คำศัพท์ที่แกะไปแล้วทั้งซีรีส์
1. docs/article-plan-claude-agent-team.md — แผนละเอียด: เมทาดาทา, โครง 11 h2, fact-check + verify checklist, วัตถุดิบจริงในภาคผนวก
2. docs/samples/README.md แล้วดูไฟล์ในโฟลเดอร์นั้น (workflow script + prototype html + ผลรัน)
3. CLAUDE.md ส่วน "Adding a new article" — คอนเวนชันการเพิ่มบทความ (แตะ 2 ที่: สร้าง .astro + เพิ่ม entry ใน articles.ts)
4. src/pages/knowledge/claude-intro.astro และ ai-taste.astro — อ่านสไตล์/โทน/การแกะศัพท์ก่อนลงมือเขียน (แต่ **ทำ fact-check §5 ของ plan ให้จบก่อนเริ่มเขียนเนื้อ** ไม่ใช่ทิ้งไว้ทำตอนท้าย — ถ้าฟีเจอร์เปลี่ยนชื่อ/เลิก experimental ระหว่างทาง section "3 วิธีจัดทีม" ต้องรื้อทั้งก้อน)

## งานที่ต้องทำ
สร้าง src/pages/knowledge/claude-agent-team.astro ตามโครงในไฟล์ plan (11 หัวข้อ h2)
และเพิ่ม entry ใน src/data/articles.ts (tag "Claude Code" — เคาะแล้ว, href "claude-agent-team/")

## กฎที่ห้ามพลาด (จาก CLAUDE.md + CLAUDE.local.md + ไฟล์ plan)
- ภาษาไทยเป็นกันเอง "เข้าใจง่าย" โทนเดียวกับบทความก่อนหน้าทั้งหมด (ปัจจุบัน 9 บท ไม่ใช่ 6 — เช็คจำนวนจริงใน src/data/articles.ts ก่อนอ้างอิง เพราะจะเพิ่มขึ้นเรื่อยๆ)
- แกะศัพท์ธง (คำอ่านไทย + ความหมาย + ที่มา) แต่ "อย่าแกะซ้ำ" คำที่บทก่อนแกะแล้ว → grep src/pages/knowledge/*.astro ก่อนเสมอ
  - **เช็คแล้วพบว่า `orchestrator` ถูกแกะไปแล้วที่ context-pollution.astro (คำอ่าน "ออร์เคสเทรเตอร์" + ที่มา orchestra ครบ) — ห้ามแกะซ้ำ ให้อ้างอิงบทนั้นสั้นๆ แทน** ส่วนคำว่า "agent" เดี่ยวๆ ยังไม่เคยแกะ แกะได้ตามแผน
- fact-check ตัวเลข/ชื่อฟีเจอร์ด้วย WebSearch **ก่อนเริ่มเขียนเนื้อหา** (มี checklist ใน plan §5) — Chi เคยจับผิดพลาดมาก่อน
- **ห้ามปล่อย `dateISO: "2026-XX-XX"` เป็น placeholder ค้างไว้ — เป็น string ที่ type-check ผ่านเฉยๆ แต่ถ้าลืมแก้จะทำให้ RSS/JSON-LD ได้วันที่พัง** ต้องแก้เป็นวันที่ publish จริงก่อน build
- prototype ห้องแชต (§A.5 ของ plan): **ห้ามฝังลิงก์ claude.ai Artifact URL ตรงๆ ในบทความ** (เป็น URL default-private ผูกกับบัญชี Chi ผู้อ่านทั่วไปเปิดไม่ได้) — ให้ถ่าย screenshot เก็บใน public/knowledge/ แทน หรือถามวิธีที่ Chi ต้องการก่อนถ้าไม่ชัวร์
- ห้ามใช้ any (ทั้ง .ts/.astro/<script>) — ถ้าคิดว่าต้องใช้ ให้ถาม Chi ก่อน
- อย่า commit เอง — commit เฉพาะเมื่อ Chi สั่ง (บรรทัดเดียว imperative ไม่มี body ไม่มี Co-Authored-By)
- อย่า over-act: เอาโครง/ตัวอย่างส่วนแรกให้ Chi ดูก่อน อย่าเขียนรวดเดียวจบทั้งบทความแล้วค่อยโชว์

## verify (จาก plan §6) เมื่อเขียนเสร็จ
npm run check + npm run lint + npm run build, แล้วเช็ค live preview: listing card ใน section Claude Code,
prev/next ทั้งหน้าใหม่และเพื่อนบ้าน, /rss.xml, dist/og/claude-agent-team.png, grep zero-width space \x{200B}

## สถานะ branch
อยู่บน develop — commit แล้ว (ดู "ความคืบหน้า (2026-07-16 จบงาน)" ด้านล่างสุดสำหรับสถานะล่าสุด)

## ความคืบหน้า (2026-07-16)
`src/pages/knowledge/claude-agent-team.astro` เขียนไปแล้ว 3 h2 แรก + เพิ่ม entry ใน `articles.ts` แล้ว (dateISO ชั่วคราว `2026-07-16` — ยืนยันวันจริงกับ Chi ก่อน publish)

**ฟีดแบ็กสำคัญจาก Chi ที่ทำให้แก้โครง h2 แรก** (ดูรายละเอียดเต็มใน `docs/article-plan-claude-agent-team.md` §4):
เดิม h2 แรกเปิดด้วยภาพ "AI หลายตัวคุยกันในห้องแชต หัวหน้า/dev/QA" ตรง ๆ — Chi บอกว่าสปอยเกินไป
อยากให้เปิดด้วยฉากที่ **ใหญ่และคลุมเครือกว่า** ก่อน แล้วค่อยเฉลยทีหลัง ตัวอย่างที่ใช้จริง: ชวนผู้อ่านสวมบทเป็น
**"เจ้าของบริษัทซอฟต์แวร์ที่เพิ่งเริ่มต้น"** (ทำเองทุกอย่างคนเดียว อยากมีทีม) โดยยังไม่บอกว่าทีมนั้นคือ AI
แล้วค่อยเฉลยในหัวข้อ "แกะศัพท์ก่อน" ถัดไป — **เทคนิคนี้ใช้ได้กับบทความหน้าอื่น ๆ ในซีรีส์ด้วย ถ้าจะเปิดด้วยภาพ mechanism ตรง ๆ
ให้ลองคิดฉากที่คลุมเครือ/เป็นภาพใหญ่กว่าก่อนเสมอ** (บันทึกไว้ใน memory `no-premature-reveal` แล้ว)

## ความคืบหน้า (2026-07-16 ต่อ)
เขียนจบครบทั้ง 9 h2 แล้ว + verify ผ่านครบ (`npm run check`/`lint`/`build` + listing/prev-next/RSS/OG/zero-width space)
เปลี่ยนชื่อบทความเป็น **"ตั้งบริษัทซอฟต์แวร์ที่ไม่มีพนักงานเป็นคนสักคน"** ตามฟีดแบ็ก Chi (ชื่อเดิมสปอยกลไก dev/QA)
เพิ่ม screenshot จริงของ prototype ห้องแชต (`docs/samples/team-room.html`) แล้ว — เนื่องจาก `preview_screenshot`/Browser pane
screenshot timeout บนเครื่องนี้ (ปัญหาเดิมที่รู้อยู่แล้ว) จึงแคปด้วย headless Edge ตรง ๆ แทน:
`msedge --headless --disable-gpu --screenshot=... --window-size=1200,1500 file:///...team-room.html`
(ต้อง serve ผ่าน local http server ก่อน เพราะ Browser pane บล็อก `file://`) ไฟล์ผลลัพธ์อยู่ที่
`public/knowledge/agent-team-room.png` อ้างอิงในบทความผ่าน `<figure class="screenshot">` ตาม convention เดิม

## ความคืบหน้า (2026-07-16 จบงาน)
**บทความเสร็จสมบูรณ์และ commit แล้ว** — ไม่ต้องเริ่มใหม่จากศูนย์อีกถ้ากลับมาแก้ต่อ แค่เปิด
`src/pages/knowledge/claude-agent-team.astro` แก้ได้เลย จุดที่ทำเพิ่มหลังบันทึกครั้งก่อน:
- เปลี่ยนคำเรียกบทบาท "หัวหน้า" → **"Lead"** ทั้งบทความ (prose, diagram box/aria-label, CodeBlock ตัวอย่าง `qa.md`,
  subtitle ในทั้ง `.astro` และ `articles.ts`) ตามคำขอ Chi — เหลือคำว่า "Team Lead" อยู่จุดเดียวคือ alt text
  ของ screenshot ห้องแชต เพราะเป็น label จริงที่ปรากฏในรูป ไม่ใช่ prose ที่เราคุมได้
- เพิ่ม `<h2>แหล่งอ้างอิง</h2>` นำหน้า `<ol class="references">` (เดิมมีแต่ `<ol>` ลอย ๆ ไม่มี heading
  เลยไม่โผล่ใน TOC ฝั่งขวา — Chi ทักหลังเห็นหน้าเว็บจริง) ตอนนี้ TOC มีครบ 10 หัวข้อรวม "แหล่งอ้างอิง" แล้ว
- เพิ่ม screenshot จริงของ prototype ห้องแชตแล้ว (ดูรายละเอียดวิธีแคปด้านบน) ใส่ครบทั้ง `<img>` + `<figcaption>`
  ที่สรุป insight ไม่ใช่บรรยายภาพ ตาม convention
- อัปเดตแหล่งอ้างอิงให้มีของจริงครบ: Agent Teams / Workflows / Subagents docs (Claude Code) + UXPin (หลักการออกแบบ
  ห้องแชตหลายคน) — ตัด reference scheduled-tasks ที่ไม่เกี่ยวกับเนื้อหาจริงออกไปแล้ว

**Verify ล่าสุด (หลัง Lead-rename + references-heading fix):** `npm run check` และ `npm run lint` รันซ้ำแล้ว
ผ่านทั้งคู่ — error/warning ที่เห็นทั้งหมดเป็นของเดิมใน `docs/samples/*.js` (ไฟล์ตัวอย่างที่ไม่ได้ตั้งใจให้ lint ผ่าน)
ไม่เกี่ยวกับ `claude-agent-team.astro`

ถ้ากลับมาทำต่อ: เช็คว่า `dateISO: '2026-07-16'` ใน `articles.ts` ยังตรงกับวันที่จะ publish จริงไหมก่อน deploy
(ตอนนั้นเป็นแค่ค่าประมาณ)
```

---

## หมายเหตุสำหรับ Chi
- ไฟล์นี้ออกแบบให้ agent ตัวใหม่ (session ใหม่/เครื่องอื่น) เริ่มได้โดยไม่ต้องเห็นบทสนทนานี้
- ถ้าอยากส่งต่อให้เพื่อนร่วมทีม แค่ชี้ให้เขาเปิด repo แล้วอ่านไฟล์นี้
- จุดที่อาจอยากเติมก่อนส่ง: วันที่ publish (`dateISO`) ถ้ากำหนดแล้ว

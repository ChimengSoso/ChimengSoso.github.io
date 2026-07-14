# Handoff prompt — เขียนบทความ "ทำให้ Claude ทำงานเป็นทีม"

> วิธีใช้: ก๊อปเนื้อในบล็อกด้านล่างทั้งก้อน วางเป็นข้อความแรกให้ agent ตัวถัดไป
> (แก้ `[...]` ที่ยังว่างก่อนวางได้ตามต้องการ)

---

```
อ่าน C:\Users\chi.cm\work\work-vault\working-with-chi.md ก่อนตอบ — เป็นไกด์วิธีสื่อสารกับ Chi (อธิบายเรื่องยากให้ง่าย: แกะศัพท์ + เปรียบเทียบ + ซื่อสัตย์ + ปิดด้วยสรุปบรรทัดเดียว, เดินทีละ step, อย่า over-act)

## บริบทงาน
เรากำลังเขียนบทความ /knowledge ภาษาไทยเรื่อง "ทำให้ Claude ทำงานเป็นทีม"
(หัวหน้าสั่ง → dev เขียน → QA ตรวจ → ลูป feedback → เด้งถามมนุษย์เมื่อโจทย์กำกวม → ส่งมอบ)
งานวางแผน + สร้างวัตถุดิบ + prototype เสร็จหมดแล้ว เหลือ "เขียนเนื้อบทความจริง"

## อ่านก่อนเริ่ม (สำคัญ ตามลำดับ)
1. docs/article-plan-claude-agent-team.md — แผนละเอียด: เมทาดาทา, โครง 11 h2, fact-check + verify checklist, วัตถุดิบจริงในภาคผนวก
2. docs/samples/README.md แล้วดูไฟล์ในโฟลเดอร์นั้น (workflow script + prototype html + ผลรัน)
3. CLAUDE.md ส่วน "Adding a new article" — คอนเวนชันการเพิ่มบทความ (แตะ 2 ที่: สร้าง .astro + เพิ่ม entry ใน articles.ts)
4. src/pages/knowledge/claude-intro.astro และ ai-taste.astro — อ่านสไตล์/โทน/การแกะศัพท์ก่อนลงมือเขียน

## งานที่ต้องทำ
สร้าง src/pages/knowledge/claude-agent-team.astro ตามโครงในไฟล์ plan (11 หัวข้อ h2)
และเพิ่ม entry ใน src/data/articles.ts (tag "Claude Code" — เคาะแล้ว, href "claude-agent-team/")

## กฎที่ห้ามพลาด (จาก CLAUDE.md + ไฟล์ plan)
- ภาษาไทยเป็นกันเอง "เข้าใจง่าย" โทนเดียวกับ 6 บทเดิม
- แกะศัพท์ธง (คำอ่านไทย + ความหมาย + ที่มา) แต่ "อย่าแกะซ้ำ" คำที่บทก่อนแกะแล้ว → grep src/pages/knowledge/*.astro ก่อน (โดยเฉพาะคำว่า agent)
- fact-check ตัวเลข/ชื่อฟีเจอร์ด้วย WebSearch ก่อน publish (มี checklist ใน plan §5) — Chi เคยจับผิดพลาดมาก่อน
- ห้ามใช้ any (ทั้ง .ts/.astro/<script>) — ถ้าคิดว่าต้องใช้ ให้ถาม Chi ก่อน
- อย่า commit เอง — commit เฉพาะเมื่อ Chi สั่ง (บรรทัดเดียว imperative ไม่มี body ไม่มี Co-Authored-By)
- อย่า over-act: เอาโครง/ตัวอย่างส่วนแรกให้ Chi ดูก่อน อย่าเขียนรวดเดียวจบทั้งบทความแล้วค่อยโชว์

## verify (จาก plan §6) เมื่อเขียนเสร็จ
npm run check + npm run lint + npm run build, แล้วเช็ค live preview: listing card ใน section Claude Code,
prev/next ทั้งหน้าใหม่และเพื่อนบ้าน, /rss.xml, dist/og/claude-agent-team.png, grep zero-width space \x{200B}

## สถานะ branch
อยู่บน develop, ยังไม่ได้ commit อะไร (ไฟล์ docs/ ที่สร้างไว้ยังเป็น untracked/uncommitted)

เริ่มจาก: ยืนยันว่าอ่านไฟล์ครบแล้ว สรุปความเข้าใจสั้นๆ ให้ Chi ฟัง แล้วถามว่าจะให้เขียนโหมด incremental หรือ batch (verify cadence) ก่อนลงมือ
```

---

## หมายเหตุสำหรับ Chi
- ไฟล์นี้ออกแบบให้ agent ตัวใหม่ (session ใหม่/เครื่องอื่น) เริ่มได้โดยไม่ต้องเห็นบทสนทนานี้
- ถ้าอยากส่งต่อให้เพื่อนร่วมทีม แค่ชี้ให้เขาเปิด repo แล้วอ่านไฟล์นี้
- จุดที่อาจอยากเติมก่อนส่ง: วันที่ publish (`dateISO`) ถ้ากำหนดแล้ว

# Samples — วัตถุดิบบทความ "ทำให้ Claude ทำงานเป็นทีม"

ไฟล์ประกอบสำหรับ [../article-plan-claude-agent-team.md](../article-plan-claude-agent-team.md)
(ย้ายมาจาก scratchpad ชั่วคราวเพื่อเก็บถาวร — ไม่ได้เป็นส่วนของ build เว็บ)

| ไฟล์ | คืออะไร |
|---|---|
| `team-demo.workflow.js` | สคริปต์ Workflow จริง: หัวหน้า → dev → QA → ลูป feedback → ส่งมอบ (รอบ 1 dev ส่งร่างเร็ว naive เพื่อให้ QA มีของจริงให้ตีกลับ) |
| `team-room.html` | Prototype หน้า "ห้องแชตทีม agent" 3 โซน (roster / ห้องหลัก / thread) render จากผลรันจริง — Artifact: `https://claude.ai/code/artifact/fa4954b8-cc69-435f-83cc-96ed040d22ed` |
| `thai-digits.mjs` | ผลรัน workflow ครั้งแรก (ตัวแปลงเลขไทย↔อารบิก) — เก็บไว้เป็นตัวอย่าง "เคสผ่านรอบเดียว" |

## รันดูได้

```bash
node docs/samples/thai-digits.mjs      # ไม่มี output = assert ผ่านหมด
open docs/samples/team-room.html       # เปิดดู prototype ในเบราว์เซอร์
```

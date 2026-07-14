# Plan: บทความ "ทำให้ Claude ทำงานเป็นทีม"

> ไฟล์นี้คือ **แผนสำหรับเขียนบทความ** ไม่ใช่ตัวบทความ — dev เอาไปเขียนเนื้อหาจริงต่อเอง
> วัตถุดิบจริงเก็บถาวรใน [`docs/samples/`](samples/) แล้ว (workflow script + prototype + ผลรัน) และย่อไว้ท้ายไฟล์นี้ด้วย

## 0. สรุปงาน

เขียนบทความ `/knowledge` ภาษาไทย เล่าวิธีทำให้ Claude ทำงานเป็น **ทีม agent**
(หัวหน้าสั่ง → dev เขียน → QA ตรวจ → ลูป feedback → เด้งถามมนุษย์เมื่อโจทย์กำกวม → ส่งมอบ)
โดยแยกชัดว่า **อะไรทำได้จริงวันนี้** vs **อะไรต้องประกอบเอง**

หัวใจของบทความ = **demo จริง** ที่เรารันไปแล้ว (สร้างฟังก์ชัน `formatThousands`) — ไม่ใช่ทฤษฎีลอยๆ

---

## 1. เมทาดาทา — เพิ่มเข้า `src/data/articles.ts`

จัดกลุ่ม tag = **`Claude Code`** (เคาะแล้ว — เป็นวิธีใช้งานจริง ไม่ใช่ความเห็น จึงอยู่ section เดิม ไม่เปิด section ใหม่)

```ts
{
  href: "claude-agent-team/",
  title: "ทำให้ Claude ทำงานเป็นทีม: หัวหน้าสั่ง–dev เขียน–QA ตรวจ จนงานเสร็จ",
  desc: "จาก AI ตัวเดียว สู่ทีมที่มีหัวหน้าแบ่งงาน มีลูปแก้งาน และเด้งกลับมาถามเราเมื่อโจทย์ไม่ชัด — อะไรทำได้จริง อะไรต้องประกอบเอง",
  tag: "Claude Code",
  soon: false,
  dateISO: "2026-XX-XX",   // ← วันที่จะ publish
  readingMinutes: 13,       // ← เคาะทีหลังจากนับอักษรจริง (ตัวไทย ÷ ~1000)
}
```

**ตำแหน่งในอาเรย์:** วางต่อท้ายกลุ่ม `Claude Code` เดิม (ลำดับในอาเรย์ = ลำดับ prev/next + การจัดกลุ่ม section)

## 2. ไฟล์เพจ — สร้าง `src/pages/knowledge/claude-agent-team.astro`

ทำตามแพตเทิร์นเดิมเป๊ะ (ก๊อป `claude-intro.astro` มาเป็นโครง):
- frontmatter: `getArticle("claude-agent-team/")`, `formatThaiDate`, `getAdjacentArticles`
- `<Layout title={\`${article.title} | หมวดความรู้\`} description={article.desc} headline={article.title} prev={...} next={...}>`
- `<ArticleByline>` เรนเดอร์วันที่เอง (อย่า hand-type วันที่ไทย)
- **โครง body ด้วย `h2`** ตามหัวข้อ §4 (TOC สร้างจาก h2 อัตโนมัติ)
- **ไม่ต้อง** ตั้ง `image` / ทำ OG เอง — สร้างอัตโนมัติจาก `/og/[slug].png.ts`

> title มี `formatThousands()` ไม่ใช่ slash-command token เลยไม่ต้อง wrap `<code>` ใน breadcrumb/h1

## 3. กฎสไตล์ที่ต้องรักษา (จาก CLAUDE.md)

- ภาษาไทย เป็นกันเอง "เข้าใจง่าย" — อ่าน `claude-intro.astro` / `ai-taste.astro` ก่อนเขียน
- **แกะศัพท์ธง**: คำอ่านไทย + ความหมายสั้น + ที่มา (ถ้าลงตัว) · `<strong>` รอบคำอ่าน/ความหมาย, `<i>` เฉพาะคำอังกฤษ
- **อย่าแกะซ้ำคำที่บทก่อนแกะแล้ว** → `grep` ใน `src/pages/knowledge/*.astro` ก่อน (เช่น เช็คว่า "agent" เคยแกะยัง)
- **fact-check** ข้อมูล product/model/วันที่ ด้วย WebSearch ก่อน publish (ดู §5)
- building blocks: `callout-tip`/`callout-note`, `card`, `step`, `diagram`, `expander`, `pull`, `<CodeBlock>`, `<ol class="references">`

---

## 4. โครงเนื้อหา — ทีละ `h2`

### h2: ความฝันที่ฟังดูเป็นหนัง sci-fi
- เปิดด้วยภาพ: AI หลายตัวคุยกันในห้องแชต หัวหน้าแบ่งงาน dev/QA วนแก้ ส่งงานกลับมาให้เรา
- **building block:** `callout-note` — "บทความนี้จะแยกให้ชัดว่าอะไรทำได้จริง อะไรต้องประกอบเอง"
- โทน: ยอมรับก่อนว่ามันฟังดูเว่อร์ แล้วค่อยพาไปดูของจริง

### h2: แกะศัพท์ก่อน
- `agent` — *"เอเจนต์"* = ตัวแทน/ผู้ทำงานแทน (Claude 1 ตัว = พนักงาน 1 คน)
- `orchestrate` — *"ออร์เคสเทรต"* = กำกับวง (ราก orchestra; หัวหน้า = วาทยกร)
- `subagent`, `workflow` — สั้นๆ
- **building block:** `card` รวมศัพท์ · **เช็คก่อนว่า claude-intro แกะ "agent" ไปหรือยัง** ถ้าแกะแล้วให้อ้างอิงสั้นๆ ไม่แกะซ้ำ

### h2: ทำไมต้องเป็น "ทีม" ไม่ใช่ AI ตัวเดียว
- analogy: ตัวเดียว = ฟรีแลนซ์ทำทุกอย่างคนเดียว (พลาดง่าย ไม่มีคนตรวจ); ทีม = แบ่งบทบาท โฟกัส ตรวจกันเอง
- **building block:** `diagram` — ผัง `หัวหน้า → dev / QA → feedback → ส่งมอบ`

### h2: 3 วิธีจัดทีมที่มีจริง
- **building block:** `step` 3 ข้อ
  1. **Agent Teams** — ทีมนั่งข้างกัน, สื่อสารผ่าน mailbox (ไฟล์ JSON) + shared task list, สูงสุด ~25 ตัว, **ยัง experimental** เปิดด้วย `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
  2. **Workflows** — สคริปต์ JS สั่งได้เป๊ะ (`agent()`/`pipeline()`/`parallel()`), เหมาะกับลูป deterministic ที่สุด
  3. **Subagents** — สั่งทีละงาน ผลกลับหาหัวหน้า คุยกันเองไม่ได้
- **building block:** ตารางเทียบ (คุยกันเองได้ไหม / ควบคุมได้แค่ไหน / เหมาะกับอะไร)

### h2: ออกแบบ "บทบาท" ให้แต่ละ agent
- role เก็บเป็นไฟล์ `.claude/agents/*.md` — frontmatter: `name` / `description` / `model` / `tools`
- analogy: ใบกำหนดตำแหน่งงาน (JD) — เขียนครั้งเดียว ทุก session หยิบใช้ซ้ำ = "จำ" role ได้
- **building block:** `<CodeBlock>` ตัวอย่างไฟล์ `qa.md` (ดูวัตถุดิบ §A.4)

### h2: ลงมือจริง — ทีมสร้างฟังก์ชันตัวหนึ่ง  ★ หัวใจบทความ
- เล่าโจทย์: ฟังก์ชัน `formatThousands(n)` ใส่ comma คั่นหลักพัน
- **building block:** `<CodeBlock>` สคริปต์ workflow (วัตถุดิบ §A.1)
- เล่าเป็นเฟส: หัวหน้าตั้งเกณฑ์รับงาน 5 ข้อ → dev เขียน → QA ไล่โค้ดด้วยมือ
- **building block:** `card` โชว์บั๊กจริง `1,234.5,678` → `1,234.5678` (พิสูจน์ด้วย node — §A.3)

### h2: ลูป feedback มี 2 ทิศทาง
- **แนวนอน:** dev ↔ QA แก้โค้ดกันเอง จน QA อนุมัติ (reject รอบ 1 → ผ่านรอบ 2 — วัตถุดิบ §A.2)
- **แนวตั้ง:** เด้งกลับหา *มนุษย์* เมื่อความกำกวมอยู่ที่ requirement ไม่ใช่ที่โค้ด
  - เคส: โจทย์แรกกำกวม ("ใส่ comma หน่อย") → QA เอะใจว่าเทสต์ไม่ถูกเพราะไม่รู้เกณฑ์ → คุยกับ lead → lead ถามเรา 3 คำถาม → ล็อกสเปก
- **building block:** `pull` quote — "agent ที่ดีคือ agent ที่ปฏิเสธจะเดา แล้วถาม ดีกว่าเดาผิดทั้งสาย"
- ประเด็นสอน: requirement กำกวมจะตีความเพี้ยนเป็นทอดๆ (lead→dev→QA) การเด้งถามมนุษย์คือตัวตัดวงจรนั้น

### h2: แล้ว "ห้องแชตรวม" ที่นั่งดูมันคุยล่ะ?
- ซื่อสัตย์: **ไม่มีเป็นฟีเจอร์สำเร็จรูป** — ที่ใกล้สุด: `/workflows` progress view, Agent Teams split-pane, `claude agents` dashboard (เป็นหน้าสถานะ ไม่ใช่ transcript แชต)
- ทางออก: เอา log มา **render เอง** → แทรกรูป/ลิงก์ prototype (วัตถุดิบ §A.5)
- **building block:** `callout-tip` อธิบายดีไซน์ที่อิง best practice:
  - ผู้พูด 3+ คน → คอลัมน์เดียวชิดซ้าย (บับเบิลซ้าย-ขวาใช้ได้แค่ 2 คน)
  - มนุษย์ = ข้อยกเว้นเดียวที่ชิดขวา
  - thread = ห้องย่อยเมื่อ agent คุยกันเอง

### h2: จะ "จำ" setting พวกนี้ได้ยังไง
- `.claude/agents/` (role) · `CLAUDE.md` (คู่มือโหลดอัตโนมัติ) · memory files · workflows ที่เซฟใน `.claude/workflows/`
- **building block:** `callout-note` ข้อจำกัด — ผูกเครื่อง/โปรเจกต์เดียว, ไม่ sync ข้ามเครื่อง, session คุยข้าม session สดๆ ไม่ได้ (ต้อง `/resume`)

### h2: ข้อควรระวัง
- Agent Teams ยัง experimental (อาจมีบั๊ก)
- Workflow มีเพดาน agent (16 พร้อมกัน / 1000 ต่อรัน) + ค่า token
- "ลูปวนจนผ่าน" ≠ "ถูกเสมอ" — QA ก็เป็น AI ยังต้องมีคนตรวจปลายทาง
- การแก้ localStorage/token ต่างๆ ไม่ใช่ security จริง

### h2: สรุป
- ปิดด้วยสรุปบรรทัดเดียว (สไตล์เจ้าของ)
- **building block:** `<ol class="references">` (ดู §5)

---

## 5. Fact-check ก่อน publish (WebSearch)

ยืนยันตัวเลข/ชื่อฟีเจอร์ให้เป๊ะ (เจ้าของเคยจับผิดพลาดมาก่อน):
- [ ] Agent Teams ยัง experimental จริงไหม + ชื่อ env flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` + เพดาน ~25 teammates
- [ ] Workflows: เพดาน concurrent 16 / total 1000 ต่อรัน
- [ ] `.claude/agents/*.md` frontmatter fields (name/description/model/tools) — ยืนยันจาก docs ปัจจุบัน
- [ ] `/agents` command ถูก deprecate ไปแล้วหรือยัง (research บอกว่า deprecated — เช็คซ้ำ)
- [ ] scheduling: `/loop`, CronCreate, Routines — ช่วง interval ขั้นต่ำ

**references ที่จะใส่:** Claude Code docs (subagents, workflows), Claude Agent SDK, หน้า Agent Teams (ถ้ามี public doc)

## 6. เช็กลิสต์ verify (จาก CLAUDE.md — new-article)

- [ ] `npm run check` + `npm run lint` + `npm run build` ผ่าน
- [ ] listing card โผล่ใน section `Claude Code` count ถูก + meta row ("อ่าน N นาที" + วันที่)
- [ ] prev/next ทำงานทั้งหน้าใหม่ **และเพื่อนบ้าน 2 หน้า**
- [ ] `/rss.xml` มี item ใหม่
- [ ] `dist/og/claude-agent-team.png` ถูกสร้าง โชว์ title/tag ถูก
- [ ] `/` ↔ บทความ นำทาง client-side ยังโอเค (`astro:page-load`)
- [ ] `grep` หา zero-width space `\x{200B}` ในไฟล์ใหม่
- [ ] (หลัง deploy) เช็ค `https://chimengsoso.github.io/og/claude-agent-team.png` ของจริง

---

# ภาคผนวก A — วัตถุดิบจริง (ฝังไว้เผื่อ scratchpad หาย)

> ไฟล์เต็มทั้งหมดอยู่ที่ [`docs/samples/`](samples/) แล้ว — ด้านล่างเป็นฉบับย่อไว้อ่านในบริบท

## A.1 สคริปต์ workflow ที่ใช้รัน — เต็มที่ [`samples/team-demo.workflow.js`](samples/team-demo.workflow.js)

โครง: `Plan (boss) → loop[ dev → QA ] → Handoff (boss)` — QA ตอบเป็น schema `{approved, verdict, issues}`
รอบแรก dev ถูกสั่งให้ส่ง "ร่างเร็ว naive" เพื่อให้ลูปมีของจริงให้จับ (พฤติกรรม dev ตอนรีบ):

```js
// meta: name 'team-demo', phases: Plan / Build+QA / Handoff
// TASK = formatThousands(n): ใส่ comma, รองรับติดลบ/ทศนิยม/ศูนย์, ห้ามใช้ toLocaleString

phase('Plan')
const spec = await agent(
  `You are the TEAM LEAD. ... Restate the goal, list 3-5 acceptance criteria your QA
   will verify, write a short brief for your dev. Do not write the code yourself.`,
  { label: 'boss:plan', schema: SPEC_SCHEMA, effort: 'low' })

phase('Build+QA')
let code = '', lastQa = null; const rounds = []; const MAX_ROUNDS = 3
for (let round = 1; round <= MAX_ROUNDS; round++) {
  const feedback = lastQa ? `Previous attempt REJECTED. Fix:\n- ${lastQa.issues.join('\n- ')}\n${code}` : ''
  // รอบ 1 = ร่างเร็ว naive (ยังไม่ special-case ลบ/ทศนิยม), รอบต่อไป = แก้ให้ครบ
  code = await agent(`You are the DEV. Implement: ${spec.devBrief} ${draftMode} ${feedback}
                      Return ONLY the module source.`,
                     { label: `dev:round${round}`, effort: 'low' })
  lastQa = await agent(`You are a STRICT QA. Mentally EXECUTE the code on 1234567, -1234,
                        1234.5678, 0, -1234567.89. Approve only if every input is exact.`,
                       { label: `qa:round${round}`, schema: QA_SCHEMA, effort: 'low' })
  rounds.push({ round, approved: lastQa.approved, verdict: lastQa.verdict, issues: lastQa.issues })
  if (lastQa.approved) break
}

phase('Handoff')
const handoff = await agent(`You are the TEAM LEAD. Write a short Thai handoff note to Chi:
                             what was built, passed QA?, how many rounds, any caveat.`,
                            { label: 'boss:handoff', effort: 'low' })
return { spec, rounds, approved: lastQa.approved, finalCode: code, handoff }
```

## A.2 ผลรันจริง (3 ครั้ง)

| รัน | โจทย์ | รอบ | ผล |
|---|---|---|---|
| 1 | เลขไทย↔อารบิก | 1 | ผ่านเลย (งานง่าย) |
| 2 | formatThousands (โจทย์ชัด) | 1 | ผ่านเลย — dev ใช้ `Math.abs` เลี่ยงกับดักเอง |
| 3 | formatThousands (dev ร่างเร็ว) | 2 | **reject รอบ 1 → แก้ → ผ่านรอบ 2** ← ใช้อันนี้ในบทความ |

**QA reject รอบ 1 (รันที่ 3):** ระบุ input ที่พัง + สาเหตุ + ส่วนที่ถูกอยู่แล้ว
> `formatThousands(1234.5678)` คืน `"1,234.5,678"` ควรเป็น `"1,234.5678"` —
> regex `\B(?=(\d{3})+(?!\d))` ไปหั่นส่วนทศนิยม + assert มีแค่เคสจำนวนเต็มบวก

**โค้ดที่ผ่านรอบ 2:**
```js
export function formatThousands(n) {
  const negative = n < 0;
  const [intPart, fracPart] = Math.abs(n).toString().split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = fracPart === undefined ? grouped : `${grouped}.${fracPart}`;
  return negative ? `-${body}` : body;
}
```

## A.3 พิสูจน์บั๊กจริง (ไม่ใช่ QA มโน)

```bash
node -e 'console.log(String(1234.5678).replace(/\B(?=(\d{3})+(?!\d))/g, ","))'
# → 1,234.5,678   (ตรงกับที่ QA รายงานเป๊ะ)
```

## A.4 ตัวอย่างไฟล์ role (`.claude/agents/qa.md`) — เขียนใหม่ประกอบบทความ

```markdown
---
name: qa
description: ตรวจโค้ดเทียบ acceptance criteria ไล่ลอจิกด้วยมือ อนุมัติหรือตีกลับพร้อมเหตุผล
model: sonnet
tools: Read, Grep, Bash
---
คุณคือ QA reviewer ... approve เฉพาะเมื่อทุกเกณฑ์ผ่านจริง ถ้าตีกลับให้ระบุ input ที่พัง
```

## A.5 Prototype ห้องแชต

- Artifact URL (ของเจ้าของ): `https://claude.ai/code/artifact/fa4954b8-cc69-435f-83cc-96ed040d22ed`
- ไฟล์ต้นฉบับ (scratchpad ชั่วคราว — **ควรก๊อปเก็บ**): `.../scratchpad/team-room.html`
- **ดีไซน์ 3 โซน:** roster (ซ้าย, ออกแบบ role ด้วยสี+glyph) · ห้องหลัก (กลาง, ไล่เฟส) · thread rail (ขวา, 2 side-chat: QA↔Lead clarify + Dev↔QA loop)
- **role coding:** 👑 หัวหน้า=อำพัน · ⌨ dev=ฟ้า · ✓ QA=ม่วง · ◆ พี่(มนุษย์)=graphite ชิดขวา
- **state ด้วยรูป:** chip เขียว `✓ APPROVED` / แดง `✗ REJECTED` / อำพัน `⁇ NEEDS YOUR DECISION`
- รองรับ light/dark + responsive (จอแคบยุบคอลัมน์เดียว) + `prefers-reduced-motion`

---

# ภาคผนวก B — เส้นเรื่องที่แนะนำ (arc)

ความฝัน → แกะศัพท์ → ทำไมต้องทีม → 3 วิธีจริง → ออกแบบ role → **demo จริง** →
ลูป 2 ทิศ (dev↔QA + เด้งถามมนุษย์) → เรื่องห้องแชต (ของจริง + prototype) →
วิธีจำ setting → ข้อควรระวัง → สรุป

**แกนอารมณ์:** เริ่มจาก "ว้าว sci-fi" → ค่อยๆ ลงดินด้วยของจริง → จบแบบมีวิจารณญาณ (ไม่ขายฝัน)

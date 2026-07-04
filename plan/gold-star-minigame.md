# แผน: มินิเกมจับดาว — Phase 2 (คำใบ้จากถ้วยรางวัล → สะพานสู่ SecretConsole)

> **สถานะ: Phase 1 + Phase 2 implement เสร็จแล้ว + verify ในเบราว์เซอร์ครบ** (รวม stretch ผู้พิทักษ์รับรู้)
> Phase 1 = commit `b852656`, `4c1ddcf`. Phase 2 = โค้ดในทรีปัจจุบัน (เอกสารนี้เก็บไว้เป็นบันทึกดีไซน์)
> ไฟล์หลัก: `src/components/StarfieldBackground.astro` + `src/lib/starClues.ts` + `src/components/SecretConsole.astro` (canvas 2D เดิม ไม่มี dependency ใหม่)

---

## สถานะปัจจุบัน (Phase 1 — เสร็จ)

- **ดาวจับได้ = สีมรกต** `STAR_COLOR = '#4fe6a8'` + หางควัน (`TRAIL_MAX = 42`) — เขียวที่เป็นไปไม่ได้ในฟิลด์ดาวจริง = อ่านว่า "พิเศษ"
- **ทอง `GOLD_COLOR = '#ffd27a'` เป็นแค่ reward accent**: `✦` / ถ้วย / "+1" ที่ลอยขึ้น
- รอบละ 6 ดวง (`ROUND_TARGET`), ไต่ความเร็วถึง `SPEED_MAX_FACTOR = 10`× ที่ดวงที่ 6
- ครบ 6 → toast มุมขวา + `✦ 6/6` + pop (`ROUND_CELEBRATE_MS = 2000`ms) → ยุบเป็น `สะสม 🏆 {total}`
- **แต้ม in-memory ล้วน** (ไม่มี localStorage) — รอด persist ข้ามหน้า แต่ refresh = รีเซ็ต (ตั้งใจ กันแฮก)
- spawn เฉพาะ `phase === 'interactive'`, reduced-motion = ปิดเกม
- ค่าคงที่จูนได้รวมหัว `<script>`

---

## Phase 2 — เป้าหมาย

ทำให้ดาวมรกต (ที่ค้นเจอง่ายเพราะเด่น) เป็น **breadcrumb** ที่ค่อย ๆ สอนว่า SecretConsole มีอยู่ + วิธีไข ทีละถ้วย —
เดิม console เป็น easter egg ที่ไม่มีทางเดา ตอนนี้จะมี "สะพาน" ให้คนทั่วไปค้นเจอผ่านมินิเกม

**เฟรมมิ่ง lore:** ดาวมรกต = เศษความลับที่ร่วงจากประตูลับ เก็บครบ 6 (1 ถ้วย) → เศษประกอบเป็น **คำใบ้ 1 ชิ้น** จากผู้พิทักษ์ (น้ำเสียงลึกลับเดียวกับ console)

---

## ปริศนาปลายทาง (ที่คำใบ้ต้องพาไปถึง — มีอยู่แล้ว ไม่แตะ)

1. **เปิด console:** Konami `↑↑↓↓←→←→ B A` (มี penalty ผิดล็อกอิน → กด Konami ซ้ำเท่าตัว, localStorage 24 ชม.)
2. **ผู้พิทักษ์:** username ต้องมี `chi` + password ต้องเป็น **anagram ของ username**
3. ผ่าน → `/divine-lore/` (token checksum ใน `divineLoreToken.ts` — ยังต้องสอด `chi` เหมือนเดิม)

> คำใบ้แค่ **สอน** ปริศนา ไม่ได้ bypass gate จริง — divine-lore ยังตรวจ token เหมือนเดิม เปิดคำใบ้หมดก็ยังต้องลงมือไขเอง

---

## ✅ การตัดสินใจ (ล็อกแล้ว)

| # | ประเด็น | เลือก |
|---|---|---|
| D1 | persistence ของความคืบหน้า | **เก็บเฉพาะ progress** (`progress` int 0..10 ใน localStorage) — แยกจาก `game.total` ที่ยัง in-memory |
| D2 | การแสดงคำใบ้ | **toast "กระซิบ" ตอนได้ถ้วย + แผง codex เปิดอ่านย้อนได้** (คลิกถ้วยใน HUD) |
| D3 | ความตรงของคำใบ้ (ชั้น 1–5) | **สอนกฎ ไม่ยกคำตอบ** (บอก Konami เต็ม + กฎ chi/anagram แต่ไม่บอกคู่ username/password สำเร็จรูป) |
| D4 | รางวัลความเพียร (ถ้วยที่ 10) | **ยอมเฉลยชัดขึ้น** — ให้ตัวอย่างคู่ที่ใช้ได้จริง (worked example) สำหรับคนที่เล่นทะลุ 5 ถ้วยไปแล้ว |

---

## บันไดคำใบ้ (ขับด้วย `progress` — ตัวนับรอบสะสมแบบ persist)

จบรอบ → `progress++` (แคปที่ 10) → whisper **เฉพาะชั้นที่มีเนื้อหา** (1–5, 6, 10) ส่วนถ้วย 7–9 นับเงียบ ๆ (toast รอบปกติยังเด้งทุกรอบ)

| ถ้วยที่ | เผยอะไร | ร่างข้อความ (ปรับได้) |
|---|---|---|
| 1 | มีประตูลับ + ดาว = เบาะแส | "เจ้าเห็นแล้วสินะ… ดาวมรกตคือเศษความลับที่ร่วงจากประตูซึ่งซ่อนในความมืดของหน้านี้ เก็บให้ครบ ข้าจะกระซิบทางเข้าให้ทีละนิด" |
| 2 | Konami ครึ่งแรก | "ประตูไม่มีปุ่ม มีแต่ 'บทสวด' ของนักเล่นเกมรุ่นเก่า — เริ่มจาก: ขึ้น ขึ้น ลง ลง" |
| 3 | Konami ครึ่งหลัง + เรียกผู้พิทักษ์ | "แล้วสานต่อ: ซ้าย ขวา ซ้าย ขวา ปิดท้ายด้วย B แล้ว A — เมื่อครบ ผู้พิทักษ์จักปรากฏ" |
| 4 | username มี `chi` | "ผู้พิทักษ์จะถามหา 'ชื่อ' ของเจ้า ชื่อที่แท้ต้องมีตัวตนของข้าซ่อนอยู่ — สามอักษร c · h · i" |
| 5 | password = anagram | "และกุญแจคือชื่อเดิมนั้น เพียงสลับอักษรใหม่ให้ครบทุกตัว ผู้ไขได้จักได้เห็นศาสตร์แห่งเทพ" |
| 6 (recap) | ครบชุดคำใบ้แล้ว | "กุญแจอยู่ในมือเจ้าครบแล้ว — ท่องบทสวด แล้วมอบชื่อกับกุญแจแก่ผู้พิทักษ์เถิด" |
| 7–9 | *(นับเงียบ ๆ ไม่มี whisper ใหม่)* | — |
| **10 (bonus)** | **worked example — ยอมเฉลยชัดขึ้น (D4)** | "เจ้าเพียรนัก… เอาละ ให้เห็นภาพชัด ๆ: ชื่อ 'michi' กับกุญแจ 'chimi' คืออักษรชุดเดียวกันที่สลับที่ และมี chi ครบ — จงลองด้วยชื่อของเจ้าเองเถิด" |

> **ตรวจแล้วว่าตัวอย่างชั้น 10 ใช้ได้จริง**: `michi` & `chimi` มีอักษรชุดเดียวกัน `{c,h,i,i,m}` (ผ่าน anagram check) และทั้งคู่มี `chi` (ผ่าน hasChi) → ล็อกอินผ่านจริง เป็นเฉลยเต็มสำหรับคนเพียรถึง 10 ถ้วย

---

## ดีไซน์เชิงเทคนิค

### 1. ข้อมูล / state
- **ค่าคงที่ใหม่** (หัว `<script>` เดียวกับที่มีอยู่):
  ```ts
  const CLUES = [ /* 5 ข้อความชั้น 1–5 */ ];
  const CLUE_RECAP = '...';               // ชั้น 6
  const CLUE_BONUS = '...';               // ชั้น 10 (worked example)
  const CLUE_BONUS_AT = 10;               // ถ้วยที่ปลด bonus
  const PROGRESS_MAX = 10;                // แคปตัวนับ (ไม่ต้องนับเกินนี้)
  const CLUE_STORAGE_KEY = 'starfieldProgress';
  const WHISPER_MS = 7000;                // คำใบ้ยาว → อยู่นานกว่า toast ปกติ
  ```
- **state**: `progress: loadProgress()` (int 0..10 จาก localStorage, default 0)
- `loadProgress()/saveProgress(n)` แบบ try/catch (กัน privacy mode) — pattern เดียวกับ SecretConsole penalty
- **แยกจาก `game.total` เด็ดขาด**: total = คะแนน session (in-memory, vanity), progress = รอบสะสมถาวร (persist, ขับคำใบ้+bonus+codex) — คนละอายุ คนละหน้าที่

### 2. trigger (ใน `catchGoldStar` ตอนจบรอบ)
- หลัง `game.total++` → เรียก `maybeRevealClue(state)`:
  ```
  if (progress < PROGRESS_MAX): progress++; saveProgress()
  // whisper เฉพาะชั้นที่มีเนื้อหา:
  if (progress <= CLUES.length):        showWhisper(CLUES[progress-1])   // 1–5
  else if (progress === CLUES.length+1): showWhisper(CLUE_RECAP)          // 6 (ครั้งเดียว)
  else if (progress === CLUE_BONUS_AT):  showWhisper(CLUE_BONUS)          // 10
  // 7–9: นับเงียบ ไม่ whisper (toast รอบปกติของ Phase 1 ยังเด้งอยู่)
  ```
- **สำคัญ**: reveal ผูกกับ `progress` (persist) ไม่ใช่ `game.total` (in-memory) → refresh แล้ว total=0 แต่จบรอบใหม่ได้ชั้น **ถัดไป** ไม่วนกลับชั้น 1 (และนับสะสมข้าม session จนถึง bonus ที่ถ้วย 10 ได้จริง)

### 3. UI ใหม่ (markup ใน template — ห้ามสร้างด้วย JS ตาม gotcha scoped-style)
- **whisper toast**: element ใหม่ (เช่นกลางล่างจอ / สไตล์ม้วนคัมภีร์) `pointer-events: none`, อยู่ ~`WHISPER_MS` แล้วจาง, reduced-motion = โผล่ทันที
- **แผง codex** (overlay อ่านย้อน): เปิดด้วยการ**คลิกถ้วยใน HUD** → ต้องเปลี่ยนถ้วยเป็น `<button pointer-events:auto>`; แผงลิสต์คำใบ้ที่ปลดแล้ว (ชั้น 1..min(progress,5), + recap ถ้า `progress≥6`, + bonus ถ้า `progress≥10`); ปิดด้วย Esc/คลิกนอก
- **HUD entry point ต้องโผล่ตาม `progress` ด้วย**: ปัจจุบัน HUD ซ่อนเมื่อ session 0/0 — ถ้า refresh แล้ว total=0 แต่ `progress≥1` ถ้วยต้อง**ยังโผล่ให้คลิกเปิด codex ได้** → แก้เงื่อนไข visibility เป็น `... || progress >= 1`

### 4. integration / gotchas (จาก CLAUDE.md)
- **exclusion list ของ pointerdown**: เพิ่ม class แผง codex เข้าไปใน `closest('.profile, .secret-console-overlay', ...)` ไม่งั้นคลิกในแผงจะไปเริ่มหลุมดำ + วาง caret ไม่ได้ (ถ้ามี input — แต่แผงนี้อ่านอย่างเดียว ยังควรกันหลุมดำ)
- **user-select**: แผงมีข้อความ → ถ้าต้องการให้ select ได้ ตั้ง `user-select: text` (override profile.css body-wide)
- **astro:page-load**: ปุ่มถ้วย/แผงถูกสร้างใหม่ทุก navigation → attach listener ใน lifecycle, กัน listener ซ้ำ
- **reduced-motion**: เกมปิดอยู่แล้ว → เก็บคำใบ้ไม่ได้ในโหมดนี้ (สอดคล้อง Phase 1, ยอมรับได้สำหรับ easter egg)

### 5. (stretch) ผู้พิทักษ์รับรู้การล่าดาว — ✅ ทำแล้ว
- ย้าย `loadProgress/saveProgress/PROGRESS_MAX/CLUE_STORAGE_KEY` ไป `src/lib/starClues.ts` (แบบ `divineLoreToken.ts`); ทั้ง StarfieldBackground และ SecretConsole import จากที่นี่
- ตอน `ACCESS GRANTED` ถ้า `loadProgress() > 0` → เพิ่มบรรทัด "ผู้พิทักษ์: เจ้าตามแสงดาวมาสินะ… สมแล้วที่ไขได้" และยืดดีเลย์ redirect เป็น 1800ms ให้อ่านทัน (verify ผ่าน MutationObserver→console แล้ว)

---

## แผนทดสอบ (deterministic — ขับ sim ผ่าน `canvas.__starfield`)
1. จบ 1 รอบ → `progress` 0→1, localStorage เขียน, whisper โชว์คำใบ้ 1
2. จบถึงรอบ 5 → `progress=5`, คำใบ้ 5 โชว์; รอบ 6 → whisper recap; รอบ 7–9 → **ไม่มี whisper ใหม่** (แต่ `progress` ยังนับขึ้น)
3. **bonus**: `progress=9` → จบอีก 1 รอบ → `progress=10`, whisper = CLUE_BONUS; รอบต่อไป → `progress` แคปที่ 10 ไม่มี whisper ใหม่
4. **worked example ใช้ได้จริง**: ป้อน `michi`/`chimi` เข้า SecretConsole → `ACCESS GRANTED` (ยืนยันว่าเฉลยชั้น 10 ถูก)
5. **จำลอง refresh**: ตั้ง localStorage `progress=3` → reload → total=0 แต่ถ้วย/แผงโผล่, แผงมี 3 ชิ้น; จบรอบ → เผยคำใบ้ **4** (ไม่ใช่ 1)
6. เปิด/ปิดแผง: คลิกถ้วย → เปิด, Esc/คลิกนอก → ปิด, คลิกในแผง → **หลุมดำไม่ทำงาน**
7. anti-hack: แก้ `starfieldProgress` ใน localStorage = สปอยตัวเองเท่านั้น; `/divine-lore/` ยังตรวจ token → ไม่ bypass
8. reduced motion: whisper โผล่ทันที (ถ้าเข้าถึงได้), เกมปิด

---

## ไฟล์ที่จะแตะ (Phase 2)
- `src/components/StarfieldBackground.astro` — CLUES + reveal logic + whisper + แผง codex + แก้ HUD visibility + exclusion list
- (stretch) `src/lib/starClues.ts` + `src/components/SecretConsole.astro` — ถ้าทำข้อ 5
- `CLAUDE.md` — โน้ตระบบคำใบ้ + การตัดสินใจ D1 (persist เฉพาะ cluesUnlocked)

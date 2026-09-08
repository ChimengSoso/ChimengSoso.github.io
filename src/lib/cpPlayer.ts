/* ตัวคุมเครื่องเดินทีละขั้น ที่หน้าโจทย์ใน /cp/ ใช้ร่วมกัน
 *
 * แต่ละหน้ามีกระดานของตัวเองซึ่งเลียนกันไม่ได้ ไฟล์นี้จึงไม่พยายามวาดกระดาน
 * มันดูแลเฉพาะส่วนที่เหมือนกันทุกหน้า คือปุ่มควบคุม แถบเลื่อน ตัวนับขั้น
 * การเล่นอัตโนมัติ ปุ่มที่ต้องถูกปิดตอนอยู่ปลายทาง และการเลื่อนช่องที่ทำงานให้เห็น
 * ส่วนการวาดกระดานเป็นของแต่ละหน้าเอง ส่งเข้ามาทาง draw
 *
 * เหตุผลที่แยกออกมาเป็นไฟล์ ไม่ใช่ก็อปวางในทุกหน้า คือโค้ดชุดนี้เคยถูกคัดลอกไว้
 * ห้าหน้าแล้ว และทุกครั้งที่แก้พฤติกรรมหนึ่งอย่าง (เช่นหยุดเล่นตอนออกจากหน้า)
 * ต้องไปแก้ทุกที่ ซึ่งเป็นวิธีที่ทำให้หน้าต่าง ๆ เพี้ยนกันทีละนิดจนไม่เหมือนเว็บเดียวกัน
 */

/** ส่วนของกล่องที่ตัวคุมรู้จัก ส่งให้ draw ใช้ต่อได้ */
export interface CpPlayerParts {
  root: HTMLElement;
  /** แผงคำอธิบายใต้กระดาน รับ HTML ได้ เพราะสเต็ปสร้างตอนบิลด์ ไม่ได้มาจากผู้ใช้ */
  say: HTMLElement;
  /** กล่องที่เลื่อนแนวนอนได้ ใช้กับ keepInView */
  scroll: HTMLElement | null;
}

export interface CpDrawContext {
  at: number;
  total: number;
  parts: CpPlayerParts;
  /** เลื่อนกล่องให้ช่องที่กำลังทำงานอยู่ในสายตา โดยไม่ลาก scroll ของหน้า */
  keepInView: (el: Element | null) => void;
}

export interface CpPlayerOptions<T> {
  /** แคบชนิดของค่าที่อ่านมาจาก data-steps ให้เป็น T[] คืน null เมื่อข้อมูลไม่ครบ
   *  รับเป็น unknown[] เพื่อไม่ต้องใช้ any ที่ไหนเลย */
  narrow: (raw: unknown[]) => T[] | null;
  /** วาดกระดานของขั้นที่ระบุ ตัวคุมจัดการ say/แถบเลื่อน/ตัวนับให้แล้ว */
  draw: (step: T, ctx: CpDrawContext) => void;
  /** ระยะห่างระหว่างขั้นตอนเล่นอัตโนมัติ หน่วยมิลลิวินาที */
  playMs?: number;
  /** ชื่อฟิลด์ใน T ที่เก็บคำอธิบายเป็น HTML ถ้ามี ตัวคุมจะเติมให้เอง */
  sayFrom?: (step: T) => string | undefined;
}

const DEFAULT_PLAY_MS = 900;

/** อ่าน data-steps แล้วคืนอาร์เรย์ดิบ ยังไม่แคบชนิด */
function readSteps(root: HTMLElement): unknown[] {
  const raw: unknown = JSON.parse(root.dataset.steps ?? '[]');
  return Array.isArray(raw) ? raw : [];
}

/** เลื่อนเฉพาะกล่อง ไม่ใช้ scrollIntoView เพราะมันลากหน้าตามแนวตั้งไปด้วย
 *  และไม่ใช้ behavior smooth เพราะการกดทีละขั้นเป็นการกระโดดอยู่แล้ว
 *  ถ้าใช้ smooth แล้วผู้อ่านกดเร็ว ๆ หรือกดเล่น คิวจะซ้อนกันจนเลื่อนเลยเป้า */
function makeKeepInView(scroll: HTMLElement | null): (el: Element | null) => void {
  return (el: Element | null): void => {
    if (!scroll || !el) return;
    const box = scroll.getBoundingClientRect();
    const target = el.getBoundingClientRect();
    const pad = 24;
    if (target.left < box.left + pad) {
      scroll.scrollLeft -= box.left + pad - target.left;
    } else if (target.right > box.right - pad) {
      scroll.scrollLeft += target.right - (box.right - pad);
    }
  };
}

function wireOne<T>(root: HTMLElement, opts: CpPlayerOptions<T>): void {
  if (root.dataset.wired === '1') return;
  root.dataset.wired = '1';

  const steps = opts.narrow(readSteps(root));
  if (steps === null || steps.length === 0) return;

  const say = root.querySelector<HTMLElement>('.dps-say');
  const range = root.querySelector<HTMLInputElement>('.dps-range');
  const count = root.querySelector<HTMLElement>('.dps-count');
  const playBtn = root.querySelector<HTMLButtonElement>('.dps-play');
  const scroll = root.querySelector<HTMLElement>('.dps-scroll');
  const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('.dps-b'));
  if (!say || !range || !count || !playBtn) return;

  const parts: CpPlayerParts = { root, say, scroll };
  const keepInView = makeKeepInView(scroll);
  const playMs = opts.playMs ?? DEFAULT_PLAY_MS;

  range.max = String(steps.length - 1);
  let at = 0;
  let timer: number | null = null;

  const render = (): void => {
    const step = steps[at];
    const text = opts.sayFrom ? opts.sayFrom(step) : undefined;
    if (text !== undefined) say.innerHTML = text;
    opts.draw(step, { at, total: steps.length, parts, keepInView });
    range.value = String(at);
    count.textContent = `ขั้น ${at + 1} / ${steps.length}`;
    for (const b of btns) {
      const act = b.dataset.act;
      if (act === 'prev' || act === 'first') b.disabled = at === 0;
      if (act === 'next' || act === 'last') b.disabled = at === steps.length - 1;
    }
  };

  const stop = (): void => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    playBtn.textContent = 'เล่น';
  };

  const go = (to: number): void => {
    at = Math.max(0, Math.min(steps.length - 1, to));
    if (at === steps.length - 1) stop();
    render();
  };

  for (const b of btns) {
    b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'play') {
        if (timer !== null) {
          stop();
          return;
        }
        if (at === steps.length - 1) at = 0;
        playBtn.textContent = 'หยุด';
        timer = window.setInterval(() => go(at + 1), playMs);
        go(at + 1);
        return;
      }
      stop();
      if (act === 'first') go(0);
      else if (act === 'prev') go(at - 1);
      else if (act === 'next') go(at + 1);
      else if (act === 'last') go(steps.length - 1);
    });
  }

  range.addEventListener('input', () => {
    stop();
    go(Number(range.value));
  });

  root.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      stop();
      go(at + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      stop();
      go(at - 1);
      e.preventDefault();
    }
  });

  /* ออกจากหน้าแล้วต้องหยุดนับ ไม่งั้นตัวจับเวลายังวิ่งอยู่บนหน้าถัดไป */
  document.addEventListener('astro:before-swap', stop, { once: true });
  render();
}

/** ผูกทุกกล่องที่ตรงกับ selector ต้องเรียกภายใน astro:page-load
 *  เพราะ ClientRouter สลับ DOM แล้วโค้ดระดับบนสุดจะไม่ทำงานอีก */
export function initCpPlayers<T>(selector: string, opts: CpPlayerOptions<T>): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((root) => wireOne(root, opts));
}

/* ---------------------------------------------------------------------------
 * เครื่องเดินแบบแถว
 *
 * หน้าที่เดินตารางส่วนใหญ่มีรูปเดียวกันหมด คือหนึ่งแถวคือหนึ่งก้าวของอัลกอริทึม
 * เดิมทุกหน้าพิมพ์ตารางออกมาทั้งใบพร้อมกัน ผู้อ่านจึงเห็นคำตอบของก้าวที่ยังไม่ได้คิด
 * และไม่มีอะไรบอกว่าตอนนี้กำลังดูแถวไหน
 *
 * ตัวช่วยนี้ทำให้ตารางเดิมกลายเป็นตารางที่ทยอยเผยทีละแถว แถวที่กำลังดูถูกเน้น
 * และมีคำอธิบายของแถวนั้นอยู่ใต้กระดาน โดยหน้าที่เรียกไม่ต้องเขียนตัวคุมเอง
 * ------------------------------------------------------------------------- */

/** ก้าวของเครื่องเดินแบบแถว มีแค่คำอธิบาย ส่วนข้อมูลอยู่ในแถวของตารางแล้ว */
export interface CpRowStep {
  note: string;
}

function isRowStep(x: unknown): x is CpRowStep {
  return typeof x === 'object' && x !== null && typeof (x as Record<string, unknown>).note === 'string';
}

/** ผูกเครื่องเดินแบบแถวให้ทุกกล่องที่ตรงกับ selector
 *  จำนวนก้าวต้องเท่ากับจำนวนแถวใน tbody ไม่งั้นไม่ผูกให้ เพื่อไม่ให้เล่าไม่ตรงกับที่เห็น */
export function initCpRowPlayers(selector: string): void {
  initCpPlayers<CpRowStep>(selector, {
    narrow: (raw) => {
      const ok = raw.filter(isRowStep);
      return ok.length === raw.length ? ok : null;
    },
    sayFrom: (st) => st.note,
    draw: (_st, ctx) => {
      const rows = Array.from(ctx.parts.root.querySelectorAll<HTMLTableRowElement>('tbody tr'));
      rows.forEach((tr, i) => {
        tr.classList.toggle('is-later', i > ctx.at);
        tr.classList.toggle('is-now', i === ctx.at);
      });
      const now = rows[ctx.at];
      if (now) ctx.keepInView(now.cells[0] ?? now);
    },
  });
}

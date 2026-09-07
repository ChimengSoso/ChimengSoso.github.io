/* โครงที่มินิเกมของ /cp/ ใช้ร่วมกัน
 *
 * แต่ละข้อมีกลไกของตัวเองซึ่งเลียนแบบกันไม่ได้ ตัวไฟล์นี้จึงไม่พยายามเป็นเอนจินกลาง
 * มันดูแลเฉพาะส่วนที่เหมือนกันจริง ๆ ทุกเกม คือแถบเลือกชุดโจทย์ ข้อความสถานะ และแถวคะแนน
 * ส่วนกระดานกับกติกาเป็นของแต่ละหน้าเอง
 *
 * เหตุผลที่แยกออกมาเป็นไฟล์ ไม่ใช่ก็อปวางในทุกหน้า คือข้อความสถานะกับคลาสของโทนสี
 * ต้องเหมือนกันทั้งคลัง ถ้าปล่อยให้แต่ละหน้าเขียนเอง มันจะเพี้ยนกันทีละนิดจนอ่านเป็นคนละเว็บ
 */

export type CpTone = 'good' | 'bad' | 'plain';

export type CpGameUi = {
  root: HTMLElement;
  setStatus: (text: string, tone?: CpTone) => void;
  setScore: (text: string) => void;
  setTease: (text: string) => void;
  onTab: (cb: (index: number) => void) => void;
  selectTab: (index: number) => void;
  onClick: (attr: string, cb: () => void) => void;
};

/** อ่านข้อมูลชุดโจทย์ที่ฝังมาจาก frontmatter ผ่าน data attribute
 *  คืนค่าเป็น unknown[] ให้ผู้เรียกไปแคบชนิดเอง เพื่อไม่ต้องใช้ any */
export function readPuzzles(root: HTMLElement, attr = 'puzzles'): unknown[] {
  const raw: unknown = JSON.parse(root.dataset[attr] ?? '[]');
  return Array.isArray(raw) ? raw : [];
}

/** ผูกส่วนที่ทุกเกมมีเหมือนกัน คืน null เมื่อ DOM ไม่ครบ หรือเคยผูกไปแล้ว */
export function cpGameUi(selector: string): CpGameUi | null {
  const root = document.querySelector<HTMLElement>(selector);
  if (!root || root.dataset.wired === '1') return null;
  root.dataset.wired = '1';

  const statusEl = root.querySelector<HTMLElement>('[data-cpg-status]');
  const scoreEl = root.querySelector<HTMLElement>('[data-cpg-score]');
  const teaseEl = root.querySelector<HTMLElement>('[data-cpg-tease]');
  if (!statusEl || !scoreEl || !teaseEl) return null;

  const status: HTMLElement = statusEl;
  const score: HTMLElement = scoreEl;
  const tease: HTMLElement = teaseEl;
  const host: HTMLElement = root;

  const tabs = Array.from(host.querySelectorAll<HTMLElement>('[data-cpg-tab]'));

  return {
    root: host,
    setStatus(text: string, tone: CpTone = 'plain'): void {
      status.textContent = text;
      status.className = tone === 'plain' ? 'cpg-status' : `cpg-status ${tone}`;
    },
    setScore(text: string): void {
      score.textContent = text;
    },
    setTease(text: string): void {
      tease.textContent = text;
    },
    onTab(cb: (index: number) => void): void {
      tabs.forEach((t, i) => t.addEventListener('click', () => cb(i)));
    },
    selectTab(index: number): void {
      tabs.forEach((t, i) => t.setAttribute('aria-selected', i === index ? 'true' : 'false'));
    },
    onClick(attr: string, cb: () => void): void {
      host.querySelector<HTMLElement>(`[${attr}]`)?.addEventListener('click', cb);
    },
  };
}

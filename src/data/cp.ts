// หมวด competitive programming: เข้าได้ทางเดียวคือผ่านหน้า /divine-lore/
// (เหมือน /games/) จึงไม่มีลิงก์จากหน้าไหนในเว็บสาธารณะ และถูกกันออกจาก sitemap

/** ชุดโจทย์ (คอนเทสต์/คอร์ส/แหล่งที่มา) ใช้จัดกลุ่มการ์ดบนหน้า /cp/ */
export interface CpSet {
  /** id สั้น ๆ ใช้อ้างจาก CpProblem.setId */
  id: string;
  /** ชื่อกลุ่มที่โชว์เป็นหัวข้อบนหน้าลิสต์ */
  title: string;
  /** ที่มาของชุดโจทย์ เช่น 'ICPC Thailand 2026 รอบย่อย' */
  source?: string;
  /** อธิบายกลุ่มสั้น ๆ ใต้หัวข้อ */
  desc?: string;
}

/** ระดับความยากที่ผมให้เอง 1 = อุ่นเครื่อง, 5 = ต้องนั่งคิดข้ามวัน */
export type CpDifficulty = 1 | 2 | 3 | 4 | 5;

export interface CpProblem {
  /** path แบบไดเรกทอรีเทียบกับ /cp/ (เช่น 'icpc-2026-needle/') */
  href: string;
  /** ชุดที่โจทย์ข้อนี้สังกัด (ต้องตรงกับ CpSet.id) */
  setId: string;
  /** ป้ายข้อในชุด เช่น 'A' หรือ '1001' (ไม่มีก็ได้) */
  label?: string;
  title: string;
  /** หนึ่งบรรทัดว่าโจทย์ถามอะไร โชว์บนการ์ด */
  desc: string;
  /** หัวข้ออัลกอริทึม เช่น ['greedy', 'binary search'] โชว์เป็นชิป */
  topics: string[];
  difficulty: CpDifficulty;
  /**
   * 'problem' (ค่าเริ่มต้น) = โจทย์หนึ่งข้อพร้อมเฉลย
   * 'lesson' = บทปูพื้นฐาน อธิบายเทคนิคแล้วค่อยมีโจทย์ฝึกอยู่ข้างใน
   */
  kind?: 'problem' | 'lesson';
  /** วันที่เขียนเฉลย (YYYY-MM-DD) */
  dateISO: string;
  readingMinutes: number;
  /** การ์ดตัวอย่างของข้อที่ยังไม่ได้เขียน */
  soon?: boolean;
}

export const cpSets: CpSet[] = [
  {
    id: 'basics',
    title: 'ปูพื้นฐาน',
    desc: 'บทที่ไม่ใช่โจทย์แข่ง แต่เป็นเทคนิคที่โจทย์ในคลังนี้เรียกใช้ อ่านก่อนแล้วข้อที่เหลือจะง่ายขึ้น',
  },
  {
    id: 'programming-in-th',
    title: 'programming.in.th',
    source: 'programming.in.th',
    desc: 'โจทย์ฝึกจากคลังโจทย์ภาษาไทย ไล่แกะทีละข้อ',
  },
];

export const cpProblems: CpProblem[] = [
  {
    href: 'interval-dp/',
    setId: 'basics',
    kind: 'lesson',
    title: 'DP บนช่วง ฉบับปูพื้น: เมื่อลบของออกแล้วช่องปิด',
    desc: 'ทำไม dp[i] ที่ใช้ได้ทุกข้อถึงพังทันทีที่โจทย์บอกว่า "ลบแล้วช่องปิด" แล้วไล่สร้างตารางแบบใหม่ขึ้นมาเอง เดินตารางทีละช่องจนจบ พร้อมโจทย์ฝึก 3 ข้อที่ไล่ระดับกัน',
    topics: ['dp', 'interval dp', 'พื้นฐาน'],
    difficulty: 2,
    dateISO: '2026-08-27',
    readingMinutes: 12,
  },
  {
    href: 'pick-books/',
    setId: 'programming-in-th',
    title: 'หยิบหนังสือ: กองที่ปิดช่องตัวเองทุกครั้งที่หยิบ',
    desc: 'หยิบหนังสือทีละ 3 เล่มที่ติดกัน ได้แต้ม สองเล่มบนบวก เล่มล่างลบ กองปิดช่องทุกครั้งจนเล่มคนละมุมมาชนกันได้ เฉลยด้วยการเปลี่ยนคำถามจาก "หยิบตรงไหน" เป็น "ใครได้บวก ใครได้ลบ"',
    topics: ['dp', 'stack'],
    difficulty: 3,
    dateISO: '2026-08-26',
    readingMinutes: 7,
  },
];

export const publishedCpProblems = cpProblems.filter((p) => !p.soon);

export function getCpProblem(href: string): CpProblem | undefined {
  return cpProblems.find((p) => p.href === href);
}

export function getCpSet(id: string): CpSet | undefined {
  return cpSets.find((s) => s.id === id);
}

/** โจทย์ที่เผยแพร่แล้ว จัดกลุ่มตามลำดับของ cpSets (ชุดที่ยังไม่มีข้อ จะไม่ถูกคืนมา) */
export function cpProblemsBySet(): { set: CpSet; problems: CpProblem[] }[] {
  return cpSets
    .map((set) => ({ set, problems: publishedCpProblems.filter((p) => p.setId === set.id) }))
    .filter((g) => g.problems.length > 0);
}

/** ก่อนหน้า/ถัดไป ตามลำดับใน cpProblems (ข้ามข้อที่ยัง soon) */
export function getAdjacentCpProblems(href: string): {
  prev?: CpProblem;
  next?: CpProblem;
} {
  const i = publishedCpProblems.findIndex((p) => p.href === href);
  if (i === -1) return {};
  return { prev: publishedCpProblems[i - 1], next: publishedCpProblems[i + 1] };
}

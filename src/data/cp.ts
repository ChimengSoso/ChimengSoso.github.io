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

/**
 * คลังหัวข้อที่อนุญาต เป็นรายการปิด ไม่ใช่สตริงอิสระ
 *
 * เหตุผล: หัวข้อกลายเป็นชิปตัวกรองบนหน้า /cp/ แล้ว ถ้าปล่อยให้พิมพ์อะไรก็ได้
 * วันหนึ่งจะมีทั้ง 'bfs' และ 'BFS' หรือ 'prefix sum' และ 'prefix-sum' อยู่ในคลังพร้อมกัน
 * กลายเป็นชิปคนละอันที่กรองได้คนละครึ่ง โดยไม่มีอะไรเตือนเลย
 * พอประกาศเป็น union แบบนี้ การพิมพ์ผิดจะกลายเป็น error ตอน npm run check ทันที
 *
 * จะเพิ่มหัวข้อใหม่ก็เพิ่มบรรทัดในนี้ ซึ่งเป็นการตัดสินใจที่ตั้งใจทำ ไม่ใช่หลุดมือ
 * เรียงตามกลุ่มเพื่อให้หาง่าย ลำดับในนี้ไม่มีผลกับหน้าเว็บ (ชิปเรียงตามความถี่ที่ใช้จริง)
 */
export const CP_TOPICS = [
  // เทคนิคหลัก
  'dp',
  'interval dp',
  'state compression',
  'greedy',
  'constructive',
  'simulation',
  'invariant',
  'ad hoc',
  // โครงสร้างข้อมูล
  'stack',
  'BIT',
  'prefix sum',
  'hashing',
  'string',
  // กราฟและต้นไม้
  'bfs',
  'dfs',
  'tree',
  'state space',
  'sweep line',
  // ป้ายกำกับอื่น
  'พื้นฐาน',
] as const;

export type CpTopic = (typeof CP_TOPICS)[number];

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
  /** หัวข้ออัลกอริทึม โชว์เป็นชิปบนการ์ดและเป็นตัวกรองบนหน้า /cp/ เลือกจาก CP_TOPICS เท่านั้น */
  topics: CpTopic[];
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
    desc: 'เครื่องมือที่โจทย์ในคลังนี้เรียกใช้ซ้ำ ๆ หยิบไปใช้ได้เลยโดยไม่ต้องอ่านข้อไหนก่อน และถ้าอ่านก่อน ข้อที่เหลือจะง่ายขึ้นทั้งชุด',
  },
  {
    id: 'programming-in-th',
    title: 'programming.in.th',
    source: 'programming.in.th',
    desc: 'โจทย์จริงจากคลังภาษาไทย หนึ่งข้อหนึ่งท่า เลือกอ่านตามท่าที่อยากได้ ไม่ต้องเรียงตามลำดับ',
  },
];

export const cpProblems: CpProblem[] = [
  {
    href: 'prefix-sums/',
    setId: 'basics',
    kind: 'lesson',
    title: 'ผลรวมสะสมกับต้นไม้เฟนวิก: ตอบคำถามช่วงได้ทันที แม้ข้อมูลจะถูกแก้ระหว่างทาง',
    desc: 'เครื่องมือที่โจทย์ "ถามผลรวมของช่วง" ทุกข้อเรียกใช้ บทนี้ให้กฎตัดสินว่าเมื่อไรผลรวมสะสมพอ เมื่อไรต้องยกต้นไม้มาใช้ และเมื่อไรที่แค่เรียงข้อมูลก็จบโดยไม่ต้องใช้ทั้งคู่ พร้อมโจทย์ฝึก 3 ข้อที่ไล่จากหนึ่งมิติไปสองมิติ',
    topics: ['prefix sum', 'BIT', 'พื้นฐาน'],
    difficulty: 1,
    dateISO: '2026-09-06',
    readingMinutes: 11,
  },
  {
    href: 'state-graph-bfs/',
    setId: 'basics',
    kind: 'lesson',
    title: 'กราฟที่โจทย์ไม่ได้ให้มา: แปลงคำว่า "อย่างน้อยกี่ท่า" เป็นโค้ดชุดเดิมทุกครั้ง',
    desc: 'เหยือกน้ำ ล็อกรหัส กระดานเลื่อนเบี้ย ใช้โค้ดชุดเดียวกันหมด ของที่ต้องเตรียมไปคือสามคำถามที่ต้องตอบให้ได้ก่อนพิมพ์โค้ดทุกครั้ง และสัญญาณที่บอกว่าเมื่อไรกราฟใหญ่เกินกว่าจะเดินตรง ๆ พร้อมโจทย์ฝึก 3 ข้อ',
    topics: ['bfs', 'state space', 'พื้นฐาน'],
    difficulty: 2,
    dateISO: '2026-09-06',
    readingMinutes: 11,
  },
  {
    href: 'tree-dp/',
    setId: 'basics',
    kind: 'lesson',
    title: 'DP บนต้นไม้: เขียนให้รอดต้นไม้ลึกแสนชั้น โดยไม่พึ่งสแต็กของระบบ',
    desc: 'ท่าที่ทุกคนเขียนคือฟังก์ชันเรียกตัวเอง ซึ่งตกรอบเงียบ ๆ เมื่อต้นไม้ลึกเป็นแสนชั้น ที่นี่เปลี่ยนไปใช้โครงสิบบรรทัดที่ลอกไปใช้ได้ทุกข้อ แล้วต่อด้วยคำถามที่ต้องตอบก่อนเขียนสูตรว่ากิ่งหนึ่งกิ่งต้องส่งค่าขึ้นมากี่ค่า พร้อมโจทย์ฝึก 3 ข้อ',
    topics: ['tree', 'dp', 'พื้นฐาน'],
    difficulty: 2,
    dateISO: '2026-09-06',
    readingMinutes: 10,
  },
  {
    href: 'string-hashing/',
    setId: 'basics',
    kind: 'lesson',
    title: 'แฮชสตริง: เทียบข้อความสองช่วงในเวลาคงที่ โดยรู้ตัวว่ากำลังแลกอะไรอยู่',
    desc: 'เครื่องมือที่ทำให้การเทียบสตริงเลิกแพงตามความยาว มาพร้อมสูตรตัดช่วง กับสามอย่างที่ทำให้โค้ดพังแบบไม่มีข้อความเตือน คือมอดุลัสที่เล็กไป ฐานที่ไม่ได้สุ่ม และช่วงกลับด้านที่คำนวณผิดตำแหน่ง พร้อมโจทย์ฝึก 3 ข้อ',
    topics: ['hashing', 'string', 'พื้นฐาน'],
    difficulty: 2,
    dateISO: '2026-09-06',
    readingMinutes: 11,
  },
  {
    href: 'interval-dp/',
    setId: 'basics',
    kind: 'lesson',
    title: 'DP บนช่วง: จุดที่ต้องเลิกถามว่าทำอะไรที่ตำแหน่งนี้ แล้วหันไปถามทั้งช่วง',
    desc: 'วิธีอ่านโจทย์ให้เจอสัญญาณว่า dp[i] ที่ใช้ได้มาตลอดกำลังจะพัง แล้วพาเปลี่ยน state จากจุดเป็นช่วง พร้อมเงื่อนไข "ตรงกลางต้องเกลี้ยง" ที่ทำให้ของคนละมุมมาเจอกันได้ พร้อมโจทย์ฝึก 3 ข้อที่ไล่ระดับกัน',
    topics: ['dp', 'interval dp', 'พื้นฐาน'],
    difficulty: 2,
    dateISO: '2026-08-27',
    readingMinutes: 12,
  },
  {
    href: 'rolling-state-dp/',
    setId: 'basics',
    kind: 'lesson',
    title: 'DP ที่สถานะคือความจำล่าสุด: เก็บอดีตให้น้อยที่สุดเท่าที่อนาคตยังต้องใช้',
    desc: 'ท่าที่ใช้ได้ทุกครั้งที่ผลของก้าวถัดไปขึ้นกับของไม่กี่ชิ้นล่าสุด บทนี้ให้ข้อสอบสองข้อที่ใช้ตัดสินว่าสิ่งที่จะจำนั้นเป็นสถานะที่ถูกต้องไหม แล้วจบด้วยการนับจำนวนสถานะ ซึ่งเป็นตัวชี้ขาดว่าท่านี้รอดหรือตาย พร้อมโจทย์ฝึก 3 ข้อ',
    topics: ['dp', 'state compression', 'พื้นฐาน'],
    difficulty: 2,
    dateISO: '2026-09-06',
    readingMinutes: 11,
  },
  {
    href: 'pick-books/',
    setId: 'programming-in-th',
    title: 'หยิบหนังสือ: เมื่อสูตรตอบไม่ได้ ให้เปลี่ยนคำถาม อย่าเปลี่ยนสูตร',
    desc: 'ท่าเปลี่ยนคำถามที่เห็นชัดที่สุดในคลังนี้ จาก "หยิบตรงไหน" เป็น "ใครได้บวก ใครได้ลบ" แล้วกองที่ดูพัวพันกันทั้งกองก็ยุบเป็นตารางที่เดินหน้าเดียวจบ ต่อยอดจากบท DP บนช่วง และเป็นทางเข้าของท่าอัดสถานะ',
    topics: ['dp', 'stack'],
    difficulty: 3,
    dateISO: '2026-08-26',
    readingMinutes: 7,
  },
  {
    href: 'miners/',
    setId: 'programming-in-th',
    label: '2003',
    title: 'Miners: วิธีหาว่าอดีตส่วนไหนทิ้งได้ จนแสนชิ้นเหลือ 256 สถานะ',
    desc: 'ท่าที่ฝึกคือการอัดสถานะ ซึ่งใช้ได้ทุกครั้งที่โจทย์มีคำว่า "สามชิ้นล่าสุด" หรือหน้าต่างที่เลื่อนไปเรื่อย ๆ ทุกอย่างเริ่มจากคำถามว่าอดีตส่วนไหนยังมีผลกับก้าวถัดไปจริง ๆ และวิธีนับว่ามันมีได้กี่แบบ พร้อมกองห้าชิ้นที่หักวิธีโลภ',
    topics: ['dp', 'state compression'],
    difficulty: 3,
    dateISO: '2026-09-05',
    readingMinutes: 9,
  },
  {
    href: 'fifteen-puzzle/',
    setId: 'programming-in-th',
    label: '2026',
    title: 'ปริศนา 15: บทเรียนเรื่องการอ่านโจทย์ให้เจอว่ามันขอน้อยกว่าที่คิด',
    desc: 'คำว่าดีที่สุดซึ่งเราเติมเข้าไปเองคือกับดัก กระดานมีหน้าตาได้สิบล้านล้านแบบ แต่โจทย์ขอแค่ต่ำกว่า 5,000 ตา ท่าที่ได้กลับไปคือการล็อกของที่เข้าที่แล้ว เพื่อหั่นการค้นก้อนเดียวเป็นเจ็ดก้อนที่ก้อนใหญ่สุดมี 40,320 สถานะ',
    topics: ['bfs', 'constructive'],
    difficulty: 3,
    dateISO: '2026-09-06',
    readingMinutes: 10,
  },
  {
    href: 'hearing-pairs/',
    setId: 'programming-in-th',
    label: '2004',
    title: 'คู่ที่ได้ยินกัน: หมุนพิกัดเพื่อแยกเงื่อนไขสองแกนที่พัวพันกันออกจากกัน',
    desc: 'ข้อที่ยกของจากบทผลรวมสะสมกับต้นไม้เฟนวิกมาใช้จริงทั้งชุด แกนของมันคือเอกลักษณ์บรรทัดเดียวที่ทำให้เงื่อนไขซึ่งผูกสองแกนไว้ด้วยกัน กลายเป็นเงื่อนไขที่ตรวจแยกกันได้ กับบทเรียนว่าทำไมท่าเดียวกันนี้ถึงช่วยอะไรไม่ได้เลยบนกระดานสามมิติ',
    topics: ['sweep line', 'BIT', 'prefix sum'],
    difficulty: 4,
    dateISO: '2026-09-06',
    readingMinutes: 11,
  },
  {
    href: 'killer-square/',
    setId: 'programming-in-th',
    label: '2006',
    title: 'สี่เหลี่ยมพิฆาต: หาโครงสร้างซ้ำในเงื่อนไข แล้วต้นทุนยุบสองพันเท่า',
    desc: 'สองท่าที่หยิบไปใช้ต่อได้ตลอด คือการมองหาว่าเงื่อนไขก้อนใหญ่มีตัวมันเองซ่อนอยู่ข้างในไหม และการเอาแฮชสตริงมาทำให้การตรวจหนึ่งชั้นเหลือเวลาคงที่ ผลคือ 82,358,940,040 ครั้งยุบเหลือ 35,820,200 ครั้ง',
    topics: ['hashing', 'dp', 'string'],
    difficulty: 3,
    dateISO: '2026-09-06',
    readingMinutes: 8,
  },
  {
    href: 'mobiles/',
    setId: 'programming-in-th',
    label: '2000',
    title: 'โมบาย: ยุบกิ่งทั้งกิ่งให้เหลือป้ายสามแบบ จนไม่เหลือทางให้ตัดสินใจผิด',
    desc: 'DP บนต้นไม้แบบที่ค่าซึ่งส่งขึ้นไปหาพ่อไม่ใช่ตัวเลข แต่เป็นป้ายบอกทรงของกิ่ง ท่าที่ได้กลับไปคือการมองหาสิ่งที่การกระทำในโจทย์เปลี่ยนไม่ได้ ซึ่งตัดหน้าตาที่เป็นไปได้สองยกกำลังแสนแบบทิ้งในประโยคเดียว',
    topics: ['tree', 'dfs', 'greedy'],
    difficulty: 3,
    dateISO: '2026-09-06',
    readingMinutes: 9,
  },
  {
    href: 'archery/',
    setId: 'programming-in-th',
    label: '2032',
    title: 'ยิงธนู: ทิ้งข้อมูลที่ไม่มีผล แล้วใช้คาบตัดพันล้านรอบให้เหลือหลักพัน',
    desc: 'ข้อที่หนักที่สุดในคลังนี้ ใช้ฝึกสองท่าที่ไม่ค่อยมีใครสอน คือการตัดข้อมูลที่ไม่มีผลกับคำตอบทิ้งจนโลกทั้งใบเหลือ 0 กับ 1 และการอ่านข้อจำกัดที่ดูเกินจำเป็นของโจทย์ให้ออกว่ามันกำลังใบ้เรื่องคาบอยู่',
    topics: ['simulation', 'invariant', 'ad hoc'],
    difficulty: 5,
    dateISO: '2026-09-06',
    readingMinutes: 11,
  },
];

/**
 * ด่านตรวจที่รันตอน build
 *
 * ไฟล์นี้ถูก import โดยหน้า /cp/ ทุกหน้า โค้ดตรงนี้จึงทำงานทุกครั้งที่ astro build
 * ของที่ผิดกติกาจะทำให้ build ล้มพร้อมข้อความบอกตรง ๆ แทนที่จะเงียบแล้วไปโผล่เป็น
 * ลิงก์ตาย ชิปตัวกรองที่ซ้ำซ้อน หรือการ์ดที่หายไปจากหน้าคลังโดยไม่มีใครรู้
 *
 * เช็กเฉพาะเรื่องที่ระบบชนิดข้อมูลตรวจให้ไม่ได้ ส่วนที่ตรวจได้แล้ว (ระดับ 1 ถึง 5,
 * ชื่อหัวข้อที่ต้องอยู่ใน CP_TOPICS) ปล่อยให้ npm run check จัดการ
 */
function assertCpData(): void {
  const setIds = new Set(cpSets.map((s) => s.id));
  const seen = new Set<string>();

  for (const p of cpProblems) {
    const at = `cp.ts: โจทย์ "${p.title || p.href}"`;

    // href ต้องเป็นแบบไดเรกทอรี เพราะ build.format ของโปรเจกต์นี้เป็น "directory"
    if (!/^[a-z0-9]+(-[a-z0-9]+)*\/$/.test(p.href))
      throw new Error(`${at}: href "${p.href}" ต้องเป็นตัวพิมพ์เล็กคั่นด้วยขีด และลงท้ายด้วย / เช่น "pick-books/"`);
    if (seen.has(p.href)) throw new Error(`${at}: href "${p.href}" ซ้ำกับข้ออื่น`);
    seen.add(p.href);

    // setId ที่ไม่มีจริง ทำให้การ์ดหายไปจากหน้าคลังแบบเงียบ ๆ เพราะ cpProblemsBySet กรองตามชุด
    if (!setIds.has(p.setId))
      throw new Error(`${at}: setId "${p.setId}" ไม่มีใน cpSets (มีอยู่: ${[...setIds].join(', ')})`);

    if (!p.title.trim()) throw new Error(`${at}: title ว่าง`);
    if (!p.desc.trim()) throw new Error(`${at}: desc ว่าง`);

    if (p.topics.length === 0) throw new Error(`${at}: ต้องมีหัวข้ออย่างน้อยหนึ่งอัน`);
    if (new Set(p.topics).size !== p.topics.length)
      throw new Error(`${at}: หัวข้อซ้ำกันเองใน ${JSON.stringify(p.topics)}`);

    if (p.soon) continue; // การ์ด "เร็วๆ นี้" ยังไม่ต้องมีวันที่กับเวลาอ่าน

    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dateISO) || Number.isNaN(Date.parse(p.dateISO)))
      throw new Error(`${at}: dateISO "${p.dateISO}" ต้องเป็นวันที่จริงในรูป YYYY-MM-DD`);
    if (!Number.isInteger(p.readingMinutes) || p.readingMinutes <= 0)
      throw new Error(`${at}: readingMinutes ต้องเป็นจำนวนเต็มบวก`);
  }
}
assertCpData();

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

/**
 * The law, as a table.
 *
 * Sources, all checked on 2026-08-22:
 *   - กรมสรรพากร, "ผู้มีเงินได้มีสิทธิหักลดหย่อนอะไรได้บ้าง?" https://www.rd.go.th/557.html
 *   - PwC Worldwide Tax Summaries, Thailand — Individual Deductions
 *
 * Deliberately NOT in here: the Finance Ministry's proposed rebuild of the
 * retirement deductions (a single 800,000 ceiling, a 1.3x/0.7x multiplier by
 * income band, and the new TISA account). As of February 2026 it was still
 * under review with no royal decree, so the game keeps quoting the law that is
 * actually in force. When the decree lands it becomes another entry in
 * RULES_BY_YEAR rather than an edit to any of this.
 */
import type { Bracket, PotDef, SlotDef, TaxYearRules } from './types';

/**
 * The progressive ladder. Only the slice of income inside each step pays that
 * step's rate, which is the misunderstanding the game exists to kill.
 */
const BRACKETS: Bracket[] = [
  { upTo: 150_000, rate: 0 },
  { upTo: 300_000, rate: 0.05 },
  { upTo: 500_000, rate: 0.1 },
  { upTo: 750_000, rate: 0.15 },
  { upTo: 1_000_000, rate: 0.2 },
  { upTo: 2_000_000, rate: 0.25 },
  { upTo: 5_000_000, rate: 0.3 },
  { upTo: Infinity, rate: 0.35 },
];

const POTS: PotDef[] = [
  {
    id: 'retirement',
    name: 'กระปุกเกษียณ',
    cap: 500_000,
    members: ['rmf', 'pvd', 'nsf', 'pensionInsurance'],
    note: 'ทุกอย่างที่รัฐถือว่าเป็นเงินออมเพื่อเกษียณ ใช้เพดานร่วมกันก้อนเดียว ดันช่องหนึ่งขึ้น อีกช่องจะเหลือน้อยลงทันที',
  },
  {
    id: 'lifeHealth',
    name: 'กระปุกประกันตัวเอง',
    cap: 100_000,
    members: ['lifeInsurance', 'healthInsurance'],
    note: 'ประกันสุขภาพตัวเองมีเพดานของตัวเอง 25,000 แต่เมื่อรวมกับเบี้ยประกันชีวิตแล้วต้องไม่เกิน 100,000',
  },
];

const SLOTS: SlotDef[] = [
  /* --- ตัวคุณและครอบครัว: เป็นข้อเท็จจริง ไม่ใช่ของที่ซื้อเพิ่มได้ --- */
  {
    id: 'personal',
    group: 'family',
    name: 'ลดหย่อนส่วนตัว',
    hint: 'ทุกคนที่ยื่นภาษีได้เท่ากันหมด ไม่ต้องทำอะไรเลย',
    statutory: 60_000,
  },
  {
    id: 'spouse',
    group: 'family',
    name: 'คู่สมรสที่ไม่มีเงินได้',
    hint: 'จดทะเบียนสมรสและคู่สมรสไม่มีเงินได้ตลอดปีภาษี',
    statutory: 60_000,
  },
  {
    id: 'children',
    group: 'family',
    name: 'บุตร (คนแรก หรือเกิดก่อนปี 2561)',
    hint: 'บุตรชอบด้วยกฎหมายและบุตรบุญธรรม',
    perHead: { amount: 30_000, maxHeads: 20 },
  },
  {
    id: 'childrenLater',
    group: 'family',
    name: 'บุตรคนที่ 2 เป็นต้นไป ที่เกิดตั้งแต่ปี 2561',
    hint: 'กฎหมายให้เป็นสองเท่าของบุตรคนแรก เพื่อจูงใจให้มีลูกคนที่สอง',
    perHead: { amount: 60_000, maxHeads: 20 },
  },
  {
    id: 'maternity',
    group: 'family',
    name: 'ค่าฝากครรภ์และคลอดบุตร',
    hint: 'เท่าที่จ่ายจริง ไม่เกิน 60,000 ต่อการตั้งครรภ์หนึ่งคราว',
    statutory: 60_000,
  },
  {
    id: 'parents',
    group: 'family',
    name: 'อุปการะบิดามารดาอายุ 60 ปีขึ้นไป',
    hint: 'ท่านต้องมีเงินได้ทั้งปีไม่เกิน 30,000 นับพ่อแม่ของคู่สมรสที่ไม่มีเงินได้ด้วย รวมสูงสุด 4 ท่าน',
    perHead: { amount: 30_000, maxHeads: 4 },
  },
  {
    id: 'disabled',
    group: 'family',
    name: 'อุปการะคนพิการหรือทุพพลภาพ',
    hint: 'คนละ 60,000 ต่อผู้ที่อยู่ในความอุปการะ',
    perHead: { amount: 60_000, maxHeads: 20 },
  },

  /* --- สิทธิที่คุณมีอยู่แล้ว แต่คนลืมกรอกกันมากที่สุด --- */
  {
    id: 'socialSecurity',
    group: 'given',
    name: 'เงินสมทบประกันสังคม',
    hint: 'ถูกหักจากสลิปทุกเดือนอยู่แล้ว เกมเติมให้อัตโนมัติจากเงินเดือนของคุณ',
    statutory: 9_000,
  },
  {
    id: 'homeLoanInterest',
    group: 'property',
    name: 'ดอกเบี้ยกู้ซื้อหรือสร้างที่อยู่อาศัย',
    hint: 'เฉพาะส่วนดอกเบี้ย ไม่ใช่ยอดผ่อนทั้งก้อน ดูได้จากหนังสือรับรองที่ธนาคารออกให้ตอนต้นปี',
    statutory: 100_000,
  },

  /* --- เงินออม: จ่ายแล้วยังเป็นเงินของคุณ --- */
  {
    id: 'rmf',
    group: 'invest',
    name: 'กองทุนรวมเพื่อการเลี้ยงชีพ (RMF)',
    hint: 'เพดาน 30% คิดจากเงินได้พึงประเมิน คือรายได้ทั้งปีก่อนหักอะไรเลย ไม่ใช่เงินได้สุทธิ',
    incomeShare: 0.3,
    pot: 'retirement',
    costsCash: true,
    retention: 1,
    lockIn: 'ต้องถือจนอายุ 55 ปี และถือมาแล้วไม่น้อยกว่า 5 ปี ทั้งต้องซื้อต่อเนื่องไม่เว้นเกินหนึ่งปี',
  },
  {
    id: 'pvd',
    group: 'invest',
    name: 'กองทุนสำรองเลี้ยงชีพ',
    hint: 'เงินสะสมส่วนของคุณ สูงสุด 15% ของค่าจ้าง ปรับได้ที่ฝ่ายบุคคล ไม่ใช่ที่โบรกเกอร์',
    incomeShare: 0.15,
    statutory: 500_000,
    pot: 'retirement',
    costsCash: true,
    retention: 1,
    lockIn: 'บนแบบ ภ.ง.ด. ยอดนี้แยกเป็นสองท่อน ลดหย่อน 10,000 บาทแรก ที่เหลือเป็นเงินได้ที่ได้รับยกเว้น ผลต่อภาษีเท่ากัน',
  },
  {
    id: 'nsf',
    group: 'invest',
    name: 'กองทุนการออมแห่งชาติ (กอช.)',
    hint: 'สำหรับคนที่ไม่มีกองทุนสำรองเลี้ยงชีพหรือ กบข. รัฐสมทบให้อีกส่วนหนึ่ง',
    statutory: 30_000,
    pot: 'retirement',
    costsCash: true,
    retention: 1,
    lockIn: 'รับเงินคืนเมื่ออายุ 60 ปี',
  },
  {
    id: 'pensionInsurance',
    group: 'invest',
    name: 'เบี้ยประกันชีวิตแบบบำนาญ',
    hint: 'คนละตัวกับประกันชีวิตทั่วไป ตัวนี้จ่ายบำนาญคืนเป็นงวดตอนเกษียณ',
    incomeShare: 0.15,
    statutory: 200_000,
    pot: 'retirement',
    costsCash: true,
    retention: 0.8,
    lockIn: 'ความคุ้มครองตั้งแต่ 10 ปีขึ้นไป และจ่ายบำนาญตั้งแต่อายุ 55 ถึง 85 ปีเป็นอย่างน้อย',
  },
  {
    id: 'thaiEsg',
    group: 'invest',
    name: 'กองทุนรวมไทยเพื่อความยั่งยืน (Thai ESG)',
    hint: 'อยู่คนละกระปุกกับ RMF เพดาน 300,000 นี้ไม่กินโควตากระปุกเกษียณเลย',
    incomeShare: 0.3,
    statutory: 300_000,
    costsCash: true,
    retention: 1,
    lockIn: 'ถือต่อเนื่องไม่น้อยกว่า 5 ปีนับจากวันที่ซื้อแต่ละครั้ง',
  },

  /* --- ความคุ้มครอง: จ่ายแล้วได้ความคุ้มครอง ไม่ได้เงินคืนเต็ม --- */
  {
    id: 'lifeInsurance',
    group: 'protect',
    name: 'เบี้ยประกันชีวิต',
    hint: 'เฉพาะกรมธรรม์ที่มีความคุ้มครองตั้งแต่ 10 ปีขึ้นไป',
    statutory: 100_000,
    pot: 'lifeHealth',
    costsCash: true,
    retention: 0.3,
    lockIn: 'ถ้าเวนคืนกรมธรรม์ก่อนครบเงื่อนไข ต้องคืนภาษีที่เคยลดหย่อนไปพร้อมเงินเพิ่ม',
  },
  {
    id: 'healthInsurance',
    group: 'protect',
    name: 'เบี้ยประกันสุขภาพตัวเอง',
    hint: 'เพดานเดี่ยว 25,000 แต่ยังต้องไปแชร์เพดาน 100,000 กับประกันชีวิตอีกชั้น',
    statutory: 25_000,
    pot: 'lifeHealth',
    costsCash: true,
    retention: 0,
  },
  {
    id: 'parentHealthInsurance',
    group: 'protect',
    name: 'เบี้ยประกันสุขภาพบิดามารดา',
    hint: 'ท่านต้องมีเงินได้ทั้งปีไม่เกิน 30,000 กระปุกนี้แยกจากประกันของตัวคุณเอง',
    statutory: 15_000,
    costsCash: true,
    retention: 0,
  },

  /* --- ให้ออกไป --- */
  {
    id: 'socialEnterprise',
    group: 'give',
    name: 'ลงทุนในวิสาหกิจเพื่อสังคม',
    hint: 'ลงหุ้นหรือเป็นหุ้นส่วนในกิจการที่จดทะเบียนเป็นวิสาหกิจเพื่อสังคม',
    statutory: 100_000,
    costsCash: true,
    retention: 0.5,
  },
  {
    id: 'politicalDonation',
    group: 'give',
    name: 'บริจาคให้พรรคการเมือง',
    hint: 'กระปุกแยก ไม่ไปนับรวมกับเพดานบริจาค 10% ที่คิดตอนท้าย',
    statutory: 10_000,
    costsCash: true,
    retention: 0,
  },
];

const BASE: Omit<TaxYearRules, 'year' | 'caveats'> = {
  brackets: BRACKETS,
  employmentExpense: { share: 0.5, cap: 100_000 },
  slots: SLOTS,
  pots: POTS,
  donationShareOfBase: 0.1,
  donationMultiplierEDonation: 2,
  socialSecurity: { rate: 0.05, monthlyWageCap: 15_000, yearlyCap: 9_000 },
  verifiedOn: '2026-08-22',
};

export const RULES_BY_YEAR: Record<number, TaxYearRules> = {
  2568: {
    ...BASE,
    year: 2568,
    caveats: [
      'ปีภาษี 2568 ยื่นแบบไปแล้วเมื่อต้นปี 2569 โหมดนี้ไว้ย้อนดูว่าปีที่แล้วพลาดช่องไหนไปบ้าง',
    ],
  },
  2569: {
    ...BASE,
    year: 2569,
    caveats: [
      'กระทรวงการคลังเสนอรื้อเพดานลดหย่อนเงินออมใหม่เป็นก้อนเดียว 800,000 บาท พร้อมบัญชี TISA และตัวคูณตามระดับรายได้ ณ เดือนกุมภาพันธ์ 2569 ยังอยู่ระหว่างการศึกษาทบทวน ยังไม่มีพระราชกฤษฎีกา เกมจึงยังคิดตามกฎหมายที่บังคับใช้อยู่จริง',
      'มาตรการรายปีอย่าง Easy E-Receipt และเที่ยวเมืองรอง เปลี่ยนเงื่อนไขและช่วงเวลาทุกปี เกมยังไม่รวมให้ ต้องเช็กประกาศของปีนั้นเอง',
    ],
  },
};

export const DEFAULT_YEAR = 2569;

export const rulesFor = (year: number): TaxYearRules =>
  RULES_BY_YEAR[year] ?? RULES_BY_YEAR[DEFAULT_YEAR];

export const slotById = (rules: TaxYearRules, id: string): SlotDef | undefined =>
  rules.slots.find((s) => s.id === id);

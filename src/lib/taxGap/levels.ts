/**
 * The puzzles.
 *
 * Each level is a pre-filled Profile plus the one thing it is trying to teach.
 * They run in order because each leans on the one before: level 1 shows that
 * the rungs of the ladder are separate, level 2 shows that the first baht of
 * deduction is worth more than the last, level 3 shows that most people are
 * sitting on unclaimed room they never bought anything for.
 *
 * The last entry is not a puzzle at all. It is the player's own numbers.
 */
import { DEFAULT_YEAR } from './rules';
import type { Profile, SlotId } from './types';

export interface Level {
  id: string;
  name: string;
  /** The situation, in the player's own terms. */
  brief: string;
  /** What the level is trying to get across, revealed after they play it. */
  lesson: string;
  /** Slots this level lets the player move. Empty means all of them. */
  focus: SlotId[];
  profile: Profile;
  sandbox?: boolean;
}

const blank = (over: Partial<Profile>): Profile => ({
  year: DEFAULT_YEAR,
  monthlySalary: 50_000,
  bonus: 0,
  hasSpouseNoIncome: false,
  childrenBefore2561: 0,
  childrenFrom2561: 0,
  parentsInCare: 0,
  disabledInCare: 0,
  budget: 60_000,
  amounts: {},
  donationGeneral: 0,
  donationEDonation: 0,
  ...over,
});

export const levels: Level[] = [
  {
    id: 'salary-50k',
    name: 'ด่าน 1 · เงินเดือน 50,000',
    brief:
      'คนในโพสต์ที่คุณเพิ่งอ่านมา เงินเดือน 50,000 ไม่ได้ใช้สิทธิอะไรเลยนอกจากขั้นพื้นฐาน ปีนี้มีเงินเย็นอยู่ 60,000 บาท ลองหาที่ลงให้มันดูว่าภาษีจะเหลือเท่าไหร่',
    lesson:
      'เงินได้สุทธิของคุณอยู่ที่ขั้น 10% ทุก 10,000 บาทที่หาช่องลดหย่อนได้ ภาษีหายไป 1,000 บาททันที และถ้าเลือกช่องที่เป็นเงินออม เงินก้อนนั้นก็ยังเป็นของคุณอยู่ทั้งก้อน',
    focus: ['rmf', 'thaiEsg', 'lifeInsurance', 'healthInsurance', 'pvd'],
    profile: blank({ monthlySalary: 50_000, budget: 60_000 }),
  },
  {
    id: 'salary-70k-bonus',
    name: 'ด่าน 2 · เงินเดือน 70,000 + โบนัส',
    brief:
      'เลื่อนขั้นแล้ว เงินเดือน 70,000 บวกโบนัสอีก 140,000 ปีนี้กันเงินไว้ลดหย่อนได้ 300,000 บาท จับตาป้ายที่บอกว่าบาทถัดไปคืนคุณกี่เปอร์เซ็นต์ไว้ แล้วค่อย ๆ ดันเงินเข้าไป',
    lesson:
      'ตอนเริ่มคุณยืนอยู่ขั้น 20% บาทแรก ๆ ที่ลดหย่อนจึงคืนคุณ 20% แต่พอใส่ครบ 300,000 เงินได้สุทธิไหลลงมาถึงขั้น 15% บาทสุดท้ายเลยคืนแค่ 15% เงินก้อนเดียวกัน จ่ายจังหวะเดียวกัน แต่คุ้มไม่เท่ากันเพราะมันไปตกคนละขั้น',
    focus: ['rmf', 'thaiEsg', 'pensionInsurance', 'pvd', 'lifeInsurance'],
    profile: blank({ monthlySalary: 70_000, bonus: 140_000, budget: 300_000 }),
  },
  {
    id: 'family',
    name: 'ด่าน 3 · สิทธิที่ลืมกรอก',
    brief:
      'เงินเดือน 65,000 ผ่อนบ้านอยู่ มีลูกหนึ่งคน และดูแลพ่อแม่ที่อายุเกิน 60 ทั้งสองท่าน ปีนี้เงินเย็นเหลือแค่ 20,000 บาท ด่านนี้ของถูกที่สุดอยู่ในช่องที่ไม่ต้องจ่ายอะไรเลย',
    lesson:
      'ดอกเบี้ยบ้านที่คุณจ่ายไปแล้ว ลูก และพ่อแม่ ล้วนเป็นเงินที่ออกจากกระเป๋าไปเรียบร้อยแล้ว การกรอกให้ครบไม่ได้ทำให้คุณจนลงสักบาท คนจำนวนมากเสียภาษีเกินเพราะช่องพวกนี้ว่างอยู่',
    focus: ['homeLoanInterest', 'rmf', 'thaiEsg', 'parentHealthInsurance'],
    profile: blank({
      monthlySalary: 65_000,
      budget: 20_000,
      childrenBefore2561: 1,
      parentsInCare: 2,
    }),
  },
  {
    id: 'sandbox',
    name: 'โหมดอิสระ · เลขของคุณเอง',
    brief:
      'กรอกเงินเดือนจริงของคุณ แล้วเปิดดูว่าช่องไหนยังว่างอยู่บ้าง จบแล้วกดคัดลอกบรีฟไปคุยกับ AI ต่อได้',
    lesson: '',
    focus: [],
    profile: blank({ monthlySalary: 50_000, budget: 60_000 }),
    sandbox: true,
  },
];

export const levelById = (id: string): Level | undefined => levels.find((l) => l.id === id);

/**
 * Content for the "หนีหนู" game — professions, deal/market/doodad decks, the
 * fast-track cards, the dreams and the two board layouts.
 *
 * This is an ORIGINAL game. It shares only the genre's unprotected mechanics
 * (a personal income statement, a small looping board, escaping once passive
 * income covers expenses); every profession, card, number and piece of wording
 * below was written for this site. Amounts are in Thai baht per month unless
 * stated otherwise.
 */
import type {
  DealCard,
  DoodadCard,
  Dream,
  FastCard,
  FastTile,
  MarketCard,
  Loc,
  Profession,
  RatTile,
  StudyRoute,
} from '../lib/neeNoo/types';

/**
 * What it actually costs to become someone else, in Thailand, in 2026.
 *
 * The prices and durations are real, and they say something the game could not
 * say any other way: the fast cheap route exists but it cannot reach the jobs
 * that need a licence, the route that reaches everything takes four years you
 * spend paying while you work, and the route that pays the most takes you out
 * of the workforce entirely and costs more than most people's houses.
 * Sources are cited in the article that goes with the game.
 */
export const studyRoutes: StudyRoute[] = [
  {
    id: 'short',
    title: { th: 'คอร์สระยะสั้น / บูตแคมป์', en: 'Short course or bootcamp' },
    story: {
      th: 'สามถึงหกเดือน เรียนกลางคืนกับวันหยุด จ่ายทีเดียวจบ เปลี่ยนสายได้จริงแต่เฉพาะงานที่ไม่ต้องมีใบอนุญาต และเข้าไปเป็นเด็กใหม่ เงินเดือนเริ่มต้นต่ำกว่าคนที่อยู่มาก่อน',
      en: 'Three to six months of evenings and weekends, paid in one go. It really does change careers, but only into work that needs no licence, and you walk in as the new person on a junior wage.',
    },
    months: 5,
    tuition: 55000,
    terms: 1,
    fullTime: false,
    opensLicensed: false,
    licenceFee: 0,
    entrySalary: 0.7,
  },
  {
    id: 'degree',
    title: { th: 'ปริญญาตรีภาคพิเศษ เสาร์อาทิตย์', en: 'Weekend bachelor’s degree' },
    story: {
      th: 'สี่ปีเต็ม เรียนเสาร์อาทิตย์ ทำงานประจำไปด้วยได้ ค่าเทอมจ่ายเป็นเทอม ๆ ไม่ได้จ่ายทีเดียว ราคาที่แท้จริงคือสี่ปีที่คุณโตช้าลงกว่าคนที่ไม่ได้เรียน',
      en: 'Four full years of weekends while you keep your job. Tuition comes term by term, not in one lump. The real price is four years of growing slower than the people who did not enrol.',
    },
    months: 48,
    tuition: 260000,
    terms: 8,
    fullTime: false,
    opensLicensed: true,
    licenceFee: 0,
    entrySalary: 0.85,
  },
  {
    id: 'pilot',
    title: { th: 'หลักสูตรนักบินพาณิชย์ตรี', en: 'Commercial pilot licence course' },
    story: {
      th: 'ยี่สิบเดือนเต็มเวลา ลาออกจากงานไปเรียนอย่างเดียว ไม่มีเงินเดือนเข้าเลยสักบาท ค่าเรียนสองล้านสองแสน แล้วยังมีค่าใบอนุญาตรออยู่ตอนจบอีกก้อน',
      en: 'Twenty months of full-time training with no salary at all, ฿2.2 million of tuition, and a licence fee still waiting on graduation day.',
    },
    months: 20,
    tuition: 2200000,
    terms: 5,
    fullTime: true,
    opensLicensed: true,
    licenceFee: 350000,
    entrySalary: 0.8,
  },
];

/**
 * What a child costs at each age, as a multiple of the profession's baseline.
 * Nothing about a child gets cheaper: the milk-and-nappies years give way to
 * school fees, and school fees give way to tutoring.
 */
export const childStages: { fromAge: number; scale: number; label: Loc }[] = [
  { fromAge: 0, scale: 1, label: { th: 'แรกเกิด', en: 'infant' } },
  { fromAge: 3, scale: 1.6, label: { th: 'อนุบาล', en: 'kindergarten' } },
  { fromAge: 6, scale: 1.8, label: { th: 'ประถม', en: 'primary' } },
  { fromAge: 12, scale: 2.4, label: { th: 'มัธยม', en: 'secondary' } },
];

/**
 * The animal in the house. A vet bill for "a pet" is an abstraction nobody
 * grumbles about; a vet bill for a cat called ลูกชิ้น is a thing that happened
 * to somebody. The species and the name are rolled at the start of the game and
 * kept for its whole length, so the same creature keeps showing up.
 */
export const petSpecies: { id: string; label: Loc }[] = [
  { id: 'dog', label: { th: 'หมา', en: 'dog' } },
  { id: 'cat', label: { th: 'แมว', en: 'cat' } },
  { id: 'rabbit', label: { th: 'กระต่าย', en: 'rabbit' } },
  { id: 'parrot', label: { th: 'นกแก้ว', en: 'parrot' } },
  { id: 'goldfish', label: { th: 'ปลาทอง', en: 'goldfish' } },
  { id: 'hamster', label: { th: 'หนูแฮมสเตอร์', en: 'hamster' } },
];

export const petNames: Loc[] = [
  { th: 'ข้าวปั้น', en: 'Khao Pan' },
  { th: 'ลูกชิ้น', en: 'Look Chin' },
  { th: 'โมจิ', en: 'Mochi' },
  { th: 'ปุยฝ้าย', en: 'Pui Fai' },
  { th: 'ชาเย็น', en: 'Cha Yen' },
  { th: 'ส้มโอ', en: 'Som O' },
  { th: 'ก้อนหิน', en: 'Kon Hin' },
  { th: 'เจ้าด่าง', en: 'Jao Dang' },
  { th: 'ตังเม', en: 'Tang Mae' },
  { th: 'ขนมปัง', en: 'Kanom Pang' },
];

/* ------------------------------------------------------------- professions */

/**
 * Balance rule for every job: the escape bar (total expenses) divided by the
 * starting monthly cash flow lands between about 2.1 and 3.3. The spread is
 * deliberate, since the point of the game is that a bigger salary does not
 * shorten the run, but nobody should be handed an unplayable ratio either.
 *
 * Renting sits above that band on purpose. The office worker starts at about
 * 4.6 because the rent is on the bar and never comes off it, and any job that
 * declines its mortgage lands in the same place: a tenant's finish line is
 * further away than an owner's, which is the thing renting actually costs.
 *
 * The rider has no ratio at all, because the ratio is negative: this household
 * spends more than it earns before it buys anything. Every other job in the
 * game hands the player a surplus on turn one and asks what to do with it,
 * which quietly assumes away the situation a great many Thai households are
 * actually in. Here the first job is not investing. It is getting to zero.
 */
export const professions: Profession[] = [
  {
    id: 'rider',
    name: { th: 'ไรเดอร์ส่งอาหาร', en: 'Delivery rider' },
    blurb: {
      th: 'เงินเข้าทุกวัน แต่ทั้งเดือนเหลือเก็บสี่ร้อยบาท เพราะบัตรเครดิตกินไปเดือนละสามพันหก ไม่มีนายจ้าง ไม่มีบำนาญ และวันไหนไม่ออกวิ่งก็ไม่มีรายได้วันนั้น',
      en: 'Money lands every day and four hundred baht of it is left at the end of the month, because the credit card takes ฿3,600 of it first. No employer, no pension, and a day not ridden is a day not paid.',
    },
    salary: 21000,
    otherExpenses: 8800,
    rent: 4300,
    childCost: 3800,
    // The one seat that opens on a real decision rather than on a surplus.
    // ฿52,000 in the account against a ฿45,000 card charging 18%: clearing it
    // turns ฿400 a month into ฿4,000 and leaves ฿7,000 of buffer against a
    // ฿20,600 month, and keeping the cash leaves the buffer and the bleed both
    // intact. Measured across forty runs, holding the cash wins more often,
    // which is the same answer every planner gives and nearly nobody believes:
    // the emergency fund comes before the interest rate.
    cash: 52000,
    debts: [
      { key: 'car', balance: 62000, payment: 2900 },
      { key: 'card', balance: 45000, payment: 3600 },
      { key: 'retail', balance: 20000, payment: 1000 },
    ],
    startAge: 27,
    retireAge: 0,
    pension: 'none',
    raise: 0,
    risk: 'gig',
  },
  {
    id: 'office',
    name: { th: 'พนักงานออฟฟิศ', en: 'Office worker' },
    blurb: {
      th: 'เงินเดือนน้อยที่สุดในเกม รายจ่ายก็เบาที่สุด แต่ยังไม่มีบ้านเป็นของตัวเอง ค่าเช่าจึงมาทุกเดือนและไม่มีวันจบ',
      en: 'The smallest salary in the game and the lightest expenses, but no house of your own: the rent arrives every month and never ends.',
    },
    salary: 25000,
    otherExpenses: 6400,
    rent: 3500,
    childCost: 4000,
    cash: 30000,
    debts: [
      { key: 'car', balance: 240000, payment: 5400 },
      { key: 'card', balance: 55000, payment: 2700 },
      { key: 'retail', balance: 20000, payment: 1000 },
    ],
    startAge: 31,
    retireAge: 60,
    pension: 'sso',
    raise: 0.02,
    risk: 'normal',
  },
  {
    id: 'teacher',
    name: { th: 'ครูโรงเรียนรัฐ', en: 'Government school teacher' },
    blurb: {
      th: 'มั่นคง มีบ้านมีรถแล้ว แต่ กยศ. ยังตามมาทุกเดือน',
      en: 'Stable, already has a house and a car, but the student loan still shows up every month.',
    },
    salary: 26000,
    otherExpenses: 8700,
    rent: 3360,
    childCost: 4600,
    cash: 30000,
    debts: [
      { key: 'home', balance: 480000, payment: 3200 },
      { key: 'car', balance: 180000, payment: 4500 },
      { key: 'card', balance: 25000, payment: 1300 },
      { key: 'student', balance: 90000, payment: 900 },
    ],
    startAge: 30,
    retireAge: 60,
    pension: 'civil',
    raise: 0.015,
    risk: 'steady',
    licensed: true,
  },
  {
    id: 'nurse',
    name: { th: 'พยาบาลวิชาชีพ', en: 'Registered nurse' },
    blurb: {
      th: 'ทำงานหนัก เงินเข้าเยอะกว่าครู แต่บ้านหลังใหญ่กว่าก็กินไปเยอะกว่า',
      en: 'Works hard and earns more than the teacher, but the bigger house eats more of it.',
    },
    salary: 34000,
    otherExpenses: 9200,
    rent: 5800,
    childCost: 5600,
    cash: 35000,
    debts: [
      { key: 'home', balance: 900000, payment: 5500 },
      { key: 'car', balance: 280000, payment: 6200 },
      { key: 'card', balance: 40000, payment: 2000 },
      { key: 'student', balance: 60000, payment: 700 },
    ],
    startAge: 30,
    retireAge: 60,
    pension: 'sso',
    raise: 0.025,
    risk: 'steady',
    licensed: true,
  },
  {
    id: 'cafe',
    name: { th: 'เจ้าของร้านกาแฟ', en: 'Coffee shop owner' },
    blurb: {
      th: 'เป็นเจ้าของกิจการแล้ว แต่รายได้ยังผูกกับการยืนชงเอง จึงยังนับเป็นเงินเดือน ส่วนที่อยู่ยังเช่าเขาอยู่',
      en: 'Already a business owner, but the income still depends on standing behind the counter, so it counts as salary. The roof is still rented.',
    },
    salary: 42000,
    otherExpenses: 8800,
    rent: 5000,
    childCost: 6000,
    cash: 35000,
    debts: [
      { key: 'retail', balance: 560000, payment: 7500 },
      { key: 'car', balance: 260000, payment: 5500 },
      { key: 'card', balance: 60000, payment: 3000 },
    ],
    startAge: 33,
    retireAge: 0,
    pension: 'none',
    raise: 0,
    risk: 'slump',
  },
  {
    id: 'engineer',
    name: { th: 'วิศวกรโยธา', en: 'Civil engineer' },
    blurb: {
      th: 'เงินเดือนดี บ้านหลังโต รถคันสวย และรายจ่ายที่โตตามเงินเดือนพอดี',
      en: 'Good salary, big house, nice car, and expenses that grew exactly as fast as the salary did.',
    },
    salary: 48000,
    otherExpenses: 12400,
    rent: 9450,
    childCost: 7200,
    cash: 50000,
    debts: [
      { key: 'home', balance: 1500000, payment: 9000 },
      { key: 'car', balance: 480000, payment: 8500 },
      { key: 'card', balance: 50000, payment: 2500 },
    ],
    startAge: 32,
    retireAge: 60,
    pension: 'sso',
    raise: 0.03,
    risk: 'normal',
    licensed: true,
  },
  {
    id: 'dev',
    name: { th: 'โปรแกรมเมอร์', en: 'Software developer' },
    blurb: {
      th: 'เงินสดตั้งต้นเยอะที่สุดในกลุ่มเงินเดือนกลาง เริ่มลงทุนได้เร็วกว่าใคร',
      en: 'The most starting cash of the mid-salary group, so the investing can start earlier.',
    },
    salary: 60000,
    otherExpenses: 15200,
    rent: 12600,
    childCost: 8400,
    cash: 70000,
    debts: [
      { key: 'home', balance: 2100000, payment: 12000 },
      { key: 'car', balance: 620000, payment: 10000 },
      { key: 'card', balance: 76000, payment: 3800 },
    ],
    startAge: 30,
    retireAge: 60,
    pension: 'sso',
    raise: 0.04,
    risk: 'layoff',
  },
  {
    id: 'doctor',
    name: { th: 'แพทย์', en: 'Doctor' },
    blurb: {
      th: 'เงินเดือนสูงที่สุดอันดับสอง แต่ต้องหาเงินไหลเข้าเดือนละแปดหมื่นสี่ถึงจะหนีออกได้',
      en: 'The second-highest salary, yet it takes eighty-four thousand a month of passive income to get out.',
    },
    salary: 110000,
    otherExpenses: 24100,
    rent: 25200,
    childCost: 13000,
    cash: 150000,
    debts: [
      { key: 'home', balance: 4200000, payment: 24000 },
      { key: 'car', balance: 1050000, payment: 13000 },
      { key: 'card', balance: 80000, payment: 4000 },
      { key: 'student', balance: 300000, payment: 3000 },
    ],
    startAge: 34,
    retireAge: 60,
    pension: 'sso',
    raise: 0.03,
    risk: 'steady',
    licensed: true,
  },
  {
    id: 'pilot',
    name: { th: 'นักบิน', en: 'Airline pilot' },
    blurb: {
      th: 'เงินเดือนสูงสุดในเกม เหลือใช้เยอะสุดด้วย แต่เส้นชัยก็ไกลที่สุดเช่นกัน คือต้องหาเงินไหลเข้าให้ได้เดือนละแสนหนึ่ง',
      en: 'The highest salary in the game and the most left over, but also the most distant finish line: a hundred and ten thousand a month of passive income.',
    },
    salary: 150000,
    otherExpenses: 28100,
    rent: 33600,
    childCost: 16000,
    cash: 250000,
    debts: [
      { key: 'home', balance: 5600000, payment: 32000 },
      { key: 'car', balance: 1800000, payment: 20000 },
      { key: 'card', balance: 140000, payment: 7000 },
    ],
    startAge: 33,
    retireAge: 60,
    pension: 'sso',
    raise: 0.025,
    risk: 'grounded',
    licensed: true,
  },
];

/* -------------------------------------------------------------- deal cards */

export const deals: DealCard[] = [
  /* ---- small: traded paper ---- */
  {
    id: 'd-mkt',
    size: 'small',
    kind: 'stock',
    symbol: 'MKT',
    title: { th: 'หุ้น MKT ห้างค้าปลีก', en: 'MKT retail chain shares' },
    story: {
      th: 'ห้างค้าปลีกที่คุณเดินซื้อของทุกเสาร์ กำลังขยายสาขาไปต่างจังหวัด ราคาหุ้นยังนิ่ง ๆ',
      en: 'The retail chain you shop at every Saturday is opening upcountry branches. The share price is still flat.',
    },
    price: 10,
    down: 10,
    debt: 0,
    cashflow: 0,
    maxQty: 1500,
    books: {
      revenue: 12400,
      profit: 620,
      growth: 0.06,
      gearing: 1.1,
      pe: 18,
      note: {
        th: 'ขายของได้เยอะมาก แต่เหลือเป็นกำไรแค่ 5 สตางค์ต่อยอดขายหนึ่งบาท และสาขาใหม่ที่กำลังเปิดก็เปิดด้วยเงินกู้',
        en: 'It sells a great deal and keeps five satang of every baht. The new branches are being opened with borrowed money.',
      },
    },
  },
  {
    id: 'd-trn',
    size: 'small',
    kind: 'stock',
    symbol: 'TRN',
    title: { th: 'หุ้น TRN ขนส่งโลจิสติกส์', en: 'TRN logistics shares' },
    story: {
      th: 'บริษัทขนส่งพัสดุที่โตตามการสั่งของออนไลน์ ราคาแกว่งแรงทั้งขาขึ้นและขาลง',
      en: 'A parcel company riding the online-shopping wave. The price swings hard in both directions.',
    },
    price: 25,
    down: 25,
    debt: 0,
    cashflow: 0,
    maxQty: 600,
    books: {
      revenue: 8900,
      profit: 410,
      growth: 0.24,
      gearing: 1.9,
      pe: 31,
      note: {
        th: 'รายได้โตปีละเกือบหนึ่งในสี่ ซึ่งเป็นเหตุผลที่ราคาแพงเมื่อเทียบกำไร คนซื้อกำลังจ่ายเงินให้กับการโตที่ยังไม่เกิด',
        en: 'Revenue grows by nearly a quarter a year, which is why it is priced high against its profit. Buyers are paying for growth that has not happened yet.',
      },
    },
  },
  {
    id: 'd-solr',
    size: 'small',
    kind: 'stock',
    symbol: 'SOLR',
    title: { th: 'หุ้น SOLR พลังงานแสงอาทิตย์', en: 'SOLR solar-energy shares' },
    story: {
      th: 'หุ้นราคาถูกจนซื้อได้เป็นพันหุ้น แต่ถูกเพราะยังไม่เคยมีกำไรสักปี',
      en: 'Cheap enough to buy by the thousand, and cheap because it has never turned a profit.',
    },
    price: 5,
    down: 5,
    debt: 0,
    cashflow: 0,
    maxQty: 3000,
    books: {
      revenue: 1200,
      profit: -380,
      growth: 0.41,
      gearing: 2.8,
      pe: 0,
      note: {
        th: 'ยังไม่เคยมีกำไรสักปี หนี้เกือบสามเท่าของทุน และรายได้ที่โตเร็วก็ยังตามรายจ่ายไม่ทัน ถูกเพราะมีเหตุผลของมัน',
        en: 'It has never had a profitable year, it owes nearly three times its equity, and revenue is growing fast but still losing the race to costs. It is cheap for a reason.',
      },
    },
  },
  {
    id: 'd-bnk',
    size: 'small',
    kind: 'stock',
    symbol: 'BNK',
    title: { th: 'หุ้น BNK ธนาคาร', en: 'BNK bank shares' },
    story: {
      th: 'ธนาคารเก่าแก่ ราคาหุ้นแทบไม่ขยับ แต่จ่ายปันผลสม่ำเสมอทุกเดือน',
      en: 'An old bank whose share price barely moves, but which pays a dividend every month like clockwork.',
    },
    price: 40,
    down: 40,
    debt: 0,
    cashflow: 0.22,
    maxQty: 6000,
    books: {
      revenue: 96000,
      profit: 21500,
      growth: 0.03,
      gearing: 0.6,
      pe: 7.5,
      note: {
        th: 'โตช้าจนน่าเบื่อ แต่กำไรหนาและจ่ายออกมาเป็นเงินสดทุกเดือน ราคาต่อกำไรต่ำที่สุดในกระดาน',
        en: 'Dull growth, thick profits, and it hands them over in cash every month. The lowest price against earnings on the board.',
      },
    },
  },
  {
    id: 'd-reit',
    size: 'small',
    kind: 'stock',
    symbol: 'REIT',
    title: { th: 'กองทุนอสังหาฯ REIT', en: 'REIT property fund' },
    story: {
      th: 'ถือกองทุนที่เอาเงินไปซื้อตึกให้เช่าแทนคุณ ได้ค่าเช่าโดยไม่ต้องซ่อมแอร์เอง',
      en: 'A fund that buys rental buildings on your behalf: rent income without ever fixing an air conditioner yourself.',
    },
    price: 100,
    down: 100,
    debt: 0,
    cashflow: 0.58,
    maxQty: 4000,
    books: {
      revenue: 3100,
      profit: 1450,
      growth: 0.02,
      gearing: 0.9,
      pe: 11,
      note: {
        th: 'เกือบทุกบาทที่เก็บค่าเช่าได้ถูกจ่ายคืนผู้ถือหน่วย กองแบบนี้จึงโตช้าเป็นปกติ เพราะไม่ได้เก็บกำไรไว้ขยายตัวเอง',
        en: 'Almost every baht of rent collected is paid back out to unit holders, so a fund like this grows slowly by design: it keeps nothing to expand with.',
      },
    },
  },
  {
    id: 'd-gold',
    size: 'small',
    kind: 'gold',
    symbol: 'GOLD',
    title: { th: 'ทองคำแท่ง (บาททองคำ)', en: 'Gold bullion (per baht-weight)' },
    story: {
      th: 'ทองไม่ให้ดอกผลสักบาท มันแค่รอวันที่ราคาขึ้น และรอเป็น',
      en: 'Gold pays no income at all. It just waits for the price to rise, and it is very good at waiting.',
    },
    price: 68000,
    down: 68000,
    debt: 0,
    cashflow: 0,
    maxQty: 18,
  },
  /* ---- small: property ---- */
  {
    id: 'd-condo',
    size: 'small',
    kind: 'property',
    tag: 'condo',
    title: { th: 'คอนโดเก่าใกล้ BTS', en: 'Older condo near the BTS' },
    story: {
      th: 'ห้อง 28 ตร.ม. ตึกอายุ 15 ปี แต่เดินถึงรถไฟฟ้า 4 นาที ผู้เช่าไม่เคยขาด',
      en: 'A 28 sq m unit in a 15-year-old building, four minutes’ walk from the train. It is never empty.',
    },
    price: 1200000,
    down: 120000,
    debt: 1080000,
    mortgagePay: 5968,
    cashflow: -1168,
    maxQty: 1,
    tenants: 1,
    tenantStay: 36,
    reletChance: 0.6,
    livable: true,
  },
  /*
   * The three cards below are the only ones in the deck that cost money every
   * month instead of paying it. Without them every leveraged deal in the game
   * was cash-flow positive from the first month, so leverage had no downside to
   * teach and there was no way to talk yourself into a hole.
   */
  {
    id: 'd-landloan',
    size: 'small',
    kind: 'property',
    tag: 'land',
    title: { th: 'ที่ดินติดถนนใหญ่ (กู้ซื้อ)', en: 'Roadside land, bought with a loan' },
    story: {
      th: 'ผังเมืองใหม่ยังไม่ประกาศ แต่คนแถวนั้นพูดกันแล้ว ที่ดินไม่ให้ค่าเช่าสักบาทระหว่างรอ ส่วนดอกเบี้ยไม่เคยรอใคร',
      en: 'The new zoning plan is still a rumour the neighbours repeat. Land pays no rent while you wait, and the interest never waits.',
    },
    price: 900000,
    down: 180000,
    debt: 720000,
    mortgagePay: 4000,
    cashflow: -4000,
    maxQty: 2,
  },
  {
    id: 'd-condoempty',
    size: 'small',
    kind: 'property',
    tag: 'condo',
    title: { th: 'คอนโดใหม่ที่ยังหาผู้เช่าไม่ได้', en: 'A new condo with nobody in it' },
    story: {
      th: 'ตึกเพิ่งสร้างเสร็จ ห้องว่างพร้อมกันทั้งชั้น ค่าเช่าที่เคยคุยไว้เลยกดกันลงมาจนไม่พอค่างวด',
      en: 'The building just finished and a whole floor came onto the market at once, so the rent everyone quoted no longer covers the payment.',
    },
    price: 1200000,
    down: 120000,
    debt: 1080000,
    mortgagePay: 5968,
    cashflow: -468,
    maxQty: 2,
    tenants: 1,
    tenantStay: 10,
    reletChance: 0.35,
    livable: true,
  },
  {
    id: 'd-cafenew',
    size: 'small',
    kind: 'business',
    tag: 'cafe',
    title: { th: 'ร้านกาแฟเปิดใหม่หน้าออฟฟิศ', en: 'A new coffee shop outside an office block' },
    story: {
      th: 'ทำเลดี ค่าเช่าแพง ลูกค้ายังไม่รู้จัก เดือนแรก ๆ ต้องควักเนื้อก่อน จะรอดหรือไม่รอดขึ้นกับว่าคนจะติดร้านทันไหม',
      en: 'Good spot, expensive rent, nobody knows it yet. The first months come out of your pocket, and whether it lives depends on how fast regulars appear.',
    },
    price: 250000,
    down: 250000,
    debt: 0,
    cashflow: -3000,
    failRate: 0.0038,
    maxQty: 1,
    volatility: 0.35,
    // Almost all of this price is counter, machine and fit-out rather than a
    // name anyone knows yet, so most of it survives even if nobody ever comes.
    salvage: 0.7,
  },
  {
    id: 'd-rooms',
    size: 'small',
    kind: 'property',
    tag: 'rooms',
    title: { th: 'ห้องเช่าแถวนิคมฯ 2 ห้อง', en: 'Two rental rooms near an industrial estate' },
    story: {
      th: 'ห้องเช่ารายเดือนสำหรับพนักงานโรงงาน ค่าเช่าไม่แพง แต่คนเช่าเปลี่ยนช้ามาก',
      en: 'Monthly rooms for factory staff. The rent is modest, but tenants almost never move out.',
    },
    price: 700000,
    down: 105000,
    debt: 595000,
    mortgagePay: 3311,
    cashflow: 1647,
    maxQty: 1,
    tenants: 2,
    tenantStay: 18,
    reletChance: 0.6,
    livable: true,
  },
  {
    id: 'd-house',
    size: 'small',
    kind: 'property',
    tag: 'house',
    title: { th: 'บ้านมือสองปล่อยเช่า', en: 'Second-hand house to rent out' },
    story: {
      th: 'บ้านเดี่ยวชานเมือง เจ้าของเดิมย้ายไปต่างประเทศ อยากขายไว ต่อรองราคาได้',
      en: 'A suburban house whose owner moved abroad and wants a quick sale, so the price is negotiable.',
    },
    price: 1800000,
    down: 270000,
    debt: 1530000,
    mortgagePay: 8411,
    cashflow: 1339,
    maxQty: 1,
    tenants: 1,
    tenantStay: 24,
    reletChance: 0.55,
    livable: true,
  },
  {
    id: 'd-townhouse',
    size: 'small',
    kind: 'property',
    tag: 'house',
    title: { th: 'ทาวน์เฮาส์ใกล้โรงงาน', en: 'Townhouse near a factory' },
    story: {
      th: 'สภาพเก่าหน่อย แต่ผู้เช่าเป็นหัวหน้ากะที่อยู่มาห้าปีและไม่คิดจะย้ายไปไหน',
      en: 'A bit tired, but the tenant is a shift supervisor who has stayed five years and shows no sign of leaving.',
    },
    price: 950000,
    down: 142500,
    debt: 807500,
    mortgagePay: 4476,
    cashflow: 1462,
    maxQty: 1,
    tenants: 1,
    tenantStay: 18,
    reletChance: 0.6,
    livable: true,
  },
  {
    id: 'd-shop1',
    size: 'small',
    kind: 'property',
    tag: 'shophouse',
    title: { th: 'ห้องแถวคูหาเดียวหน้าตลาด', en: 'Single shophouse unit facing a market' },
    story: {
      th: 'ชั้นล่างเปิดร้านขายของชำ ชั้นบนเจ้าของร้านอยู่เอง จ่ายค่าเช่าตรงเวลาทุกวันที่ 1',
      en: 'A grocery downstairs and the shopkeeper living above it, paying rent on the first of every month.',
    },
    price: 2400000,
    down: 600000,
    debt: 1800000,
    mortgagePay: 9868,
    cashflow: 4132,
    maxQty: 1,
    tenants: 1,
    tenantStay: 36,
    reletChance: 0.5,
    livable: true,
  },
  {
    id: 'd-land',
    size: 'small',
    kind: 'property',
    tag: 'land',
    title: { th: 'ที่ดินเปล่าชานเมือง', en: 'Empty suburban land' },
    story: {
      th: 'ที่ดิน 1 งานติดถนนซอย ไม่มีรายได้สักบาทระหว่างถือ มีแต่ข่าวลือเรื่องถนนตัดใหม่',
      en: 'A small plot on a side road. Zero income while you hold it, only a rumour about a new road.',
    },
    price: 350000,
    down: 350000,
    debt: 0,
    cashflow: 0,
    maxQty: 2,
  },
  /* ---- small: business ---- */
  {
    id: 'd-water',
    size: 'small',
    kind: 'business',
    tag: 'vending',
    title: { th: 'ตู้กดน้ำหยอดเหรียญ 3 ตู้', en: 'Three coin-operated water vending machines' },
    story: {
      th: 'ตั้งหน้าหมู่บ้าน เก็บเหรียญเดือนละครั้ง งานหลักคือหาที่ตั้งให้ถูกจุด',
      en: 'Parked at the front of a housing estate. You collect the coins monthly; the real work was picking the spot.',
    },
    price: 90000,
    down: 90000,
    debt: 0,
    cashflow: 3200,
    volatility: 0.08,
    maxQty: 2,
  },
  {
    id: 'd-topup',
    size: 'small',
    kind: 'business',
    tag: 'vending',
    title: { th: 'ตู้เติมเงินมือถือ 5 ตู้', en: 'Five phone top-up kiosks' },
    story: {
      th: 'กำไรต่อรายการน้อยมาก แต่คนกดทั้งวัน และตู้ไม่เคยขอลาป่วย',
      en: 'Tiny margin per transaction, all day long, and the machines never call in sick.',
    },
    price: 60000,
    down: 60000,
    debt: 0,
    cashflow: 2200,
    volatility: 0.1,
    maxQty: 2,
  },
  {
    id: 'd-laundry',
    size: 'small',
    kind: 'business',
    tag: 'laundry',
    title: { th: 'ตู้ซักผ้าหยอดเหรียญ 4 เครื่อง', en: 'Four coin laundry machines' },
    story: {
      th: 'ตั้งในหอพักนักศึกษา ช่วงสอบปลายภาคเงินเข้าดีเป็นพิเศษ',
      en: 'Installed in a student dorm. Business is especially good during final exams.',
    },
    price: 180000,
    down: 180000,
    debt: 0,
    cashflow: 6400,
    volatility: 0.09,
    maxQty: 1,
  },
  {
    id: 'd-milktea',
    size: 'small',
    kind: 'business',
    tag: 'franchise',
    title: { th: 'แฟรนไชส์ร้านชานมไข่มุก', en: 'Bubble-tea franchise branch' },
    story: {
      th: 'จ้างน้องสองคนยืนขาย คุณดูแค่ยอดกับสต๊อก กำไรดีตราบใดที่กระแสยังไม่ตก',
      en: 'Two staff run the counter; you only watch sales and stock. Profitable as long as the trend holds.',
    },
    price: 250000,
    down: 250000,
    debt: 0,
    cashflow: 9000,
    volatility: 0.18,
    failRate: 0.0017,
    maxQty: 1,
  },
  {
    id: 'd-cart',
    size: 'small',
    kind: 'business',
    tag: 'rentbiz',
    title: { th: 'รถเข็นกาแฟให้เช่า 3 คัน', en: 'Three coffee carts leased out' },
    story: {
      th: 'คุณเป็นเจ้าของรถเข็น คนอื่นเป็นคนตื่นตีห้าไปตั้งขาย คุณเก็บค่าเช่ารายเดือน',
      en: 'You own the carts; other people wake at five to run them. You just collect the monthly lease.',
    },
    price: 150000,
    down: 150000,
    debt: 0,
    cashflow: 5400,
    volatility: 0.2,
    failRate: 0.0019,
    maxQty: 2,
  },
  /* ---- big deals ---- */
  {
    id: 'd-apartment',
    size: 'big',
    kind: 'property',
    tag: 'apartment',
    title: { th: 'อพาร์ตเมนต์ 12 ห้อง', en: '12-unit apartment block' },
    story: {
      th: 'ตึกเก่าย่านมหาวิทยาลัย เจ้าของอายุมากแล้วอยากวางมือ ผู้เช่าเต็มมาสามปีติด',
      en: 'An older block by a university. The elderly owner wants out; it has been fully occupied for three years.',
    },
    price: 9000000,
    down: 2250000,
    debt: 6750000,
    mortgagePay: 37105,
    cashflow: 26645,
    maxQty: 1,
    tenants: 12,
    tenantStay: 18,
    reletChance: 0.6,
    livable: true,
  },
  {
    id: 'd-shophouse',
    size: 'big',
    kind: 'property',
    tag: 'shophouse',
    title: { th: 'ตึกแถว 2 คูหา', en: 'Two adjoining shophouses' },
    story: {
      th: 'ชั้นล่างเป็นร้านซักรีดกับร้านตัดผม ชั้นบนปล่อยเช่าอยู่อาศัย สัญญายาว 3 ปี',
      en: 'A laundry and a barber downstairs, residential rentals above, all on three-year leases.',
    },
    price: 6500000,
    down: 1625000,
    debt: 4875000,
    mortgagePay: 26842,
    cashflow: 11075,
    maxQty: 1,
    tenants: 2,
    tenantStay: 24,
    reletChance: 0.55,
    livable: true,
  },
  {
    id: 'd-dorm',
    size: 'big',
    kind: 'property',
    tag: 'apartment',
    title: { th: 'หอพักนักศึกษา 24 ห้อง', en: '24-room student dormitory' },
    story: {
      th: 'ห้องเล็กแต่เต็มทุกเทอม ปิดเทอมรายได้หายไปบ้าง เฉลี่ยแล้วยังคุ้ม',
      en: 'Small rooms, full every term. Income dips during the break, but the average still works.',
    },
    price: 11000000,
    down: 2750000,
    debt: 8250000,
    mortgagePay: 45395,
    cashflow: 37105,
    maxQty: 1,
    tenants: 24,
    tenantStay: 12,
    reletChance: 0.7,
    livable: true,
  },
  {
    id: 'd-warehouse',
    size: 'big',
    kind: 'property',
    tag: 'warehouse',
    title: { th: 'โกดังให้เช่าริมถนนเลี่ยงเมือง', en: 'Warehouse on the bypass road' },
    story: {
      th: 'ผู้เช่าเป็นบริษัทขนส่งรายใหญ่ สัญญา 5 ปี ค่าเช่าปรับขึ้นทุกปีตามสัญญา',
      en: 'Leased to a large logistics firm for five years, with a contractual rent rise every year.',
    },
    price: 12000000,
    down: 3000000,
    debt: 9000000,
    mortgagePay: 49500,
    cashflow: 25500,
    maxQty: 1,
    tenants: 1,
    tenantStay: 60,
    reletChance: 0.4,
  },
  {
    id: 'd-hotel',
    size: 'big',
    kind: 'property',
    tag: 'hotel',
    title: { th: 'โรงแรมบูทีค 15 ห้อง', en: '15-room boutique hotel' },
    story: {
      th: 'เมืองรอง นักท่องเที่ยวเริ่มมา รายได้ดีในไฮซีซัน และเงียบสนิทในโลว์ซีซัน',
      en: 'In a second-tier town just discovering tourism: strong in high season, silent in low season.',
    },
    price: 15000000,
    down: 4500000,
    debt: 10500000,
    mortgagePay: 57768,
    cashflow: 79732,
    maxQty: 1,
    tenants: 15,
    tenantStay: 4,
    reletChance: 0.75,
  },
  {
    id: 'd-restaurant',
    size: 'big',
    kind: 'business',
    tag: 'partner',
    title: { th: 'หุ้นส่วนร้านอาหาร 30%', en: '30% stake in a restaurant' },
    story: {
      th: 'เพื่อนเป็นเชฟและเป็นคนคุมร้าน คุณลงเงินอย่างเดียวและรับส่วนแบ่งกำไร',
      en: 'Your friend is the chef and runs the place; you put in money only and take a share of profit.',
    },
    price: 800000,
    down: 800000,
    debt: 0,
    cashflow: 31000,
    volatility: 0.22,
    failRate: 0.0022,
    maxQty: 1,
  },
  {
    id: 'd-carwash',
    size: 'big',
    kind: 'business',
    tag: 'service',
    title: { th: 'กิจการคาร์แคร์พร้อมทีมงาน', en: 'Car-care shop with staff included' },
    story: {
      th: 'ซื้อยกกิจการ ทีมงานเดิมอยู่ต่อทั้งหมด ลูกค้าประจำเป็นแท็กซี่ทั้งซอย',
      en: 'Bought as a going concern with the whole team staying on; the regulars are every taxi on the street.',
    },
    price: 1200000,
    down: 1200000,
    debt: 0,
    cashflow: 46000,
    volatility: 0.14,
    failRate: 0.001,
    maxQty: 1,
  },
  {
    id: 'd-bigland',
    size: 'big',
    kind: 'property',
    tag: 'land',
    title: { th: 'ที่ดินติดถนนใหญ่ 2 ไร่', en: 'Two rai of land on a main road' },
    story: {
      th: 'ไม่มีรายได้ระหว่างถือแม้แต่บาทเดียว แต่ผังเมืองใหม่กำลังจะประกาศ',
      en: 'Not one baht of income while you hold it, but a new zoning plan is about to be announced.',
    },
    price: 4500000,
    down: 4500000,
    debt: 0,
    cashflow: 0,
    maxQty: 1,
  },

  /* ================================================== fast track: ordinary ==
   * Out here the salary is gone and the sums are bigger, but the same card
   * shape applies: paper you can sell any day, businesses that swing, and
   * property you can still borrow against.
   */
  {
    id: 'ff-govb',
    size: 'fast',
    kind: 'stock',
    symbol: 'GOVB',
    title: { th: 'พันธบัตรรัฐบาลอายุ 10 ปี', en: 'Ten-year government bonds' },
    story: {
      th: 'ดอกเบี้ยต่ำที่สุดในกระดาน แลกกับการที่รัฐบาลไม่เคยเบี้ยวใคร ที่พักเงินระหว่างรอดีลใหญ่',
      en: 'The lowest yield on the board, in exchange for a borrower that has never missed a payment. Somewhere to park cash between big deals.',
    },
    price: 100000,
    down: 100000,
    debt: 0,
    cashflow: 235,
    maxQty: 400,
  },
  {
    id: 'ff-corpb',
    size: 'fast',
    kind: 'stock',
    symbol: 'CORPB',
    title: { th: 'หุ้นกู้บริษัทเอกชน', en: 'Corporate bonds' },
    story: {
      th: 'ดอกดีกว่าพันธบัตรอยู่ครึ่งหนึ่ง เพราะบริษัทเจ๊งได้ ส่วนรัฐบาลพิมพ์เงินเองได้',
      en: 'Half again the yield of a government bond, because a company can go under and a government can print.',
    },
    price: 100000,
    down: 100000,
    debt: 0,
    cashflow: 415,
    maxQty: 300,
  },
  {
    id: 'ff-mmf',
    size: 'fast',
    kind: 'stock',
    symbol: 'MMF',
    title: { th: 'กองทุนรวมตลาดเงิน', en: 'Money-market fund' },
    story: {
      th: 'แทบไม่ให้อะไรเลย แต่ถอนวันไหนก็ได้และแทบไม่มีทางขาดทุน คือบัญชีออมทรัพย์ที่ขยันกว่าหน่อย',
      en: 'Barely pays anything, withdrawable any day, and almost impossible to lose money in. A savings account that tries a little harder.',
    },
    price: 10000,
    down: 10000,
    debt: 0,
    cashflow: 15,
    maxQty: 3000,
  },
  {
    id: 'ff-gold',
    size: 'fast',
    kind: 'gold',
    symbol: 'GOLD',
    title: { th: 'ทองคำแท่ง (บาททองคำ)', en: 'Gold bullion (per baht-weight)' },
    story: {
      th: 'ยังไม่ให้ดอกผลเหมือนเดิม และยังรอเป็นเหมือนเดิม รวมกองกับทองที่คุณถือมาตั้งแต่ยังอยู่ในวงล้อ',
      en: 'Still pays nothing, still very good at waiting. It stacks with whatever gold you carried out of the rat race.',
    },
    price: 68000,
    down: 68000,
    debt: 0,
    cashflow: 0,
    maxQty: 124,
  },
  {
    id: 'ff-setx',
    size: 'fast',
    kind: 'stock',
    symbol: 'SETX',
    title: { th: 'กองทุนดัชนีหุ้นไทย', en: 'Thai equity index fund' },
    story: {
      th: 'ซื้อทั้งตลาดในใบเดียว ไม่ต้องเดาว่าบริษัทไหนจะรอด เพราะถือมันทุกบริษัท',
      en: 'The whole market in one line. No need to guess which company survives, because you own all of them.',
    },
    price: 1000,
    down: 1000,
    debt: 0,
    cashflow: 2.5,
    maxQty: 20000,
  },
  {
    id: 'ff-startup',
    size: 'fast',
    kind: 'business',
    tag: 'fasttrack',
    title: { th: 'สตาร์ทอัพเทคโนโลยีรอบ Series A', en: 'Series A technology startup' },
    story: {
      th: 'บางเดือนยอดโตพรวด บางเดือนลูกค้ารายใหญ่หายไปทีเดียวสามราย และบางบริษัทก็ปิดตัวไปเงียบ ๆ',
      en: 'Some months it doubles, some months three big customers leave at once, and some of these quietly shut down.',
    },
    price: 700000,
    down: 700000,
    debt: 0,
    cashflow: 34000,
    failRate: 0.019,
    maxQty: 4,
    volatility: 0.3,
  },
  {
    id: 'ff-food',
    size: 'fast',
    kind: 'business',
    tag: 'fasttrack',
    title: { th: 'โรงงานอาหารสำเร็จรูป', en: 'Ready-meal factory' },
    story: {
      th: 'ผลิตส่งซูเปอร์มาร์เก็ตทั้งเครือ สัญญาต่ออายุอัตโนมัติทุกสองปี',
      en: 'Supplies a whole supermarket chain on a contract that renews automatically every two years.',
    },
    price: 2000000,
    down: 2000000,
    debt: 0,
    cashflow: 90000,
    volatility: 0.16,
    failRate: 0.001,
    maxQty: 2,
  },
  {
    id: 'ff-conv',
    size: 'fast',
    kind: 'business',
    tag: 'fasttrack',
    title: { th: 'แฟรนไชส์ร้านสะดวกซื้อ 10 สาขา', en: 'Ten convenience-store franchises' },
    story: {
      th: 'สิบสาขาในจังหวัดเดียว ผู้จัดการเขตดูแลให้ คุณดูแค่รายงาน',
      en: 'Ten branches in one province with an area manager running them. You only read the report.',
    },
    price: 1500000,
    down: 1500000,
    debt: 0,
    cashflow: 66000,
    maxQty: 3,
    volatility: 0.12,
  },
  {
    id: 'ff-port',
    size: 'fast',
    kind: 'business',
    tag: 'fasttrack',
    title: { th: 'ท่าเรือขนส่งขนาดเล็ก', en: 'Small cargo pier' },
    story: {
      th: 'เก็บค่าเทียบท่าและค่าโกดัง เรือเข้าออกทุกวันไม่เว้นวันหยุด',
      en: 'Charges berthing and storage fees; boats come and go every day including holidays.',
    },
    price: 2500000,
    down: 2500000,
    debt: 0,
    cashflow: 112000,
    volatility: 0.08,
    maxQty: 2,
  },
  {
    id: 'ff-solar',
    size: 'fast',
    kind: 'business',
    tag: 'fasttrack',
    title: { th: 'ฟาร์มโซลาร์เซลล์', en: 'Solar farm' },
    story: {
      th: 'ขายไฟเข้าระบบตามสัญญา 20 ปี รายได้เท่ากันทุกเดือนจนน่าเบื่อ',
      en: 'Sells power into the grid on a 20-year contract, the same amount every month, almost boringly.',
    },
    price: 3000000,
    down: 3000000,
    debt: 0,
    cashflow: 132000,
    volatility: 0.06,
    maxQty: 2,
  },
  {
    id: 'ff-resort',
    size: 'fast',
    kind: 'property',
    tag: 'apartment',
    title: { th: 'คอนโดตากอากาศ 30 ยูนิต', en: '30-unit resort condominium' },
    story: {
      th: 'ปล่อยเช่ารายวันผ่านแพลตฟอร์ม มีทีมแม่บ้านประจำอยู่แล้ว รายได้ขึ้นลงตามฤดูท่องเที่ยว',
      en: 'Rented nightly through a platform with a housekeeping team in place. Income rises and falls with the season.',
    },
    price: 24000000,
    down: 7200000,
    debt: 16800000,
    mortgagePay: 93333,
    cashflow: 126667,
    maxQty: 2,
    tenants: 30,
    tenantStay: 8,
    reletChance: 0.6,
    livable: true,
    volatility: 0.15,
  },
  {
    id: 'ff-mall',
    size: 'fast',
    kind: 'property',
    tag: 'shophouse',
    title: { th: 'ห้างชุมชนขนาดเล็ก', en: 'Neighbourhood shopping centre' },
    story: {
      th: 'ผู้เช่า 40 ร้าน เก็บค่าเช่ารายเดือนพร้อมส่วนแบ่งยอดขาย',
      en: 'Forty tenants paying monthly rent plus a slice of their sales.',
    },
    price: 18000000,
    down: 5400000,
    debt: 12600000,
    mortgagePay: 70000,
    cashflow: 65000,
    maxQty: 2,
    tenants: 40,
    tenantStay: 24,
    reletChance: 0.5,
  },
  {
    id: 'ff-cold',
    size: 'fast',
    kind: 'business',
    tag: 'fasttrack',
    title: { th: 'คลังห้องเย็นส่งออกผลไม้', en: 'Cold-storage hub for fruit exports' },
    story: {
      th: 'ทุเรียนกับลำไยต้องผ่านที่นี่ก่อนขึ้นเรือไปจีน ฤดูผลไม้คือฤดูเก็บเกี่ยวของคุณด้วย',
      en: 'Durian and longan pass through here before the ship to China. Fruit season is your season too.',
    },
    price: 4000000,
    down: 4000000,
    debt: 0,
    cashflow: 190000,
    maxQty: 2,
    volatility: 0.18,
  },

  /* ===================================================== fast track: mega ==
   * The capitalist's deck. These are the balance sheets that show up in other
   * people's lives: where a province banks, where its children study, where it
   * gets its electricity. They carry an `impact` figure alongside the yield.
   */
  {
    id: 'fm-bank',
    size: 'mega',
    kind: 'business',
    tag: 'institution',
    title: { th: 'ธนาคารพาณิชย์ขนาดเล็ก', en: 'Small commercial bank' },
    story: {
      th: 'คุณกลายเป็นฝั่งที่ปล่อยกู้ ดอกเบี้ยที่เคยกัดคุณทุกเดือน ตอนนี้มันไหลเข้ามาแทน',
      en: 'You are the lender now. The interest that used to bite you every month arrives instead.',
    },
    price: 240000000,
    down: 60000000,
    debt: 180000000,
    mortgagePay: 900000,
    cashflow: 1600000,
    volatility: 0.05,
    maxQty: 1,
    impact: 400000,
  },
  {
    id: 'fm-school',
    size: 'mega',
    kind: 'business',
    tag: 'institution',
    title: { th: 'โรงเรียนนานาชาติ', en: 'International school' },
    story: {
      th: 'กำไรต่อบาทที่ลงไปน้อยกว่าห้าง แต่คุณจะได้เจอเด็กที่จบจากที่นี่ไปอีกยี่สิบปี',
      en: 'A thinner margin than a shopping centre, and you will keep meeting its graduates for the next twenty years.',
    },
    price: 90000000,
    down: 22500000,
    debt: 67500000,
    mortgagePay: 340000,
    cashflow: 520000,
    volatility: 0.04,
    maxQty: 2,
    impact: 2400,
  },
  {
    id: 'fm-hospital',
    size: 'mega',
    kind: 'business',
    tag: 'institution',
    title: { th: 'โรงพยาบาลเอกชนต่างจังหวัด', en: 'Private hospital in a provincial town' },
    story: {
      th: 'เมืองนี้เคยต้องนั่งรถสามชั่วโมงเข้ากรุงเทพฯ เพื่อผ่าตัด ตอนนี้ไม่ต้องแล้ว',
      en: 'This town used to drive three hours to Bangkok for surgery. Not any more.',
    },
    price: 180000000,
    down: 45000000,
    debt: 135000000,
    mortgagePay: 680000,
    cashflow: 1150000,
    volatility: 0.04,
    maxQty: 1,
    impact: 60000,
  },
  {
    id: 'fm-power',
    size: 'mega',
    kind: 'business',
    tag: 'institution',
    title: { th: 'โรงไฟฟ้าชีวมวล', en: 'Biomass power plant' },
    story: {
      th: 'เผาเศษไม้กับแกลบที่ชาวไร่เคยเผาทิ้งกลางแจ้ง ขายไฟเข้าระบบตามสัญญายาว',
      en: 'Burns the wood chips and rice husk farmers used to burn in the open, and sells the power on a long contract.',
    },
    price: 150000000,
    down: 37500000,
    debt: 112500000,
    mortgagePay: 560000,
    cashflow: 980000,
    volatility: 0.04,
    maxQty: 2,
    impact: 25000,
  },
  {
    id: 'fm-estate',
    size: 'mega',
    kind: 'property',
    tag: 'institution',
    title: { th: 'นิคมอุตสาหกรรม', en: 'Industrial estate' },
    story: {
      th: 'ขายที่ดินพร้อมระบบสาธารณูปโภคให้โรงงาน แล้วเก็บค่าบริการส่วนกลางไปตลอดอายุสัญญา',
      en: 'Sells serviced land to factories, then collects the estate fee for the life of every lease.',
    },
    price: 320000000,
    down: 80000000,
    debt: 240000000,
    mortgagePay: 1200000,
    cashflow: 2255500,
    maxQty: 1,
    tenants: 20,
    tenantStay: 60,
    reletChance: 0.35,
    impact: 18000,
  },
  {
    id: 'fm-airline',
    size: 'mega',
    kind: 'business',
    tag: 'institution',
    title: { th: 'สายการบินภูมิภาค', en: 'Regional airline' },
    story: {
      th: 'ธุรกิจที่ทำให้คนรวยกลายเป็นคนจนได้เร็วที่สุด น้ำมันขึ้นทีเดียวกำไรทั้งปีหายไปเลย',
      en: 'The fastest way known to turn a large fortune into a small one. One fuel spike and the year is gone.',
    },
    price: 200000000,
    down: 50000000,
    debt: 150000000,
    mortgagePay: 750000,
    cashflow: 1400000,
    failRate: 0.0014,
    maxQty: 1,
    volatility: 0.35,
    impact: 9000,
  },
  {
    id: 'fm-water',
    size: 'mega',
    kind: 'business',
    tag: 'institution',
    title: { th: 'สัมปทานประปาเมือง', en: 'Municipal water concession' },
    story: {
      th: 'ไม่มีใครเลิกใช้น้ำตอนเศรษฐกิจไม่ดี รายได้จึงนิ่งที่สุดในบรรดาของทั้งหมดที่คุณถือ',
      en: 'Nobody stops using water in a downturn, which makes this the steadiest line on your whole balance sheet.',
    },
    price: 260000000,
    down: 65000000,
    debt: 195000000,
    mortgagePay: 980000,
    cashflow: 1550000,
    volatility: 0.03,
    maxQty: 1,
    impact: 120000,
  },
  {
    id: 'fm-telco',
    size: 'mega',
    kind: 'business',
    tag: 'institution',
    title: { th: 'โครงข่ายเน็ตบ้านต่างจังหวัด', en: 'Upcountry home broadband network' },
    story: {
      th: 'วางไฟเบอร์ไปถึงอำเภอที่ค่ายใหญ่ไม่อยากลง เด็กที่นั่นเพิ่งได้เรียนออนไลน์ครั้งแรก',
      en: 'Fibre run out to districts the big carriers skipped. The children there just got their first online class.',
    },
    price: 110000000,
    down: 27500000,
    debt: 82500000,
    mortgagePay: 420000,
    cashflow: 700000,
    volatility: 0.05,
    maxQty: 2,
    impact: 45000,
  },
];

/* ----------------------------------------------------------- traded prices */

/**
 * How each traded thing behaves between market cards.
 *
 * Prices used to sit perfectly still unless a card came up, so a player could
 * reach eighty years old holding gold at the price they paid for it in their
 * thirties. Every month now moves them: `drift` is the long-run trend a year,
 * `vol` is how far a year can wander off it, and `pull` is how strongly the
 * price is dragged back toward the trend line afterwards.
 *
 * The figures are set against what these things have actually done. Thai gold
 * ran from around ฿20,000 a baht-weight in the mid-2010s to an all-time high
 * above ฿80,000 in January 2026 and was back near ฿68,000 by that August: a
 * long climb with drops of fifteen percent inside a year, which is what a 7%
 * trend and 18% annual volatility looks like. The index fund carries the Thai
 * market's long-run price growth with its dividend paid separately, single
 * shares swing two to three times as hard as the index, and bonds barely move
 * at all but are pulled firmly back to par, because that is what they redeem at.
 */
export const priceModels: Record<string, { drift: number; vol: number; pull: number }> = {
  GOLD: { drift: 0.07, vol: 0.18, pull: 0.006 },
  SETX: { drift: 0.06, vol: 0.16, pull: 0.01 },
  MKT: { drift: 0.05, vol: 0.34, pull: 0.015 },
  TRN: { drift: 0.06, vol: 0.32, pull: 0.015 },
  SOLR: { drift: 0.07, vol: 0.4, pull: 0.015 },
  BNK: { drift: 0.04, vol: 0.24, pull: 0.02 },
  REIT: { drift: 0.03, vol: 0.18, pull: 0.025 },
  CORPB: { drift: 0, vol: 0.05, pull: 0.15 },
  GOVB: { drift: 0, vol: 0.04, pull: 0.18 },
  MMF: { drift: 0, vol: 0.005, pull: 0.4 },
};

/* ------------------------------------------------------------ market cards */

export const marketCards: MarketCard[] = [
  {
    id: 'm-mkt-up',
    type: 'price',
    symbol: 'MKT',
    move: 2.8,
    title: { th: 'MKT พุ่งขึ้น 180% เป็น {price}', en: 'MKT jumps 180% to {price}' },
    story: {
      th: 'ห้างประกาศผลประกอบการดีกว่าคาด นักวิเคราะห์แห่ปรับเป้าราคาขึ้นพร้อมกัน',
      en: 'The chain beat its earnings forecast and every analyst raised their target at once.',
    },
  },
  {
    id: 'm-mkt-down',
    type: 'price',
    symbol: 'MKT',
    move: 0.4,
    title: { th: 'MKT ร่วง 60% เหลือ {price}', en: 'MKT slides 60% to {price}' },
    story: {
      th: 'ข่าวลือว่าจะปิดสาขาต่างจังหวัด คนแห่ขายทิ้ง ราคาถูกลงกว่าครึ่ง',
      en: 'A rumour about closing upcountry branches sent everyone to the exit; the price more than halved.',
    },
  },
  {
    id: 'm-trn-up',
    type: 'price',
    symbol: 'TRN',
    move: 2.4,
    title: { th: 'TRN พุ่งขึ้น 140% เป็น {price}', en: 'TRN jumps 140% to {price}' },
    story: {
      th: 'ได้สัญญาขนส่งให้แพลตฟอร์มอีคอมเมิร์ซรายใหญ่ ราคาวิ่งขึ้นสองวันติด',
      en: 'It won the delivery contract for a major e-commerce platform and ran up for two straight days.',
    },
  },
  {
    id: 'm-trn-down',
    type: 'price',
    symbol: 'TRN',
    move: 0.48,
    title: { th: 'TRN ร่วง 52% เหลือ {price}', en: 'TRN drops 52% to {price}' },
    story: {
      th: 'น้ำมันแพงขึ้น ต้นทุนขนส่งพุ่ง กำไรไตรมาสนี้หายไปเกือบหมด',
      en: 'Fuel got expensive, delivery costs spiked, and this quarter’s profit nearly vanished.',
    },
  },
  {
    id: 'm-solr-up',
    type: 'price',
    symbol: 'SOLR',
    move: 2.8,
    title: { th: 'SOLR พุ่งขึ้น 180% เป็น {price}', en: 'SOLR jumps 180% to {price}' },
    story: {
      th: 'รัฐประกาศรับซื้อไฟจากโซลาร์เพิ่ม หุ้นเล็กตัวนี้เด้งแรงกว่าตัวใหญ่',
      en: 'The state raised how much solar power it will buy, and this small cap bounced harder than the big ones.',
    },
  },
  {
    id: 'm-solr-down',
    type: 'price',
    symbol: 'SOLR',
    move: 0.4,
    title: { th: 'SOLR ร่วง 60% เหลือ {price}', en: 'SOLR falls 60% to {price}' },
    story: {
      th: 'บริษัทขาดทุนอีกปี ต้องเพิ่มทุน ผู้ถือหุ้นเดิมโดนลดสัดส่วน',
      en: 'Another loss-making year forced a capital raise, diluting everyone who already held it.',
    },
  },
  {
    id: 'm-bnk-up',
    type: 'price',
    symbol: 'BNK',
    move: 1.875,
    title: { th: 'BNK ขึ้น 88% เป็น {price}', en: 'BNK rises 88% to {price}' },
    story: {
      th: 'ดอกเบี้ยขาขึ้นทำให้ธนาคารกำไรดี ราคาหุ้นวิ่งตามเกือบเท่าตัว',
      en: 'Rising interest rates fattened bank profits and nearly doubled the share price.',
    },
  },
  {
    id: 'm-reit-up',
    type: 'price',
    symbol: 'REIT',
    move: 1.45,
    title: { th: 'REIT ขึ้น 45% เป็นหน่วยละ {price}', en: 'REIT rises 45% to {price} per unit' },
    story: {
      th: 'กองทุนซื้อตึกเพิ่มอีกสองแห่ง ค่าเช่ารวมโตขึ้น คนอยากถือมากขึ้น',
      en: 'The fund bought two more buildings, total rent grew, and demand for units followed.',
    },
  },
  {
    id: 'm-gold-up',
    type: 'price',
    symbol: 'GOLD',
    move: 1.381,
    title: { th: 'ทองขึ้น 38% เป็นบาทละ {price}', en: 'Gold rises 38% to {price} per baht-weight' },
    story: {
      th: 'ตลาดโลกผันผวน คนแห่เข้าซื้อทองเป็นที่หลบภัย ร้านทองคนแน่นตั้งแต่เช้า',
      en: 'Global markets wobbled, everyone ran to gold as shelter, and the gold shops were packed from dawn.',
    },
  },
  {
    id: 'm-gold-up2',
    type: 'price',
    symbol: 'GOLD',
    move: 1.167,
    title: { th: 'ทองขึ้น 17% เป็นบาทละ {price}', en: 'Gold rises 17% to {price} per baht-weight' },
    story: {
      th: 'ธนาคารกลางหลายประเทศทยอยซื้อทองเข้าคลัง ราคาขยับขึ้นช้า ๆ แต่ไม่ยอมลง',
      en: 'Central banks kept adding to their reserves, and the price crept up without ever slipping back.',
    },
  },
  {
    id: 'm-gold-down2',
    type: 'price',
    symbol: 'GOLD',
    move: 0.905,
    title: { th: 'ทองย่อลง 10% เหลือบาทละ {price}', en: 'Gold slips 10% to {price} per baht-weight' },
    story: {
      th: 'ค่าเงินแข็งขึ้น ราคาทองในประเทศเลยย่อลงทั้งที่ราคาทองโลกแทบไม่ขยับ',
      en: 'The currency strengthened, so the local gold price eased even though the world price barely moved.',
    },
  },
  {
    id: 'm-bnk-down',
    type: 'price',
    symbol: 'BNK',
    move: 0.55,
    title: { th: 'BNK ร่วง 45% เหลือ {price}', en: 'BNK slides 45% to {price}' },
    story: {
      th: 'ธนาคารตั้งสำรองหนี้เสียก้อนใหญ่ กำไรหด และประกาศลดปันผลลงในปีหน้า',
      en: 'The bank set aside a large provision for bad loans, profit shrank, and next year’s dividend was cut.',
    },
  },
  {
    id: 'm-reit-down',
    type: 'price',
    symbol: 'REIT',
    move: 0.62,
    title: { th: 'REIT ร่วง 38% เหลือหน่วยละ {price}', en: 'REIT falls 38% to {price} per unit' },
    story: {
      th: 'ตึกในกองทุนสองแห่งผู้เช่ารายใหญ่ย้ายออก ค่าเช่าที่เก็บได้ลดลงทั้งกอง',
      en: 'Anchor tenants left two of the fund’s buildings, and collected rent fell across the whole portfolio.',
    },
  },
  {
    id: 'm-gold-down',
    type: 'price',
    symbol: 'GOLD',
    move: 0.786,
    title: { th: 'ทองร่วง 21% เหลือบาทละ {price}', en: 'Gold drops 21% to {price} per baht-weight' },
    story: {
      th: 'ตลาดหุ้นโลกกลับมาคึกคัก คนขายทองออกไปหาของที่ให้ผลตอบแทนมากกว่าการรอ',
      en: 'World stock markets perked up and people sold gold for things that pay more than waiting does.',
    },
  },
  {
    id: 'm-setx-up',
    type: 'price',
    symbol: 'SETX',
    move: 1.38,
    title: { th: 'ดัชนีหุ้นไทยขึ้น 38% เป็นหน่วยละ {price}', en: 'The Thai index climbs 38% to {price} a unit' },
    story: {
      th: 'ต่างชาติกลับมาซื้อสุทธิติดกันหกสัปดาห์ กองทุนดัชนีขึ้นตามทั้งตลาดโดยไม่ต้องเลือกหุ้นถูกสักตัว',
      en: 'Six straight weeks of foreign buying lifted the whole market, and the index fund with it, without picking a single winner.',
    },
  },
  {
    id: 'm-setx-down',
    type: 'price',
    symbol: 'SETX',
    move: 0.72,
    title: { th: 'ดัชนีหุ้นไทยร่วง 28% เหลือหน่วยละ {price}', en: 'The Thai index falls 28% to {price} a unit' },
    story: {
      th: 'ข่าวการเมืองกับกำไรบริษัทที่ต่ำกว่าคาดมาพร้อมกัน ตลาดลงยกแผงและกองทุนดัชนีก็ลงยกแผงเหมือนกัน',
      en: 'Politics and a disappointing earnings season arrived together. The market fell across the board, and so did the fund.',
    },
  },
  {
    id: 'm-corpb-down',
    type: 'price',
    symbol: 'CORPB',
    move: 0.74,
    title: { th: 'หุ้นกู้ถูกลดอันดับ ราคาเหลือ {price}', en: 'The corporate bonds are downgraded to {price}' },
    story: {
      th: 'บริษัทผู้ออกโดนหั่นเครดิตเรตติ้ง ราคาหุ้นกู้ในตลาดรองร่วงทันที นี่คือส่วนต่างดอกเบี้ยที่คุณได้มาแลกกับอะไร',
      en: 'The issuer was downgraded and the secondary price fell at once. This is what that extra yield was paying you for.',
    },
  },
  {
    id: 'm-govb-up',
    type: 'price',
    symbol: 'GOVB',
    move: 1.12,
    title: { th: 'ดอกเบี้ยขาลง พันธบัตรขึ้นเป็น {price}', en: 'Rates fall and the bonds rise to {price}' },
    story: {
      th: 'แบงก์ชาติลดดอกเบี้ย พันธบัตรเก่าที่จ่ายดอกสูงกว่าจึงมีคนอยากได้ ราคาเลยขึ้น',
      en: 'The central bank cut rates, so older bonds paying the higher coupon became worth having, and their price rose.',
    },
  },
  {
    id: 'm-condo-buyer',
    type: 'offer',
    tag: 'condo',
    multiplier: 1.3,
    title: { th: 'มีคนขอซื้อคอนโดของคุณ', en: 'A buyer wants your condo' },
    story: {
      th: 'นายหน้าโทรมาว่ามีลูกค้าต่างชาติอยากได้ห้องในตึกนี้ ให้ราคา 130% ของราคาบ้านตอนนี้',
      en: 'An agent calls: a foreign client wants a unit in your building and offers 130% of what it is worth now.',
    },
  },
  {
    id: 'm-land-buyer',
    type: 'offer',
    tag: 'land',
    multiplier: 2,
    title: { th: 'ผู้รับเหมาขอซื้อที่ดิน', en: 'A developer wants your land' },
    story: {
      th: 'ถนนตัดใหม่ประกาศแล้วจริง ๆ ผู้รับเหมาเสนอซื้อสองเท่าของราคาที่ดินตอนนี้',
      en: 'The new road was announced after all, and a developer offers double what the land is worth now.',
    },
  },
  {
    id: 'm-apartment-buyer',
    type: 'offer',
    tag: 'apartment',
    multiplier: 1.25,
    title: { th: 'นักลงทุนขอซื้ออพาร์ตเมนต์/หอพัก', en: 'An investor wants your apartment block' },
    story: {
      th: 'กองทุนอสังหาฯ กำลังกว้านซื้อตึกปล่อยเช่า เสนอ 125% ของราคาตึกตอนนี้',
      en: 'A property fund is buying rental blocks and offers 125% of what the block is worth now.',
    },
  },
  {
    id: 'm-house-buyer',
    type: 'offer',
    tag: 'house',
    multiplier: 1.35,
    title: { th: 'ครอบครัวหนึ่งขอซื้อบ้านเช่าของคุณ', en: 'A family wants to buy your rental house' },
    story: {
      th: 'ผู้เช่าเดิมชอบบ้านหลังนี้มากจนขอซื้อเลย ให้ราคา 135% ของราคาบ้านตอนนี้',
      en: 'Your tenants love the house enough to buy it, at 135% of what it is worth now.',
    },
  },
  {
    id: 'm-biz-buyer',
    type: 'bizOffer',
    share: 1.6,
    title: { th: 'มีคนขอซื้อกิจการของคุณ', en: 'Someone wants to buy your business' },
    story: {
      th: 'ผู้ซื้ออยากได้กิจการนี้ไปต่อยอดของเดิมที่เขามีอยู่ เลยยอมจ่าย 160% ของมูลค่ากิจการตอนนี้ แล้วจ่ายสด',
      en: 'The buyer wants it to bolt onto something they already run, and will pay 160% of what the business is worth today, in cash.',
    },
  },
  {
    id: 'm-biz-buyer2',
    type: 'bizOffer',
    share: 1.3,
    title: { th: 'คู่แข่งเสนอซื้อกิจการ', en: 'A competitor bids for your business' },
    story: {
      th: 'คู่แข่งอยากตัดหน้าคุณ แต่ให้แค่ 130% ของมูลค่ากิจการตอนนี้ ขายหรือไม่ขายก็ได้',
      en: 'A rival wants you out of the way, but only bids 130% of what the business is worth today. Take it or leave it.',
    },
  },
];

/* ------------------------------------------------------------ doodad cards */

export const doodads: DoodadCard[] = [
  {
    id: 'x-car',
    title: { th: 'รถเข้าอู่', en: 'The car goes to the garage' },
    story: { th: 'คลัตช์เริ่มลื่นมาสองอาทิตย์แล้ว วันนี้มันตัดสินใจแทนคุณ', en: 'The clutch has been slipping for two weeks. Today it decided for you.' },
    scale: 1.3,
    insurable: true,
    needsCar: true,
  },
  {
    id: 'x-dentist',
    title: { th: 'ค่าทำฟัน', en: 'Dental work' },
    story: { th: 'อุดฟันสองซี่ กับคำเทศน์ฟรีเรื่องการใช้ไหมขัดฟัน', en: 'Two fillings, plus a free lecture about flossing.' },
    scale: 0.65,
  },
  {
    id: 'x-phone',
    title: { th: 'มือถือตกน้ำ', en: 'Phone in the water' },
    story: { th: 'ข่าวดีคือมันกันน้ำ ข่าวร้ายคือรุ่นก่อนหน้าต่างหากที่กันน้ำ', en: 'Good news: it is waterproof. Bad news: it was the previous model that was waterproof.' },
    scale: 1.8,
  },
  {
    id: 'x-wedding',
    title: { th: 'งานแต่งเพื่อน', en: 'A friend’s wedding' },
    story: { th: 'ซองแดงหนึ่งใบ กับค่าเดินทางไปต่างจังหวัดอีกนิดหน่อย', en: 'One envelope of cash, plus a little travel to get there.' },
    scale: 0.3,
    optional: true,
    social: true,
  },
  {
    id: 'x-school',
    title: { th: 'ค่าเทอมลูก', en: 'School fees' },
    story: {
      th: 'เปิดเทอมใหม่มาพร้อมค่าเทอม ค่าชุด ค่าหนังสือ และค่าอะไรอีกไม่รู้ที่โรงเรียนเพิ่งคิดออก ปีหน้าก็มาอีก และแพงขึ้นทุกปีที่ลูกโตขึ้น',
      en: 'A new school year arrives with tuition, uniforms, books, and something else the school just thought of. It comes again next year, and it costs more every year they grow.',
    },
    scale: 0.9,
    perChild: true,
    annual: true,
  },
  {
    id: 'x-ticket',
    title: { th: 'ใบสั่งจราจร', en: 'A traffic fine' },
    story: { th: 'กล้องตรวจจับความเร็วไม่เคยฟังเหตุผลว่าคุณกำลังรีบ', en: 'The speed camera has never once cared that you were in a hurry.' },
    scale: 0.15,
  },
  {
    id: 'x-aircon',
    title: { th: 'แอร์บ้านพัง', en: 'The air conditioner dies' },
    story: { th: 'พังกลางเดือนเมษายน จังหวะที่แย่ที่สุดเท่าที่จะเป็นไปได้', en: 'It died in the middle of April, the worst possible timing.' },
    scale: 2.3,
  },
  {
    id: 'x-vet',
    title: { th: 'ค่ารักษา{petName}', en: 'Vet bill for {petName}' },
    story: { th: '{pet} ไปกินอะไรมาก็ไม่รู้ หมอบอกว่าเดี๋ยวก็หาย แต่กระเป๋าเงินคุณอาจไม่หาย', en: '{pet} ate something unidentifiable. The vet says it will recover; your wallet may not.' },
    scale: 0.85,
    pet: true,
  },
  {
    id: 'x-trip',
    title: { th: 'ทริปเที่ยวกับเพื่อน', en: 'A trip with friends' },
    story: { th: 'กลุ่มไลน์จองตั๋วไปแล้ว เหลือแค่คุณที่ยังไม่ได้โอน', en: 'The group chat already booked the tickets. Only your transfer is missing.' },
    scale: 1.4,
    optional: true,
    social: true,
  },
  {
    id: 'x-insurance',
    title: { th: 'ต่อประกันรถ', en: 'Car insurance renewal' },
    story: {
      th: 'ประกันชั้นหนึ่งเป็นภาคสมัครใจ ไม่ต่อก็ขับได้ตามกฎหมาย ค่าเบี้ยขึ้นทุกปีแม้ปีนี้จะขับดีขึ้นก็ตาม และมันจะดูเหมือนเงินทิ้งไปเรื่อย ๆ จนถึงเดือนที่มันไม่ใช่',
      en: 'Comprehensive cover is voluntary; the law lets you drive without it. The premium rises every year, even the years you drove better, and it looks like money thrown away right up until the month it is not.',
    },
    scale: 2.1,
    optional: true,
    declineNote: {
      th: 'ไม่ต่อประกันปีนี้ เก็บเงินไว้ในกระเป๋าได้ทั้งก้อน จากนี้ถ้ารถมีเรื่อง ค่าซ่อมเป็นของคุณคนเดียวเต็มจำนวน',
      en: 'No cover this year and the whole premium stays in your pocket. From here, anything that happens to the car is yours to pay in full.',
    },
  },
  {
    /**
     * The bills a child brings that are not food and not school: the hospital
     * night, the policy that would have paid for it, the toys, and the trips
     * that are half the reason people have children in the first place.
     */
    id: 'x-childsick',
    title: { th: 'ลูกไม่สบาย ต้องนอนโรงพยาบาล', en: 'A child in hospital overnight' },
    story: {
      th: 'ไข้ขึ้นสูงตอนตีสอง ห้องฉุกเฉินบอกให้นอนดูอาการหนึ่งคืน ค่าห้องกับค่ายาไม่ได้รอให้ถึงสิ้นเดือน',
      en: 'A fever at two in the morning, one night under observation, and a bill that does not wait for payday.',
    },
    scale: 4.2,
    perChild: true,
    needsChild: true,
    insurableChild: true,
  },
  {
    id: 'x-childcover',
    title: { th: 'ทำประกันสุขภาพให้ลูก', en: 'Health cover for the children' },
    story: {
      th: 'เบี้ยประกันสุขภาพเด็กเริ่มราวสองพันกว่าบาทต่อเดือนต่อคน จ่ายทุกเดือนไปโดยไม่ได้อะไรกลับมาเลย จนถึงคืนที่ได้',
      en: 'Child health cover starts at a couple of thousand baht a month each, paid every month for nothing at all, right up until the night it pays for everything.',
    },
    scale: 0,
    optional: true,
    needsChild: true,
    buysChildCover: true,
    declineNote: {
      th: 'ยังไม่ทำประกันให้ลูก เงินอยู่ในกระเป๋าครบทุกบาท ถ้าลูกเจ็บป่วยขึ้นมา ค่ารักษาเป็นของคุณเต็มจำนวน',
      en: 'No cover for now and every baht stays in your pocket. If a child gets ill, the bill is entirely yours.',
    },
  },
  {
    id: 'x-childtrip',
    title: { th: 'พาลูกไปเที่ยว กับของเล่นที่สัญญาไว้', en: 'A trip with the children, and the toy you promised' },
    story: {
      th: 'ปิดเทอมนี้ที่บ้านคุยกันว่าจะไปทะเล ค่าที่พักกับค่ารถไม่เท่าไหร่ ที่หนักคือของทุกอย่างที่เดินผ่านแล้วมีคนชี้',
      en: 'The family agreed on the sea this school holiday. The room and the fuel are the small part; the expensive part is everything anybody points at on the way.',
    },
    scale: 1.5,
    perChild: true,
    needsChild: true,
    optional: true,
    declineNote: {
      th: 'ปีนี้ไม่ได้ไป เงินยังอยู่ ส่วนเด็ก ๆ จำได้ว่าปีนี้ไม่ได้ไป',
      en: 'No trip this year. The money stays, and the children remember that there was no trip this year.',
    },
  },
  {
    id: 'x-anniversary',
    title: { th: 'ครบรอบ กับวันเกิดคู่ชีวิต', en: 'An anniversary, and their birthday' },
    story: {
      th: 'ร้านที่จองไว้ล่วงหน้าสองเดือน กับของขวัญที่ดูราคาแล้ววางลง แล้วก็หยิบขึ้นมาใหม่ ปีหนึ่งมีไม่กี่วันที่ยอมจ่ายโดยไม่คิดเลข',
      en: 'The restaurant booked two months ahead, and the present you put down after seeing the price and then picked up again. There are only a few days a year worth not doing the arithmetic on.',
    },
    scale: 1.9,
    optional: true,
    social: true,
    needsPartner: true,
    declineNote: {
      th: 'ปีนี้ผ่านไปเงียบ ๆ ประหยัดเงินได้จริง และอีกฝ่ายก็จำได้จริงเหมือนกัน',
      en: 'The day passed quietly. It really did save the money, and they really do remember.',
    },
  },
  {
    /**
     * The lottery. Twice a month, a hundred baht at a time, and the arithmetic
     * is not close: the first prize is one ticket in a million and the whole
     * draw pays back about sixty satang on the baht. It is in the game because
     * it is in the country, and because expected value is easier to feel with a
     * ticket in your hand than on a whiteboard.
     */
    id: 'x-lottery',
    title: { th: 'งวดนี้ซื้อหวยไหม', en: 'The draw is on the sixteenth' },
    story: {
      th: 'เลขที่ฝันเมื่อคืนกับเลขทะเบียนรถที่จอดหน้าบ้าน คนขายบอกว่าเหลือใบสุดท้ายพอดี ทุกงวดก็เหลือใบสุดท้ายพอดีทุกที',
      en: 'The number from last night’s dream and the plate on the car outside. The seller says it is the last one left, the way it is every draw.',
    },
    scale: 0.12,
    optional: true,
    lottery: true,
    declineNote: {
      th: 'ไม่ซื้องวดนี้ เงินอยู่ครบ และค่าคาดหวังที่หายไปคือติดลบอยู่แล้ว',
      en: 'No ticket this time. The money stays, and the expected value you gave up was negative anyway.',
    },
  },
  {
    id: 'x-chair',
    title: { th: 'เพื่อนชวนเล่นแชร์', en: 'A rotating savings circle' },
    story: {
      th: 'วงละสิบคน ส่งเดือนละเท่ากัน ใครอยากได้ก่อนก็ประมูลดอกสูงกว่าคนอื่น ได้เงินก้อนเร็วแปลว่าจ่ายแพงกว่า ได้ท้ายวงแปลว่าได้ดอกจากคนอื่น ทั้งหมดนี้ตั้งอยู่บนความเชื่อใจล้วน ๆ ไม่มีใครค้ำอะไรให้',
      en: 'Ten people, the same amount every month, and whoever wants the pot first bids the highest rate for it. Going early costs you; going last pays you. The whole thing rests on trust and nothing else.',
    },
    scale: 1.6,
    optional: true,
    social: true,
    chair: true,
    declineNote: {
      th: 'ไม่เข้าวงแชร์ครั้งนี้ ไม่ได้ดอกจากใคร และไม่ต้องลุ้นว่าท้าววงจะหอบเงินหนีไหม',
      en: 'No circle this time: no interest from anybody, and nothing to lose if the organiser disappears.',
    },
  },
  {
    id: 'x-lend',
    title: { th: 'ญาติขอยืมเงิน', en: 'A relative asks for a loan' },
    story: { th: 'ยืมแล้วอาจได้คืน อาจไม่ได้คืน แต่ที่แน่ ๆ คือความสัมพันธ์จะเปลี่ยนไปทั้งสองทาง', en: 'You might get it back, you might not. Either way the relationship changes.' },
    scale: 3,
    optional: true,
    social: true,
  },
  {
    id: 'x-tv',
    title: { th: 'ทีวีใหม่ผ่อน 0%', en: 'A new TV at 0% instalments' },
    story: { th: 'ผ่อน 0% ฟังดูเหมือนฟรี แต่มันเพิ่มรายจ่ายรายเดือนของคุณจริง ๆ', en: 'Zero percent sounds free, but it still adds a real line to your monthly expenses.' },
    scale: 0,
    optional: true,
    instalment: { balanceScale: 2.8, paymentScale: 0.14 },
  },
  {
    id: 'x-crash',
    title: { th: 'รถชนกลางสี่แยก', en: 'A crash at the junction' },
    story: {
      th: 'ไฟเหลืองยาวกว่าที่คิด อีกคันมาเร็วกว่าที่คิด ไม่มีใครเจ็บ แต่หน้ารถพังทั้งหน้าและอู่ไม่ได้คิดราคาตามความรู้สึกของใคร',
      en: 'The amber lasted less than it looked and the other car came faster than it looked. Nobody was hurt, the whole front end is gone, and the garage does not price by how unfair it felt.',
    },
    scale: 5,
    insurable: true,
    needsCar: true,
  },
  {
    id: 'x-utility',
    title: { th: 'ค่าน้ำค่าไฟหน้าร้อน', en: 'Summer utility bill' },
    story: { th: 'เดือนนี้แอร์ทำงานหนักกว่าคุณ และมันก็เรียกค่าแรงด้วย', en: 'This month the air conditioner worked harder than you did, and it billed you for it.' },
    scale: 0.6,
  },
  {
    /**
     * The only card in the deck that buys nothing you can point at. It is here
     * so the fast-track book-rights cheque has somebody to belong to: that card
     * says "the story you wrote while still on the wheel", and until this
     * existed there was no wheel and no story, just money arriving.
     */
    id: 'x-writing',
    title: { th: 'เริ่มเขียนต้นฉบับตอนกลางคืน', en: 'Starting the manuscript at night' },
    story: {
      th: 'คอร์สเขียนออนไลน์กับเวลาที่ต้องแลกมาด้วยการนอนน้อยลงวันละชั่วโมง เงินก้อนนี้ไม่ได้ซื้ออะไรที่จับต้องได้เลย และอาจไม่ได้อะไรกลับมาสักบาทตลอดชีวิต หรืออาจได้กลับมาในอีกสิบปีข้างหน้าตอนที่คุณลืมไปแล้วว่าเคยเขียน',
      en: 'An online writing course and an hour less sleep a night. This money buys nothing you can hold, and it may never come back at all, or it may come back in ten years when you have forgotten you ever wrote anything.',
    },
    scale: 1.1,
    optional: true,
    writes: true,
    declineNote: {
      th: 'ปิดแท็บคอร์สไป เดือนนี้ก็เหมือนเดือนก่อน ๆ ไม่มีอะไรเสีย และไม่มีอะไรเริ่ม',
      en: 'You closed the tab. This month looks like all the ones before it: nothing lost, and nothing begun.',
    },
  },
  {
    id: 'x-gift',
    title: { th: 'ของขวัญวันเกิดลูก', en: 'Birthday present for the kids' },
    story: {
      th: 'ของที่ลูกขอไว้ราคาสูงกว่าที่คิด เดือนนี้ตัวเลขในบัญชีก็ตึงกว่าที่คิดเหมือนกัน จะซื้อก็ได้ จะบอกว่าปีนี้ขอผ่านก่อนก็ได้ ไม่มีใครในเกมนี้มีสิทธิ์ตัดสินคุณ',
      en: 'What they asked for costs more than you thought, and this month is tighter than you thought. You can buy it, or you can say not this year. Nobody in this game gets to judge you for either.',
    },
    scale: 0.45,
    perChild: true,
    annual: true,
    optional: true,
    declineNote: {
      th: 'เงินก้อนนี้ยังอยู่ในบัญชีคุณครบ อีกยี่สิบปีลูกอาจจำวันเกิดปีนี้ไม่ได้เลย หรืออาจจำได้แม่นกว่าที่คุณอยากให้จำ เกมนี้คำนวณให้คุณได้ทุกอย่าง ยกเว้นว่าตกลงแล้วคุ้มไหม',
      en: 'The money is still in your account, every baht of it. In twenty years they may not remember this birthday at all, or they may remember it more precisely than you would like. This game can compute everything for you except whether that was worth it.',
    },
  },
];

/* -------------------------------------------------------- fast-track cards */

export const fastCards: FastCard[] = [
  {
    id: 'f-bonus-div',
    type: 'bonus',
    title: { th: 'เงินปันผลพิเศษ', en: 'Special dividend' },
    story: { th: 'กิจการหนึ่งที่คุณถืออยู่มีกำไรสะสมเยอะเกินไป เลยจ่ายคืนผู้ถือหุ้นก้อนหนึ่ง', en: 'One of your holdings built up too much retained profit and paid a slice back to shareholders.' },
    months: 4,
    needs: 'shares',
  },
  {
    id: 'f-bonus-book',
    type: 'bonus',
    title: { th: 'ขายลิขสิทธิ์หนังสือ', en: 'Book rights sold' },
    story: {
      th: 'ต้นฉบับที่คุณนั่งเขียนตอนกลางคืนสมัยยังอยู่ในวงล้อ วันนี้มีสำนักพิมพ์ต่างประเทศขอซื้อลิขสิทธิ์แปล ค่าคอร์สที่จ่ายไปวันนั้นเพิ่งได้คำตอบวันนี้',
      en: 'The manuscript you sat up writing back when you were still on the wheel just sold its translation rights abroad. The course you paid for that year finally answered today.',
    },
    months: 9,
    needs: 'book',
  },
  {
    /**
     * The guaranteed bonus. Every other card in this deck now asks the player to
     * own something first, so one of them has to be true for everybody or a
     * portfolio of pure cash would face an empty deck.
     */
    id: 'f-bonus-refund',
    type: 'bonus',
    title: { th: 'ได้ภาษีคืนก้อนใหญ่', en: 'A large tax refund' },
    story: {
      th: 'ยื่นแบบปีนี้แล้วพบว่าจ่ายเกินไปหลายรายการ ค่าลดหย่อนที่ลืมใช้มาสองปีถูกนับย้อนให้ทั้งหมด เงินที่เคยเป็นของคุณอยู่แล้วเดินทางกลับบ้าน',
      en: 'This year’s filing turned up several things you had overpaid, and two years of allowances you had forgotten to claim were counted back. Money that was already yours found its way home.',
    },
    months: 3,
  },
  {
    id: 'f-bonus-land',
    type: 'bonus',
    title: { th: 'เวนคืนที่ดิน', en: 'Land expropriated' },
    story: {
      th: 'ทางด่วนสายใหม่ตัดผ่านที่ดินของคุณพอดี รัฐจ่ายค่าทดแทนสูงกว่าราคาประเมิน แต่ไม่ได้ถามว่าคุณอยากขายไหม ที่ดินแปลงนั้นออกจากมือคุณไปแล้ว',
      en: 'The new expressway runs straight through your plot. The state pays above the assessed value and does not ask whether you wanted to sell. That land is no longer yours.',
    },
    months: 0,
    needs: 'land',
    effect: 'expropriate',
  },
  {
    id: 'f-bonus-ipo',
    type: 'bonus',
    title: { th: 'กิจการเข้าตลาดหลักทรัพย์', en: 'One of your companies lists' },
    story: {
      th: 'บริษัทที่คุณถือหุ้นอยู่เข้าตลาด คุณขายออกบางส่วนตอน IPO ที่ราคาสูงกว่าที่เคยประเมินไว้มาก',
      en: 'A company you hold went public, and you sold part of your stake at the offer price, well above anything it had been valued at before.',
    },
    months: 12,
    needs: 'business',
  },
  {
    id: 'f-bonus-concession',
    type: 'bonus',
    title: { th: 'ได้สัมปทานเพิ่ม', en: 'A concession renewed and widened' },
    story: {
      th: 'สัญญาเดิมต่ออายุพร้อมขยายพื้นที่ให้ และมีเงินล่วงหน้าจ่ายมาก้อนหนึ่งตอนเซ็น',
      en: 'The existing contract was renewed with more territory attached, and an advance arrived on signing.',
    },
    months: 7,
    needs: 'business',
  },
  {
    id: 'f-bonus-anchor',
    type: 'bonus',
    title: { th: 'ผู้เช่ารายใหญ่เซ็นสัญญายาว', en: 'An anchor tenant signs long' },
    story: {
      th: 'บริษัทระดับประเทศเช่าพื้นที่ก้อนใหญ่สัญญาสิบปี พร้อมวางมัดจำล่วงหน้าหนึ่งปีเต็ม',
      en: 'A national company took a large space on a ten-year lease and paid a full year up front.',
    },
    months: 6,
    needs: 'tenants',
  },
  {
    id: 'f-bonus-insurance',
    type: 'bonus',
    title: { th: 'ประกันจ่ายเต็มวงเงิน', en: 'The insurer paid in full' },
    story: {
      th: 'ครั้งนี้กรมธรรม์ครอบคลุมจริงและจ่ายเต็ม เบี้ยที่จ่ายมาหลายปีเพิ่งพิสูจน์ตัวเองในวันเดียว',
      en: 'This time the policy actually covered it and paid in full. Years of premiums justified themselves in a single day.',
    },
    months: 5,
    needs: 'insured',
  },
  {
    id: 'f-set-tax',
    type: 'setback',
    title: { th: 'ภาษีย้อนหลัง', en: 'Back taxes' },
    story: { th: 'สรรพากรตรวจย้อนสามปี และพบว่าคุณหักค่าใช้จ่ายเกินไปหน่อย', en: 'The revenue office reviewed three years and found you had deducted a little too much.' },
    months: 3,
  },
  {
    id: 'f-set-market',
    type: 'setback',
    title: { th: 'ตลาดผันผวน', en: 'The market turns' },
    // Deliberately the one setback with no prerequisite: whatever you hold, a
    // slow year reaches it, and every portfolio needs more than one thing that
    // can go wrong.
    story: {
      th: 'เศรษฐกิจชะลอทั้งประเทศ ไม่ว่าเงินของคุณไปอยู่ในอะไร ปีนี้มันจ่ายกลับมาน้อยลงพร้อมกันหมด',
      en: 'The whole economy slowed. Whatever your money is sitting in, this year all of it pays back less at once.',
    },
    months: 0,
    incomeLossPct: 0.12,
  },
  {
    id: 'f-set-fire',
    type: 'setback',
    title: { th: 'ไฟไหม้โกดัง', en: 'Warehouse fire' },
    story: { th: 'ประกันจ่ายไม่ครบ ส่วนต่างคุณต้องควักเอง และรายได้หยุดไปช่วงหนึ่ง', en: 'Insurance did not cover everything, you paid the gap, and income paused for a while.' },
    months: 2.5,
    incomeLossPct: 0.06,
    needs: 'property',
  },
  {
    id: 'f-set-rates',
    type: 'setback',
    title: { th: 'ดอกเบี้ยขาขึ้น', en: 'Rates go up' },
    story: {
      th: 'แบงก์ชาติขึ้นดอกเบี้ยสามครั้งในปีเดียว ทุกก้อนที่คุณกู้มาผ่อนแพงขึ้นพร้อมกันหมด',
      en: 'Three rate rises in one year. Every loan you carry got more expensive at the same time.',
    },
    months: 1.5,
    incomeLossPct: 0.07,
    needs: 'debt',
  },
  {
    id: 'f-set-flood',
    type: 'setback',
    title: { th: 'น้ำท่วมใหญ่', en: 'The big flood' },
    story: {
      th: 'น้ำเข้าชั้นล่างทุกหลัง ผู้เช่าย้ายออกระหว่างซ่อม และประกันภัยน้ำท่วมมีเพดานจ่าย',
      en: 'Water reached the ground floor of everything. Tenants moved out during repairs, and the flood cover has a ceiling.',
    },
    months: 4,
    incomeLossPct: 0.05,
    needs: 'tenants',
  },
  {
    id: 'f-set-manager',
    type: 'setback',
    title: { th: 'ผู้จัดการยักยอกเงิน', en: 'The manager was stealing' },
    story: {
      th: 'คนที่คุณไว้ใจให้ดูแลแทนมาสองปี ทำบัญชีสองชุดมาตลอด กว่าจะรู้ก็หายไปหลายเดือนแล้ว',
      en: 'The person you trusted to run things for two years had been keeping two sets of books. By the time it surfaced, months of money were gone.',
    },
    months: 5,
    needs: 'business',
  },
  {
    id: 'f-set-lawsuit',
    type: 'setback',
    title: { th: 'โดนฟ้องร้อง', en: 'Sued' },
    story: {
      th: 'ผู้เช่ารายหนึ่งลื่นล้มในพื้นที่ส่วนกลาง คดียืดเยื้อสองปี ค่าทนายเดินทุกเดือนไม่ว่าจะชนะหรือแพ้',
      en: 'A tenant slipped in a common area. The case dragged on for two years, and the lawyers billed every month either way.',
    },
    months: 3.5,
    needs: 'tenants',
  },
  {
    id: 'f-set-competitor',
    type: 'setback',
    title: { th: 'เจ้าใหญ่เปิดตรงข้าม', en: 'A giant opens across the road' },
    story: {
      th: 'เชนระดับประเทศมาเปิดสาขาห่างไปสองร้อยเมตร ลูกค้าประจำของคุณหายไปเกือบครึ่งในเดือนเดียว',
      en: 'A national chain opened two hundred metres away, and half your regulars were gone within a month.',
    },
    months: 0,
    incomeLossPct: 0.18,
    needs: 'business',
  },
  {
    id: 'f-set-cyber',
    type: 'setback',
    title: { th: 'ระบบโดนแฮก', en: 'The systems were breached' },
    story: {
      th: 'ข้อมูลลูกค้าหลุด ต้องแจ้งทุกคน จ้างทีมกู้ระบบ และจ่ายค่าปรับตามกฎหมายคุ้มครองข้อมูล',
      en: 'Customer data leaked. Everyone had to be notified, a response team hired, and the data-protection fine paid.',
    },
    months: 4.5,
    needs: 'business',
  },
  {
    id: 'f-set-landtax',
    type: 'setback',
    title: { th: 'ประเมินภาษีที่ดินใหม่', en: 'The land was reassessed' },
    story: {
      th: 'ราคาประเมินรอบใหม่ขยับขึ้นทั้งย่าน ที่ดินที่คุณถือไว้เฉย ๆ กลายเป็นของที่ต้องจ่ายเพื่อถือ',
      en: 'The new valuation lifted the whole district. Land you were simply holding became land you pay to hold.',
    },
    months: 2,
    needs: 'land',
  },
  {
    id: 'f-set-keystaff',
    type: 'setback',
    title: { th: 'ทีมหลักลาออกยกชุด', en: 'The core team walked out' },
    story: {
      th: 'คู่แข่งซื้อตัวหัวหน้าทีมไป แล้วลูกทีมตามไปทั้งแผนก ต้องจ้างใหม่และเริ่มสอนงานกันใหม่หมด',
      en: 'A competitor hired your team lead, and the whole department followed. Everyone had to be replaced and retrained.',
    },
    months: 2.5,
    incomeLossPct: 0.08,
    needs: 'business',
  },
  {
    id: 'f-set-baht',
    type: 'setback',
    title: { th: 'บาทแข็งค่า', en: 'The baht strengthens' },
    story: {
      th: 'ลูกค้าต่างประเทศจ่ายเท่าเดิมเป็นดอลลาร์ แต่พอแปลงกลับมาเป็นบาทแล้วหายไปเป็นสิบเปอร์เซ็นต์',
      en: 'Overseas customers paid the same in dollars, and ten percent of it evaporated on the way back into baht.',
    },
    months: 0,
    incomeLossPct: 0.1,
    needs: 'business',
  },
  {
    id: 'f-set-permit',
    type: 'setback',
    title: { th: 'ใบอนุญาตไม่ผ่าน', en: 'The permit did not come through' },
    story: {
      th: 'กฎผังเมืองใหม่ออกหลังคุณเริ่มก่อสร้างไปแล้ว ต้องแก้แบบและยื่นใหม่ทั้งชุด',
      en: 'New zoning rules landed after construction had started. The drawings had to be redone and refiled from scratch.',
    },
    months: 3,
    needs: 'property',
  },
  {
    id: 'f-set-recall',
    type: 'setback',
    title: { th: 'เรียกคืนสินค้า', en: 'Product recall' },
    story: {
      th: 'ล็อตหนึ่งมีปัญหา ต้องเก็บกลับจากทุกสาขาและชดเชยลูกค้า ชื่อเสียงกู้คืนช้ากว่าเงิน',
      en: 'One batch was faulty. It had to be pulled from every branch and customers compensated; the reputation took longer to recover than the money.',
    },
    months: 3.5,
    incomeLossPct: 0.05,
    needs: 'business',
  },
  {
    id: 'f-set-partner',
    type: 'setback',
    title: { th: 'หุ้นส่วนขอถอนตัว', en: 'Your partner wants out' },
    story: {
      th: 'เพื่อนที่ลงขันมาด้วยกันขอถอนทุนคืนกลางทาง คุณต้องหาเงินมาซื้อหุ้นส่วนของเขาเอง',
      en: 'The friend who put in money alongside you wants it back, and you have to buy their share yourself.',
    },
    months: 6,
    needs: 'business',
  },
];

/* ------------------------------------------------------------------ dreams */

export const dreams: Dream[] = [
  {
    id: 'dr-foundation',
    title: { th: 'เปิดมูลนิธิช่วยเด็กด้อยโอกาส', en: 'Open a foundation for underprivileged children' },
    story: { th: 'ทุนตั้งต้นพอให้มูลนิธิเดินได้เองสิบปีโดยไม่ต้องขอใคร', en: 'Enough endowment for the foundation to run itself for ten years without asking anyone.' },
    cost: 6000000,
  },
  {
    id: 'dr-world',
    title: { th: 'เที่ยวรอบโลกหนึ่งปีเต็ม', en: 'Travel the world for a full year' },
    story: { th: 'ไม่ใช่ทริปพักร้อน แต่เป็นหนึ่งปีที่ไม่มีวันไหนต้องขอลา', en: 'Not a holiday, but a year in which no day needs anyone’s permission.' },
    cost: 4000000,
  },
  {
    id: 'dr-beach',
    title: { th: 'บ้านริมทะเลที่ภูเก็ต', en: 'A house by the sea in Phuket' },
    story: { th: 'ตื่นมาเห็นทะเลทุกเช้า และไม่มีนัดประชุมตอนเก้าโมง', en: 'Waking up to the sea every morning, with no nine o’clock meeting.' },
    cost: 15000000,
  },
  {
    id: 'dr-study',
    title: { th: 'ส่งลูกเรียนต่างประเทศจนจบ', en: 'Send the kids abroad through graduation' },
    story: { th: 'จ่ายครบตั้งแต่วันแรกถึงวันรับปริญญา โดยไม่ต้องกู้สักบาท', en: 'Paid in full from day one to graduation day, without borrowing a single baht.' },
    cost: 9000000,
  },
  {
    id: 'dr-bookshop',
    title: { th: 'เปิดร้านหนังสือในฝัน', en: 'Open the bookshop you always wanted' },
    story: { th: 'ร้านเล็ก ๆ ที่ไม่ต้องกำไรก็อยู่ได้ เพราะคุณไม่ได้ต้องการกำไรจากมัน', en: 'A small shop that survives without profit, because profit was never the point.' },
    cost: 3000000,
  },
  {
    id: 'dr-school',
    title: { th: 'สร้างโรงเรียนในหมู่บ้านเกิด', en: 'Build a school in your home village' },
    story: { th: 'อาคารเรียนหลังใหม่ พร้อมทุนจ้างครูอีกสิบปี', en: 'A new school building, plus ten years of teachers’ salaries.' },
    cost: 11000000,
  },
  {
    id: 'dr-car',
    title: { th: 'ซูเปอร์คาร์คันที่เคยติดผนังห้อง', en: 'The supercar that was a poster on your wall' },
    story: { th: 'โปสเตอร์ในห้องตอนเด็ก ย้ายลงมาจอดในโรงรถจริง ๆ', en: 'The childhood poster, finally parked in an actual garage.' },
    cost: 12000000,
  },
  {
    id: 'dr-album',
    title: { th: 'ออกอัลบั้มเพลงของตัวเอง', en: 'Record your own album' },
    story: { th: 'จ้างห้องอัดดี ๆ วงเต็มวง และไม่ต้องแคร์ว่าจะขายได้ไหม', en: 'A proper studio, a full band, and no need to care whether it sells.' },
    cost: 3500000,
  },
];

/* ------------------------------------------------------------------ boards */

/**
 * 24 tiles = the perimeter of a 7x7 grid, index 0 at the top-left, clockwise.
 * Five paydays against three doodads: with four of each the wheel paid out
 * barely faster than it took, and the median escape ran past a hundred turns.
 */
export const RAT_BOARD: RatTile[] = [
  'payday', 'deal', 'doodad', 'deal', 'charity', 'deal',
  'payday', 'market', 'deal', 'payday', 'deal', 'baby',
  'payday', 'deal', 'market', 'deal', 'doodad', 'deal',
  'payday', 'market', 'deal', 'downsized', 'deal', 'doodad',
];

/**
 * Two market tiles were carved out of the deal tiles so prices out here can
 * move and holdings can be sold to a buyer, which the fast track had no way of
 * doing at all. The four `dream` tiles turn into legacy tiles once every dream
 * is achieved, so nothing on this ring ever goes dead.
 */
export const FAST_BOARD: FastTile[] = [
  'fastpay', 'fastdeal', 'bonus', 'fastdeal', 'dream', 'fastmarket',
  'fastpay', 'setback', 'fastdeal', 'dream', 'fastdeal', 'bonus',
  'fastpay', 'fastdeal', 'dream', 'fastmarket', 'setback', 'fastdeal',
  'fastpay', 'bonus', 'fastdeal', 'dream', 'fastdeal', 'setback',
];

/* ---------------------------------------------------------------- lookups */

export const dealById = new Map(deals.map((d) => [d.id, d]));
export const marketById = new Map(marketCards.map((c) => [c.id, c]));
export const doodadById = new Map(doodads.map((c) => [c.id, c]));
export const fastById = new Map(fastCards.map((c) => [c.id, c]));
export const dreamById = new Map(dreams.map((d) => [d.id, d]));
export const professionById = new Map(professions.map((p) => [p.id, p]));
export const studyRouteById = new Map(studyRoutes.map((r) => [r.id, r]));

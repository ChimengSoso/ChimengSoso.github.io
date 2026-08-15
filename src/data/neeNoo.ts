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
  Profession,
  RatTile,
} from '../lib/neeNoo/types';

/* ------------------------------------------------------------- professions */

/**
 * Balance rule for every job: the escape bar (total expenses) divided by the
 * starting monthly cash flow lands between about 2.1 and 3.3. The spread is
 * deliberate, since the point of the game is that a bigger salary does not
 * shorten the run, but nobody should be handed an unplayable ratio either.
 */
export const professions: Profession[] = [
  {
    id: 'office',
    name: { th: 'พนักงานออฟฟิศ', en: 'Office worker' },
    blurb: {
      th: 'เงินเดือนน้อยที่สุดในเกม แต่รายจ่ายก็เบาที่สุด เส้นชัยอยู่ใกล้กว่าที่คิด',
      en: 'The smallest salary in the game, but also the lightest expenses. The finish line is closer than it looks.',
    },
    salary: 22000,
    taxes: 900,
    otherExpenses: 6000,
    childCost: 2200,
    cash: 30000,
    debts: [
      { key: 'car', balance: 240000, payment: 5400 },
      { key: 'card', balance: 55000, payment: 2700 },
      { key: 'retail', balance: 20000, payment: 1000 },
    ],
  },
  {
    id: 'teacher',
    name: { th: 'ครูโรงเรียนรัฐ', en: 'Government school teacher' },
    blurb: {
      th: 'มั่นคง มีบ้านมีรถแล้ว แต่ กยศ. ยังตามมาทุกเดือน',
      en: 'Stable, already has a house and a car, but the student loan still shows up every month.',
    },
    salary: 26000,
    taxes: 1300,
    otherExpenses: 6500,
    childCost: 2500,
    cash: 30000,
    debts: [
      { key: 'home', balance: 480000, payment: 3200 },
      { key: 'car', balance: 180000, payment: 4500 },
      { key: 'card', balance: 25000, payment: 1300 },
      { key: 'student', balance: 90000, payment: 900 },
    ],
  },
  {
    id: 'nurse',
    name: { th: 'พยาบาลวิชาชีพ', en: 'Registered nurse' },
    blurb: {
      th: 'ทำงานหนัก เงินเข้าเยอะกว่าครู แต่บ้านหลังใหญ่กว่าก็กินไปเยอะกว่า',
      en: 'Works hard and earns more than the teacher, but the bigger house eats more of it.',
    },
    salary: 34000,
    taxes: 2100,
    otherExpenses: 7500,
    childCost: 2800,
    cash: 35000,
    debts: [
      { key: 'home', balance: 900000, payment: 5500 },
      { key: 'car', balance: 280000, payment: 6200 },
      { key: 'card', balance: 40000, payment: 2000 },
      { key: 'student', balance: 60000, payment: 700 },
    ],
  },
  {
    id: 'cafe',
    name: { th: 'เจ้าของร้านกาแฟ', en: 'Coffee shop owner' },
    blurb: {
      th: 'เป็นเจ้าของกิจการแล้ว แต่รายได้ยังผูกกับการยืนชงเอง จึงยังนับเป็นเงินเดือน',
      en: 'Already a business owner, but the income still depends on standing behind the counter, so it counts as salary.',
    },
    salary: 38000,
    taxes: 1800,
    otherExpenses: 8200,
    childCost: 3000,
    cash: 35000,
    debts: [
      { key: 'retail', balance: 560000, payment: 7500 },
      { key: 'car', balance: 260000, payment: 5500 },
      { key: 'card', balance: 60000, payment: 3000 },
    ],
  },
  {
    id: 'engineer',
    name: { th: 'วิศวกรโยธา', en: 'Civil engineer' },
    blurb: {
      th: 'เงินเดือนดี บ้านหลังโต รถคันสวย และรายจ่ายที่โตตามเงินเดือนพอดี',
      en: 'Good salary, big house, nice car, and expenses that grew exactly as fast as the salary did.',
    },
    salary: 48000,
    taxes: 3600,
    otherExpenses: 10400,
    childCost: 3500,
    cash: 50000,
    debts: [
      { key: 'home', balance: 1500000, payment: 9000 },
      { key: 'car', balance: 480000, payment: 8500 },
      { key: 'card', balance: 50000, payment: 2500 },
    ],
  },
  {
    id: 'dev',
    name: { th: 'โปรแกรมเมอร์', en: 'Software developer' },
    blurb: {
      th: 'เงินสดตั้งต้นเยอะที่สุดในกลุ่มเงินเดือนกลาง เริ่มลงทุนได้เร็วกว่าใคร',
      en: 'The most starting cash of the mid-salary group, so the investing can start earlier.',
    },
    salary: 60000,
    taxes: 5200,
    otherExpenses: 13000,
    childCost: 3800,
    cash: 70000,
    debts: [
      { key: 'home', balance: 2100000, payment: 12000 },
      { key: 'car', balance: 620000, payment: 10000 },
      { key: 'card', balance: 76000, payment: 3800 },
    ],
  },
  {
    id: 'doctor',
    name: { th: 'แพทย์', en: 'Doctor' },
    blurb: {
      th: 'เงินเดือนสูงที่สุดอันดับสอง แต่ต้องหาเงินไหลเข้าเดือนละแปดหมื่นสี่ถึงจะหนีออกได้',
      en: 'The second-highest salary, yet it takes eighty-four thousand a month of passive income to get out.',
    },
    salary: 110000,
    taxes: 13000,
    otherExpenses: 24000,
    childCost: 6000,
    cash: 150000,
    debts: [
      { key: 'home', balance: 4200000, payment: 24000 },
      { key: 'car', balance: 1200000, payment: 16000 },
      { key: 'card', balance: 80000, payment: 4000 },
      { key: 'student', balance: 300000, payment: 3000 },
    ],
  },
  {
    id: 'pilot',
    name: { th: 'นักบิน', en: 'Airline pilot' },
    blurb: {
      th: 'เงินเดือนสูงสุดในเกม เหลือใช้เยอะสุดด้วย แต่เส้นชัยก็ไกลที่สุดเช่นกัน คือต้องหาเงินไหลเข้าให้ได้เดือนละแสนหนึ่ง',
      en: 'The highest salary in the game and the most left over, but also the most distant finish line: a hundred and ten thousand a month of passive income.',
    },
    salary: 150000,
    taxes: 19000,
    otherExpenses: 32000,
    childCost: 7000,
    cash: 250000,
    debts: [
      { key: 'home', balance: 5600000, payment: 32000 },
      { key: 'car', balance: 1800000, payment: 20000 },
      { key: 'card', balance: 140000, payment: 7000 },
    ],
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
    cashflow: 0.3,
    maxQty: 400,
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
    cashflow: 0.6,
    maxQty: 300,
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
    price: 42000,
    down: 42000,
    debt: 0,
    cashflow: 0,
    maxQty: 8,
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
    down: 60000,
    debt: 1140000,
    cashflow: 3500,
    maxQty: 1,
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
    down: 35000,
    debt: 665000,
    cashflow: 2100,
    maxQty: 1,
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
    down: 90000,
    debt: 1710000,
    cashflow: 5000,
    maxQty: 1,
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
    cashflow: 2700,
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
    cashflow: 1800,
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
    cashflow: 5000,
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
    cashflow: 7000,
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
    cashflow: 4200,
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
    down: 450000,
    debt: 8550000,
    cashflow: 26000,
    maxQty: 1,
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
    down: 325000,
    debt: 6175000,
    cashflow: 19000,
    maxQty: 1,
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
    down: 550000,
    debt: 10450000,
    cashflow: 32000,
    maxQty: 1,
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
    down: 600000,
    debt: 11400000,
    cashflow: 36000,
    maxQty: 1,
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
    down: 750000,
    debt: 14250000,
    cashflow: 45000,
    maxQty: 1,
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
    cashflow: 24000,
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
    cashflow: 36000,
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
];

/* ------------------------------------------------------------ market cards */

export const marketCards: MarketCard[] = [
  {
    id: 'm-mkt-up',
    type: 'price',
    symbol: 'MKT',
    price: 28,
    title: { th: 'MKT พุ่งเป็น 28 บาท', en: 'MKT jumps to ฿28' },
    story: {
      th: 'ห้างประกาศผลประกอบการดีกว่าคาด นักวิเคราะห์แห่ปรับเป้าราคาขึ้นพร้อมกัน',
      en: 'The chain beat its earnings forecast and every analyst raised their target at once.',
    },
  },
  {
    id: 'm-mkt-down',
    type: 'price',
    symbol: 'MKT',
    price: 4,
    title: { th: 'MKT ร่วงเหลือ 4 บาท', en: 'MKT slides to ฿4' },
    story: {
      th: 'ข่าวลือว่าจะปิดสาขาต่างจังหวัด คนแห่ขายทิ้ง ราคาถูกลงกว่าครึ่ง',
      en: 'A rumour about closing upcountry branches sent everyone to the exit; the price more than halved.',
    },
  },
  {
    id: 'm-trn-up',
    type: 'price',
    symbol: 'TRN',
    price: 60,
    title: { th: 'TRN พุ่งเป็น 60 บาท', en: 'TRN jumps to ฿60' },
    story: {
      th: 'ได้สัญญาขนส่งให้แพลตฟอร์มอีคอมเมิร์ซรายใหญ่ ราคาวิ่งขึ้นสองวันติด',
      en: 'It won the delivery contract for a major e-commerce platform and ran up for two straight days.',
    },
  },
  {
    id: 'm-trn-down',
    type: 'price',
    symbol: 'TRN',
    price: 12,
    title: { th: 'TRN ร่วงเหลือ 12 บาท', en: 'TRN drops to ฿12' },
    story: {
      th: 'น้ำมันแพงขึ้น ต้นทุนขนส่งพุ่ง กำไรไตรมาสนี้หายไปเกือบหมด',
      en: 'Fuel got expensive, delivery costs spiked, and this quarter’s profit nearly vanished.',
    },
  },
  {
    id: 'm-solr-up',
    type: 'price',
    symbol: 'SOLR',
    price: 14,
    title: { th: 'SOLR พุ่งเป็น 14 บาท', en: 'SOLR jumps to ฿14' },
    story: {
      th: 'รัฐประกาศรับซื้อไฟจากโซลาร์เพิ่ม หุ้นเล็กตัวนี้เด้งแรงกว่าตัวใหญ่',
      en: 'The state raised how much solar power it will buy, and this small cap bounced harder than the big ones.',
    },
  },
  {
    id: 'm-solr-down',
    type: 'price',
    symbol: 'SOLR',
    price: 2,
    title: { th: 'SOLR ร่วงเหลือ 2 บาท', en: 'SOLR falls to ฿2' },
    story: {
      th: 'บริษัทขาดทุนอีกปี ต้องเพิ่มทุน ผู้ถือหุ้นเดิมโดนลดสัดส่วน',
      en: 'Another loss-making year forced a capital raise, diluting everyone who already held it.',
    },
  },
  {
    id: 'm-bnk-up',
    type: 'price',
    symbol: 'BNK',
    price: 75,
    title: { th: 'BNK พุ่งเป็น 75 บาท', en: 'BNK jumps to ฿75' },
    story: {
      th: 'ดอกเบี้ยขาขึ้นทำให้ธนาคารกำไรดี ราคาหุ้นวิ่งตามเกือบเท่าตัว',
      en: 'Rising interest rates fattened bank profits and nearly doubled the share price.',
    },
  },
  {
    id: 'm-reit-up',
    type: 'price',
    symbol: 'REIT',
    price: 145,
    title: { th: 'REIT ขึ้นเป็นหน่วยละ 145 บาท', en: 'REIT rises to ฿145 per unit' },
    story: {
      th: 'กองทุนซื้อตึกเพิ่มอีกสองแห่ง ค่าเช่ารวมโตขึ้น คนอยากถือมากขึ้น',
      en: 'The fund bought two more buildings, total rent grew, and demand for units followed.',
    },
  },
  {
    id: 'm-gold-up',
    type: 'price',
    symbol: 'GOLD',
    price: 58000,
    title: { th: 'ทองขึ้นเป็นบาทละ 58,000', en: 'Gold rises to ฿58,000 per baht-weight' },
    story: {
      th: 'ตลาดโลกผันผวน คนแห่เข้าซื้อทองเป็นที่หลบภัย ร้านทองคนแน่นตั้งแต่เช้า',
      en: 'Global markets wobbled, everyone ran to gold as shelter, and the gold shops were packed from dawn.',
    },
  },
  {
    id: 'm-condo-buyer',
    type: 'offer',
    tag: 'condo',
    multiplier: 1.3,
    title: { th: 'มีคนขอซื้อคอนโดของคุณ', en: 'A buyer wants your condo' },
    story: {
      th: 'นายหน้าโทรมาว่ามีลูกค้าต่างชาติอยากได้ห้องในตึกนี้ ให้ราคา 130% ของราคาที่คุณซื้อ',
      en: 'An agent calls: a foreign client wants a unit in your building and offers 130% of what you paid.',
    },
  },
  {
    id: 'm-land-buyer',
    type: 'offer',
    tag: 'land',
    multiplier: 2,
    title: { th: 'ผู้รับเหมาขอซื้อที่ดิน', en: 'A developer wants your land' },
    story: {
      th: 'ถนนตัดใหม่ประกาศแล้วจริง ๆ ผู้รับเหมาเสนอซื้อสองเท่าของราคาที่คุณซื้อมา',
      en: 'The new road was announced after all, and a developer offers double what you paid.',
    },
  },
  {
    id: 'm-apartment-buyer',
    type: 'offer',
    tag: 'apartment',
    multiplier: 1.25,
    title: { th: 'นักลงทุนขอซื้ออพาร์ตเมนต์/หอพัก', en: 'An investor wants your apartment block' },
    story: {
      th: 'กองทุนอสังหาฯ กำลังกว้านซื้อตึกปล่อยเช่า เสนอ 125% ของราคาที่คุณซื้อ',
      en: 'A property fund is buying rental blocks and offers 125% of your purchase price.',
    },
  },
  {
    id: 'm-house-buyer',
    type: 'offer',
    tag: 'house',
    multiplier: 1.35,
    title: { th: 'ครอบครัวหนึ่งขอซื้อบ้านเช่าของคุณ', en: 'A family wants to buy your rental house' },
    story: {
      th: 'ผู้เช่าเดิมชอบบ้านหลังนี้มากจนขอซื้อเลย ให้ราคา 135% ของที่คุณจ่ายไป',
      en: 'Your tenants love the house enough to buy it, at 135% of what you paid.',
    },
  },
  {
    id: 'm-biz-buyer',
    type: 'bizOffer',
    monthsMultiple: 60,
    title: { th: 'มีคนขอซื้อกิจการของคุณ', en: 'Someone wants to buy your business' },
    story: {
      th: 'ผู้ซื้อประเมินราคาแบบคลาสสิก คือกำไรต่อเดือนคูณ 60 (ห้าปี) แล้วจ่ายสด',
      en: 'The buyer uses the classic yardstick: monthly profit times 60 (five years), paid in cash.',
    },
  },
  {
    id: 'm-biz-buyer2',
    type: 'bizOffer',
    monthsMultiple: 40,
    title: { th: 'คู่แข่งเสนอซื้อกิจการ', en: 'A competitor bids for your business' },
    story: {
      th: 'คู่แข่งอยากตัดหน้าคุณ แต่ให้ราคาแค่กำไรต่อเดือนคูณ 40 ขายหรือไม่ขายก็ได้',
      en: 'A rival wants you out of the way, but only offers forty months of profit. Take it or leave it.',
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
  },
  {
    id: 'x-school',
    title: { th: 'ค่าเทอมลูก', en: 'School fees' },
    story: { th: 'ค่าเทอม ค่าชุด ค่าหนังสือ และค่าอะไรอีกไม่รู้ที่โรงเรียนเพิ่งคิดออก', en: 'Tuition, uniforms, books, and something else the school just thought of.' },
    scale: 0.9,
    perChild: true,
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
    title: { th: 'ค่ารักษาสัตว์เลี้ยง', en: 'Vet bill' },
    story: { th: 'หมาไปกินอะไรมาก็ไม่รู้ หมอบอกว่ามันจะหาย แต่กระเป๋าเงินคุณอาจไม่หาย', en: 'The dog ate something unidentifiable. The vet says it will recover; your wallet may not.' },
    scale: 0.85,
  },
  {
    id: 'x-trip',
    title: { th: 'ทริปเที่ยวกับเพื่อน', en: 'A trip with friends' },
    story: { th: 'กลุ่มไลน์จองตั๋วไปแล้ว เหลือแค่คุณที่ยังไม่ได้โอน', en: 'The group chat already booked the tickets. Only your transfer is missing.' },
    scale: 1.4,
    optional: true,
  },
  {
    id: 'x-insurance',
    title: { th: 'ต่อประกันรถ', en: 'Car insurance renewal' },
    story: { th: 'ค่าเบี้ยขึ้นทุกปี แม้ปีนี้จะขับดีขึ้นก็ตาม', en: 'The premium rises every year, even the years you drove better.' },
    scale: 2.1,
  },
  {
    id: 'x-lend',
    title: { th: 'ญาติขอยืมเงิน', en: 'A relative asks for a loan' },
    story: { th: 'ยืมแล้วอาจได้คืน อาจไม่ได้คืน แต่ที่แน่ ๆ คือความสัมพันธ์จะเปลี่ยนไปทั้งสองทาง', en: 'You might get it back, you might not. Either way the relationship changes.' },
    scale: 3,
    optional: true,
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
    id: 'x-utility',
    title: { th: 'ค่าน้ำค่าไฟหน้าร้อน', en: 'Summer utility bill' },
    story: { th: 'เดือนนี้แอร์ทำงานหนักกว่าคุณ และมันก็เรียกค่าแรงด้วย', en: 'This month the air conditioner worked harder than you did, and it billed you for it.' },
    scale: 0.6,
  },
  {
    id: 'x-gift',
    title: { th: 'ของขวัญวันเกิดลูก', en: 'Birthday present for the kids' },
    story: { th: 'ของที่ขอไว้ราคาสูงกว่าที่คิด และคุณก็ปฏิเสธไม่ลง', en: 'What they asked for costs more than you expected, and you cannot say no.' },
    scale: 0.45,
    perChild: true,
  },
];

/* -------------------------------------------------------- fast-track cards */

export const fastCards: FastCard[] = [
  {
    id: 'f-food',
    type: 'deal',
    title: { th: 'โรงงานอาหารสำเร็จรูป', en: 'Ready-meal factory' },
    story: { th: 'ผลิตส่งซูเปอร์มาร์เก็ตทั้งเครือ สัญญาต่ออายุอัตโนมัติทุกสองปี', en: 'Supplies a whole supermarket chain on a contract that renews automatically every two years.' },
    price: 2000000,
    cashflow: 90000,
  },
  {
    id: 'f-mall',
    type: 'deal',
    title: { th: 'ห้างชุมชนขนาดเล็ก', en: 'Neighbourhood shopping centre' },
    story: { th: 'ผู้เช่า 40 ร้าน เก็บค่าเช่ารายเดือนพร้อมส่วนแบ่งยอดขาย', en: 'Forty tenants paying monthly rent plus a slice of their sales.' },
    price: 4500000,
    cashflow: 200000,
  },
  {
    id: 'f-solar',
    type: 'deal',
    title: { th: 'ฟาร์มโซลาร์เซลล์', en: 'Solar farm' },
    story: { th: 'ขายไฟเข้าระบบตามสัญญา 20 ปี รายได้เท่ากันทุกเดือนจนน่าเบื่อ', en: 'Sells power into the grid on a 20-year contract, the same amount every month, almost boringly.' },
    price: 3000000,
    cashflow: 140000,
  },
  {
    id: 'f-conv',
    type: 'deal',
    title: { th: 'แฟรนไชส์ร้านสะดวกซื้อ 10 สาขา', en: 'Ten convenience-store franchises' },
    story: { th: 'สิบสาขาในจังหวัดเดียว ผู้จัดการเขตดูแลให้ คุณดูแค่รายงาน', en: 'Ten branches in one province with an area manager running them. You only read the report.' },
    price: 1500000,
    cashflow: 65000,
  },
  {
    id: 'f-resort',
    type: 'deal',
    title: { th: 'คอนโดตากอากาศ 30 ยูนิต', en: '30-unit resort condominium' },
    story: { th: 'ปล่อยเช่ารายวันผ่านแพลตฟอร์ม มีทีมแม่บ้านประจำอยู่แล้ว', en: 'Rented nightly through a platform, with a housekeeping team already in place.' },
    price: 6000000,
    cashflow: 280000,
  },
  {
    id: 'f-startup',
    type: 'deal',
    title: { th: 'กองทุนร่วมลงทุนสตาร์ทอัพ', en: 'Startup venture fund' },
    story: { th: 'ผลตอบแทนต่อเงินลงทุนต่ำกว่าตัวอื่น แลกกับโอกาสถูกรางวัลใหญ่ในอนาคต', en: 'A lower yield than the rest, traded for the chance of one very large winner later.' },
    price: 700000,
    cashflow: 32000,
  },
  {
    id: 'f-port',
    type: 'deal',
    title: { th: 'ท่าเรือขนส่งขนาดเล็ก', en: 'Small cargo pier' },
    story: { th: 'เก็บค่าเทียบท่าและค่าโกดัง เรือเข้าออกทุกวันไม่เว้นวันหยุด', en: 'Charges berthing and storage fees; boats come and go every day including holidays.' },
    price: 2500000,
    cashflow: 115000,
  },
  {
    id: 'f-bonus-div',
    type: 'bonus',
    title: { th: 'เงินปันผลพิเศษ', en: 'Special dividend' },
    story: { th: 'กิจการหนึ่งที่คุณถืออยู่มีกำไรสะสมเยอะเกินไป เลยจ่ายคืนผู้ถือหุ้นก้อนหนึ่ง', en: 'One of your holdings built up too much retained profit and paid a slice back to shareholders.' },
    amount: 400000,
  },
  {
    id: 'f-bonus-book',
    type: 'bonus',
    title: { th: 'ขายลิขสิทธิ์หนังสือ', en: 'Book rights sold' },
    story: { th: 'เรื่องที่คุณเขียนตอนยังอยู่ในวงล้อ มีสำนักพิมพ์ขอซื้อลิขสิทธิ์แปล', en: 'The story you wrote while still on the wheel just sold its translation rights.' },
    amount: 900000,
  },
  {
    id: 'f-bonus-land',
    type: 'bonus',
    title: { th: 'เวนคืนที่ดิน', en: 'Land expropriated' },
    story: { th: 'รัฐเวนคืนที่ดินแปลงเก่าของคุณเพื่อทำทางด่วน จ่ายค่าชดเชยเป็นเงินก้อน', en: 'The state took an old plot of yours for an expressway and paid compensation in one lump.' },
    amount: 1500000,
  },
  {
    id: 'f-set-tax',
    type: 'setback',
    title: { th: 'ภาษีย้อนหลัง', en: 'Back taxes' },
    story: { th: 'สรรพากรตรวจย้อนสามปี และพบว่าคุณหักค่าใช้จ่ายเกินไปหน่อย', en: 'The revenue office reviewed three years and found you had deducted a little too much.' },
    amount: 300000,
  },
  {
    id: 'f-set-market',
    type: 'setback',
    title: { th: 'ตลาดผันผวน', en: 'The market turns' },
    story: { th: 'เศรษฐกิจชะลอ ผู้เช่าบางรายขอลดค่าเช่า รายได้ต่อเดือนของคุณหายไปส่วนหนึ่ง', en: 'The economy slowed and some tenants renegotiated. Part of your monthly income is gone.' },
    amount: 0,
    incomeLoss: 40000,
  },
  {
    id: 'f-set-fire',
    type: 'setback',
    title: { th: 'ไฟไหม้โกดัง', en: 'Warehouse fire' },
    story: { th: 'ประกันจ่ายไม่ครบ ส่วนต่างคุณต้องควักเอง และรายได้หยุดไปช่วงหนึ่ง', en: 'Insurance did not cover everything, you paid the gap, and income paused for a while.' },
    amount: 250000,
    incomeLoss: 20000,
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

/** 24 tiles = the perimeter of a 7x7 grid, index 0 at the top-left, clockwise. */
export const RAT_BOARD: RatTile[] = [
  'payday', 'deal', 'doodad', 'deal', 'charity', 'deal',
  'payday', 'market', 'deal', 'doodad', 'deal', 'baby',
  'payday', 'deal', 'market', 'deal', 'doodad', 'deal',
  'payday', 'market', 'deal', 'downsized', 'deal', 'doodad',
];

export const FAST_BOARD: FastTile[] = [
  'fastpay', 'fastdeal', 'bonus', 'fastdeal', 'dream', 'fastdeal',
  'fastpay', 'setback', 'fastdeal', 'dream', 'fastdeal', 'bonus',
  'fastpay', 'fastdeal', 'dream', 'fastdeal', 'setback', 'fastdeal',
  'fastpay', 'bonus', 'fastdeal', 'dream', 'fastdeal', 'setback',
];

/* ---------------------------------------------------------------- lookups */

export const dealById = new Map(deals.map((d) => [d.id, d]));
export const marketById = new Map(marketCards.map((c) => [c.id, c]));
export const doodadById = new Map(doodads.map((c) => [c.id, c]));
export const fastById = new Map(fastCards.map((c) => [c.id, c]));
export const dreamById = new Map(dreams.map((d) => [d.id, d]));
export const professionById = new Map(professions.map((p) => [p.id, p]));

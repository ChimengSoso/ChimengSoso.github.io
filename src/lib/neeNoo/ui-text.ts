/** Every fixed label in the "หนีหนู" interface, in both languages. */
import type { Loc } from './types';

export const UI = {
  back: { th: 'หมวดเกม', en: 'All games' },
  gameTitle: { th: 'หนีหนู', en: 'Off the Wheel' },
  gameSub: {
    th: 'เกมกระดานการเงินที่คุณชนะเมื่อเงินไหลเข้าต่อเดือน มากกว่ารายจ่ายต่อเดือน',
    en: 'A financial board game you win the month your passive income outgrows your expenses.',
  },
  rules: { th: 'กติกา', en: 'Rules' },
  restart: { th: 'เริ่มใหม่', en: 'New game' },
  close: { th: 'ปิด', en: 'Close' },

  /* setup */
  setupStep1: { th: '1. เลือกอาชีพ', en: '1. Pick a job' },
  setupStep2: { th: '2. เลือกความฝัน', en: '2. Pick a dream' },
  setupHint: {
    th: 'อาชีพกำหนดเงินเดือน รายจ่าย และหนี้ตั้งต้น ยิ่งเงินเดือนสูง รายจ่ายยิ่งสูงตาม เส้นชัยจึงไม่ได้อยู่ที่ใครเงินเดือนเยอะกว่า',
    en: 'The job sets your salary, expenses and starting debts. Higher salaries come with higher expenses, so the finish line is not about who earns more.',
  },
  dreamHint: {
    th: 'ความฝันคือเป้าหมายสำรองบนทางด่วน ซื้อได้เมื่อไหร่ก็ชนะทันที ราคาต่างกันเกือบเจ็ดเท่า เลือกฝันใหญ่แปลว่าเลือกเกมที่ยาวขึ้น',
    en: 'The dream is your alternate goal on the fast track: buy it and you win on the spot. They differ almost sevenfold in price, so a bigger dream is a longer game.',
  },
  startGame: { th: 'เริ่มเล่น', en: 'Start' },
  resume: { th: 'เล่นต่อจากเกมเดิม', en: 'Resume saved game' },
  salary: { th: 'เงินเดือน', en: 'Salary' },
  startCash: { th: 'เงินสดตั้งต้น', en: 'Starting cash' },
  startCf: { th: 'กระแสเงินสด', en: 'Cash flow' },
  escapeNeed: { th: 'ต้องหาเงินไหลเข้าให้ถึง', en: 'Passive income needed' },
  /** on a job card the escape bar and the expense line are the same number, so
      they share one row instead of being printed twice */
  expensesIsBar: { th: 'รายจ่าย = เส้นชัย', en: 'Expenses = the bar' },

  /* statement */
  statement: { th: 'งบการเงินของคุณ', en: 'Your financial statement' },
  income: { th: 'รายได้', en: 'Income' },
  passive: { th: 'เงินไหลเข้า (passive)', en: 'Passive income' },
  expenses: { th: 'รายจ่าย', en: 'Expenses' },
  taxes: { th: 'ภาษี', en: 'Taxes' },
  other: { th: 'ค่าใช้จ่ายอื่น ๆ', en: 'Other living costs' },
  childrenCost: { th: 'ค่าเลี้ยงลูก', en: 'Cost of children' },
  cashflow: { th: 'กระแสเงินสดต่อเดือน', en: 'Monthly cash flow' },
  cash: { th: 'เงินสด', en: 'Cash' },
  assets: { th: 'สินทรัพย์', en: 'Assets' },
  liabilities: { th: 'หนี้สิน', en: 'Liabilities' },
  netWorth: { th: 'ความมั่งคั่งสุทธิ', en: 'Net worth' },
  noAssets: { th: 'ยังไม่มีสินทรัพย์สักชิ้น', en: 'No assets yet' },
  noDebts: { th: 'ไม่มีหนี้เหลือแล้ว', en: 'No debts left' },
  payoff: { th: 'ปิดหนี้', en: 'Pay off' },
  units: { th: 'หน่วย', en: 'units' },
  perMonth: { th: '/เดือน', en: '/mo' },

  /* board + controls */
  roll1: { th: 'ทอย 1 ลูก', en: 'Roll 1 die' },
  roll2: { th: 'ทอย 2 ลูก', en: 'Roll 2 dice' },
  turn: { th: 'ตาที่', en: 'Turn' },
  walking: { th: 'กำลังเดิน อีก', en: 'Moving, steps left:' },
  rolling: { th: 'กำลังทอย...', en: 'Rolling…' },
  months: { th: 'เดือนที่ผ่านไป', en: 'Months elapsed' },
  progress: { th: 'ความคืบหน้าสู่การหนีออก', en: 'Progress toward escape' },
  fastProgressLabel: { th: 'ความคืบหน้าสู่ชัยชนะ', en: 'Progress toward the win' },
  skipping: { th: 'ตกงาน ข้ามตา', en: 'Out of work' },
  charityLeft: { th: 'สิทธิ์ทอยสองลูก', en: 'Two-dice turns left' },
  log: { th: 'บันทึกเหตุการณ์', en: 'Event log' },
  borrowTitle: { th: 'กู้เงิน', en: 'Borrow' },
  borrowBtn: { th: 'กู้ 10,000', en: 'Borrow ฿10,000' },

  /* tiles */
  tilePayday: { th: 'เงินเดือน', en: 'Payday' },
  tileDeal: { th: 'โอกาส', en: 'Deal' },
  tileMarket: { th: 'ตลาด', en: 'Market' },
  tileDoodad: { th: 'จิปาถะ', en: 'Doodad' },
  tileBaby: { th: 'มีลูก', en: 'Baby' },
  tileDownsized: { th: 'ตกงาน', en: 'Downsized' },
  tileCharity: { th: 'ทำบุญ', en: 'Charity' },
  tileFastpay: { th: 'รายได้เข้า', en: 'Income' },
  tileFastdeal: { th: 'ดีลใหญ่', en: 'Big deal' },
  tileDream: { th: 'ความฝัน', en: 'Dream' },
  tileBonus: { th: 'โชคดี', en: 'Windfall' },
  tileSetback: { th: 'สะดุด', en: 'Setback' },

  /* card modals */
  chooseDeal: { th: 'เลือกขนาดดีล', en: 'Choose a deal size' },
  chooseDealHint: {
    th: 'ดีลเล็กใช้เงินน้อย เข้าถึงง่าย ดีลใหญ่ใช้เงินเยอะแต่เปลี่ยนเกมได้ในใบเดียว',
    en: 'Small deals are cheap and reachable. Big deals cost a lot and can change the game in one card.',
  },
  smallDeal: { th: 'ดีลเล็ก', en: 'Small deal' },
  bigDeal: { th: 'ดีลใหญ่', en: 'Big deal' },
  price: { th: 'ราคา', en: 'Price' },
  downPayment: { th: 'ใช้เงินสด', en: 'Cash needed' },
  loanTaken: { th: 'กู้เพิ่ม', en: 'Debt taken on' },
  monthlyIn: { th: 'เงินเข้าต่อเดือน', en: 'Monthly income' },
  qty: { th: 'จำนวน', en: 'Quantity' },
  buy: { th: 'ซื้อ', en: 'Buy' },
  pass: { th: 'ไม่เอา', en: 'Pass' },
  cannotAfford: { th: 'เงินสดไม่พอ', en: 'Not enough cash' },
  sell: { th: 'ขาย', en: 'Sell' },
  sellNone: { th: 'ไม่ขาย', en: 'Sell nothing' },
  nothingToSell: { th: 'คุณไม่มีของที่ตรงกับข้อเสนอนี้', en: 'You hold nothing that matches this offer.' },
  offerPrice: { th: 'ราคาที่เขาให้', en: 'Their price' },
  pay: { th: 'จ่าย', en: 'Pay' },
  decline: { th: 'ปฏิเสธ', en: 'Decline' },
  instalmentBtn: { th: 'ขอผ่อนแทน', en: 'Take instalments' },
  ok: { th: 'รับทราบ', en: 'Continue' },
  babyBody: {
    th: 'ครอบครัวใหญ่ขึ้นหนึ่งคน ความสุขเพิ่มขึ้นเยอะ และรายจ่ายรายเดือนก็เพิ่มขึ้นตามไปด้วย',
    en: 'The family grows by one. So does joy, and so does the monthly expense line.',
  },
  downsizedBody: {
    th: 'บริษัทลดขนาด สองเดือนถัดไปคุณไม่มีเงินเดือนเข้า แต่รายจ่ายยังเดินเท่าเดิมทุกเดือน สิ่งเดียวที่ช่วยได้คือเงินไหลเข้าที่คุณสร้างไว้แล้ว',
    en: 'The company downsized. For the next two months no salary arrives, while every expense carries on as usual. The only thing that softens it is the passive income you already built.',
  },
  downsizedCost: { th: 'สองเดือนนี้จะติดลบราว', en: 'Roughly the next two months' },
  keepLooking: { th: 'ปิดหน้าสรุป', en: 'Close summary' },
  seeSummary: { th: 'ดูสรุปอีกครั้ง', en: 'See summary' },
  wonBanner: { th: 'จบเกมแล้ว', en: 'Game over' },
  playedAs: { th: 'เล่นเป็น', en: 'Played as' },
  charityBody: {
    th: 'บริจาค 10% ของรายได้รวม แลกกับสิทธิ์เลือกทอย 1 หรือ 2 ลูกในสามตาถัดไป ทอยสองลูกทำให้คุณเดินได้ไกลขึ้น เจอโอกาสเร็วขึ้น',
    en: 'Donate 10% of total income for the right to roll one die or two for the next three turns. Two dice cover more ground and reach opportunities sooner.',
  },
  give: { th: 'บริจาค', en: 'Donate' },
  dontGive: { th: 'ไม่บริจาค', en: 'Skip' },

  /* rescue */
  rescueTitle: { th: 'เงินสดติดลบ', en: 'Cash has gone negative' },
  rescueBody: {
    th: 'ต้องหาเงินสดมาให้กลับเป็นบวกก่อนถึงจะเดินต่อได้ เลือกกู้ธนาคาร (จ่ายคืนเดือนละ 10% ของยอดกู้) หรือขายสินทรัพย์ด่วนที่ครึ่งราคา',
    en: 'You must get back above zero before playing on: borrow from the bank (repaying 10% of the balance every month) or fire-sell an asset at half price.',
  },
  fireSaleBtn: { th: 'ขายด่วนครึ่งราคา', en: 'Fire-sell at half price' },

  /* fast track */
  fastTitle: { th: 'ทางด่วน', en: 'The fast track' },
  fastIntro: {
    th: 'คุณออกจากวงล้อแล้ว จากนี้ไม่มีเงินเดือน มีแต่เงินที่ไหลเข้าเอง ชนะเมื่อสร้างรายได้เพิ่มได้อีกเดือนละ ฿300,000 หรือซื้อความฝันของคุณได้',
    en: 'You are off the wheel. No salary from here on, only income that arrives by itself. Win by adding another ฿300,000 a month, or by buying your dream.',
  },
  fastIncome: { th: 'รายได้ทางด่วนต่อเดือน', en: 'Fast-track income' },
  yourDream: { th: 'ความฝันของคุณ', en: 'Your dream' },
  buyDream: { th: 'ซื้อความฝัน', en: 'Buy the dream' },
  notYet: { th: 'ยังไม่ซื้อ', en: 'Not yet' },
  invest: { th: 'ลงทุน', en: 'Invest' },

  /* endings */
  wonTitle: { th: 'คุณหนีออกมาได้แล้ว', en: 'You are out' },
  lostTitle: { th: 'ล้มละลาย', en: 'Bankrupt' },
  lostBody: {
    th: 'เงินสดติดลบจนไม่มีอะไรให้ขายและกู้ไม่ได้อีก ลองใหม่อีกรอบได้เลย รอบหน้าลองปิดหนี้ดอกสูงก่อนสะสมสินทรัพย์',
    en: 'Cash went negative with nothing left to sell and no credit left. Try again, and next time consider clearing the expensive debt before stacking assets.',
  },
  playAgain: { th: 'เล่นอีกรอบ', en: 'Play again' },
  summaryMonths: { th: 'ใช้เวลาไป', en: 'It took' },
  monthsUnit: { th: 'เดือน', en: 'months' },

  /* rules modal */
  rulesGoal: { th: 'เป้าหมาย', en: 'The goal' },
  rulesGoalBody: {
    th: 'คุณเริ่มในวงล้อ ที่ซึ่งรายได้เกือบทั้งหมดมาจากเงินเดือน และหยุดทำงานเมื่อไหร่รายได้ก็หยุดตาม เป้าหมายคือสะสมสินทรัพย์ที่ให้เงินไหลเข้าทุกเดือน จนเงินไหลเข้ามากกว่ารายจ่ายรวม แล้วคุณจะออกจากวงล้อไปสู่ทางด่วน',
    en: 'You start on the wheel, where nearly all income is salary and stops the moment you do. The goal is to stack assets that pay you monthly until that income covers every expense. Then you leave the wheel for the fast track.',
  },
  rulesTurn: { th: 'เล่นยังไง', en: 'How a turn works' },
  rulesTurnBody: {
    th: 'ทอยลูกเต๋าแล้วเดินตามช่อง แต่ละช่องมีเหตุการณ์ของมัน ช่องเงินเดือนจ่ายกระแสเงินสดหนึ่งเดือน (เดินผ่านก็ได้เงิน) ช่องโอกาสให้เลือกดีลเล็กหรือดีลใหญ่ ช่องตลาดคือคนมาขอซื้อของที่คุณถืออยู่ ช่องจิปาถะคือรายจ่ายจรที่โผล่มาตอนไม่ทันตั้งตัว',
    en: 'Roll, move, and resolve the tile you land on. Payday tiles pay one month of cash flow (passing one counts too). Deal tiles let you choose a small or big deal. Market tiles bring buyers for what you hold. Doodad tiles are the unplanned expenses that always arrive at the wrong moment.',
  },
  rulesMoney: { th: 'เรื่องเงินที่ควรรู้', en: 'The money rules' },
  rulesMoneyBody: {
    th: 'อสังหาฯ ใช้เงินดาวน์ไม่กี่เปอร์เซ็นต์ แต่หนี้ที่เหลือติดไปกับตัวสินทรัพย์ ตัวเลข "เงินเข้าต่อเดือน" บนการ์ดจึงหักค่าผ่อนให้แล้ว หุ้นไม่ให้เงินไหลเข้า (ยกเว้นตัวที่ระบุปันผล) กำไรมาจากขายตอนราคาขึ้นเท่านั้น เงินกู้ฉุกเฉินกู้ได้ทีละ 10,000 และจ่ายคืนเดือนละ 10% ของยอดกู้ ซึ่งแพงมาก ใช้เมื่อจำเป็นจริง ๆ',
    en: 'Property takes only a small down payment, and the remaining loan travels with the asset, so the “monthly income” printed on a card is already net of the mortgage. Shares pay nothing unless a dividend is stated; their profit comes only from selling higher. The emergency loan comes in ฿10,000 steps and costs 10% of the balance every month, which is brutal. Use it only when you must.',
  },
  rulesNote: { th: 'ที่มา', en: 'About this game' },
  rulesNoteBody: {
    th: 'เกมนี้เขียนขึ้นใหม่ทั้งหมดสำหรับเว็บนี้ ทั้งอาชีพ การ์ด ตัวเลข และถ้อยคำ ไม่ได้เกี่ยวข้องกับหรือได้รับอนุญาตจากเจ้าของเกมการเงินเชิงพาณิชย์รายใด กลไกพื้นฐานอย่างงบการเงินส่วนบุคคลและการวัดอิสรภาพจากเงินไหลเข้า เป็นแนวคิดสาธารณะที่ใครก็หยิบมาออกแบบเกมของตัวเองได้',
    en: 'Every profession, card, number and line of text here was written for this site. It is not affiliated with, or licensed by, any commercial financial board game. The underlying ideas, a personal income statement and measuring freedom by passive income, are public concepts anyone may build a game around.',
  },
} satisfies Record<string, Loc>;

export type UIKey = keyof typeof UI;

/**
 * Cut-down tile names. A 7-column ring gives each tile about 40px on a phone,
 * so nothing here goes past five characters; the full name of the tile the
 * player is standing on is spelled out in the middle of the board, and every
 * tile carries the long name in its aria-label.
 */
export const TILE_SHORT = {
  payday: { th: 'เงิน', en: 'Pay' },
  deal: { th: 'โอกาส', en: 'Deal' },
  market: { th: 'ตลาด', en: 'Mkt' },
  doodad: { th: 'จ่าย', en: 'Cost' },
  baby: { th: 'ลูก', en: 'Baby' },
  downsized: { th: 'ตกงาน', en: 'Fired' },
  charity: { th: 'บุญ', en: 'Give' },
  fastpay: { th: 'เงิน', en: 'Pay' },
  fastdeal: { th: 'ดีล', en: 'Deal' },
  dream: { th: 'ฝัน', en: 'Dream' },
  bonus: { th: 'โชค', en: 'Luck' },
  setback: { th: 'สะดุด', en: 'Hit' },
} satisfies Record<string, Loc>;

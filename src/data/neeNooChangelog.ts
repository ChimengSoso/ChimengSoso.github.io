import type { Loc } from '../lib/neeNoo/types';

/**
 * What changed, and when.
 *
 * A player who says "the bank never lends to me" is describing a version, and
 * without a number on screen neither of us can tell which one. The chip in the
 * header is there so a complaint can be pinned to a build, and this file is
 * what the chip opens.
 *
 * The shape follows Keep a Changelog: newest first, an ISO date on every
 * release, and every line filed under what it did rather than under which file
 * it touched. `added` / `changed` / `fixed` / `removed` are the only four kinds
 * here; a board game has no deprecations and no security advisories.
 *
 * Numbering is MINOR-per-release while the game is still 0.x: each entry below
 * is one day of work that reached the player. Patch numbers are kept free for
 * fixes that go out on their own.
 */
export type ChangeKind = 'added' | 'changed' | 'fixed' | 'removed';

export interface Release {
  version: string;
  /** YYYY-MM-DD, the day it went live */
  dateISO: string;
  /** what this release was about, in a few words, so it can be talked about by name */
  codename: Loc;
  entries: { kind: ChangeKind; text: Loc }[];
}

export const releases: Release[] = [
  {
    version: '0.5.1',
    dateISO: '2026-08-20',
    codename: { th: 'กดเลขแล้วได้คำตอบจริง', en: 'Tap a figure, get its real answer' },
    entries: [
      {
        kind: 'fixed',
        text: {
          th: 'กดตัวเลขแล้วหน้าที่เปิดออกมาเคยตอบคนละเลขกับที่กด เช่นกดหนี้ในชื่อตัวเองแล้วได้หนี้รวมทั้งของบริษัท กดกำไรที่เข้าครัวเรือนแล้วได้กำไรที่ค้างอยู่ในบริษัท ตอนนี้ทุกเส้นทางจบที่เลขเดียวกับที่กดเข้าไป',
          en: 'A figure you tapped could open a page that added up to something else: your own debt opened the company total, the profit reaching the household opened the profit still sitting in the company. Every route now ends on the figure it was opened from.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'หน้าหนี้สินแจกแจงทีละก้อนแล้ว ผ่อนรถ บัตรเครดิต กยศ. และค่างวดของแต่ละตึกแยกบรรทัด พร้อมบอกว่าตึกไหนถืออยู่ในนามบริษัท และกดต่อไปดูยอดผ่อนรวมต่อเดือนได้',
          en: 'The liabilities page now names every loan: car, card, student loan and the balance riding on each building, marking which ones the company holds, with a tap through to what they cost a month.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'หน้าที่แจกแจงตัวเลขทุกหน้าจบบรรทัดสุดท้ายที่ยอดรวมเสมอ บรรทัดหมายเหตุย้ายขึ้นไปอยู่ข้างตัวเลขที่มันอธิบาย',
          en: 'Every breakdown ends its last line on the total. Notes moved up to sit beside the number they explain.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'หน้ากองทุนสำรองเลี้ยงชีพแสดงครบทั้งยอดสะสม ภาษีที่โดนหักถ้าถอนก่อนอายุ 55 และเงินที่ได้จริง จากเดิมที่จบด้วยยอดก่อนหักภาษี',
          en: 'The provident fund page shows the pot, the tax taken if it is cashed out before 55, and what actually arrives. It used to stop at the pre-tax figure.',
        },
      },
    ],
  },
  {
    version: '0.5.0',
    dateISO: '2026-08-19',
    codename: { th: 'ผู้เช่าย้ายออก ราคาขยับ', en: 'Tenants leave, prices move' },
    entries: [
      {
        kind: 'added',
        text: {
          th: 'ห้องเช่าว่างได้แล้ว ผู้เช่าแต่ละรายมีโอกาสย้ายออกทุกเดือน เดือนที่ว่างไม่มีค่าเช่าเข้า แต่ค่างวดยังจ่ายเต็ม คอนโดห้องเดียวว่างทีคือขาดทั้งก้อน ส่วนอพาร์ตเมนต์ 12 ห้องว่างทีละห้อง',
          en: 'Rented units can stand empty. Every tenancy rolls its own notice each month: an empty month collects no rent while the instalment carries on. One condo empties all at once; a twelve-room block loses a room at a time.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ย้ายเข้าไปอยู่ในห้องที่ตัวเองปล่อยเช่าได้ ค่าเช่าที่จ่ายหายไป แต่ห้องนั้นก็เลิกเก็บค่าเช่า การ์ดบอกผลรวมของสองอย่างก่อนกด',
          en: 'You can move into a unit you rent out. The rent you pay stops, the rent it collects stops too, and the card shows what the two come to before you decide.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ราคาทอง หุ้น กองทุน ขยับทุกเดือนตามแบบจำลองของตัวเอง ทองเดินขึ้นราว 7% ต่อปีแต่แกว่ง 18% หุ้นรายตัวแกว่งหนักกว่า พันธบัตรแทบนิ่ง',
          en: 'Gold, shares and funds move every month on a model of their own: gold trends about 7% a year and swings 18%, single shares swing harder, bonds barely move.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'กดที่ยอดรวมบนงบได้ทุกตัว แล้วมันจะกางบรรทัดที่บวกกันมาให้ดู',
          en: 'Every total on the statement can be tapped to open the lines it was added up from.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'เลือกได้แล้วว่าจะเลี้ยงสัตว์ไหม เลี้ยงอะไร ชื่ออะไร ไม่เลี้ยงก็ไม่มีการ์ดค่าหมอสัตว์เลยทั้งเกม',
          en: 'The pet is a choice now: take the one offered, name your own, or keep none at all, in which case the vet card is never dealt.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ก่อนขายทรัพย์สินเห็นครบว่าได้เงินสดเท่าไหร่ หนี้ที่ติดไปด้วยเท่าไหร่ กำไรขาดทุนเท่าไหร่ และเงินไหลเข้าที่จะหายไปเดือนละเท่าไหร่',
          en: 'Before selling anything you now see the cash you would actually get, the debt that leaves with it, the gain or loss, and the monthly income that stops.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'หน้าบริษัทแยกเป็นสามบล็อก ติดป้ายว่าเงินวิ่งทางไหน และคำนวณผลให้ดูสด ๆ ตามที่พิมพ์ก่อนกดโอน',
          en: 'The company desk is three separate blocks, each labelled with the direction the money travels and each showing the result of what you typed before you press anything.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'ช่องทรัพย์สินนับเงินสดด้วยแล้ว ขายของได้กำไรยอดรวมจะไม่ลดอีกต่อไป',
          en: 'Cash is counted on the asset side, so selling something at a profit no longer makes the total fall.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'ราคาทองตั้งต้นปรับเป็นบาทละ ฿68,000 ตามราคาจริงเดือนสิงหาคม 2569 จากเดิม ฿42,000',
          en: 'Gold starts at ฿68,000 a baht-weight, the real August 2026 price, up from ฿42,000.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'การ์ดข่าวราคาเปลี่ยนจากเลขตายตัวเป็นเปอร์เซ็นต์ เล่นไปยี่สิบปีการ์ดจะไม่ตบราคากลับไปเท่าปีแรกอีก',
          en: 'Price news cards move the price by a percentage instead of setting a fixed number, so a card drawn twenty years in no longer resets the market to year one.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'กรอกซื้อกองทุนลดหย่อนภาษีต่ำกว่า ฿10,000 แล้วระบบซื้อ ฿10,000 ให้เงียบ ๆ ตอนนี้บอกก่อนกดว่าจะซื้อจริงเท่าไหร่',
          en: 'Typing less than ฿10,000 into the tax-deductible fund quietly bought ฿10,000 anyway. The card now says what the button will actually buy.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'กำไรที่รายงานตอนขายนับแค่เงินดาวน์ ใครปิดหนี้ก่อนขายจะเห็นกำไรเกินจริง ตอนนี้นับเงินที่จ่ายเข้าไปทั้งหมด',
          en: 'The gain reported on a sale counted only the deposit, so anyone who cleared the loan first saw a gain far larger than it was. It counts every baht put in now.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'การ์ดผู้ซื้อเขียนว่าให้ราคา "135% ของที่คุณจ่ายไป" ทั้งที่คิดจากราคาบ้าน แก้ข้อความทั้งสี่ใบ',
          en: 'The buyer cards said they paid "135% of what you paid" when the figure came off the asking price. All four were reworded.',
        },
      },
    ],
  },
  {
    version: '0.4.0',
    dateISO: '2026-08-18',
    codename: { th: 'เงินเดือนจริง บ้านจริง', en: 'A real payslip, a real roof' },
    entries: [
      {
        kind: 'added',
        text: {
          th: 'ประกันสังคม กองทุนสำรองเลี้ยงชีพที่นายจ้างสมทบ กองทุนลดหย่อนภาษีเดือนธันวาคม และการออมอัตโนมัติรายเดือน',
          en: 'Social security, an employer-matched provident fund, the December tax-deductible fund, and an automatic monthly savings plan.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ค่าเช่าบ้านของทุกอาชีพ และการซื้อบ้านมือสองระหว่างเกม ทั้งจ่ายสดและกู้ ซึ่งธนาคารพิจารณาจริง',
          en: 'Rent for every profession, and buying a second-hand house mid-game, in cash or on a mortgage the bank actually assesses.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'หวย วงแชร์ เงินอุดหนุนเด็กแรกเกิด ฿600 และใบสรุปผลตอนจบเกมที่เทียบกับการฝากกองทุนดัชนีเฉย ๆ',
          en: 'The lottery, savings circles, the state’s ฿600 child allowance, and an end-of-game report card measured against simply holding an index fund.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'ค่าเลี้ยงลูกและค่าครอบครัวคิดจากค่าใช้จ่ายครัวเรือนไทยจริง ดอกเบี้ยบ้านลอยตัวหลังปีที่สาม และบัตรเครดิตมีตัวเลือกจ่ายขั้นต่ำ',
          en: 'Children and family cost what a Thai household really spends, mortgages float after the third year, and the credit card offers its minimum payment.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'จัดหน้าใหม่ทั้งกระดาน ลูกเต๋ากลางกระดานกลายเป็นปุ่มทอย แยกงบกับทรัพย์สินคนละคอลัมน์ และงบการเงินหุ้นพับเก็บได้',
          en: 'The board was relaid out: the dice in the middle became the roll button, the statement and the balance sheet split into their own columns, and a share’s accounts fold away.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ขายบ้านหรือรถได้ตอนเงินหมด แทนที่จะล้มละลายทั้งที่ยังมีของอยู่ในมือ',
          en: 'The house and the car can be sold when the money runs out, instead of going bankrupt while still holding them.',
        },
      },
    ],
  },
  {
    version: '0.3.0',
    dateISO: '2026-08-17',
    codename: { th: 'ภาษีจริงและบริษัทของคุณ', en: 'Real tax, and a company of your own' },
    entries: [
      {
        kind: 'changed',
        text: {
          th: 'ภาษีคิดตามขั้นบันไดจริงของกรมสรรพากร แยกตามประเภทเงินได้ แทนตัวเลขเหมาที่เขียนไว้ต่ออาชีพ',
          en: 'Tax is worked out on the real progressive ladder, by category of income, instead of a flat figure written per profession.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'จดทะเบียนบริษัทได้ มีบัญชีของตัวเอง ภาษีนิติบุคคลของตัวเอง เงินเดือนกรรมการ และปันผลที่โดนหัก 10%',
          en: 'You can incorporate: the company keeps its own books, pays its own corporate tax, pays you a director’s salary, and its dividends are withheld at 10%.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'การ์ดทุกใบบอกสิ่งที่กำลังจะเกิดขึ้นก่อนถาม แทนที่จะให้กดแล้วค่อยรู้',
          en: 'Every card says what it is about to do before it asks, instead of telling you afterwards.',
        },
      },
    ],
  },
  {
    version: '0.2.0',
    dateISO: '2026-08-16',
    codename: { th: 'อายุ เงินเฟ้อ และทางเลือก', en: 'Age, inflation and choices' },
    entries: [
      {
        kind: 'added',
        text: {
          th: 'อายุเดินจริง เงินเฟ้อ 3% ต่อปี เกษียณตามอายุอาชีพ ความเสี่ยงตกงาน และการเรียนต่อเพื่อเปลี่ยนอาชีพ',
          en: 'Age advances, prices rise 3% a year, careers end at their own retirement age, jobs can be lost, and retraining can change the job you have.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ระดับนักลงทุน การลาออกจากงาน เฟสมรดก ดีลระดับนายทุน และกิจการที่โตหรือเจ๊งเองได้',
          en: 'Investor tiers, quitting the job, the legacy phase, capitalist-scale deals, and businesses that grow or fold on their own.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'วันเกิดลูกและค่าเทอมย้ายไปอยู่บนปฏิทินแทนกองการ์ด และคนไม่มีลูกจะไม่โดนแจกการ์ดค่าลูกอีก',
          en: 'Birthdays and school fees moved onto the calendar instead of the deck, and players with no children stopped being dealt cards about them.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'เลือกได้ว่าจะแต่งงานไหม จะมีลูกไหม และประกันรถกลายเป็นการเดิมพันจริงที่มีทั้งจ่ายและไม่จ่าย',
          en: 'Marrying and having children became choices, and car insurance became a real bet that either pays out or does not.',
        },
      },
    ],
  },
  {
    version: '0.1.0',
    dateISO: '2026-08-15',
    codename: { th: 'เล่นได้ครั้งแรก', en: 'First playable' },
    entries: [
      {
        kind: 'added',
        text: {
          th: 'กระดาน ลูกเต๋า สำรับการ์ด งบการเงิน และเงื่อนไขชนะคือเงินไหลเข้ามากกว่ารายจ่าย เล่นได้สองภาษา',
          en: 'The board, the dice, the decks, the statement, and the win condition: passive income above expenses. Playable in both languages.',
        },
      },
    ],
  },
];

/** What the player is holding right now. */
export const GAME_VERSION = releases[0]?.version ?? '0.0.0';
export const GAME_VERSION_DATE = releases[0]?.dateISO ?? '';

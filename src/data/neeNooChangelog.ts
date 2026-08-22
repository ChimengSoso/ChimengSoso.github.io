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
    version: '0.8.0',
    dateISO: '2026-08-22',
    codename: { th: 'เงินเก็บก็นับ และกิจการเลิกเน่าเอง', en: 'Savings count, and a business stops rotting on its own' },
    entries: [
      {
        kind: 'fixed',
        text: {
          th: 'ล้มละลายได้ทั้งที่มีเงินเป็นล้านอยู่ในกองทุน การตัดสินว่า "ไม่เหลือทางออกแล้ว" ดูแค่สินทรัพย์ บ้าน รถ เงินในบริษัท และวงเงินกู้ ไม่เคยดูกองทุนดัชนี กองทุนลดหย่อนภาษี หรือกองทุนสำรองเลี้ยงชีพเลย และการ์ดขายด่วนก็ไม่มีปุ่มถอนกองทุนให้ วัดจากเกมที่จบด้วยล้มละลาย 170 เกม พบว่ามีเงินค้างในกองทุนทั้ง 170 เกม เฉลี่ย 44.4 ล้านบาท หนักสุดคือนักบินอายุ 76 ที่โดนประกาศล้มละลายเพราะเงินสดติดลบ 210,313 บาท ขณะถือกองทุนอยู่ 530 ล้านบาท ตอนนี้การ์ดขายด่วนมีแถวเงินเก็บอยู่บนสุด และเกมจะไม่ประกาศล้มละลายตราบใดที่ยังมีอะไรถอนได้',
          en: 'You could be declared bankrupt while holding millions in a fund. The test for "there is no way out" looked at holdings, the house, the car, company cash and the credit line, and never at the index fund, the tax fund or the provident fund; the rescue card had no button for any of them either. Across 170 bankruptcies, all 170 had money in a fund, an average of ฿44.4m, the worst being a pilot declared bankrupt at seventy-six over ฿210,313 of overdraft while holding ฿530m. Savings now sit at the top of the rescue card, and nobody is declared bankrupt while something is still withdrawable.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ถอนกองทุนลดหย่อนภาษีก่อนครบกำหนดได้แล้ว โดยเสียค่าคืนสิทธิ์ภาษี 20% ของยอด ซึ่งเป็นรูปร่างคร่าว ๆ ของการคืนค่าลดหย่อนที่เคยใช้ไปพร้อมเงินเพิ่ม แพงพอที่จะไม่มีใครแตะถ้ายังมีทางอื่น แต่ก็ไม่ใช่กุญแจที่หายไปแล้ว',
          en: 'The tax fund can be broken before its lock is up, at a fifth of the pot. That is roughly the shape of paying back the relief already claimed with a surcharge on top: painful enough that nobody reaches for it while anything else is left, but no longer a padlock with the key thrown away.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'กิจการที่กำไรเน่าตายด้วยคณิตศาสตร์ ไม่ใช่ด้วยโชค การขยับใช้คูณ (1+v) ตอนขึ้น และ (1−v) ตอนลง ซึ่งดูสมมาตรแต่ไม่ใช่ ขึ้นหนึ่งครั้งลงหนึ่งครั้งเหลือ 1−v² ของเดิม กิจการทั่วไปจึงหดลงไม่ว่าจะขึ้นบ่อยแค่ไหน จำลอง 400 ครั้ง ร้านที่ทำเงินเดือนละ 10,000 บาท ค่าผันผวน 0.35 เหลือเดือนละ 34 บาทหลังผ่านไป 30 ปี โดยไม่เคยทอยปิดกิจการสักครั้ง ค่าผันผวน 0.20 เหลือ 4,516 บาท ความผันผวนกลายเป็นภาษีที่เก็บจากความกล้าล้วน ๆ ตอนนี้ขึ้นด้วย (1+v) ลงด้วย 1/(1+v) และเหรียญยุติธรรม 50/50 ขึ้นแล้วลงจึงกลับที่เดิมพอดี สิ่งที่พรากกิจการไปคือการปิดกิจการเท่านั้น ส่วนกิจการที่ซื้อมาตอนขาดทุนยังขยับแบบบวกลบและยังเอนขึ้นเหมือนเดิม เพราะนั่นคือเหตุผลเดียวที่จะซื้อมัน',
          en: 'A profitable business decayed by arithmetic rather than by luck. It stepped up by (1 + v) and down by (1 - v), which looks even and is not: one step up and one step down leave 1 - v² of what was there, so the typical business shrank however often it went up. Over 400 simulated careers a shop earning ฿10,000 a month at v = 0.35 was earning ฿34 after thirty years without ever failing a closure roll, and ฿4,516 at v = 0.20. Volatility was a pure tax on daring. The pair is now (1 + v) and 1/(1 + v) on a fair coin, so up-then-down lands exactly where it started and the only thing that takes a business away is closing. A business bought underwater still steps in fixed amounts with the old upward pull, because that is the only reason to buy one.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'เพดานการขยับของกิจการไม่มีพื้นคู่กัน ขึ้นได้ไม่เกินสามเท่าแต่ลงได้ถึงศูนย์ เพดานจึงสะท้อนขาขึ้นกลับลงมาขณะที่ขาลงวิ่งได้เต็มที่ ต่อให้การขยับยุติธรรมแล้ว กิจการค่าผันผวน 0.20 ก็ยังหล่นจาก 10,000 เหลือ 4,038 บาทใน 30 ปี ทั้งที่ถอดเพดานออกแล้วอยู่ที่ 10,000 พอดี ตอนนี้กิจการที่กำไรแกว่งอยู่ระหว่างหนึ่งในสามถึงสามเท่าของรายได้ตั้งต้น',
          en: 'The swing had a ceiling with no floor facing it: three times up, but all the way to zero down, so the cap reflected the upside while the downside ran free. Even with the steps made fair, a v = 0.20 business still fell from ฿10,000 to ฿4,038 over thirty years, where removing the cap alone left it at exactly ฿10,000. A profitable business now swings between a third of its takings and three times them.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'ผลรวมของสามข้อบน วัดจากบอทเล่นครบ 60 ปี อาชีพละ 25 เกม แบบไม่มีลูก จำนวนเกมที่จบด้วยล้มละลายลดลงจาก 24 เหลือ 10 (เจ้าของร้านกาแฟ) 16 เหลือ 4 (พนักงานออฟฟิศ) 12 เหลือ 0 (พยาบาล) 10 เหลือ 2 (แพทย์) และ 3 เหลือ 0 (นักบิน) ที่สำคัญกว่าคือเงินไหลเข้าตอนจบเกมไม่ได้เป็นศูนย์อีกแล้ว เมื่อก่อนออกจากวงหนูได้ที่เดือนละ 20,639 บาท แล้วเหลือ 2,040 บาทในอีก 20 ปี ตอนนี้เกมเดียวกันเหลือ 12,885 บาท เส้นทางเร็วเลิกเป็นทางลงทางเดียว',
          en: 'The three fixes above, measured over 60-year games, 25 per profession, no children: bankruptcies fell from 24 to 10 for the cafe owner, 16 to 4 for the office worker, 12 to 0 for the nurse, 10 to 2 for the doctor and 3 to 0 for the pilot. More to the point, income at the end of a game is no longer zero. One office run used to leave the wheel at ฿20,639 a month and be down to ฿2,040 twenty years later; the same run now holds ฿12,885. The fast track has stopped being a one-way slope.',
        },
      },
    ],
  },
  {
    version: '0.7.1',
    dateISO: '2026-08-22',
    codename: { th: 'ปิดแล้วปิดเลย และมีพื้นให้ตก', en: 'Shut stays shut, and there is a floor' },
    entries: [
      {
        kind: 'fixed',
        text: {
          th: 'อัตราปิดกิจการที่เพิ่งใส่ไปใน 0.7.0 ตั้งไว้สูงเกินไปมาก ตัวเลขถูกเลือกให้ดูสมเหตุผลเป็นรายปี แต่มันถูกทอยทุกเดือนและกิจการที่ปิดแล้วเปิดใหม่ไม่ได้ ยอดสะสมสามสิบปีจึงกลายเป็นเกือบแน่นอน รถเข็นกับร้านอาหารปิด 99% ร้านชานม 96% ตอนนี้คำนวณย้อนจากอัตรารอดที่ต้องการแทน ห้าปีแรกรอด 87% ถึง 95% สามสิบปีรอด 43% ถึง 67% ส่วนสตาร์ทอัพยังตายเป็นส่วนใหญ่ตามเดิม',
          en: 'The closure rates added in 0.7.0 were far too high. The figures were picked to look sensible read as a year, but they are rolled every month and a closed business never reopens, so the thirty-year total came out near-certain: 99% for the food cart and the restaurant, 96% for the milk-tea shop. They are now worked backwards from a target survival rate instead: 87% to 95% alive after five years, 43% to 67% after thirty. A startup still mostly dies.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'กิจการที่ซื้อมาตอนขาดทุนแล้วปิดตัวไป กลับมาเปิดเองเดือนถัดไป เพราะการปิดกิจการทำเครื่องหมายด้วยรายได้เป็นศูนย์เฉย ๆ ซึ่งใช้ได้กับกิจการที่กำไรอยู่ (คูณศูนย์ก็ยังศูนย์) แต่กิจการที่ติดลบขยับแบบบวกลบทีละก้อน มันจึงเดินออกจากศูนย์ได้ทันที วัดจากการ์ดคาเฟ่เปิดใหม่ 74% ปิดตัวลงระหว่างสามสิบปี แต่เหลือปิดจริงตอนจบแค่ 6% ตอนนี้ปิดแล้วปิดเลย',
          en: 'A business bought while losing money would fold and then reopen by itself the next month. A closure was marked only by cash flow reaching zero, which holds for a profitable business because the drift multiplies and zero times anything is zero, but one bought underwater steps by fixed amounts and simply walked back off zero. On the new-cafe card, 74% folded at some point across thirty years and only 6% were still shut at the end. Shut is now shut.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'เส้นทางเร็วไม่มีพื้นรองรับ เงินสดติดลบได้ไม่จำกัดโดยไม่มีการ์ดขายด่วน ไม่มีการ์ดกู้ และไม่มีจอจบเกม เดิมเขียนไว้ว่าตั้งใจ เพราะ "ช่องรายได้ถัดไปจะเติมเงินให้เสมอ" ซึ่งจริงตอนกิจการเล็กจ่ายเท่าเดิมตลอดกาล พอกิจการขยับขึ้นลงได้ เคสที่เจอคือคนที่ออกจากหนูสำเร็จตั้งแต่ปีที่หก พอถึงปีที่ห้าสิบเหลือเงินไหลเข้าเดือนละ ฿181 สู้รายจ่าย ฿43,401 เงินสดติดลบ ฿7.27 ล้าน แล้วนั่งดูตัวเลขไหลลงต่ออีกสี่สิบสี่ปีโดยไม่มีอะไรเกิดขึ้น ตอนนี้ถ้าเงินไหลเข้าไม่พอจ่ายบิลแล้วเงินสดติดลบ การ์ดขายด่วนจะขึ้นเหมือนตอนอยู่ในวงหนู และล้มละลายได้จริงถ้าไม่เหลืออะไรให้ขาย ส่วนเงินสดที่แกว่งติดลบชั่วคราวทั้งที่รายได้ยังท่วมรายจ่าย ยังไม่มีใครมากวนเหมือนเดิม',
          en: 'The fast track had no floor: cash could fall without limit with no rescue card, no fire sale offered and no ending. That exemption was deliberate, on the grounds that the next income tile always refills it, which held while small businesses paid the same amount for ever. Now that they move, one run escaped the wheel in year six and by year fifty had ฿181 a month coming in against ฿43,401 of bills and ฿7.27 million of negative cash, with another forty-four years of watching it fall. The rescue card now appears out there too, once the income has stopped covering the bills, and bankruptcy is real if there is nothing left to sell. A dip while the income still covers everything is left alone, exactly as before.',
        },
      },
    ],
  },
  {
    version: '0.7.0',
    dateISO: '2026-08-22',
    codename: { th: 'ตลาดที่ลงได้จริง', en: 'A market that can actually fall' },
    entries: [
      {
        kind: 'changed',
        text: {
          th: 'กองทุนดัชนีสุ่มผลตอบแทน "รายปี" ครั้งเดียวแล้วทยอยเดินทีละเดือน จากเดิมที่สุ่มใหม่ทุกเดือนแล้วหารสิบสอง ซึ่งฟังดูผันผวนแต่จริง ๆ แล้วหักล้างกันเองจนปีที่แย่ที่สุดเท่าที่เป็นไปได้คือประมาณ -2% ตอนนี้ปีที่แย่จริง ๆ ลงได้ถึง -40% กว่า และกองทุนสำรองเลี้ยงชีพกับกองทุนลดหย่อนภาษีก็ลงตามไปด้วย เพราะทั้งสามกองห่อหุ้มตลาดเดียวกัน ผลตอบแทนระยะยาวยังอยู่ที่ 7% ต่อปีเท่าเดิม',
          en: 'The index fund now draws one return for the whole year and lives through it month by month, instead of redrawing every month and dividing by twelve. That sounded volatile and was not: twelve draws cancel, so the worst year the fund could possibly have was about -2%. A bad year can now take more than 40%, and the provident fund and the tax-break fund fall with it, because all three wrap the same market. The long-run return is still 7% a year.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ปีไหนที่ตลาดลงหนัก จะมีการ์ดขึ้นมาถามตรง ๆ ว่าจะหยุดคำสั่งซื้อกองทุนรายเดือนไว้ก่อนไหม พร้อมบอกว่าปีนี้พอร์ตหายไปกี่บาท นี่คือคำถามเดียวกับที่คนจริง ๆ ต้องตอบทุกครั้งที่ตลาดลง และคำตอบของมันคือสิ่งที่ตัดสินพอร์ตทั้งชีวิต',
          en: 'When a year falls hard a card asks outright whether to stop the monthly standing order, and says how much came off the fund this year. It is the same question anybody with a fund faces every time a market falls, and the answer to it decides a portfolio.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'ผลตอบแทนอสังหาฯ ให้เช่าปรับใหม่ทั้งสำรับให้ตรงกับของจริงในไทย และต่างกันตามประเภทแทนที่จะเท่ากันหมด คอนโดกลางเมืองราว 5% ต่อปี ห้องเช่าใกล้โรงงานราว 8.5% หอพักราว 9% โรงแรม 11% จากเดิมที่ทุกใบอยู่ที่ 10.3% ถึง 13.2% เท่ากันหมด และเงินดาวน์เปลี่ยนจาก 5% ทุกใบ เป็น 10% ถึง 30% ตามประเภท เพราะโกดังกับโรงแรมไม่ใช่สินเชื่อบ้าน ผลคือการเลือกว่าจะซื้อใบไหนกลายเป็นการตัดสินใจจริง ไม่ใช่ซื้ออะไรก็ชนะ',
          en: 'Rental yields across the whole deck were rebuilt to match what Thai property actually pays, and to differ by type instead of being one number: a city condo about 5% a year, rooms by a factory about 8.5%, a dormitory 9%, a hotel 11%, where every card used to sit between 10.3% and 13.2%. Deposits moved from a flat 5% to between 10% and 30% by type, because a warehouse and a hotel are not home loans. Choosing which building to buy is now a decision rather than a formality.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'กิจการเล็กแทบทุกใบมีความผันผวนแล้ว ร้านซักผ้าเคยจ่ายเท่าเดิมทุกเดือนติดต่อกันสามสิบปี ตอนนี้รายได้ขยับขึ้นลงเหมือนร้านจริง และร้านอาหาร รถเข็น ร้านชานม คาเฟ่ มีโอกาสปิดกิจการตามอัตราของตัวเอง เมื่อก่อนมีแค่ 6 ใบจาก 49 ใบที่ขยับได้เลย',
          en: 'Nearly every small business now moves. A coin laundry used to pay the same amount every month for thirty years; its takings now rise and fall like a real one, and restaurants, carts, milk-tea shops and cafes can close for good at a rate of their own. Only 6 of the 49 cards used to move at all.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'เพิ่มอาชีพ "ไรเดอร์ส่งอาหาร" เงินเดือนต่ำสุดในเกม เหลือเก็บเดือนละสี่ร้อยบาท มีบัตรเครดิตหมุนอยู่ ไม่มีนายจ้าง ไม่มีบำนาญ ทุกอาชีพก่อนหน้านี้เริ่มเกมด้วยเงินเหลือ 18% ถึง 29% ของรายได้ ซึ่งข้ามสถานการณ์ที่ครัวเรือนไทยจำนวนมากอยู่จริงไปทั้งก้อน ที่นั่งนี้ภารกิจแรกไม่ใช่การลงทุน แต่คือการทำให้เหลือเงิน',
          en: 'A new seat: the delivery rider, on the smallest wage in the game, with four hundred baht left at the end of the month and a credit card revolving. No employer and no pension. Every other job opens with 18% to 29% of its income left over, which quietly assumes away the situation a great many Thai households are actually in. Here the first job is not investing; it is having anything left.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'งบแสดงสองบรรทัดที่ไม่เคยแสดงมาก่อน คือเก็บได้กี่เปอร์เซ็นต์ของเงินที่เข้ามา และเงินสดพอจ่ายบิลได้กี่เดือน สองตัวนี้คือตัวที่ผู้เล่นสั่งได้เองทั้งหมดและทำนายตอนจบได้ดีที่สุด ตัวหลังเคยมีอยู่แล้วแต่มีแค่ธนาคารที่เห็นตอนพิจารณาสินเชื่อ',
          en: 'The statement now carries two lines it never showed: the share of income you keep, and how many months of bills the cash would cover. They are the two numbers most under the player’s own hand and the two that predict the ending best. The bank could already see the second one; the player could not.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'ใบสรุปตอนจบเพิ่มบรรทัดวินิจฉัย บอกตรง ๆ ว่ารูรั่วที่ใหญ่ที่สุดของเกมนั้นคืออะไร เลือกจากตัวเลขที่เก็บไว้อยู่แล้ว เช่นเดือนที่เงินสดติดลบ ดอกเบี้ยที่จ่ายมากกว่าเงินที่ลงทุน หรือกองเงินสดไว้เฉย ๆ หลายปี หน้าที่มีแต่ตัวเลขโดยไม่มีใครจัดอันดับให้ คือหน้าที่ไม่มีใครได้อะไรกลับไป',
          en: 'The ending card now names the single biggest leak of that game, chosen from tallies it was already keeping: months spent overdrawn, interest that outgrew the investing, cash left sitting for years. A page of numbers nobody ranks is a page nobody learns from.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'นักบินเคยถูกระงับใบอนุญาตเกือบทุกเกม การ์ดตกงานเปิดขึ้นราวปีละ 0.7 ครั้ง แต่โอกาสตรวจร่างกายไม่ผ่านตั้งไว้ 15% ต่อครั้งและไต่ถึง 60% ตามอายุ ผลจากการทดลองเล่น 20 เกมคือนักบินเสียใบอนุญาตครบทั้ง 20 เกม และล้มละลายไป 17 เกม ตอนนี้อยู่ที่ราวหนึ่งในสี่ของทั้งชีวิตการบิน ซึ่งยังเป็นความเสี่ยงอาชีพที่หนักที่สุดในเกม แต่รอดได้ถ้าสร้างรายได้ไว้ก่อน',
          en: 'The pilot used to lose the licence in nearly every game. The layoff tile comes round about 0.7 times a year while the medical was set to fail at 15% a time, rising to 60% with age: across twenty test games all twenty pilots were grounded and seventeen went bankrupt after it. It now works out at roughly one flying career in four, still the heaviest career risk in the game and survivable by anybody who built income first.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'การ์ดตกงานเลิกถือว่า "เปิดการ์ด = ตกงาน" แล้ว การ์ดเปิดราวปีละ 0.7 ครั้ง แต่เดิมทุกครั้งที่เปิดคือตกงานจริง ครูเสียเดือนละครั้ง โปรแกรมเมอร์เสีย 4 เดือนทุกครั้ง คิดเป็นชีวิตการทำงานที่ไม่มีเงินเดือน 6% ถึง 23% ในประเทศที่อัตราว่างงานจริงราว 1% ตอนนี้แต่ละครั้งจะสุ่มว่าเป็นข่าวประเภทไหน ส่วนใหญ่คือ "รอบนี้ไม่ถึงโต๊ะคุณ" ผลคือสัดส่วนชีวิตที่ไม่มีเงินเดือนเหลือ 0.5% สำหรับข้าราชการและพยาบาล 4.4% สำหรับออฟฟิศกับวิศวกร และ 5.8% สำหรับโปรแกรมเมอร์ ซึ่งยังเรียงลำดับความเสี่ยงเหมือนเดิมทุกอาชีพ',
          en: 'The layoff card no longer treats every landing as the thing itself. It comes round about 0.7 times a year, and each landing used to be a real redundancy: a month for the teacher, four for the developer, which reads as a working life with 6% to 23% of its months unpaid in a country whose unemployment rate is about 1%. Each landing now rolls for what kind of news it is, and most of the time it did not reach your desk. The share of a career spent unpaid comes out at 0.5% for a civil servant or a nurse, 4.4% for the office worker and the engineer, and 5.8% for the developer, which keeps every profession in the order it was written in.',
        },
      },
      {
        kind: 'added',
        text: {
          th: 'เพิ่มผลลัพธ์ "ปีนี้ไม่มีการปรับเงินเดือน" ให้การ์ดตกงาน งานยังอยู่ครบแต่ขั้นเงินเดือนปีนั้นหายไปเลย และไม่ได้ไล่คืนทีหลัง ทั้งบันไดจึงสั้นลงหนึ่งขั้นไปตลอดอาชีพ แพทย์ที่โดนแช่หนึ่งปีตอนปีที่สิบ เสียเงินเดือนเดือนละ ฿4,306 ไปจนเกษียณ เกิดราวสิบสองปีครั้ง นี่คือการลดเงินเดือนที่ไม่มีใครออกจดหมายแจ้ง และเงินเฟ้อ 3% ต่อปีเก็บของมันไปเงียบ ๆ ทุกปี',
          en: 'The layoff card gained a third outcome: no rise this year. The desk is untouched and the rung is gone for good, never caught up later, so the whole ladder stays one step shorter for the rest of the career. A doctor frozen once in year ten is ฿4,306 a month poorer until retirement. It happens about once every twelve years. It is a pay cut nobody writes a letter about, and 3% inflation collects on it quietly every year after.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'เรียนจบสายที่ต้องมีใบอนุญาตแล้วยังไม่ได้เริ่มงานทันที ต้องรอรอบเรียกตัว นักบินรอเฉลี่ย 7 เดือน พยาบาลกับครูราว 2 เดือน ระหว่างรอไม่มีเงินเดือนแต่รายจ่ายเดินต่อ เพราะค่าเรียนไม่ใช่ส่วนที่แพงที่สุดของการเปลี่ยนสาย',
          en: 'Qualifying in a licensed field no longer means starting work that week. The pilot waits about seven months for a seat, a nurse or a teacher about two, with no wage and the bills carrying on, because the tuition was never the expensive part of changing careers.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'เงินเดือนหลังเปลี่ยนสายไต่กลับปีละ 20% ของช่องว่าง จากเดิมที่โดนหักถาวรตลอดชีวิต คนที่ย้ายสายแล้วทำได้จริงไม่ได้เป็นเด็กใหม่ไปตลอด',
          en: 'The entry-pay haircut after retraining now closes by a fifth of the gap every year instead of standing for life. Nobody who can do the work stays the new one for ever.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'ปรับสมดุลอาชีพให้กลับเข้ากรอบที่ตั้งไว้เอง ครูเคยได้เส้นชัยต่ำที่สุดพร้อมบำนาญข้าราชการจนเป็นที่นั่งที่ง่ายที่สุด ส่วนแพทย์หลุดกรอบไปอยู่ที่ 3.79 ตอนนี้ทั้งสองอยู่ในช่วง 2.9 ถึง 3.2 ตามที่กติกาในโค้ดประกาศไว้',
          en: 'Two seats were pulled back inside the band the rules set for themselves. The teacher had both the lowest finish line and a civil-service pension, which made it the easiest chair in the game; the doctor had drifted out to 3.79. Both now sit between 2.9 and 3.2.',
        },
      },
    ],
  },
  {
    version: '0.6.0',
    dateISO: '2026-08-20',
    codename: { th: 'กิจการมีมูลค่าตามที่มันทำได้', en: 'A business is worth what it earns' },
    entries: [
      {
        kind: 'changed',
        text: {
          th: 'มูลค่ากิจการในงบเดินตามกำไรของมันเองแล้ว ร้านที่กำไรโตขึ้นเท่าตัวมูลค่าก็ขึ้นเท่าตัว ร้านที่เจ๊งจนกำไรเหลือศูนย์เหลือแค่ค่าซากประมาณ 30% ของราคาที่ซื้อมา เมื่อก่อนงบบอกราคาที่ซื้อมาตลอดกาลไม่ว่ากิจการจะเป็นยังไง',
          en: 'What a business is worth on the statement now follows what it earns. One that doubles its takings doubles in value; one that stops earning falls to roughly 30% of its price, the second-hand worth of its equipment. It used to sit at the purchase price for ever, whatever happened to it.',
        },
      },
      {
        kind: 'changed',
        text: {
          th: 'การ์ดคนซื้อกิจการเปลี่ยนจาก "กำไรต่อเดือนคูณ 40 ถึง 60" เป็น "130% ถึง 160% ของมูลค่ากิจการตอนนี้" แบบเดียวกับการ์ดคนซื้ออสังหา ตัวคูณตัวเดียวใช้กับร้านชานมกับโรงพยาบาลไม่ได้ เพราะร้านเล็กซื้อขายกันที่ราว 25 เท่าของกำไรต่อเดือน ส่วนโครงสร้างพื้นฐานอยู่ที่ราว 100 เท่า ซึ่งเป็นราคาจริงของทั้งสองแบบ ส่วนการขายเองแบบรีบ ๆ ได้ 70% ของมูลค่า',
          en: 'The business-buyer cards now bid 130% to 160% of what the business is worth today, the same way the property buyers bid on a building, instead of a flat 40 to 60 months of profit. One multiple cannot cover a milk-tea franchise and a hospital: small shops really do change hands at about 25 times monthly profit and infrastructure at about 100. A quick private sale pays 70% of the value.',
        },
      },
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
      {
        kind: 'fixed',
        text: {
          th: 'ขายกิจการที่กู้มาซื้อ เคยกลายเป็นเราต้องจ่ายเงินให้คนซื้อ เพราะราคาที่เสนอคิดจากกำไรหลังหักค่างวดแล้วยังเอาหนี้ทั้งก้อนมาหักซ้ำอีกรอบ ตอนนี้คิดจากกำไรก่อนหักค่างวด ไม่มีทางติดลบ และถ้าราคาไม่พอปิดหนี้ ส่วนต่างจะกลายเป็นหนี้ที่ยังต้องผ่อนต่อ แทนที่หนี้จะหายไปเฉย ๆ',
          en: 'Selling a business bought with a loan could take money out of your pocket: the offer was priced off profit after the instalment and then had the whole loan subtracted again. It is now priced off profit before the instalment, never goes negative, and any part the price cannot clear stays as a debt instead of quietly vanishing.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'ช่องกรอกจำนวนหน่วยตอนขาย ทำให้ตัวเลขข้างบนเปลี่ยนตามแล้ว ทั้งหน้าขายด่วนและแถวทองกับหุ้นในงบ เมื่อก่อนกรอก 3 จาก 12 แต่ตัวเลขยังเป็นของ 12',
          en: 'Typing a smaller quantity into a sell box now re-prices the row above it, both in the forced-sale panel and on the gold and share rows. Typing 3 of 12 used to leave the figures showing all 12.',
        },
      },
      {
        kind: 'fixed',
        text: {
          th: 'ข้อความอังกฤษของการ์ดผู้ซื้อบ้าน คอนโด และอพาร์ตเมนต์ เขียนว่าเสนอราคาเป็นเปอร์เซ็นต์ของราคาที่ซื้อมา ทั้งที่คิดจากราคาตอนนี้ และข้อความตอนกิจการปิดตัวยังขึ้นชื่อภาษาไทยในเวอร์ชันอังกฤษ',
          en: 'The English on the condo, apartment and house buyer cards said the offer was a percentage of what you paid, when it is a percentage of today’s price, and the business-shutdown line still printed the Thai name in English.',
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

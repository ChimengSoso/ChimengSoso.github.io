export interface Game {
  /** Directory-style path relative to /games/ (e.g. 'nee-noo/'). */
  href: string;
  /** Short category label shown as a pill on the card. */
  tag: string;
  title: string;
  desc: string;
  /** One line on what the player actually does, shown under the description. */
  howToWin: string;
  /** Placeholder card for something not built yet. */
  soon?: boolean;
}

export const games: Game[] = [
  {
    href: 'nee-noo/',
    tag: 'เกมการเงิน',
    title: 'หนีหนู',
    desc: 'เกมกระดานการเงินที่เขียนขึ้นใหม่ทั้งเกม เลือกอาชีพจาก 8 แบบ ดูงบการเงินของตัวเองทุกเดือน สะสมสินทรัพย์ที่ให้เงินไหลเข้า แล้วหนีออกจากวงล้อเงินเดือนให้ได้ สลับไทย/อังกฤษได้ระหว่างเล่น และบันทึกความคืบหน้าไว้ให้กลับมาเล่นต่อ',
    howToWin: 'ชนะเมื่อเงินไหลเข้าต่อเดือน มากกว่ารายจ่ายต่อเดือน',
  },
  {
    href: 'tax-gap/',
    tag: 'เกมการเงิน',
    title: 'ล่าช่องว่างภาษี',
    desc: 'เกมวางแผนลดหย่อนภาษีเงินได้บุคคลธรรมดาที่คำนวณตามกฎหมายไทยจริง กรอกเงินเดือนตัวเดียว ที่เหลือเกมเติมให้ทั้งค่าใช้จ่ายเหมา ลดหย่อนส่วนตัว และประกันสังคม แล้วดูว่าแต่ละช่องยังเหลือเพดานเท่าไหร่ พร้อมคำตอบว่า RMF 30% นั้นคิดจากอะไร คัดลอกสรุปทั้งหมดไปคุยกับ AI ต่อได้',
    howToWin: 'ชนะเมื่อใช้เงินเย็นที่มีอยู่ ประหยัดภาษีได้มากที่สุดโดยที่เงินยังเป็นของคุณ',
  },
];

export function getGame(href: string): Game | undefined {
  return games.find((g) => g.href === href);
}

export const publishedGames = games.filter((g) => !g.soon);

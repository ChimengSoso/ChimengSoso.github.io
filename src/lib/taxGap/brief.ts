/**
 * The hand-off to an AI.
 *
 * The point of the button this feeds is that nobody should have to retype
 * fifteen numbers into a chat window and hope they got them right. It emits
 * one Markdown block holding the whole position: what the player earns, what
 * they have already claimed, exactly how much room is left in each slot and
 * which ceiling is holding it down, and the rate the next baht claws back.
 *
 * It also carries its own health warning. An assistant handed a table of
 * numbers with no provenance will happily plan around last year's law, so the
 * brief states which tax year it is quoting and what is still unsettled.
 */
import { allHeadroom, computeTax, money, capText, scoreProfile } from './engine';
import { rulesFor } from './rules';
import type { Profile, Headroom, TaxYearRules } from './types';

const bindingLabel: Record<Headroom['binding'], string> = {
  statutory: 'เพดานตามกฎหมาย',
  income: 'สัดส่วนของเงินได้พึงประเมิน',
  pot: 'เพดานร่วมกับช่องอื่น',
  none: 'ไม่มีเพดาน',
};

export function buildBrief(profile: Profile, rules: TaxYearRules = rulesFor(profile.year)): string {
  const tax = computeTax(profile, rules);
  const score = scoreProfile(profile, rules);
  const rows = allHeadroom(profile, rules);

  // A per-head slot's ceiling is a rate times a headcount, so printing the
  // ceiling of someone who has declared nobody prints a zero, and a zero here
  // reads as "the law allows you nothing" rather than "you have not said how
  // many people you support". Quote the rate instead.
  const statutoryText = (h: Headroom): string =>
    h.slot.perHead
      ? `${money(h.slot.perHead.amount)} ต่อคน (สูงสุด ${h.slot.perHead.maxHeads} คน)`
      : capText(h.statutoryCap);

  const line = (h: Headroom): string =>
    `| ${h.slot.name} | ${statutoryText(h)} | ${capText(h.effectiveCap)} | ${money(h.used)} | ${money(h.left)} | ${bindingLabel[h.binding]} |`;

  const claimed = rows.filter((h) => h.used > 0);
  const spare = rows.filter((h) => h.slot.costsCash && h.left > 0);

  return [
    `# สรุปสถานะภาษีเงินได้บุคคลธรรมดา ปีภาษี ${rules.year}`,
    '',
    'ช่วยวางแผนภาษีต่อจากตัวเลขชุดนี้ ทุกตัวเลขคำนวณมาแล้วตามกฎหมายไทยที่บังคับใช้อยู่ ไม่ต้องคำนวณใหม่',
    '',
    '## รายได้และภาษีปัจจุบัน',
    '',
    `- เงินได้พึงประเมินทั้งปี: ${money(tax.assessableIncome)} บาท (เงินเดือน ${money(profile.monthlySalary)} ต่อเดือน${profile.bonus > 0 ? ` บวกโบนัสและรายได้อื่น ${money(profile.bonus)}` : ''})`,
    `- หักค่าใช้จ่ายแบบเหมา: ${money(tax.employmentExpense)} บาท`,
    `- ค่าลดหย่อนที่ใช้แล้วรวม: ${money(tax.allowances)} บาท`,
    `- เงินบริจาคที่หักได้: ${money(tax.donationAllowed)} บาท (เพดาน ${money(tax.donationCap)})`,
    `- **เงินได้สุทธิ: ${money(tax.netIncome)} บาท**`,
    `- **ภาษีที่ต้องจ่าย: ${money(tax.tax)} บาทต่อปี** (เฉลี่ยเดือนละ ${money(tax.tax / 12)})`,
    `- อัตราภาษีขั้นบันไดที่อยู่ตอนนี้: ${Math.round(tax.marginalRate * 100)}% แปลว่าทุก 1,000 บาทที่ลดหย่อนเพิ่ม ภาษีลดลง ${money(1000 * tax.marginalRate)} บาท`,
    `- เงินสดที่ยังใช้ลดหย่อนได้ปีนี้: ${money(profile.budget)} บาท`,
    `- **ลดหย่อนเพิ่มได้อีก ${money(score.usefulRoomLeft)} บาทที่ยังลดภาษีได้จริง** เกินจากนี้เงินได้สุทธิจะลงไปถึงขั้นยกเว้น ลดหย่อนเพิ่มก็ไม่ได้ภาษีคืนแล้ว อย่าแนะนำให้ซื้อเกินตัวเลขนี้`,
    '',
    '## ช่องลดหย่อนทั้งหมด',
    '',
    'คอลัมน์ "เพดานจริงของคุณ" คิดสัดส่วนตามเงินได้และเพดานร่วมกับช่องอื่นมาแล้ว ใช้ตัวเลขนี้ ไม่ใช่เพดานตามกฎหมาย',
    '',
    '| ช่อง | เพดานตามกฎหมาย | เพดานจริงของคุณ | ใช้แล้ว | เหลือ | ตัวที่บีบอยู่ |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...rows.map(line),
    '',
    '## กระปุกที่ใช้เพดานร่วมกัน',
    '',
    ...rules.pots.map((p) => `- **${p.name}** เพดานรวม ${money(p.cap)} บาท: ${p.members.map((m) => rules.slots.find((s) => s.id === m)?.name ?? m).join(', ')} · ${p.note}`),
    '',
    '## สรุปการเล่นรอบนี้',
    '',
    `- ถ้ายังไม่ได้ซื้ออะไรเพิ่มปีนี้ แต่กรอกสิทธิที่มีอยู่แล้วครบ ภาษีจะเป็น ${money(score.baselineTax)} บาท`,
    `- ตอนนี้ประหยัดไปได้ ${money(score.taxSaved)} บาท โดยใช้เงินสดของปีนี้ ${money(score.cashSpent - score.alreadyPaid)} บาท ซึ่งยังเป็นทรัพย์สินของตัวเองอยู่ ${money(score.capitalRetained)} บาท`,
    ...(score.alreadyPaid > 0
      ? [
          `- อีก ${money(score.alreadyPaid)} บาทจ่ายไปก่อนหน้านี้แล้วในปีภาษีเดียวกัน นับเป็นค่าลดหย่อนตามปกติ แต่ไม่ใช่เงินที่ยังตัดสินใจได้ อย่าเสนอให้ย้ายหรือถอนออก`,
        ]
      : []),
    `- ช่องที่ยังว่างและซื้อเพิ่มได้: ${spare.length > 0 ? spare.map((h) => `${h.slot.name} เหลือ ${money(h.left)}`).join(' · ') : 'ไม่เหลือแล้ว'}`,
    `- สิทธิที่ใช้ไปแล้ว: ${claimed.map((h) => h.slot.name).join(', ')}`,
    '',
    '## ข้อควรรู้ก่อนแนะนำ',
    '',
    `- ตัวเลขชุดนี้อ้างอิงกฎหมายที่ตรวจสอบล่าสุดเมื่อ ${rules.verifiedOn} จากประกาศของกรมสรรพากร`,
    ...rules.caveats.map((c) => `- ${c}`),
    '- ช่องที่มีเงื่อนไขผูกมัดระยะยาว อย่าแนะนำให้ซื้อเต็มเพดานโดยไม่ถามเรื่องสภาพคล่องก่อน RMF ต้องถือจนอายุ 55 และซื้อต่อเนื่อง Thai ESG ถือ 5 ปี ประกันชีวิตต้องคุ้มครอง 10 ปีขึ้นไป',
    '- ช่องที่คิดตามจำนวนคน เช่น บุตร บิดามารดา คนพิการ เพดานจริงจะเป็น 0 ถ้ายังไม่ได้ระบุจำนวนคน ไม่ได้แปลว่ากฎหมายไม่ให้สิทธิ ถ้าคอลัมน์นั้นเป็น 0 ให้ถามก่อนว่ามีคนในอุปการะไหม',
    '- ช่วยตรวจด้วยว่ามีสิทธิที่ยังไม่ได้กรอกไหม เช่น ดอกเบี้ยบ้าน พ่อแม่ที่อายุเกิน 60 ประกันสุขภาพพ่อแม่ หรือมาตรการรายปีของปีนี้',
  ].join('\n');
}

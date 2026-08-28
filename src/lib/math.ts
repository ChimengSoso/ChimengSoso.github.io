import katex from 'katex';

/**
 * เรนเดอร์ LaTeX เป็น HTML ตอน build (ไม่มี JS ฝั่ง client)
 * ใช้คู่กับ set:html เช่น <span set:html={tex('r = 0.005')} />
 */
export function tex(src: string): string {
  return katex.renderToString(src, { throwOnError: true, displayMode: false, output: 'html' });
}

/** สูตรแบบบรรทัดเดี่ยว จัดกลาง ห่อ .mathblock ไว้ให้เลื่อนแนวนอนได้เอง */
export function texBlock(src: string): string {
  const html = katex.renderToString(src, { throwOnError: true, displayMode: true, output: 'html' });
  return `<div class="mathblock">${html}</div>`;
}

/**
 * สูตรที่ย้อมสีแบบ syntax highlight ให้อ่านเป็น "ภาษาคอม" ไม่ใช่คณิตศาสตร์บริสุทธิ์
 *
 * สีชุดนี้คือสีเดียวกับหน้าต่างโค้ดในหน้าเดียวกัน (shiki ธีม dracula) จะได้อ่านสลับไปมาได้
 * ชื่อตาราง/ฟังก์ชันเขียว ตัวเลขม่วง ตัวดำเนินการชมพู ส่วนตัวแปรเดี่ยว ๆ ปล่อยเป็นสีพื้น
 * เหมือนที่ shiki ทำกับตัวแปรในโค้ด C++ จริง
 *
 * KaTeX รับสีเป็น #hex ได้ แต่ **นิยามเป็น macro ไม่ได้** เพราะตัวแยกวิเคราะห์ของ KaTeX
 * อ่าน "#5" ใน #50FA7B เป็นพารามิเตอร์ที่ 5 ของ macro แล้วพัง จึงต้องเขียน \textcolor ตรง ๆ
 */
const codeColor = (hex: string, src: string): string => '\\textcolor{' + hex + '}{' + src + '}';

export const mc = {
  /** ชื่อตาราง ชื่ออาเรย์ ชื่อฟังก์ชัน เช่น dp, f, t, a */
  fn: (src: string): string => codeColor('#50FA7B', src),
  /** ค่าคงที่ที่เป็นตัวเลข */
  num: (src: string): string => codeColor('#BD93F9', src),
  /** ตัวดำเนินการ + - = >= < <= */
  op: (src: string): string => codeColor('#FF79C6', src),
  /** \max ที่ยังวางเงื่อนไขไว้ใต้ตัวมันได้ (\textcolor เฉย ๆ จะทำให้กลายเป็น ord แล้วเงื่อนไขไปอยู่ห้อยข้าง) */
  max: '\\mathop{' + codeColor('#50FA7B', '\\max') + '}\\limits',
  /**
   * ฟังก์ชันตรีโกณ (\cos, \sin, \tan) ที่ย้อมสีแล้วยังเป็น \mathop เหมือนเดิม
   * \textcolor เฉย ๆ จะทำให้มันกลายเป็น ord แล้วช่องไฟหน้า/หลังเพี้ยน (\cos\theta จะติดกัน)
   * ใช้แบบ mc.trig('\\cos') + '\\theta'
   */
  trig: (src: string): string => '\\mathop{' + codeColor('#50FA7B', src) + '}\\nolimits ',
};

/** เหมือน texBlock แต่พื้นหลัง/สีพื้นเป็นหน้าต่างโค้ด ใช้คู่กับ mc ข้างบน */
export function texCode(src: string): string {
  const html = katex.renderToString(src, { throwOnError: true, displayMode: true, output: 'html' });
  return `<div class="mathblock mathcode">${html}</div>`;
}

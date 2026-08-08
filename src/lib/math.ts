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

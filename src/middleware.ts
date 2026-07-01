import { defineMiddleware } from 'astro:middleware';

// เอาไว้ใช้แค่ตอน `npm run dev` เท่านั้น: ทำให้พิมพ์ localhost:4321 เฉยๆ
// (ไม่ต้องพ่วง /index.html) แล้วเห็นหน้าโปรไฟล์ได้เลย
//
// ตอน build จริง (astro build) ไม่มี server รันอยู่ ไฟล์นี้จะไม่ถูกเรียกใช้เลย
// เพราะ GitHub Pages เสิร์ฟไฟล์ static ตรงๆ (dist/index.html ที่มาจาก public/index.html
// อยู่แล้ว) — ไม่กระทบ production
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === '/') {
    return context.redirect('/index.html');
  }
  return next();
});

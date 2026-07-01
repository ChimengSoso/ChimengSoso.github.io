import { defineConfig } from 'astro/config';

// เว็บนี้เป็น user page (ChimengSoso.github.io) จึง deploy ที่ root โดยไม่ต้องตั้ง base
// ใช้ build.format แบบ default ("directory") -> /knowledge/index.html, /knowledge/claude-intro/index.html
// GitHub Pages เสิร์ฟ directory index ได้เองตามปกติ ไม่ต้องบังคับ flat .html
export default defineConfig({
  site: 'https://chimengsoso.github.io',
});

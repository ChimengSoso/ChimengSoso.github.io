import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// เว็บนี้เป็น user page (ChimengSoso.github.io) จึง deploy ที่ root โดยไม่ต้องตั้ง base
// ใช้ build.format แบบ default ("directory") -> /knowledge/index.html, /knowledge/claude-intro/index.html
// GitHub Pages เสิร์ฟ directory index ได้เองตามปกติ ไม่ต้องบังคับ flat .html
export default defineConfig({
  site: 'https://chimengsoso.github.io',
  // divine-lore is a hidden easter-egg page, unlocked in-app -- keep it out
  // of the sitemap so it isn't discoverable by crawling /sitemap-0.xml.
  integrations: [sitemap({ filter: (page) => !page.includes('/divine-lore') })],
});
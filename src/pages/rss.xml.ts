import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { articles } from '../data/articles';

export function GET(context: APIContext) {
  const published = articles.filter((a) => !a.soon && a.dateISO);
  return rss({
    title: 'ChimengSoso — ความรู้',
    description: 'บทความความรู้ด้าน AI, Claude Code และมุมมองเทคโนโลยี โดย Worakun Ata',
    site: context.site!,
    items: published.map((a) => ({
      title: a.title,
      description: a.desc,
      pubDate: new Date(a.dateISO!),
      link: `/knowledge/${a.href}`,
    })),
    customData: '<language>th</language>',
  });
}

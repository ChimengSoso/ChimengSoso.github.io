import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { articles } from '../data/articles';

export function GET(context: APIContext) {
  const published = articles.filter((a) => !a.soon && a.dateISO);
  const selfUrl = new URL('rss.xml', context.site!).href;
  return rss({
    title: 'ChimengSoso — ความรู้',
    description: 'บทความความรู้ด้าน AI, Claude Code และมุมมองเทคโนโลยี โดย Worakun Ata',
    site: context.site!,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: published.map((a) => ({
      title: a.title,
      description: a.desc,
      pubDate: new Date(a.dateISO!),
      link: `/knowledge/${a.href}`,
    })),
    customData: `<language>th</language><atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>`,
  });
}

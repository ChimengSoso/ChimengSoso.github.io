import type { APIRoute, GetStaticPaths } from 'astro';
import { articles } from '../../data/articles.js';
import { renderCard } from '../../og/card';

// One share card per published article, plus the /knowledge listing page.
// Slug matches the article's directory-style href (e.g. 'grill-and-loop/' -> 'grill-and-loop').
export const getStaticPaths: GetStaticPaths = () => {
  const items = articles
    .filter((a) => !a.soon)
    .map((a) => ({
      params: { slug: a.href.replace(/\/$/, '') },
      props: { title: a.title, tag: a.tag },
    }));
  items.push({ params: { slug: 'knowledge' }, props: { title: 'หมวดความรู้', tag: '' } });
  return items;
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard({ title: props.title as string, tag: props.tag as string });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};

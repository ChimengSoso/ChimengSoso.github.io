import type { APIRoute, GetStaticPaths } from 'astro';
import { publishedCpProblems, getCpSet } from '../../../data/cp';
import { renderCard, type CardInput } from '../../../og/card';

// การ์ดแชร์หนึ่งใบต่อโจทย์หนึ่งข้อ ใช้ธีม vault เดียวกับ /divine-lore/
// slug ตรงกับ href แบบไดเรกทอรีของโจทย์ (เช่น 'icpc-2026-needle/' -> 'icpc-2026-needle')
export const getStaticPaths: GetStaticPaths = () =>
  publishedCpProblems.map((p) => ({
    params: { slug: p.href.replace(/\/$/, '') },
    props: { title: p.title, tag: getCpSet(p.setId)?.title ?? 'โจทย์แข่ง' },
  }));

export const GET: APIRoute<CardInput> = async ({ props }) => {
  const png = await renderCard({ title: props.title, tag: props.tag, theme: 'divine' });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};

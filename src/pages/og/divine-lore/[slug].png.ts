import type { APIRoute, GetStaticPaths } from 'astro';
import { divineLoreEntries } from '../../../data/divineLore';
import { renderCard, type CardInput } from '../../../og/card';

// One share card per divine-lore entry, in the emerald "vault" theme.
// Slug matches the entry's directory-style href (e.g. 'icpc-warmup-2026/' -> 'icpc-warmup-2026').
export const getStaticPaths: GetStaticPaths = () =>
  divineLoreEntries.map((e) => ({
    params: { slug: e.href.replace(/\/$/, '') },
    props: { title: e.title, tag: e.tag },
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

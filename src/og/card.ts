import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// --- Font setup -------------------------------------------------------------
// We render with sharp/librsvg because its pango+harfbuzz text stack shapes Thai
// correctly (tone marks stack above the upper vowels). resvg was tried but its
// shaper drops Thai mark-to-mark positioning, so ไม้เอก over สระอี disappears.
//
// The catch with librsvg is font discovery: an embedded base64 @font-face works
// on Windows but is ignored by the Linux CI's librsvg (Thai then renders as
// .notdef boxes). So instead we point fontconfig at our own font directory via a
// generated config, and FORCE every non-mono run to Sarabun so no system font can
// leak in for Latin — that keeps the output identical on every machine.
//
// FONTCONFIG_FILE must be set before libvips (sharp) initialises fontconfig, so it
// happens here at module load and sharp is imported lazily inside renderCard.
const fontDir = path.join(process.cwd(), 'src', 'og').replace(/\\/g, '/');
const cacheDir = path.join(os.tmpdir(), 'chimeng-og-fc-cache').replace(/\\/g, '/');
fs.mkdirSync(cacheDir, { recursive: true });
const confPath = path.join(os.tmpdir(), 'chimeng-og-fonts.conf');
fs.writeFileSync(
  confPath,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontDir}</dir>
  <cachedir>${cacheDir}</cachedir>
  <match target="pattern">
    <test name="family" compare="not_eq"><string>JetBrains Mono</string></test>
    <edit name="family" mode="assign" binding="strong"><string>Sarabun</string></edit>
  </match>
</fontconfig>`,
);
process.env.FONTCONFIG_FILE = confPath;

const SARABUN = 'Sarabun';
const MONO = 'JetBrains Mono';

// Thai above/below marks (tone marks, upper/lower vowels) carry no horizontal
// advance, so they must count as zero width when estimating a line's length.
const isThaiMark = (c: number) =>
  c === 0x0e31 || (c >= 0x0e34 && c <= 0x0e3a) || (c >= 0x0e47 && c <= 0x0e4e);

// Rough per-glyph advance (in em) for Sarabun — good enough to wrap/scale titles
// without a full text-layout engine. Verified against the real article titles.
function sarabunChar(ch: string): number {
  const c = ch.codePointAt(0)!;
  if (isThaiMark(c)) return 0;
  if (ch === ' ') return 0.32;
  if (c >= 0x0e00 && c <= 0x0e7f) return 0.62; // Thai base glyphs
  if (/[ .,:;!'|ijlt]/.test(ch)) return 0.32; // narrow latin
  if (/[mwMW@]/.test(ch)) return 0.9; // extra-wide latin
  if (/[A-Z0-9]/.test(ch)) return 0.68; // caps & digits (bold)
  return 0.55; // latin lowercase
}
const sarabunWidth = (text: string, size: number) =>
  Array.from(text).reduce((w, ch) => w + sarabunChar(ch) * size, 0);

// JetBrains Mono is monospaced: every glyph advances 0.6em.
const monoWidth = (text: string, size: number) => text.length * 0.6 * size;

// A "code" run is a slash command like /grill-me — rendered in the mono font
// with an inline-code highlight, echoing how <code> looks on the site.
interface Run {
  text: string;
  code: boolean;
}
const tokenize = (title: string): Run[] =>
  title.split(' ').map((w) => ({ text: w, code: /^\/[A-Za-z]/.test(w) }));

const codePad = (size: number) => size * 0.14; // horizontal padding inside the chip
const runWidth = (run: Run, size: number) =>
  run.code ? monoWidth(run.text, size) + 2 * codePad(size) : sarabunWidth(run.text, size);

interface Line {
  runs: Run[];
  width: number;
}
function layout(title: string, size: number, maxWidth: number): { lines: Line[]; maxWidth: number } {
  const space = sarabunWidth(' ', size);
  const lines: Line[] = [];
  let runs: Run[] = [];
  let width = 0;
  for (const run of tokenize(title)) {
    const rw = runWidth(run, size);
    const add = runs.length ? space + rw : rw;
    if (runs.length && width + add > maxWidth) {
      lines.push({ runs, width });
      runs = [run];
      width = rw;
    } else {
      runs.push(run);
      width += add;
    }
  }
  if (runs.length) lines.push({ runs, width });
  // Math.max() of an empty array is -Infinity, which would corrupt the shrink
  // loop and centering math — guard against a blank/whitespace-only title.
  return { lines, maxWidth: lines.length ? Math.max(...lines.map((l) => l.width)) : 0 };
}

const escapeXml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

export interface CardInput {
  title: string;
  tag?: string;
}

// Renders a 1200x630 branded share card (Facebook/Twitter og:image size) as PNG.
export async function renderCard({ title, tag }: CardInput): Promise<Buffer> {
  const maxWidth = 1040;

  // Start big; shrink until the title fits within 3 lines and no line overflows.
  let size = 76;
  let laid = layout(title, size, maxWidth);
  while ((laid.lines.length > 3 || laid.maxWidth > maxWidth) && size > 44) {
    size -= 4;
    laid = layout(title, size, maxWidth);
  }

  const space = sarabunWidth(' ', size);
  const pad = codePad(size);
  const lineHeight = size * 1.24;
  const firstBaseline = 330 - (laid.lines.length * lineHeight) / 2 + size * 0.8;

  let titleEls = '';
  laid.lines.forEach((line, li) => {
    const baseline = firstBaseline + li * lineHeight;
    const runs = line.runs;
    let x = 80;
    let i = 0;
    let first = true;
    while (i < runs.length) {
      if (!first) x += space;
      first = false;
      if (runs[i].code) {
        // A single code token rendered as an inline-code chip in the mono font.
        const text = runs[i].text;
        const boxW = monoWidth(text, size) + 2 * pad;
        titleEls +=
          `<rect x="${x.toFixed(1)}" y="${(baseline - size * 0.86).toFixed(1)}" width="${boxW.toFixed(1)}" height="${(size * 1.08).toFixed(1)}" rx="${(size * 0.16).toFixed(1)}" fill="#ffffff" fill-opacity="0.13"/>` +
          `<text x="${(x + pad).toFixed(1)}" y="${baseline.toFixed(1)}" font-family="${MONO}" font-weight="700" font-size="${size}" fill="#d7e4ff">${escapeXml(text)}</text>`;
        x += boxW;
        i += 1;
      } else {
        // Coalesce consecutive normal words into one <text> so librsvg lays out
        // their spacing exactly — manual positioning is only used at chip seams,
        // where the small width estimate error is hidden by the chip padding.
        const words: string[] = [];
        while (i < runs.length && !runs[i].code) words.push(runs[i++].text);
        const seg = words.join(' ');
        titleEls += `<text x="${x.toFixed(1)}" y="${baseline.toFixed(1)}" font-family="${SARABUN}" font-weight="700" font-size="${size}" fill="#ffffff">${escapeXml(seg)}</text>`;
        x += sarabunWidth(seg, size);
      }
    }
  });

  let tagEl = '';
  if (tag) {
    const w = sarabunWidth(tag, 28) + 64;
    tagEl =
      `<rect x="80" y="74" width="${w.toFixed(0)}" height="58" rx="29" fill="#4d72a9"/>` +
      `<text x="${(80 + w / 2).toFixed(0)}" y="113" font-family="${SARABUN}" font-weight="700" font-size="28" fill="#ffffff" text-anchor="middle">${escapeXml(tag)}</text>`;
  }

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b2c4a"/>
      <stop offset="1" stop-color="#0d1524"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="150" r="3" fill="#ffffff" opacity="0.5"/>
  <circle cx="1108" cy="238" r="2" fill="#ffffff" opacity="0.35"/>
  <circle cx="978" cy="92" r="2" fill="#ffffff" opacity="0.3"/>
  <circle cx="1140" cy="118" r="2.5" fill="#ffffff" opacity="0.45"/>
  <circle cx="1068" cy="322" r="2" fill="#ffffff" opacity="0.3"/>
  <rect x="0" y="0" width="12" height="630" fill="#4d72a9"/>
  ${tagEl}
  ${titleEls}
  <text x="80" y="560" font-family="${SARABUN}" font-weight="700" font-size="30" fill="#9fb4d4">ChimengSoso.github.io · หมวดความรู้</text>
</svg>`;

  const { default: sharp } = await import('sharp');
  return sharp(Buffer.from(svg)).png().toBuffer();
}

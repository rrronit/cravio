import { decode } from 'html-entities';
import { createAppError } from '../models/error.model';
import type { SourceExtraction } from '../models/import.model';

export const createSourceExtractor = () => ({
  normalize: normalizeInstagramReelUrl,
  extract: extractInstagramReel,
});

export function normalizeInstagramReelUrl(value: string): { url: string; platform: 'Instagram' } {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (
    url.protocol !== 'https:' || url.username || url.password || url.port ||
    hostname !== 'instagram.com' || !/^\/reel\/[^/]+\/?$/i.test(url.pathname)
  ) {
    throw createAppError(400, 'Use a public Instagram Reel link in the form https://www.instagram.com/reel/…');
  }
  url.hostname = 'www.instagram.com';
  url.hash = '';
  return { url: url.toString(), platform: 'Instagram' };
}

async function extractInstagramReel(value: string, suppliedCaption?: string): Promise<SourceExtraction> {
  const normalized = normalizeInstagramReelUrl(value);
  const response = await fetch(normalized.url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw createAppError(502, `Instagram returned HTTP ${response.status}.`);

  const html = await response.text();
  const source = parseInstagramReelHtml(html);
  if (suppliedCaption?.trim()) {
    source.description = suppliedCaption.trim();
    source.provider = `${source.provider}+user_caption`;
  }
  if (!source.description) {
    throw createAppError(422, 'No caption was found in the Instagram Reel HTML.');
  }
  return source;
}

export function parseInstagramReelHtml(html: string): SourceExtraction {
  const metadata = readMetaTags(html);
  const description = metadata.get('description') || metadata.get('og:description') || '';
  const captionMatch = description.match(/comments\s*-\s*([a-z0-9._]+)\s+on\s+[^:]+:\s*["“]([\s\S]*)["”]\.\s*$/i);
  const title = metadata.get('twitter:title') || '';
  const titleCreator = title.match(/\(@([a-z0-9._]+)\)/i)?.[1] || '';
  return {
    title: '',
    creator: captionMatch?.[1] || titleCreator,
    description: (captionMatch?.[2] || description).trim(),
    thumbnail: safeImage(metadata.get('og:image') || metadata.get('twitter:image')),
    provider: 'instagram_html_meta',
  };
}

function readMetaTags(html: string): Map<string, string> {
  const metadata = new Map<string, string>();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map<string, string>();
    for (const attribute of match[0].matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
      attributes.set(attribute[1]!.toLowerCase(), decode(attribute[3]!, { level: 'html5' }));
    }
    const key = attributes.get('name') || attributes.get('property');
    const content = attributes.get('content');
    if (key && content && !metadata.has(key.toLowerCase())) metadata.set(key.toLowerCase(), content);
  }
  return metadata;
}

function safeImage(value: unknown): string {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return url.protocol === 'https:' ? url.toString() : ''; } catch { return ''; }
}

export type SourceExtractor = ReturnType<typeof createSourceExtractor>;

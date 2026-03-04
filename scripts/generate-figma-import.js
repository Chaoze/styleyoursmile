#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'exports');
const OUT_FILE = path.join(OUT_DIR, 'styleyoursmile-figma-import.svg');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(text, maxChars) {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function extractAll(re, text) {
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(m);
  return out;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function listHtmlFiles() {
  return fs.readdirSync(ROOT)
    .filter((f) => f.endsWith('.html'))
    .sort((a, b) => a.localeCompare(b, 'de'));
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function listImageFiles() {
  const imgDir = path.join(ROOT, 'Images');
  if (!fs.existsSync(imgDir)) return [];
  const exts = new Set(['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.avif', '.eps']);
  return walk(imgDir)
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
    .sort((a, b) => a.localeCompare(b, 'de'));
}

function parseCssTokens(css) {
  const rootBlock = css.match(/:root\s*{([\s\S]*?)}/);
  if (!rootBlock) return [];
  return extractAll(/--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g, rootBlock[1])
    .map((m) => ({ name: m[1], value: m[2].trim() }));
}

function parsePage(file) {
  const html = read(file);
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [null, ''])[1].trim();
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i) || [null, ''])[1].trim();
  const h1 = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [null, ''])[1]);
  const h2s = extractAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, html)
    .map((m) => stripTags(m[1]))
    .filter(Boolean)
    .slice(0, 6);
  const h3s = extractAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, html)
    .map((m) => stripTags(m[1]))
    .filter(Boolean);
  const sectionIds = extractAll(/<(section|div)[^>]*\sid=["']([^"']+)["']/gi, html).map((m) => m[2]);
  const imgCount = extractAll(/<img\b/gi, html).length;
  const linkCount = extractAll(/<a\b/gi, html).length;
  const wordCount = stripTags(html).split(/\s+/).filter(Boolean).length;

  return { file, title, desc, h1, h2s, h3Count: h3s.length, sectionIds, imgCount, linkCount, wordCount };
}

function colorSwatch(token) {
  const v = token.value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return v;
  const rgba = v.match(/^rgba?\((.+)\)$/i);
  if (rgba) return v;
  return null;
}

function buildSvg({ pages, tokens, images }) {
  const pageCols = 3;
  const cardW = 560;
  const cardGap = 32;
  const cardX0 = 48;
  const cardY0 = 240;
  const headerH = 140;
  const paletteH = 240;
  const leftMetaW = 420;
  const pageAreaX = leftMetaW + 72;
  const pageAreaW = pageCols * cardW + (pageCols - 1) * cardGap;
  const boardW = pageAreaX + pageAreaW + 48;

  const cards = pages.map((p) => {
    const h2Lines = p.h2s.slice(0, 5);
    const descLines = wrapText(p.desc, 56).slice(0, 2);
    const titleLines = wrapText(p.title || p.file, 42).slice(0, 2);
    const h1Lines = wrapText(p.h1, 42).slice(0, 2);
    const titleRows = Math.max(1, titleLines.length);
    const h1Rows = h1Lines.length ? h1Lines.length : 1;
    const h2Rows = Math.max(1, h2Lines.length);
    const descRows = Math.max(0, descLines.length);
    const height = 200 + (titleRows * 22) + (h1Rows * 22) + (h2Rows * 22) + (descRows * 18);
    return { ...p, titleLines, h1Lines, h2Lines, descLines, cardHeight: Math.max(280, height) };
  });

  let maxColumnHeights = new Array(pageCols).fill(cardY0);
  const placed = cards.map((c, i) => {
    const col = i % pageCols;
    const rowY = maxColumnHeights[col];
    maxColumnHeights[col] += c.cardHeight + cardGap;
    return {
      ...c,
      x: pageAreaX + cardX0 + col * (cardW + cardGap),
      y: rowY,
      w: cardW,
      h: c.cardHeight
    };
  });

  const pagesBottom = Math.max(...maxColumnHeights, cardY0);
  const assetStartY = Math.max(headerH + paletteH + 80, pagesBottom + 48);

  const imageCols = 3;
  const assetCardW = Math.floor((boardW - 96 - (imageCols - 1) * 24) / imageCols);
  const assetX0 = 48;
  const assetTopPad = 112;
  const assetLines = images.map((img) => wrapText(img, 42)).flat();
  const assetRows = Math.max(images.length, 1);
  const assetH = assetTopPad + Math.max(240, assetRows * 22 + 40);
  const boardH = assetStartY + assetH + 48;

  const swatches = tokens.filter((t) => colorSwatch(t)).slice(0, 18);
  const nonColorTokens = tokens.filter((t) => !colorSwatch(t)).slice(0, 20);

  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${boardW}" height="${boardH}" viewBox="0 0 ${boardW} ${boardH}">`);
  parts.push(`<rect x="0" y="0" width="${boardW}" height="${boardH}" fill="#eef0ec"/>`);
  parts.push(`<rect x="24" y="24" width="${boardW - 48}" height="${boardH - 48}" rx="24" fill="#f6f7f3" stroke="#dde2da"/>`);

  parts.push(`<text x="48" y="74" font-family="Arial" font-size="34" fill="#111">StyleYourSmile - Figma Import Board</text>`);
  parts.push(`<text x="48" y="106" font-family="Arial" font-size="14" fill="#475046">Quelle: lokale HTML/CSS-Dateien im Projekt. Importierbar als SVG in Figma.</text>`);
  parts.push(`<text x="48" y="128" font-family="Arial" font-size="14" fill="#475046">Seiten: ${pages.length} | Bilder/Assets: ${images.length} | Tokens: ${tokens.length}</text>`);

  parts.push(`<rect x="48" y="156" width="${leftMetaW}" height="${paletteH}" rx="18" fill="#ffffff" stroke="#d7ddd5"/>`);
  parts.push(`<text x="72" y="188" font-family="Arial" font-size="16" font-weight="700" fill="#111">Design Tokens aus styles.css</text>`);

  let sx = 72;
  let sy = 214;
  let count = 0;
  for (const token of swatches) {
    const sw = 105;
    const sh = 64;
    const col = count % 3;
    const row = Math.floor(count / 3);
    const x = sx + col * 112;
    const y = sy + row * 74;
    const fill = colorSwatch(token);
    parts.push(`<rect x="${x}" y="${y}" width="${sw}" height="${sh}" rx="10" fill="#f8faf7" stroke="#d7ddd5"/>`);
    parts.push(`<rect x="${x + 8}" y="${y + 8}" width="28" height="28" rx="6" fill="${esc(fill)}" stroke="#bfc8be"/>`);
    parts.push(`<text x="${x + 42}" y="${y + 21}" font-family="Arial" font-size="10" fill="#4b544a">${esc(token.name)}</text>`);
    parts.push(`<text x="${x + 42}" y="${y + 36}" font-family="Arial" font-size="10" fill="#111">${esc(token.value)}</text>`);
    count++;
    if (count >= 9) break;
  }

  parts.push(`<rect x="48" y="412" width="${leftMetaW}" height="${Math.max(240, 40 + nonColorTokens.length * 14)}" rx="18" fill="#ffffff" stroke="#d7ddd5"/>`);
  parts.push(`<text x="72" y="444" font-family="Arial" font-size="16" font-weight="700" fill="#111">Weitere Tokens</text>`);
  nonColorTokens.forEach((t, i) => {
    parts.push(`<text x="72" y="${468 + i * 14}" font-family="Courier New, monospace" font-size="11" fill="#2b322d">--${esc(t.name)}: ${esc(t.value)}</text>`);
  });

  parts.push(`<text x="${pageAreaX + 48}" y="188" font-family="Arial" font-size="16" font-weight="700" fill="#111">Seiten-Frames (HTML-Dateien)</text>`);

  for (const c of placed) {
    parts.push(`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="18" fill="#ffffff" stroke="#d7ddd5"/>`);
    parts.push(`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="42" rx="18" fill="#0f1210"/>`);
    parts.push(`<rect x="${c.x}" y="${c.y + 24}" width="${c.w}" height="18" fill="#0f1210"/>`);
    parts.push(`<text x="${c.x + 18}" y="${c.y + 27}" font-family="Arial" font-size="12" fill="#eef2ec">${esc(c.file)}</text>`);
    parts.push(`<text x="${c.x + c.w - 18}" y="${c.y + 27}" text-anchor="end" font-family="Arial" font-size="11" fill="#a4b2a7">${c.wordCount} Woerter</text>`);

    let y = c.y + 64;
    for (const line of c.titleLines) {
      parts.push(`<text x="${c.x + 18}" y="${y}" font-family="Arial" font-size="18" fill="#111">${esc(line)}</text>`);
      y += 21;
    }

    parts.push(`<text x="${c.x + 18}" y="${y + 4}" font-family="Arial" font-size="11" fill="#5b8c7b">H1</text>`);
    y += 20;
    if (c.h1Lines.length) {
      for (const line of c.h1Lines) {
        parts.push(`<text x="${c.x + 18}" y="${y}" font-family="Arial" font-size="13" fill="#1f2722">${esc(line)}</text>`);
        y += 17;
      }
    } else {
      parts.push(`<text x="${c.x + 18}" y="${y}" font-family="Arial" font-size="13" fill="#9aa39a">(kein H1 gefunden)</text>`);
      y += 17;
    }

    parts.push(`<text x="${c.x + 18}" y="${y + 8}" font-family="Arial" font-size="11" fill="#5b8c7b">Wichtige H2s</text>`);
    y += 24;
    if (c.h2Lines.length) {
      c.h2Lines.forEach((h2) => {
        parts.push(`<text x="${c.x + 24}" y="${y}" font-family="Arial" font-size="12" fill="#2b322d">- ${esc(h2)}</text>`);
        y += 18;
      });
    } else {
      parts.push(`<text x="${c.x + 24}" y="${y}" font-family="Arial" font-size="12" fill="#9aa39a">- keine H2 gefunden</text>`);
      y += 18;
    }

    if (c.descLines.length) {
      parts.push(`<text x="${c.x + 18}" y="${y + 8}" font-family="Arial" font-size="11" fill="#5b8c7b">Meta Description</text>`);
      y += 24;
      c.descLines.forEach((line) => {
        parts.push(`<text x="${c.x + 18}" y="${y}" font-family="Arial" font-size="11" fill="#4b544a">${esc(line)}</text>`);
        y += 15;
      });
    }

    const footerY = c.y + c.h - 18;
    parts.push(`<text x="${c.x + 18}" y="${footerY}" font-family="Arial" font-size="11" fill="#667066">Sections: ${c.sectionIds.length} | Bilder: ${c.imgCount} | Links: ${c.linkCount} | H3: ${c.h3Count}</text>`);
  }

  parts.push(`<rect x="48" y="${assetStartY}" width="${boardW - 96}" height="${assetH}" rx="18" fill="#ffffff" stroke="#d7ddd5"/>`);
  parts.push(`<text x="72" y="${assetStartY + 34}" font-family="Arial" font-size="16" font-weight="700" fill="#111">Asset-Inventar (Images/)</text>`);
  parts.push(`<text x="72" y="${assetStartY + 56}" font-family="Arial" font-size="12" fill="#4b544a">Alle gefundenen Bild- und Grafikdateien als Referenzliste fuer Figma.</text>`);

  images.forEach((img, i) => {
    const col = i % imageCols;
    const row = Math.floor(i / imageCols);
    const x = assetX0 + 24 + col * (assetCardW + 24);
    const y = assetStartY + 88 + row * 24;
    parts.push(`<text x="${x}" y="${y}" font-family="Courier New, monospace" font-size="11" fill="#2b322d">${esc(img)}</text>`);
  });

  parts.push(`</svg>`);
  return parts.join('\n');
}

function main() {
  const htmlFiles = listHtmlFiles();
  const pages = htmlFiles.map(parsePage);
  const css = fs.existsSync(path.join(ROOT, 'styles.css')) ? read('styles.css') : '';
  const tokens = css ? parseCssTokens(css) : [];
  const images = listImageFiles();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const svg = buildSvg({ pages, tokens, images });
  fs.writeFileSync(OUT_FILE, svg, 'utf8');

  console.log(`Generated ${path.relative(ROOT, OUT_FILE)} (${pages.length} pages, ${images.length} assets, ${tokens.length} tokens)`);
}

main();

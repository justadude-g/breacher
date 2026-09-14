/* ============================================================
   card-render.js
   Canvas renderer for the Breacher card templates.

   RULE (carried over from the Pulp Alley build): every layout
   number lives in LAYOUT below, declared exactly once. Nothing
   downstream — renderer, print sheet, or test — may re-hardcode
   one of these values. Tests read them live via
   page.evaluate(() => LAYOUT.SIZES.poker.W) so a layout change
   updates the assertions instead of silently invalidating them.

   Two physical sizes:
     poker — 2.5" x 3.5"  (Breacher, OPFOR, Reference)
     mini  — 41 x 63 mm   (Weapon, Gear)  "Mini American"
   Mini gets its own constant block rather than a scale factor:
   text has a legibility floor that does not scale with the card.
   ============================================================ */

const LAYOUT = {
  DPI: 300,

  SIZES: {
    poker: { W: 750, H: 1050 },   // 2.5" x 3.5"
    mini:  { W: 484, H: 744 },    // 41 x 63 mm
  },

  /* 1/8" bleed, drawn OUTSIDE the trim box when enabled. */
  BLEED: 37,

  /* ── Poker geometry (unit + reference cards) ── */
  FRAME:       9,
  RADIUS:      26,
  PAD:         22,
  HEADER_H:    78,
  BADGE_W:     104,
  BADGE_H:     46,
  TILE_W:      132,
  TILE_H:      84,
  TILE_BORDER: 5,     // black keyline around and between stat tiles
  BAND_H:      46,
  BAND_GAP:    4,
  ART_MIN_H:   440,   // must clear a 5-tile column plus breathing room
  RULES_MIN_H: 230,   // raised so ability text prints large

  /* ── Mini geometry (weapon + gear cards) ── */
  MINI: {
    FRAME:    7,
    RADIUS:   18,
    PAD:      15,
    HEADER_H: 72,
    ROW_H:    46,
    FOOT_MIN: 74,
    PILL_H:   52,
    PILL_PAD: 11,
    ART_MIN:  190,
  },

  /* Type scale, px at 300 DPI. 1pt = 4.167px here. */
  FS_TITLE:     46,
  FS_TITLE_MIN: 26,
  FS_SUB:       24,
  FS_BADGE:     30,
  FS_STAT:      44,
  FS_BAND:      23,
  FS_BODY:      32,   // 7.7pt — comfortable printed reading
  FS_BODY_MIN:  25,   // 6pt — below this text stops being readable on paper
  FS_ROWLBL:    25,

  /* Mini cards carry less text, so they get their own ramp. */
  FS_MINI_TITLE: 34,
  FS_MINI_SUB:   19,
  FS_MINI_BODY:  26,
  FS_MINI_MIN:   21,
  FS_MINI_ROW:   22,

  /* Reference card */
  FS_REF_BODY:  31,
  FS_REF_MIN:   23,
};

/* Resolve a template id to its pixel size. */
function cardSize(templateId) {
  const tpl = TEMPLATES[templateId] || TEMPLATES.breacher;
  return LAYOUT.SIZES[tpl.size || 'poker'];
}

/* ── Tone lookup: tile background -> ink that survives print ── */
const TONES = {
  bone:  { bg: PALETTE.bone,      ink: '#15181c', icon: PALETTE.red },
  red:   { bg: PALETTE.red,       ink: '#ffffff', icon: '#ffffff'   },
  navy:  { bg: PALETTE.navy,      ink: '#ffffff', icon: '#ffffff'   },
  olive: { bg: PALETTE.olive,     ink: '#ffffff', icon: '#ffffff'   },
  dark:  { bg: PALETTE.headerA,   ink: '#f2efe9', icon: '#f2efe9'   },
  light: { bg: PALETTE.boneLight, ink: '#15181c', icon: '#15181c'   },
};

/* ============================================================
   Text helpers
   ============================================================ */

function setFont(ctx, weight, size, family) {
  ctx.font = `${weight} ${size}px ${family}`;
}

function fitLine(ctx, text, maxW, weight, startSize, minSize, family) {
  let size = startSize;
  while (size > minSize) {
    setFont(ctx, weight, size, family);
    if (ctx.measureText(text).width <= maxW) break;
    size -= 1;
  }
  setFont(ctx, weight, size, family);
  return size;
}

function wrapLines(ctx, text, maxW) {
  const out = [];
  String(text).split('\n').forEach(para => {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); return; }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = line + ' ' + words[i];
      if (ctx.measureText(test).width <= maxW) line = test;
      else { out.push(line); line = words[i]; }
    }
    out.push(line);
  });
  return out;
}

function measureBullets(ctx, items, maxW, size, lineGap, itemGap) {
  setFont(ctx, 400, size, FONTS.body);
  let h = 0;
  items.forEach(it => {
    h += wrapLines(ctx, it, maxW).length * (size + lineGap) + itemGap;
  });
  return h;
}

function drawBullets(ctx, items, x, y, maxW, maxH, colour, startSize, minSize) {
  const start = startSize || LAYOUT.FS_BODY;
  const floor = minSize || LAYOUT.FS_BODY_MIN;
  const INDENT = Math.round(start * 0.82);
  const textW = maxW - INDENT;
  let size = start;
  const lineGap = 8, itemGap = 12;
  while (size > floor &&
         measureBullets(ctx, items, textW, size, lineGap, itemGap) > maxH) {
    size -= 1;
  }
  setFont(ctx, 400, size, FONTS.body);
  ctx.fillStyle = colour;
  ctx.textBaseline = 'top';
  let cy = y;
  items.forEach(it => {
    ctx.textAlign = 'left';
    ctx.beginPath();
    ctx.arc(x + size * 0.26, cy + size * 0.48, size * 0.14, 0, Math.PI * 2);
    ctx.fill();
    wrapLines(ctx, it, textW).forEach(ln => {
      ctx.fillText(ln, x + INDENT, cy);
      cy += size + lineGap;
    });
    cy += itemGap;
  });
  return cy - y;
}

/* Tokenise **bold** runs once; richLayout re-measures per size. */
function richTokens(text) {
  const tokens = [];
  String(text).split(/(\*\*[^*]+\*\*)/g).forEach(chunk => {
    if (!chunk) return;
    const bold = chunk.startsWith('**') && chunk.endsWith('**');
    const body = bold ? chunk.slice(2, -2) : chunk;
    body.split(/(\s+)/).forEach(w => { if (w !== '') tokens.push({ w, bold }); });
  });
  return tokens;
}

function richLayout(ctx, tokens, size, maxW) {
  const lines = [[]];
  let width = 0;
  tokens.forEach(t => {
    setFont(ctx, t.bold ? 700 : 400, size, FONTS.body);
    const tw = ctx.measureText(t.w).width;
    if (width + tw > maxW && /\S/.test(t.w)) { lines.push([]); width = 0; }
    if (!/\S/.test(t.w) && width === 0) return;
    lines[lines.length - 1].push({ ...t, tw });
    width += tw;
  });
  return lines;
}

function drawRichText(ctx, text, x, y, maxW, maxH, colour, startSize, minSize) {
  const tokens = richTokens(text);
  const start = startSize || LAYOUT.FS_BODY;
  const floor = minSize || LAYOUT.FS_BODY_MIN;
  let size = start, lines = richLayout(ctx, tokens, size, maxW);
  const gap = () => Math.round(size * 0.28);
  while (size > floor && lines.length * (size + gap()) > maxH) {
    size -= 1; lines = richLayout(ctx, tokens, size, maxW);
  }
  ctx.fillStyle = colour;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let cy = y;
  lines.forEach(line => {
    let cx = x;
    line.forEach(t => {
      setFont(ctx, t.bold ? 700 : 400, size, FONTS.body);
      ctx.fillText(t.w, cx, cy);
      cx += t.tw;
    });
    cy += size + gap();
  });
  return cy - y;
}

/* ============================================================
   Primitive panels
   ============================================================ */

function vGradient(ctx, x, y, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function drawCover(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5, zoom = 1) {
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale, dh = img.height * scale;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, x + (w - dw) * offsetX, y + (h - dh) * offsetY, dw, dh);
  ctx.restore();
}

/* The art well is always painted, image or not. A transparent PNG
   then sits on the card's own backdrop instead of on nothing, and
   an empty well reads as part of the design rather than a hole. */
function drawArtWell(ctx, x, y, w, h, top, bottom, label, hasImage) {
  vGradient(ctx, x, y, w, h, top, bottom);
  if (hasImage) return;
  ctx.save();
  ctx.globalAlpha = 0.30;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.strokeRect(x + 26, y + 26, w - 52, h - 52);
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#ffffff';
  setFont(ctx, 500, 26, FONTS.display);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}

/* Title bar. The title is centred on the CARD, not on the space
   left beside the badge, so a deck with different CE costs still
   has its names in a straight line. */
function drawHeader(ctx, x, y, w, h, title, subtitle, badge, badgeLabel, accent, opt = {}) {
  const fsTitle = opt.fsTitle || LAYOUT.FS_TITLE;
  const fsSub   = opt.fsSub   || LAYOUT.FS_SUB;
  const pad     = opt.pad     || LAYOUT.PAD;

  vGradient(ctx, x, y, w, h, PALETTE.headerA, PALETTE.headerB);
  if (!opt.noAccentBar) {
    ctx.fillStyle = accent;
    ctx.fillRect(x, y + h - 4, w, 4);
  }

  const hasBadge = badge !== undefined && badge !== null && String(badge).trim() !== '';
  const badgeW = opt.badgeW || LAYOUT.BADGE_W;
  const badgeH = opt.badgeH || LAYOUT.BADGE_H;
  /* Reserve the badge gutter on BOTH sides so centring stays true. */
  const reserve = hasBadge ? (pad + badgeW + 10) * 2 : pad * 2;
  const titleMax = w - reserve;
  const cx = x + w / 2;

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '2px';
  fitLine(ctx, title, titleMax, 600, fsTitle, LAYOUT.FS_TITLE_MIN, FONTS.display);
  ctx.fillStyle = PALETTE.headerInk;
  ctx.fillText(title, cx, subtitle ? y + h * 0.36 : y + h / 2 - 2);
  ctx.letterSpacing = '0px';

  if (subtitle) {
    fitLine(ctx, subtitle, titleMax, 300, fsSub, 15, FONTS.body);
    ctx.fillStyle = 'rgba(244,242,238,0.74)';
    ctx.fillText(subtitle, cx, y + h * 0.76);
  }

  if (hasBadge) {
    const bx = x + w - pad - badgeW;
    const by = y + (h - badgeH) / 2 - 1;
    ctx.fillStyle = PALETTE.redDeep;
    roundRectPath(ctx, bx, by, badgeW, badgeH, 7);
    ctx.fill();
    ctx.strokeStyle = PALETTE.redBright; ctx.lineWidth = 2; ctx.stroke();
    const txt = badgeLabel ? `${badgeLabel} ${badge}` : String(badge);
    fitLine(ctx, txt, badgeW - 14, 600, LAYOUT.FS_BADGE, 16, FONTS.display);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(txt, bx + badgeW / 2, by + badgeH / 2 + 1);
  }
}

/* A stat column is one solid block: tiles butt against each other
   and a single black grid separates them. No gaps, so no artwork
   shows between tiles. */
function drawStatColumn(ctx, specs, card, x, y) {
  const w = LAYOUT.TILE_W, h = LAYOUT.TILE_H, b = LAYOUT.TILE_BORDER;
  const totalH = specs.length * h;

  specs.forEach((spec, i) => {
    const ty = y + i * h;
    const tone = TONES[spec.tone] || TONES.navy;
    ctx.fillStyle = tone.bg;
    ctx.fillRect(x, ty, w, h);

    const iconBox = h * 0.60;
    drawIcon(ctx, spec.icon, x + b + 4, ty + (h - iconBox) / 2, iconBox, iconBox, tone.icon);

    const v = card[spec.key];
    const txt = (v === '' || v === undefined || v === null) ? '–' : String(v);
    const textX = x + b + 8 + iconBox;
    fitLine(ctx, txt, x + w - b - 8 - textX, 600, LAYOUT.FS_STAT, 22, FONTS.display);
    ctx.fillStyle = tone.ink;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + w - b - 8, ty + h / 2 + 1);
  });

  /* One black grid over the whole column: outer box + dividers. */
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = b;
  ctx.strokeRect(x + b / 2, y + b / 2, w - b, totalH - b);
  for (let i = 1; i < specs.length; i++) {
    const ly = y + i * h;
    ctx.beginPath();
    ctx.moveTo(x + b, ly); ctx.lineTo(x + w - b, ly);
    ctx.stroke();
  }
  return totalH;
}

function drawBand(ctx, x, y, w, h, band) {
  const tone = TONES[band.tone] || TONES.dark;
  ctx.fillStyle = tone.bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  const text = band.text || '';
  const m = text.match(/^([^:]{1,28}):\s*(.+)$/);
  ctx.textBaseline = 'middle';
  const cy = y + h / 2 + 1;
  if (m) {
    const lbl = m[1].toUpperCase() + ':', rest = ' ' + m[2];
    let size = LAYOUT.FS_BAND;
    const total = () => {
      setFont(ctx, 700, size, FONTS.display);
      const a = ctx.measureText(lbl).width;
      setFont(ctx, 300, size, FONTS.body);
      return a + ctx.measureText(rest).width;
    };
    while (size > 14 && total() > w - 24) size -= 1;
    setFont(ctx, 700, size, FONTS.display);
    const aw = ctx.measureText(lbl).width;
    setFont(ctx, 300, size, FONTS.body);
    const bw = ctx.measureText(rest).width;
    const cx = x + (w - aw - bw) / 2;
    ctx.textAlign = 'left';
    setFont(ctx, 700, size, FONTS.display);
    ctx.fillStyle = tone.ink;
    ctx.fillText(lbl, cx, cy);
    setFont(ctx, 300, size, FONTS.body);
    ctx.fillStyle = 'rgba(242,239,233,0.82)';
    ctx.fillText(rest, cx + aw, cy);
  } else {
    ctx.letterSpacing = '1px';
    fitLine(ctx, text.toUpperCase(), w - 20, 600, LAYOUT.FS_BAND, 13, FONTS.display);
    ctx.fillStyle = tone.ink;
    ctx.textAlign = 'center';
    ctx.fillText(text.toUpperCase(), x + w / 2, cy);
    ctx.letterSpacing = '0px';
  }
}

function layoutBands(bands) {
  const rows = [];
  let pending = null;
  (bands || []).forEach(b => {
    if (!b || !String(b.text || '').trim()) return;
    if (b.span === 'full') {
      if (pending) { rows.push([pending]); pending = null; }
      rows.push([b]);
    } else if (pending) { rows.push([pending, b]); pending = null; }
    else { pending = b; }
  });
  if (pending) rows.push([pending]);
  return rows;
}

/* ============================================================
   Templates
   ============================================================ */

function renderUnitCard(ctx, card, img, tpl) {
  const W = LAYOUT.SIZES.poker.W, H = LAYOUT.SIZES.poker.H;
  const F = LAYOUT.FRAME, inX = F, inW = W - F * 2;

  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);

  drawHeader(ctx, inX, F, inW, LAYOUT.HEADER_H,
             card.name || '', card.subtitle || '',
             card.badge, tpl.badgeLabel, tpl.accent, { noAccentBar: true });

  /* Budget: bands and rules are measured first; the portrait takes
     what is left, floored so the stat columns always fit. */
  const rows = layoutBands(card.bands);
  const bandsH = rows.length * (LAYOUT.BAND_H + LAYOUT.BAND_GAP);

  const bullets   = (card.rules || []).filter(r => String(r).trim());
  const rulesW    = inW - LAYOUT.PAD * 2;
  const formation = String(card.formation || '').trim();
  const footer    = String(card.footer || '').trim();

  setFont(ctx, 400, LAYOUT.FS_BODY, FONTS.body);
  let rulesNeed = measureBullets(ctx, bullets, rulesW - 26, LAYOUT.FS_BODY, 8, 12) + 30;
  if (formation) rulesNeed += 44;
  if (footer)    rulesNeed += 36;

  const headBottom = F + LAYOUT.HEADER_H;
  const avail = H - F - headBottom - bandsH;

  /* Art must be tall enough to fully contain the stat columns on each
     side. Breacher has 5 rows (420 px) but OPFOR only has 3 (252 px),
     so calculate per-template rather than using the global ART_MIN_H. */
  const statRows = Math.max(tpl.statsLeft.length, tpl.statsRight.length);
  const artMinH  = statRows * LAYOUT.TILE_H + 20;   // +20 px breathing room

  let rulesH = Math.max(rulesNeed, LAYOUT.RULES_MIN_H);
  rulesH = Math.min(rulesH, avail - artMinH);
  rulesH = Math.max(rulesH, Math.min(LAYOUT.RULES_MIN_H, avail * 0.3));
  const artH = avail - rulesH;

  const artY = headBottom;
  const wellTop = tpl.id === 'opfor'      ? PALETTE.opforArt   :
                  tpl.id === 'hired-gun'  ? PALETTE.navy       : '#8f8c85';
  const wellBot = tpl.id === 'opfor'      ? PALETTE.opforArtB  :
                  tpl.id === 'hired-gun'  ? PALETTE.navyLight  : '#4a4843';
  const wellPlaceholder = tpl.id === 'opfor' ? 'ADD UNIT ART' :
                          tpl.id === 'hired-gun' ? 'ADD HIRED GUN ART' : 'ADD PORTRAIT';
  drawArtWell(ctx, inX, artY, inW, artH, wellTop, wellBot, wellPlaceholder, !!img);
  if (img) drawCover(ctx, img, inX, artY, inW, artH,
                     card.artX ?? 0.5, card.artY ?? 0.5, card.artZoom ?? 1);

  drawStatColumn(ctx, tpl.statsLeft,  card, inX, artY);
  drawStatColumn(ctx, tpl.statsRight, card, inX + inW - LAYOUT.TILE_W, artY);

  let by = artY + artH;
  rows.forEach(row => {
    if (row.length === 1) drawBand(ctx, inX, by, inW, LAYOUT.BAND_H, row[0]);
    else {
      const half = (inW - LAYOUT.BAND_GAP) / 2;
      drawBand(ctx, inX, by, half, LAYOUT.BAND_H, row[0]);
      drawBand(ctx, inX + half + LAYOUT.BAND_GAP, by, half, LAYOUT.BAND_H, row[1]);
    }
    by += LAYOUT.BAND_H + LAYOUT.BAND_GAP;
  });

  const rY = by;
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(inX, rY, inW, H - F - rY);

  let ty = rY + 16;
  if (formation) {
    fitLine(ctx, formation, rulesW, 700, 28, 18, FONTS.body);
    ctx.fillStyle = '#15181c';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(formation, inX + inW / 2, ty);
    ty += 40;
  }
  if (bullets.length) {
    const room = (H - F - ty) - (footer ? 38 : 12);
    drawBullets(ctx, bullets, inX + LAYOUT.PAD, ty, rulesW, room, '#15181c');
  }
  if (footer) {
    fitLine(ctx, footer, rulesW, 400, 21, 15, FONTS.body);
    ctx.fillStyle = 'rgba(21,24,28,0.62)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(footer, inX + inW / 2, H - F - 14);
  }

  drawFrame(ctx, W, H, LAYOUT.FRAME, LAYOUT.RADIUS);
}

/* Companion card: name plus the full special-ability text. */
function renderReferenceCard(ctx, card) {
  const W = LAYOUT.SIZES.poker.W, H = LAYOUT.SIZES.poker.H;
  const F = LAYOUT.FRAME, inX = F, inW = W - F * 2;

  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);

  drawHeader(ctx, inX, F, inW, LAYOUT.HEADER_H,
             card.name || '', card.subtitle || '', '', '', PALETTE.redBright);

  const entries = (card.abilities || []).filter(a => String(a).trim());
  const footer  = String(card.footer || '').trim();
  const bodyX   = inX + LAYOUT.PAD;
  const bodyW   = inW - LAYOUT.PAD * 2;
  const top     = F + LAYOUT.HEADER_H + 20;
  const bottom  = H - F - (footer ? 52 : 20);
  const maxH    = bottom - top;

  /* One font size across every entry — mixed sizes in a list read
     as a mistake — so shrink the whole block until it fits. */
  const toks = entries.map(richTokens);
  let size = LAYOUT.FS_REF_BODY;
  const blockGap = () => Math.round(size * 0.62);
  const total = () => {
    let h = 0;
    toks.forEach(t => {
      h += richLayout(ctx, t, size, bodyW).length * (size + Math.round(size * 0.28));
      h += blockGap();
    });
    return h;
  };
  while (size > LAYOUT.FS_REF_MIN && total() > maxH) size -= 1;

  let cy = top;
  entries.forEach(text => {
    cy += drawRichText(ctx, text, bodyX, cy, bodyW, bottom - cy,
                       '#15181c', size, size) + blockGap();
  });

  if (footer) {
    ctx.strokeStyle = 'rgba(21,24,28,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bodyX, H - F - 46); ctx.lineTo(inX + inW - LAYOUT.PAD, H - F - 46);
    ctx.stroke();
    fitLine(ctx, footer, bodyW, 400, 24, 16, FONTS.body);
    ctx.fillStyle = 'rgba(21,24,28,0.70)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(footer, bodyX, H - F - 16);
  }

  drawFrame(ctx, W, H, LAYOUT.FRAME, LAYOUT.RADIUS);
}

function renderWeaponCard(ctx, card, img) {
  const W = LAYOUT.SIZES.mini.W, H = LAYOUT.SIZES.mini.H;
  const M = LAYOUT.MINI, F = M.FRAME, inX = F, inW = W - F * 2;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  drawHeader(ctx, inX, F, inW, M.HEADER_H,
             card.name || '', card.subtitle || '', '', '', PALETTE.maroon,
             { fsTitle: LAYOUT.FS_MINI_TITLE, fsSub: LAYOUT.FS_MINI_SUB, pad: M.PAD });

  const bandCount = [card.short, card.medium, card.long]
        .filter(v => String(v || '').trim()).length;
  const wRules = (card.rules || []).filter(r => String(r).trim());

  setFont(ctx, 400, LAYOUT.FS_MINI_BODY, FONTS.body);
  let footNeed = 20;
  if (String(card.wtype || '').trim()) footNeed += 30;
  if (wRules.length) footNeed += measureBullets(
      ctx, wRules, inW - M.PAD * 2 - 22, LAYOUT.FS_MINI_BODY, 6, 9);
  const footH = Math.max(footNeed, M.FOOT_MIN);

  const modes = (card.modes || []).filter(m => String(m).trim());
  const hasDmg = String(card.damage || '').trim() !== '';
  const stripH = 8 + (modes.length ? 42 : 0) + (hasDmg ? 44 : 0);

  const artY = F + M.HEADER_H;
  const artH = Math.max(M.ART_MIN,
                        (H - F) - artY - stripH - bandCount * M.ROW_H - footH);

  drawArtWell(ctx, inX, artY, inW, artH, PALETTE.maroon, PALETTE.maroonDeep,
              'ADD WEAPON ART', !!img);
  if (img) drawCover(ctx, img, inX, artY, inW, artH,
                     card.artX ?? 0.5, card.artY ?? 0.5, card.artZoom ?? 1);

  const stripY = artY + artH;
  vGradient(ctx, inX, stripY, inW, stripH, PALETTE.maroonDeep, '#3d191b');

  let sy = stripY + 6;
  if (modes.length) {
    const gap = 9;
    setFont(ctx, 700, 22, FONTS.display);
    const ws = modes.map(m => ctx.measureText(m).width + 26);
    let px = inX + (inW - (ws.reduce((a, b) => a + b, 0) + gap * (modes.length - 1))) / 2;
    modes.forEach((m, i) => {
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, px, sy, ws[i], 34, 17); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#15181c';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      setFont(ctx, 700, 22, FONTS.display);
      ctx.fillText(m, px + ws[i] / 2, sy + 18);
      px += ws[i] + gap;
    });
    sy += 42;
  }
  if (hasDmg) {
    const ce = String(card.ce || '').trim();
    setFont(ctx, 700, 24, FONTS.display);
    const dw = ctx.measureText(card.damage).width + 32;
    const cw = ce ? ctx.measureText(ce).width + 20 : 0;
    const gap = ce ? 9 : 0;
    let px = inX + (inW - dw - cw - gap) / 2;
    ctx.fillStyle = PALETTE.redBright;
    roundRectPath(ctx, px, sy, dw, 36, 18); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(card.damage, px + dw / 2, sy + 18);
    if (ce) {
      px += dw + gap;
      ctx.fillStyle = PALETTE.boneLight;
      roundRectPath(ctx, px, sy, cw, 36, 7); ctx.fill();
      ctx.strokeStyle = '#5c4a1c'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#4a3a10';
      ctx.fillText(ce, px + cw / 2, sy + 18);
    }
  }

  let ry = stripY + stripH;
  [['Short Range', card.short], ['Medium Range', card.medium], ['Long Range', card.long]]
    .filter(function (pair) { return String(pair[1] || '').trim(); })
    .forEach(function (pair, i) {
      const label = pair[0], value = pair[1];
      ctx.fillStyle = i % 2 ? PALETTE.paperAlt : PALETTE.boneLight;
      ctx.fillRect(inX, ry, inW, M.ROW_H);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(inX + 0.75, ry + 0.75, inW - 1.5, M.ROW_H - 1.5);
      const split = inX + inW * 0.48;
      ctx.beginPath(); ctx.moveTo(split, ry); ctx.lineTo(split, ry + M.ROW_H); ctx.stroke();
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#15181c';
      ctx.textAlign = 'center';
      fitLine(ctx, label, inW * 0.48 - 10, 400, LAYOUT.FS_MINI_BODY, 14, FONTS.body);
      ctx.fillText(label, inX + inW * 0.24, ry + M.ROW_H / 2 + 1);
      fitLine(ctx, String(value), inW * 0.52 - 10, 700, LAYOUT.FS_MINI_BODY, 14, FONTS.display);
      ctx.fillText(String(value), split + (inW * 0.52) / 2, ry + M.ROW_H / 2 + 1);
      ry += M.ROW_H;
    });

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(inX, ry, inW, H - F - ry);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(inX + 0.75, ry + 0.75, inW - 1.5, H - F - ry - 1.5);

  const fw = inW - M.PAD * 2;
  const hasWtype = String(card.wtype || '').trim();
  const boxH = H - F - ry;

  if (hasWtype && !wRules.length) {
    /* Only wtype — vertically centre it in the white box */
    fitLine(ctx, card.wtype, fw, 400, LAYOUT.FS_MINI_BODY, 15, FONTS.body);
    ctx.fillStyle = '#15181c';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(card.wtype, inX + M.PAD, ry + boxH / 2);
  } else {
    /* wtype + rules, or rules only — stack from top */
    let fy = ry + 10;
    if (hasWtype) {
      fitLine(ctx, card.wtype, fw, 400, LAYOUT.FS_MINI_BODY, 15, FONTS.body);
      ctx.fillStyle = '#15181c';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(card.wtype, inX + M.PAD, fy);
      fy += 30;
    }
    if (wRules.length) {
      drawBullets(ctx, wRules, inX + M.PAD, fy, fw, H - F - fy - 8, '#15181c',
                  LAYOUT.FS_MINI_BODY, LAYOUT.FS_MINI_MIN);
    }
  }

  drawFrame(ctx, W, H, M.FRAME, M.RADIUS);
}

function renderGearCard(ctx, card, img) {
  const W = LAYOUT.SIZES.mini.W, H = LAYOUT.SIZES.mini.H;
  const M = LAYOUT.MINI, F = M.FRAME, inX = F, inW = W - F * 2;

  ctx.fillStyle = PALETTE.sage;
  ctx.fillRect(0, 0, W, H);

  const px = inX + M.PILL_PAD, py = F + M.PILL_PAD;
  const pw = inW - M.PILL_PAD * 2, ph = M.PILL_H;
  ctx.fillStyle = PALETTE.sagePill;
  roundRectPath(ctx, px, py, pw, ph, ph / 2); ctx.fill();

  /* Light glyph on a lifted dark disc. */
  const icoD = ph - 12;
  const icoCX = px + 6 + icoD / 2;
  const icoCY = py + ph / 2;
  ctx.fillStyle = '#4c4745';
  ctx.beginPath(); ctx.arc(icoCX, icoCY, icoD / 2, 0, Math.PI * 2); ctx.fill();
  /* Centre the icon bounding box exactly on the disc centre. */
  const icoSz = icoD * 0.64;
  drawIcon(ctx, card.icon || 'dice', icoCX - icoSz / 2, icoCY - icoSz / 2,
           icoSz, icoSz, '#e9ece4');

  /* Slot cost — drawn as a circle that matches the icon disc size. */
  const slots = String(card.slots || '').trim();
  let slotW = 0;
  if (slots) {
    const slotR = (ph - 14) / 2;               // radius
    const scx   = px + pw - 7 - slotR;         // centre X
    const scy   = py + ph / 2;                 // centre Y (same as icon disc)
    slotW = slotR * 2 + 7;                     // space reserved in layout
    ctx.fillStyle = PALETTE.sageDeep;
    ctx.beginPath(); ctx.arc(scx, scy, slotR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d2119'; ctx.lineWidth = 2; ctx.stroke();
    fitLine(ctx, slots, slotR * 1.4, 700, 25, 14, FONTS.display);
    ctx.fillStyle = '#1d2119';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(slots, scx, scy + 1);
  }

  const titleX = px + 12 + icoD, titleMax = pw - icoD - slotW - 36;
  ctx.letterSpacing = '1.5px';
  fitLine(ctx, String(card.name || '').toUpperCase(), titleMax, 600, 26, 14, FONTS.display);
  ctx.fillStyle = '#e9ece4';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(card.name || '').toUpperCase(), titleX + titleMax / 2, py + ph / 2 + 1);
  ctx.letterSpacing = '0px';

  const gBullets = (card.rules || []).filter(r => String(r).trim());
  const gBody    = String(card.body || '').trim();
  const gTextW   = pw - 6;
  setFont(ctx, 400, LAYOUT.FS_MINI_BODY, FONTS.body);
  let textNeed = 0;
  if (gBody) textNeed += richLayout(ctx, richTokens(gBody), LAYOUT.FS_MINI_BODY, gTextW).length
                         * (LAYOUT.FS_MINI_BODY + 7) + 8;
  if (gBullets.length) textNeed += measureBullets(
      ctx, gBullets, gTextW - 22, LAYOUT.FS_MINI_BODY, 6, 9);

  const gBottom = H - F - M.PILL_PAD;
  const artTop  = py + ph + 8;
  const artH    = Math.max(M.ART_MIN, gBottom - artTop - 12 - Math.max(textNeed, 30));

  drawArtWell(ctx, px, artTop, pw, artH, PALETTE.sageDeep, '#7a876f',
              'ADD ITEM ART', !!img);
  if (img) drawCover(ctx, img, px, artTop, pw, artH,
                     card.artX ?? 0.5, card.artY ?? 0.5, card.artZoom ?? 1);

  const ce = String(card.ce || '').trim();
  if (ce) {
    setFont(ctx, 700, 22, FONTS.display);
    const cw = ctx.measureText(ce).width + 18;
    const cx = px + pw - cw - 8;
    const cyy = artTop + artH - 38;
    ctx.fillStyle = PALETTE.boneLight;
    roundRectPath(ctx, cx, cyy, cw, 30, 6); ctx.fill();
    ctx.strokeStyle = '#5c4a1c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#4a3a10';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ce, cx + cw / 2, cyy + 16);
  }

  let ty = artTop + artH + 12;
  const bx = px + 3;
  if (gBody) {
    ty += drawRichText(ctx, gBody, bx, ty, gTextW,
                       gBullets.length ? (gBottom - ty) * 0.6 : gBottom - ty,
                       '#1d2119', LAYOUT.FS_MINI_BODY, LAYOUT.FS_MINI_MIN) + 8;
  }
  if (gBullets.length) {
    drawBullets(ctx, gBullets, bx, ty, gTextW, gBottom - ty, '#1d2119',
                LAYOUT.FS_MINI_BODY, LAYOUT.FS_MINI_MIN);
  }

  drawFrame(ctx, W, H, M.FRAME, M.RADIUS);
}

/* Rounded mask + black keyline, applied last on every template. */
function drawFrame(ctx, W, H, frame, radius) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  roundRectPath(ctx, 0, 0, W, H, radius);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = frame * 2;
  roundRectPath(ctx, 0, 0, W, H, radius);
  ctx.stroke();
}

/* ============================================================
   Public entry point
   ============================================================ */

const RENDERERS = {
  breacher:    (ctx, c, img) => renderUnitCard(ctx, c, img, TEMPLATES.breacher),
  opfor:       (ctx, c, img) => renderUnitCard(ctx, c, img, TEMPLATES.opfor),
  'hired-gun': (ctx, c, img) => renderUnitCard(ctx, c, img, TEMPLATES['hired-gun']),
  reference:   (ctx, c) => renderReferenceCard(ctx, c),
  weapon:      renderWeaponCard,
  gear:        renderGearCard,
};

function renderCard(canvas, card, img, opts) {
  opts = opts || {};
  const size = cardSize(card.template);
  const bleed = opts.bleed ? LAYOUT.BLEED : 0;
  const W = size.W + bleed * 2, H = size.H + bleed * 2;
  canvas.width = W; canvas.height = H;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  if (bleed) {
    ctx.fillStyle = card.template === 'gear' ? PALETTE.sage : PALETTE.ink;
    ctx.fillRect(0, 0, W, H);
  }

  /* Paint into an offscreen buffer so drawFrame's rounded
     destination-in mask cannot eat the bleed margin. */
  const buf = document.createElement('canvas');
  buf.width = size.W; buf.height = size.H;
  (RENDERERS[card.template] || RENDERERS.breacher)(buf.getContext('2d'), card, img);
  ctx.drawImage(buf, bleed, bleed);

  if (opts.cropMarks && bleed) drawCropMarks(ctx, W, H, bleed);
  return canvas;
}

function drawCropMarks(ctx, W, H, bleed) {
  ctx.save();
  ctx.strokeStyle = '#ff0066';
  ctx.lineWidth = 2;
  const L = bleed * 0.62;
  [bleed, W - bleed].forEach(x => [bleed, H - bleed].forEach(y => {
    ctx.beginPath();
    ctx.moveTo(x, y < H / 2 ? y - L : y + L); ctx.lineTo(x, y);
    ctx.moveTo(x < W / 2 ? x - L : x + L, y); ctx.lineTo(x, y);
    ctx.stroke();
  }));
  ctx.restore();
}

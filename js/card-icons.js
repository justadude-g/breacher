/* ============================================================
   card-icons.js
   Icon set for stat tiles and gear categories.

   These are Ivan's own icons from the Pixelmator cards, exported
   as trimmed 256px white silhouettes on transparent alpha. One
   file serves both light and dark tiles: the renderer tints the
   silhouette at draw time, so a tile that needs dark ink on a
   bone background uses the same PNG as a white-on-navy tile.

   Icons must be preloaded before the first render. `iconsReady`
   resolves once every file is in; the app awaits it at boot and
   the test suite awaits it before sampling pixels.
   ============================================================ */

const ICON_DIR = 'assets/icons/';

/* Slug -> human label. The slug is the filename stem. */
const ICON_SET = {
  ranged:           'Ranged Combat',
  melee:            'Melee Combat',
  technical:        'Technical',
  'technical-alt':  'Technical (alt)',
  'technical-cog':  'Technical (cog)',
  morale:           'Morale / Command',
  command:          'Command Rank',
  wounds:           'Wounds',
  movement:         'Movement',
  boot:             'Movement (boot)',
  armor:            'Armour',
  magazine:         'Magazines / Reload',
  'gear-slots':     'Gear Slots',
  belt:             'Tactical Belt',
  grenade:          'Grenades',
  grit:             'Grit',
  dice:             'Dice / Chance',
  shield:           'Shield / Cover',
  terrain:          'Terrain',
  eye:              'Observation',
};

const ICON_IMAGES = {};

const iconsReady = Promise.all(
  Object.keys(ICON_SET).map(slug => new Promise(resolve => {
    const img = new Image();
    img.onload  = () => { ICON_IMAGES[slug] = img; resolve(slug); };
    img.onerror = () => { console.warn('icon failed to load:', slug); resolve(null); };
    img.src = ICON_DIR + slug + '.png';
  }))
);

/* Shared rounded-rect path helper — used by the renderer too. */
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x,     y + h, rr);
  ctx.arcTo(x,     y + h, x,     y,     rr);
  ctx.arcTo(x,     y,     x + w, y,     rr);
  ctx.closePath();
}

/* Tinting happens on a scratch canvas: draw the silhouette, then
   flood the colour through it with 'source-in'. Doing that on the
   card itself would repaint everything already drawn there. */
const _iconScratch = document.createElement('canvas');

/* Draw icon `slug` centred in box (x,y,w,h), tinted to `colour`. */
function drawIcon(ctx, slug, x, y, w, h, colour) {
  const img = ICON_IMAGES[slug];
  if (!img) return;

  const size = Math.max(1, Math.round(Math.min(w, h)));
  /* Oversample 2x so the downscale stays crisp in print exports. */
  const px = size * 2;
  if (_iconScratch.width !== px || _iconScratch.height !== px) {
    _iconScratch.width = _iconScratch.height = px;
  }
  const s = _iconScratch.getContext('2d');
  s.clearRect(0, 0, px, px);
  s.drawImage(img, 0, 0, px, px);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = colour;
  s.fillRect(0, 0, px, px);
  s.globalCompositeOperation = 'source-over';

  ctx.drawImage(_iconScratch,
                x + (w - size) / 2, y + (h - size) / 2, size, size);
}

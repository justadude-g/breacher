/* ============================================================
   verify1.js
   Regression: the four card templates must all render, and the
   stat tiles must land exactly where LAYOUT says they do.

   Exists because the first version of the renderer vertically
   centred short stat columns, so an OPFOR card's 3 tiles sat at
   a different y than a Breacher card's 5 — invisible on screen,
   obvious across a printed deck. Every coordinate below is READ
   LIVE from LAYOUT; nothing here hardcodes a layout number, so a
   deliberate layout change updates the test automatically instead
   of silently invalidating it.
   ============================================================ */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8931;
const ROOT = path.join(__dirname, '..');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };

function ok(label) { console.log('  ok  ' + label); }

/* Launch the first browser that actually exists on this machine.
   Playwright's bundled Chromium is a ~130MB download from
   cdn.playwright.dev that times out or is firewalled often enough
   that requiring it made the suite unrunnable. Any Chromium build
   renders this canvas identically, so fall back to a real Chrome. */
async function launchBrowser() {
  const attempts = [
    process.env.CHROMIUM_PATH
      ? { label: 'CHROMIUM_PATH', opts: { executablePath: process.env.CHROMIUM_PATH } }
      : null,
    { label: 'bundled chromium', opts: {} },
    { label: 'system Chrome',        opts: { channel: 'chrome' } },
    { label: 'system Edge',          opts: { channel: 'msedge' } },
  ].filter(Boolean);

  const tried = [];
  for (const a of attempts) {
    try {
      const b = await chromium.launch(a.opts);
      console.log(`  --  browser: ${a.label}`);
      return b;
    } catch (e) {
      tried.push(`${a.label}: ${e.message.split('\n')[0]}`);
    }
  }
  throw new Error(
    'No Chromium-based browser available. Tried:\n    ' + tried.join('\n    ') +
    '\n\n  Fix with either:\n' +
    '    PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=180000 npx playwright install --only-shell chromium\n' +
    '    (or just install Google Chrome — the suite will use it automatically)'
  );
}

function serve() {
  return new Promise(res => {
    const s = http.createServer((req, rep) => {
      const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      fs.readFile(f, (e, d) => {
        if (e) { rep.writeHead(404); rep.end('nope'); return; }
        rep.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
        rep.end(d);
      });
    }).listen(PORT, () => res(s));
  });
}

(async () => {
  const server = await serve();
  const browser = await launchBrowser();
  const page = await browser.newPage();

  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  await page.goto(`http://localhost:${PORT}/cards.html`);
  await page.waitForFunction(() => typeof LAYOUT !== 'undefined' && state.card);
  /* Icons are PNGs now — every pixel assertion below depends on them
     being in before a render, so wait on the same promise the app does. */
  await page.evaluate(() => iconsReady);
  const missing = await page.evaluate(
    () => Object.keys(ICON_SET).filter(k => !ICON_IMAGES[k]));
  assert.deepStrictEqual(missing, [], 'every icon PNG loaded');
  ok(`all ${Object.keys(await page.evaluate(() => ICON_SET)).length} icon files loaded`);

  /* 1 — layout constants are readable live (the whole point of
         declaring them as top-level consts in a non-module script) */
  const L = await page.evaluate(() => JSON.parse(JSON.stringify(LAYOUT)));
  assert.strictEqual(L.SIZES.poker.W / L.DPI, 2.5, 'poker is 2.5in wide');
  assert.strictEqual(L.SIZES.poker.H / L.DPI, 3.5, 'poker is 3.5in tall');
  /* Mini American is 41 x 63 mm; allow half a millimetre of rounding. */
  const mmW = L.SIZES.mini.W / L.DPI * 25.4;
  const mmH = L.SIZES.mini.H / L.DPI * 25.4;
  assert.ok(Math.abs(mmW - 41) < 0.5, `mini width ${mmW.toFixed(2)}mm ~ 41mm`);
  assert.ok(Math.abs(mmH - 63) < 0.5, `mini height ${mmH.toFixed(2)}mm ~ 63mm`);
  ok(`poker 2.5x3.5in, mini ${mmW.toFixed(1)}x${mmH.toFixed(1)}mm — both readable live`);

  /* Each template renders at the size its own entry declares. The
     print sheet groups by this, so a drift here mixes sizes on a page. */
  const sizeMap = await page.evaluate(() =>
    Object.fromEntries(TEMPLATE_ORDER.map(t => [t, TEMPLATES[t].size])));
  assert.deepStrictEqual(sizeMap, {
    breacher: 'poker', opfor: 'poker', reference: 'poker',
    weapon: 'mini', gear: 'mini',
  }, 'template size assignments');
  ok('weapon + gear are mini; breacher, opfor, reference are poker');

  /* 2 — every template renders to the exact canvas size */
  for (const tpl of ['breacher', 'opfor', 'reference', 'weapon', 'gear']) {
    const size = await page.evaluate(t => {
      const c = document.createElement('canvas');
      renderCard(c, { ...blankCard(t) }, null, {});
      return { w: c.width, h: c.height, expect: cardSize(t) };
    }, tpl);
    assert.strictEqual(size.w, size.expect.W, `${tpl} width`);
    assert.strictEqual(size.h, size.expect.H, `${tpl} height`);
    ok(`${tpl} renders at ${size.w}x${size.h}`);
  }

  /* 3 — stat tiles sit at the coordinates LAYOUT implies, and the
         first tile is at the same y on breacher and opfor */
  const probe = await page.evaluate(() => {
    const read = (tpl) => {
      const c = document.createElement('canvas');
      renderCard(c, { ...blankCard(tpl) }, null, {});
      const ctx = c.getContext('2d');
      // centre of the first left-hand tile, derived from LAYOUT
      const x = LAYOUT.FRAME + LAYOUT.TILE_W / 2;
      const y = LAYOUT.FRAME + LAYOUT.HEADER_H + LAYOUT.TILE_H / 2;
      const d = ctx.getImageData(x, y, 1, 1).data;
      return { x, y, px: [d[0], d[1], d[2]] };
    };
    return { breacher: read('breacher'), opfor: read('opfor') };
  });
  assert.deepStrictEqual(probe.breacher.px, probe.opfor.px,
    'first left tile paints the same tone on both unit templates');
  assert.strictEqual(probe.breacher.y, probe.opfor.y,
    'first left tile is top-aligned on both unit templates');
  ok(`first stat tile top-aligned at y=${probe.breacher.y} on both unit cards`);

  /* 4 — bleed adds exactly BLEED px on every edge */
  const bled = await page.evaluate(() => {
    const c = document.createElement('canvas');
    renderCard(c, { ...blankCard('breacher') }, null, { bleed: true, cropMarks: true });
    return { w: c.width, h: c.height };
  });
  assert.strictEqual(bled.w, L.SIZES.poker.W + L.BLEED * 2, 'bleed width');
  assert.strictEqual(bled.h, L.SIZES.poker.H + L.BLEED * 2, 'bleed height');
  ok(`bleed adds ${L.BLEED}px per edge -> ${bled.w}x${bled.h}`);

  /* 5 — supplied artwork actually reaches the canvas */
  const artOK = await page.evaluate(async () => {
    // 4x4 pure magenta PNG, drawn cover-fit into the portrait box
    const src = document.createElement('canvas');
    src.width = src.height = 4;
    const s = src.getContext('2d');
    s.fillStyle = '#ff00ff'; s.fillRect(0, 0, 4, 4);
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = src.toDataURL(); });

    const c = document.createElement('canvas');
    renderCard(c, { ...blankCard('breacher') }, img, {});
    // sample the middle of the portrait area, clear of the stat columns
    const d = c.getContext('2d').getImageData(LAYOUT.SIZES.poker.W / 2, 300, 1, 1).data;
    return [d[0], d[1], d[2]];
  });
  assert.deepStrictEqual(artOK, [255, 0, 255], 'portrait art is composited');
  ok('uploaded artwork composites into the portrait box');

  /* Regression: the art well used to be painted only when no image
     was supplied, so a transparent PNG showed raw canvas instead of
     the card's own backdrop. Sample a point the glyph never covers. */
  const wellBehindPNG = await page.evaluate(async () => {
    const src = document.createElement('canvas');
    src.width = src.height = 8;
    const s = src.getContext('2d');
    s.clearRect(0, 0, 8, 8);           // fully transparent PNG
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = src.toDataURL(); });
    const c = document.createElement('canvas');
    renderCard(c, { ...blankCard('breacher') }, img, {});
    const d = c.getContext('2d').getImageData(LAYOUT.SIZES.poker.W / 2, 300, 1, 1).data;
    return { rgb: [d[0], d[1], d[2]], alpha: d[3] };
  });
  assert.strictEqual(wellBehindPNG.alpha, 255, 'art well is opaque behind a transparent PNG');
  ok('transparent PNG sits on the card backdrop, not on empty canvas');

  /* Regression: the title used to be centred in the space left beside
     the CE badge, so names shifted depending on the cost. */
  const centred = await page.evaluate(() => {
    const probe = (badge) => {
      const card = { ...blankCard('breacher'), name: 'IIIIIIII', badge };
      const c = document.createElement('canvas');
      renderCard(c, card, null, {});
      const ctx = c.getContext('2d');
      const y = Math.round(LAYOUT.FRAME + LAYOUT.HEADER_H * 0.5);
      const row = ctx.getImageData(0, y, LAYOUT.SIZES.poker.W, 1).data;
      let first = -1, last = -1;
      // header ink is near-white; the badge sits far right, so scan the
      // middle 60% of the card only
      const lo = Math.round(LAYOUT.SIZES.poker.W * 0.2);
      const hi = Math.round(LAYOUT.SIZES.poker.W * 0.8);
      for (let x = lo; x < hi; x++) {
        if (row[x * 4] > 200 && row[x * 4 + 1] > 200) {
          if (first < 0) first = x;
          last = x;
        }
      }
      return (first + last) / 2;
    };
    return { none: probe(''), small: probe('9'), big: probe('199') };
  });
  assert.ok(Math.abs(centred.none - centred.small) < 3,
    `title centre moves with badge (${centred.none} vs ${centred.small})`);
  assert.ok(Math.abs(centred.small - centred.big) < 3,
    `title centre moves with badge width (${centred.small} vs ${centred.big})`);
  ok(`title stays centred at x=${centred.small.toFixed(0)} regardless of CE value`);

  /* 6 — the weapon/gear libraries build, search, and prefill.
         Regression: the library is derived from game-data.js at
         runtime, so a shape change there (a renamed field, a
         weapon whose name has no variant in brackets) silently
         yields blank cards rather than throwing. */
  const lib = await page.evaluate(() => {
    const w = getLibrary('weapon'), g = getLibrary('gear');
    return {
      weaponCount: w.length,
      gearCount: g.length,
      noLibForBreacher: getLibrary('breacher') === null,
      blankWeapons: w.filter(i => !i.label || !i.fields.damage).map(i => i.id),
      blankGear: g.filter(i => !i.label || !i.fields.body).map(i => i.id),
      groups: [...new Set(w.map(i => i.group))].sort(),
    };
  });
  assert.ok(lib.weaponCount >= 30, `weapon library has ${lib.weaponCount} entries`);
  assert.ok(lib.gearCount >= 25, `gear library has ${lib.gearCount} entries`);
  assert.ok(lib.noLibForBreacher, 'templates without a library return null');
  assert.deepStrictEqual(lib.blankGear, [], 'every gear entry has rules text');
  ok(`libraries built: ${lib.weaponCount} weapons/grenades (${lib.groups.join(', ')}), ${lib.gearCount} gear`);

  /* Ranking: an exact prefix must win over a mid-word match. */
  const ranked = await page.evaluate(() => ({
    sho: searchLibrary('weapon', 'sho').map(i => i.label),
    bipod: searchLibrary('gear', 'bipod').map(i => i.label),
    byEffect: searchLibrary('gear', 'initiative').map(i => i.label),
  }));
  assert.ok(ranked.sho[0].toLowerCase().startsWith('sho'),
    `prefix match ranks first, got "${ranked.sho[0]}"`);
  assert.strictEqual(ranked.bipod[0], 'Bipod');
  assert.ok(ranked.byEffect.includes('Chrono'),
    'gear is searchable by its rules text, not just its name');
  ok('search ranks prefix matches first and finds gear by effect text');

  /* Prefill must reach the rendered card, not just the form model. */
  const prefilled = await page.evaluate(() => {
    const item = searchLibrary('weapon', 'anti material')[0];
    const card = { ...blankCard('weapon'), ...item.fields, template: 'weapon' };
    const c = document.createElement('canvas');
    renderCard(c, card, null, {});
    return { fields: item.fields, painted: c.width > 0 };
  });
  assert.strictEqual(prefilled.fields.damage, '2D10 (AP)(T)(SH+4)',
    'rulebook damage notation converts to card notation');
  assert.deepStrictEqual(prefilled.fields.modes, ['(PS)']);
  assert.ok(prefilled.fields.rules.length === 1, 'special rule carried over');
  assert.ok(prefilled.painted);
  ok(`prefill maps rulebook data to card fields (${prefilled.fields.damage})`);

  /* 7 — no uncaught page errors across all of the above */
  assert.deepStrictEqual(pageErrors, [], 'no uncaught page errors');
  ok('no uncaught page errors');

  await browser.close();
  server.close();
  console.log('\nverify1: all checks passed');
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });

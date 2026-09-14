/* ============================================================
   card-library.js
   Turns canonical game data (game-data.js) into ready-to-use
   card field sets for the designer's autocomplete and browser.

   The conversion lives here, not in game-data.js, so the game
   data stays a plain transcription of the rulebook and the
   card-specific formatting stays a card concern.
   ============================================================ */

/* Rulebook notation -> card notation.
   '1D10 [DEV][T][SH+2]'  ->  'D10 (DEV)(T)(SH+2)'
   The leading 1 is dropped because a single die is implied, and
   square brackets become parentheses to match the printed cards. */
function toCardDamage(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\[([^\]]+)\]/g, '($1)')
    .replace(/\b1D(\d)/g, 'D$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/* '[PS][SA2][B]' or '[PS]/[SA2]' -> ['(PS)','(SA2)','(B)'] */
function toCardModes(raw) {
  if (!raw) return [];
  const bracketed = String(raw).match(/\[[^\]]+\]/g);
  if (bracketed) return bracketed.map(m => '(' + m.slice(1, -1) + ')');
  /* Melee weapons list prose modes: 'Rapid Strikes + Heavy Blow' */
  return String(raw).split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
}

/* 'Bolt Action Sniper (Hvy)' -> { name, subtitle } */
function splitWeaponName(key) {
  const m = String(key).match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { name: key, subtitle: '' };
  const variants = {
    Hvy: 'Heavy rounds', Med: 'Medium rounds', Light: 'Light rounds',
    Medium: 'Medium rounds',
  };
  return { name: m[1], subtitle: variants[m[2]] || m[2] };
}

const TYPE_LABEL = {
  primary: 'Primary', support: 'Support', secondary: 'Secondary', melee: 'Melee',
};

/* Build the weapon library: every entry in WEAPONS plus every
   grenade, as a complete set of `weapon` card fields. */
function buildWeaponLibrary() {
  const out = [];

  Object.keys(WEAPONS).forEach(key => {
    const w = WEAPONS[key];
    const { name, subtitle } = splitWeaponName(key);
    const typeBits = [TYPE_LABEL[w.type] || w.type];
    if (w.category && w.category !== TYPE_LABEL[w.type]) typeBits.push(w.category);

    out.push({
      id: 'w:' + key,
      group: TYPE_LABEL[w.type] || 'Weapon',
      label: name,
      sublabel: subtitle,
      search: (key + ' ' + name + ' ' + subtitle + ' ' + (w.category || '')).toLowerCase(),
      fields: {
        name,
        subtitle,
        modes: toCardModes(w.modes),
        damage: toCardDamage(w.damage),
        ce: w.ce ? '+' + w.ce + 'CE' : '',
        short: w.short && w.short !== '—' ? w.short : '',
        medium: w.medium && w.medium !== '—' ? w.medium : '',
        long: w.long && w.long !== '—' ? w.long : '',
        wtype: 'Type: ' + typeBits.join(' / '),
        rules: w.special ? [w.special] : [],
      },
    });
  });

  GRENADES.forEach(g => {
    out.push({
      id: 'g:' + g.id,
      group: 'Grenade',
      label: g.name,
      sublabel: g.slots + ' slot' + (g.slots > 1 ? 's' : ''),
      search: (g.name + ' grenade').toLowerCase(),
      fields: {
        name: g.name,
        subtitle: g.slots + ' Slot' + (g.slots > 1 ? 's' : ''),
        modes: [g.blast].filter(Boolean),
        damage: toCardDamage(g.damage === '—' ? '' : g.damage),
        ce: '',
        short: g.range || '',
        medium: '',
        long: '',
        wtype: 'Duration: ' + (g.duration || '—'),
        rules: g.effect ? [g.effect] : [],
      },
    });
  });

  return out;
}

/* Build the gear library from TACTICAL_GEAR. */
function buildGearLibrary() {
  return TACTICAL_GEAR.map(g => ({
    id: 'tg:' + g.id,
    group: g.slots === 0 ? 'Loadout' : g.slots + ' Slot' + (g.slots > 1 ? 's' : ''),
    label: g.name,
    sublabel: (g.ce > 0 ? '+' + g.ce + ' CE' : g.ce < 0 ? g.ce + ' CE' : ''),
    search: (g.name + ' ' + String(g.effect).replace(/\*\*/g, '')).toLowerCase(),
    fields: {
      name: g.name,
      icon: g.icon || 'dice',
      slots: String(g.slots),
      ce: g.ce > 0 ? '+' + g.ce + 'CE' : g.ce < 0 ? g.ce + 'CE' : '',
      body: g.effect || '',
      rules: [],
    },
  }));
}

/* Build the OPFOR unit library from OPFOR_UNITS (game-data.js).
   Each entry fills the card's stat fields plus an initial FOP badge
   derived from the unit's base cost × default model count. */
function buildOpforLibrary() {
  return OPFOR_UNITS.map(u => {
    const baseFop = u.fopPerModel * u.modelsDefault;
    const formLabel = u.formation === 'coordinated' ? 'Coordinated'
                    : u.formation === 'individual'  ? 'Individual'
                    : 'Coord / Individual';
    const modRange = u.modelsMin === u.modelsMax
      ? u.modelsMin + ' model' + (u.modelsMin > 1 ? 's' : '')
      : u.modelsMin + '–' + u.modelsMax + ' models';
    return {
      id:       'ou:' + u.id,
      group:    u.group || 'Unit',
      label:    u.name,
      sublabel: modRange + ' · ' + formLabel,
      search:   (u.name + ' ' + u.group + ' ' + formLabel).toLowerCase(),
      fields: {
        name:      u.name,
        badge:     String(baseFop),
        rc:        u.stats.rc,
        mc:        u.stats.mc,
        arm:       u.stats.arm,
        mov:       u.stats.mov,
        wnd:       u.stats.wnd,
        tech:      u.stats.tech,
        formation: formLabel + ': [' + u.modelsDefault + '/' + u.modelsMax + ']',
        rules:     u.rules ? [...u.rules] : [],
      },
      /* Extra metadata for the FOP calculator — not written to card fields directly. */
      meta: {
        unitId:        u.id,
        fopPerModel:   u.fopPerModel,
        modelsDefault: u.modelsDefault,
        modelsMin:     u.modelsMin,
        modelsMax:     u.modelsMax,
        formation:     u.formation,
        upgrades:      u.upgrades,
      },
    };
  });
}

/* Build the Breacher library: generic class archetypes + premade named
   characters. Generic classes come first so they appear at the top. */
function buildBreacherLibrary() {
  const out = [];
  BREACHER_CLASSES.forEach(c => {
    out.push({
      id:       'bc:' + c.id,
      group:    'Generic Classes',
      label:    c.name,
      sublabel: '',
      search:   c.name.toLowerCase(),
      fields: {
        name:     c.name,
        badge:    c.badge,
        subtitle: c.subtitle,
        rc: c.stats.rc, mc: c.stats.mc, tech: c.stats.tech,
        mor: c.stats.mor, wnd: c.stats.wnd,
        mov: c.stats.mov, arm: c.stats.arm, mag: c.stats.mag,
        grid: c.stats.grid, gren: c.stats.gren,
        bands:  c.bands.map(b => ({ ...b })),
        rules:  c.rules.slice(),
        footer: c.footer,
      },
    });
  });
  BREACHER_PREMADES.forEach(p => {
    out.push({
      id:       'bp:' + p.id,
      group:    'Premade Breachers',
      label:    p.subtitle || p.name,
      sublabel: p.badge ? 'CE ' + p.badge : '',
      search:   (p.name + ' ' + p.subtitle).toLowerCase(),
      fields: {
        name:     p.name,
        badge:    p.badge,
        subtitle: p.subtitle,
        rc: p.stats.rc, mc: p.stats.mc, tech: p.stats.tech,
        mor: p.stats.mor, wnd: p.stats.wnd,
        mov: p.stats.mov, arm: p.stats.arm, mag: p.stats.mag,
        grid: p.stats.grid, gren: p.stats.gren,
        bands:  p.bands.map(b => ({ ...b })),
        rules:  p.rules.slice(),
        footer: p.footer,
      },
    });
  });
  return out;
}

/* Build the Reference card library from premade Breachers only.
   Selecting a character pre-fills name, subtitle and abilities. */
function buildReferenceLibrary() {
  return BREACHER_PREMADES.map(p => ({
    id:       'ref:' + p.id,
    group:    'Premade Breachers',
    label:    p.subtitle || p.name,
    sublabel: '',
    search:   (p.name + ' ' + p.subtitle).toLowerCase(),
    fields: {
      name:      p.subtitle || p.name,
      subtitle:  '',
      abilities: p.abilities ? p.abilities.slice() : [],
      footer:    p.footer || '',
    },
  }));
}

/* One registry keyed by template id; a template without an entry
   simply gets no library controls. */
const LIBRARIES = {
  weapon:    { title: 'Weapon Library',    build: buildWeaponLibrary,    cache: null },
  gear:      { title: 'Gear Library',      build: buildGearLibrary,      cache: null },
  opfor:     { title: 'OPFOR Library',     build: buildOpforLibrary,     cache: null },
  breacher:  { title: 'Breacher Library',  build: buildBreacherLibrary,  cache: null },
  reference: { title: 'Reference Library', build: buildReferenceLibrary, cache: null },
};

function getLibrary(templateId) {
  const reg = LIBRARIES[templateId];
  if (!reg) return null;
  if (!reg.cache) reg.cache = reg.build();
  return reg.cache;
}

/* Normalise for matching: case, hyphens, slashes and punctuation
   all collapse to single spaces. Without this, "anti material"
   misses "Anti-Material Rifle" and "semi auto" misses
   "Semi-Auto Sniper" — exactly what someone types when searching. */
function normalise(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9'"+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Rank matches: prefix on the label beats word-start beats
   anywhere, so typing "sho" surfaces Shotgun before Sawed-Off. */
function searchLibrary(templateId, query) {
  const lib = getLibrary(templateId);
  if (!lib) return [];
  const q = normalise(query);
  if (!q) return lib.slice();

  const scored = [];
  lib.forEach(item => {
    const label = normalise(item.label);
    const hay = normalise(item.search);
    let score = -1;
    if (label.startsWith(q)) score = 0;
    else if (label.includes(' ' + q)) score = 1;
    else if (label.includes(q)) score = 2;
    else if (hay.includes(q)) score = 3;
    if (score >= 0) scored.push({ item, score });
  });
  scored.sort((a, b) => a.score - b.score || a.item.label.localeCompare(b.item.label));
  return scored.map(s => s.item);
}

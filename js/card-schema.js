/* ============================================================
   card-schema.js
   Template definitions for the Breacher Card Designer.
   PURE DATA — no functions that touch the DOM or canvas.

   Four template-locked categories:
     breacher | opfor | weapon | gear

   Every colour in the app comes from PALETTE below. Sampled
   directly from Ivan's Pixelmator sample cards, then nudged
   where print contrast demanded it (see notes inline).
   ============================================================ */

/* ── Shared palette ─────────────────────────────────────── */
const PALETTE = {
  ink:        '#000000',
  bone:       '#b1ada4',   // sampled: light stat tile
  boneLight:  '#dddad3',   // sampled: weapon range-table row
  paper:      '#e8e6e2',   // sampled #d5d5d5 -> lightened for print contrast
  paperAlt:   '#dcd9d4',   // zebra row

  headerA:    '#232325',   // sampled header bar, top of gradient
  headerB:    '#131315',   // bottom of gradient
  headerInk:  '#f4f2ee',

  red:        '#7a1e12',   // sampled MC tile
  redDeep:    '#4a1008',   // sampled CE badge
  redBright:  '#c0392b',   // matches index.html --red
  navy:       '#1d303e',   // sampled TECH / MOR / WND tile
  navyLight:  '#26414f',
  olive:      '#1c3619',   // sampled ARM / MAG / GREN tile
  oliveLight: '#2a4b25',

  maroon:     '#6c3336',   // sampled weapon art panel
  maroonDeep: '#4d2124',
  sage:       '#b6c1b1',   // sampled equipment card body
  sageDeep:   '#8d9b89',
  sagePill:   '#353130',   // sampled equipment title pill

  opforArt:   '#7f8a2e',   // sampled OPFOR portrait backdrop (olive)
  opforArtB:  '#4a5219',
};

/* ── Type ramps ─────────────────────────────────────────── */
const FONTS = {
  display: "'Oswald', 'Roboto Condensed', sans-serif",
  body:    "'Roboto Condensed', 'Helvetica Neue', sans-serif",
};

/* ── Stat rows ──────────────────────────────────────────────
   Each unit card carries 5 stats down the left of the portrait
   and 5 down the right. icon keys resolve in card-icons.js.
   tone picks the tile colour + auto-contrast text.
   ──────────────────────────────────────────────────────────*/
const BREACHER_STATS_LEFT = [
  { key:'rc',    icon:'ranged',     tone:'red',   label:'Ranged Combat' },
  { key:'mc',    icon:'melee',      tone:'red',   label:'Melee Combat' },
  { key:'tech',  icon:'technical',  tone:'navy',  label:'Technical' },
  { key:'mor',   icon:'morale',     tone:'navy',  label:'Morale' },
  { key:'wnd',   icon:'wounds',     tone:'navy',  label:'Wounds' },
];
const BREACHER_STATS_RIGHT = [
  { key:'mov',   icon:'movement',   tone:'bone',  label:'Movement' },
  { key:'arm',   icon:'armor',      tone:'olive', label:'Armour' },
  { key:'mag',   icon:'magazine',   tone:'olive', label:'Magazines' },
  { key:'grid',  icon:'gear-slots', tone:'olive', label:'Gear Slots' },
  { key:'gren',  icon:'grenade',    tone:'olive', label:'Grenades' },
];
const OPFOR_STATS_LEFT = [
  { key:'rc',    icon:'ranged',     tone:'red',   label:'Ranged Combat' },
  { key:'mc',    icon:'melee',      tone:'red',   label:'Melee Combat' },
  { key:'arm',   icon:'armor',      tone:'olive', label:'Armour' },
];
const OPFOR_STATS_RIGHT = [
  { key:'mov',   icon:'movement',   tone:'bone',  label:'Movement' },
  { key:'wnd',   icon:'wounds',     tone:'navy',  label:'Wounds' },
  { key:'tech',  icon:'technical',  tone:'navy',  label:'Technical' },
];

/* ── Gear icon choices (equipment cards) ────────────────── */
const GEAR_ICONS = Object.keys(ICON_SET).map(id => ({ id, label: ICON_SET[id] }));

/* ── Template registry ──────────────────────────────────────
   `fields` drives the whole form UI. Adding a field here adds
   an input to the editor; the renderer reads the same keys.
   ──────────────────────────────────────────────────────────*/
const TEMPLATES = {

  breacher: {
    id: 'breacher',
    size: 'poker',
    label: 'Breacher',
    blurb: 'Player operator card — 10 stats, loadout bands, special rules.',
    accent: PALETTE.redBright,
    badgeLabel: 'CE',
    statsLeft: BREACHER_STATS_LEFT,
    statsRight: BREACHER_STATS_RIGHT,
    fields: [
      { key:'name',     type:'text',   label:'Name / Role',    placeholder:'ASSAULT',      maxlength:34 },
      { key:'badge',    type:'text',   label:'CE Cost',        placeholder:'11',           maxlength:6, width:'third' },
      { key:'subtitle', type:'text',   label:'Subtitle (optional)', placeholder:'MUTT (ASSAULT)', maxlength:40 },
      { key:'art',      type:'image',  label:'Portrait Art' },
      { group:'Stats' },
      { key:'rc',   type:'stat', label:'Ranged Combat', placeholder:'14', width:'fifth' },
      { key:'mc',   type:'stat', label:'Melee Combat',  placeholder:'12', width:'fifth' },
      { key:'tech', type:'stat', label:'Technical',     placeholder:'12', width:'fifth' },
      { key:'mor',  type:'stat', label:'Morale',        placeholder:'11', width:'fifth' },
      { key:'wnd',  type:'stat', label:'Wounds',        placeholder:'20', width:'fifth' },
      { key:'mov',  type:'stat', label:'Movement',      placeholder:'4"', width:'fifth' },
      { key:'arm',  type:'stat', label:'Armour',        placeholder:'3',  width:'fifth' },
      { key:'mag',  type:'stat', label:'Magazines',     placeholder:'4',  width:'fifth' },
      { key:'grid', type:'stat', label:'Gear Slots',    placeholder:'4',  width:'fifth' },
      { key:'gren', type:'stat', label:'Grenades',      placeholder:'2',  width:'fifth' },
      { group:'Loadout' },
      { key:'bands',    type:'bands',  label:'Loadout Bands',
        hint:'One band per row. Use a full-width row for the primary weapon, or pair two rows side by side.' },
      { group:'Rules' },
      { key:'rules',    type:'bullets', label:'Special Rules', placeholder:'One rule per line' },
      { key:'footer',   type:'text',   label:'Footer Note (optional)', placeholder:'', maxlength:60 },
    ],
    defaults: {
      name:'ASSAULT', badge:'11', subtitle:'',
      rc:'14', mc:'12', tech:'12', mor:'11', wnd:'20',
      mov:'4"', arm:'3', mag:'4', grid:'4', gren:'2',
      bands:[
        { text:'PRIMARY WEAPON: Short or Medium Range', span:'full', tone:'dark' },
        { text:'SECONDARY WEAPON', span:'half', tone:'dark' },
        { text:'MELEE WEAPON',     span:'half', tone:'dark' },
      ],
      rules:[
        '(SAx) Ranged Combat Maneuvers: max +1 extra shot.',
        'Stacked Mag OoA: gain +2 MP.',
        'Stacked Mags never grant a Low Ammo token.',
      ],
      footer:'',
    },
  },

  opfor: {
    id: 'opfor',
    size: 'poker',
    label: 'OPFOR',
    blurb: 'Enemy unit card — FOP cost, formation line, unit rules.',
    accent: PALETTE.redBright,
    badgeLabel: 'FOP',
    statsLeft: OPFOR_STATS_LEFT,
    statsRight: OPFOR_STATS_RIGHT,
    fields: [
      { key:'name',     type:'text',  label:'Unit Name',  placeholder:'TRAINED', maxlength:34 },
      { key:'badge',    type:'text',  label:'FOP Cost (auto-calculated below)', placeholder:'10', maxlength:6, width:'third' },
      { key:'art',      type:'image', label:'Unit Art' },
      { group:'Stats' },
      { key:'rc',   type:'stat', label:'Ranged Combat', placeholder:'11', width:'third' },
      { key:'mc',   type:'stat', label:'Melee Combat',  placeholder:'10', width:'third' },
      { key:'arm',  type:'stat', label:'Armour',        placeholder:'2',  width:'third' },
      { key:'mov',  type:'stat', label:'Movement',      placeholder:'4',  width:'third' },
      { key:'wnd',  type:'stat', label:'Wounds',        placeholder:'7',  width:'third' },
      { key:'tech', type:'stat', label:'Technical',     placeholder:'10', width:'third' },
      { group:'Loadout' },
      { key:'bands',    type:'bands', label:'Loadout Bands' },
      { group:'Rules' },
      { key:'formation',type:'text',  label:'Formation Line', placeholder:'Coordinated: [2/5]', maxlength:40 },
      { key:'rules',    type:'bullets', label:'Unit Rules', placeholder:'One rule per line' },
      { key:'footer',   type:'text',  label:'Footer Note (optional)', placeholder:'', maxlength:60 },
    ],
    defaults: {
      name:'TRAINED', badge:'10',
      rc:'11', mc:'10', arm:'2', mov:'4', wnd:'7', tech:'10',
      bands:[
        { text:'PRIMARY WEAPON', span:'half', tone:'dark' },
        { text:'MELEE WEAPON',   span:'half', tone:'dark' },
      ],
      formation:'Coordinated: [2/5]',
      rules:[
        '3 FOP Per Model',
        'Cohesion: 4"',
        '+1 FOP/model: Unit gets +2 Armor',
      ],
      footer:'',
    },
  },

  weapon: {
    id: 'weapon',
    size: 'mini',
    label: 'Weapon',
    blurb: 'Firearm or melee card — fire modes, damage, three range bands.',
    accent: PALETTE.maroon,
    fields: [
      { key:'name',     type:'text', label:'Weapon Name', placeholder:'Shotgun', maxlength:30 },
      { key:'subtitle', type:'text', label:'Variant / Rounds', placeholder:'Slug', maxlength:30 },
      { key:'art',      type:'image', label:'Weapon Art' },
      { group:'Profile' },
      { key:'modes',    type:'pills', label:'Fire Modes', placeholder:'(PS), (SA2)',
        hint:'Comma separated. Rendered as white pills.' },
      { key:'damage',   type:'text', label:'Damage',  placeholder:'D8 (DEV)', maxlength:24, width:'half' },
      { key:'ce',       type:'text', label:'CE Badge (optional)', placeholder:'+1CE', maxlength:8, width:'half' },
      { group:'Range Bands' },
      { key:'short',    type:'text', label:'Short Range',  placeholder:'1-8" +1',   maxlength:24, width:'third' },
      { key:'medium',   type:'text', label:'Medium Range', placeholder:'8-15" +0',  maxlength:24, width:'third' },
      { key:'long',     type:'text', label:'Long Range',   placeholder:'15-20" -2', maxlength:24, width:'third' },
      { group:'Notes' },
      { key:'wtype',    type:'text', label:'Type Line', placeholder:'Type: Short', maxlength:40 },
      { key:'rules',    type:'bullets', label:'Special Rules', placeholder:'One rule per line, optional' },
    ],
    defaults: {
      name:'Shotgun', subtitle:'Slug', modes:['(PS)','(SA2)'],
      damage:'D8 (DEV)', ce:'',
      short:'1-8" +1', medium:'8-15" +0', long:'15-20" -2',
      wtype:'Type: Short', rules:[],
    },
  },

  gear: {
    id: 'gear',
    size: 'mini',
    label: 'Gear',
    blurb: 'Tactical equipment card — slot cost, icon, rules text.',
    accent: PALETTE.sageDeep,
    fields: [
      { key:'name',     type:'text',  label:'Item Name', placeholder:'BREACHING CHARGE', maxlength:28 },
      { key:'icon',     type:'select', label:'Category Icon', options:GEAR_ICONS, width:'half' },
      { key:'slots',    type:'text',  label:'Slot Cost', placeholder:'1', maxlength:3, width:'half' },
      { key:'ce',       type:'text',  label:'CE Badge (optional)', placeholder:'+1CE', maxlength:8, width:'half' },
      { key:'art',      type:'image', label:'Item Art' },
      { group:'Rules' },
      { key:'body',     type:'richtext', label:'Rules Text',
        hint:'Wrap words in **double asterisks** to bold them, like the printed cards.' },
      { key:'rules',    type:'bullets', label:'Bulleted Rules (optional)', placeholder:'One per line' },
    ],
    defaults: {
      name:'BREACHING CHARGE', icon:'grenade', slots:'1', ce:'',
      body:'Placed on a wall within 1" of the Breacher as a Movement Maneuver and detonated as a Combat Maneuver. Makes a 2"x1" opening in a solid surface of Cover 2 or less. All enemy Units within 3" of the breaching charge become **Shaken**.',
      rules:[],
    },
  },

  /* Hired Gun: named or generic NPC ally unit.
     Same stat layout as OPFOR (3+3 stat tiles). Always Individual. */
  'hired-gun': {
    id: 'hired-gun',
    size: 'poker',
    label: 'Hired Gun',
    blurb: 'Named or generic Hired Gun — always Individual, FOP cost, special rules.',
    accent: PALETTE.redBright,
    badgeLabel: 'FOP',
    statsLeft: OPFOR_STATS_LEFT,
    statsRight: OPFOR_STATS_RIGHT,
    fields: [
      { key:'name',      type:'text',    label:'Name',             placeholder:'HIRED GUN', maxlength:34 },
      { key:'badge',     type:'text',    label:'FOP Cost',         placeholder:'6',         maxlength:6,  width:'third' },
      { key:'art',       type:'image',   label:'Character Art' },
      { group:'Stats' },
      { key:'rc',    type:'stat', label:'Ranged Combat', placeholder:'12', width:'third' },
      { key:'mc',    type:'stat', label:'Melee Combat',  placeholder:'12', width:'third' },
      { key:'arm',   type:'stat', label:'Armour',        placeholder:'1',  width:'third' },
      { key:'mov',   type:'stat', label:'Movement',      placeholder:'5"', width:'third' },
      { key:'wnd',   type:'stat', label:'Wounds',        placeholder:'12', width:'third' },
      { key:'tech',  type:'stat', label:'Technical',     placeholder:'12', width:'third' },
      { group:'Loadout' },
      { key:'bands',     type:'bands',   label:'Loadout Bands' },
      { group:'Rules' },
      { key:'formation', type:'text',    label:'Formation / Concealed', placeholder:'Individual', maxlength:40 },
      { key:'rules',     type:'bullets', label:'Special Rules',  placeholder:'One rule per line' },
      { key:'footer',    type:'text',    label:'Footer Note (optional)', placeholder:'', maxlength:60 },
    ],
    defaults: {
      name:'HIRED GUN', badge:'6',
      rc:'12', mc:'12', arm:'1', mov:'5"', wnd:'12', tech:'12',
      bands:[
        { text:'PRIMARY WEAPON (or Support)', span:'full', tone:'dark' },
        { text:'SECONDARY WEAPON',            span:'half', tone:'dark' },
        { text:'MELEE WEAPON',                span:'half', tone:'dark' },
        { text:'MELEE WEAPON 2',              span:'half', tone:'dark' },
      ],
      formation:'Individual',
      rules:[
        '6 FOP. Max 1 per Breacher in the Operation.',
        'Always Individual.',
        'Upgrade: +1 Armor (→3) +2 FOP.',
        'Upgrade: Concealed +2 FOP.',
        'Upgrade: Coordinated +1 FOP/model [2/4] 2" cohesion.',
      ],
      footer:'',
    },
  },

  /* Companion card for a premade Breacher: name plus the full
     special-ability text, at a size you can actually read across
     the table. Pairs with a `breacher` card of the same name. */
  reference: {
    id: 'reference',
    size: 'poker',
    label: 'Reference',
    blurb: 'Companion card for a premade Breacher — name and full special-ability text.',
    accent: PALETTE.redBright,
    fields: [
      { key:'name',     type:'text', label:'Breacher Name', placeholder:'KRAKEN', maxlength:34 },
      { key:'subtitle', type:'text', label:'Class / Role',  placeholder:'Heavy Assault', maxlength:34 },
      { group:'Abilities' },
      { key:'abilities', type:'entries', label:'Special Abilities',
        hint:'One ability per block. Wrap a lead-in in **double asterisks** to bold it, like "**Dominate The A.O. (cost 1 Momentum or Grit):**".' },
      { group:'Footer' },
      { key:'footer',   type:'text', label:'Footer Line', placeholder:'Spent Cryptocurrency: 4', maxlength:60 },
    ],
    defaults: {
      name:'KRAKEN', subtitle:'Heavy Assault',
      abilities:[
        '1. This Breacher reduces the number of Low Ammo tokens they receive from Combat Maneuvers by 1 to a minimum of 1.',
        '2. When this Breacher takes an enemy Unit Out of Action using the Full Auto Combat Maneuver, gain 1 Momentum.',
        '**Dominate The A.O. (cost 1 Momentum or Grit):** If the Unit is within 2" of an objective or Breach Point, the next attack this Unit makes this activation gains the bonuses of (AP) and (DEV).',
      ],
      footer:'Spent Cryptocurrency: 4',
    },
  },

};

const TEMPLATE_ORDER = ['breacher','reference','opfor','weapon','gear'];

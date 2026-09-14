/* ============================================================
   game-data.js
   CANONICAL Breacher game data. Pure data — no functions, no DOM.

   This is the single source for weapons, grenades and tactical
   gear. The force builder (index.html) and the card designer
   (cards.html) both load this file, so a stat corrected here is
   corrected in both places. Transcribed from the rulebook,
   Section 12: Weapons and Tactical Equipment.

   Hand-editable on purpose: no build step, no generated code.
   ============================================================ */

const WEAPONS = {
  // Primary — Long Range
  'Bolt Action Sniper (Hvy)':   { type:'primary', damage:'1D10 [DEV][T][SH+2]', modes:'[PS]',           short:'1-12" -2',  medium:'12-24" +0', long:'24+" +2',    category:'Long',      ce:1 },
  'Semi-Auto Sniper (Med)':     { type:'primary', damage:'1D8 [DEV][T][SH+1]',  modes:'[SA2]',          short:'1-12" -1',  medium:'12-24" +1', long:'24+" +1',    category:'Long',      ce:1 },
  'DMR (Med)':                  { type:'primary', damage:'1D8 [T][SH+1]',        modes:'[PS][SA2][B]',   short:'1-12" -2',  medium:'12-24" +2', long:'24+" -2',    category:'Long',      ce:0 },
  // Primary — Medium Range
  'Assault Rifle (Med)':        { type:'primary', damage:'1D6+1',                modes:'[SA3][A][PS]',   short:'1-12" +1',  medium:'12-24" +0', long:'24-30" -1',  category:'Med',       ce:0 },
  'Assault Rifle (Hvy)':        { type:'primary', damage:'1D8+1',                modes:'[SA2][A][PS]',   short:'1-12" +0',  medium:'12-24" +1', long:'24-30" -1',  category:'Med',       ce:0 },
  // Primary — Short/Medium Range
  'SMG (Light)':                { type:'primary', damage:'1D6',                  modes:'[SA2][B][A]',    short:'1-8" +2',   medium:'8-18" -1',  long:'18-22" -2',  category:'Short/Med', ce:0 },
  'SMG (Medium)':               { type:'primary', damage:'1D6+1',                modes:'[PS][B][A]',     short:'1-8" +1',   medium:'8-20" +0',  long:'20-25" -2',  category:'Short/Med', ce:0 },
  // Primary — Short Range
  'PDW (Light)':                { type:'primary', damage:'1D6 [AP Short]',       modes:'[B][A]',         short:'1-6" +2',   medium:'6-15" +1',  long:'15-20" -3',  category:'Short',     ce:0 },
  'Compact SMG (Light)':        { type:'primary', damage:'1D6',                  modes:'[Ax2]',          short:'1-6" +3',   medium:'6-15" -3',  long:'16-20" -4',  category:'Short',     ce:1 },
  'Automatic Pistol (Light)':   { type:'primary', damage:'1D6',                  modes:'[SA2][A]',       short:'1-4" +2',   medium:'4-10" -3',  long:'10-15" -4',  category:'Short',     ce:1 },
  'Heavy Pistol (Hvy)':         { type:'primary', damage:'1D6+1 [Dev][SH]',      modes:'[SA1]',          short:'1-4" +2',   medium:'4-12" +0',  long:'12-15" -1',  category:'Short',     ce:0 },
  'Shotgun (Buckshot)':         { type:'primary', damage:'3D3',                  modes:'[PS]/[SA2]',     short:'1-6" +3',   medium:'6-15" -1',  long:'15-20" -3',  category:'Short',     ce:0 },
  'Shotgun (Slug)':             { type:'primary', damage:'1D8 [DEV]',            modes:'[PS]/[SA2]',     short:'1-8" +1',   medium:'8-15" +0',  long:'15-20" -2',  category:'Short',     ce:0 },
  'Shotgun (Flechette)':        { type:'primary', damage:'1D6 [AP][T]',          modes:'[PS]/[SA2]',     short:'1-6" +3',   medium:'6-15" -2',  long:'15-20" -5',  category:'Short',     ce:0 },
  'Sawed-Off (Buckshot)':       { type:'primary', damage:'3D3 +Low Ammo',        modes:'[PS]/[SA2]',     short:'1-6" +4',   medium:'6-15" -4',  long:'—',          category:'Short',     ce:0 },
  // Support
  'LMG (Med)':                  { type:'support', damage:'1D6+2 [SH+1]',         modes:'[A]',            short:'1-12" -1',  medium:'12-24" +0', long:'24-40" -2',  special:'Prone/Bracing: all bands +1',          ce:0 },
  'LMG PARA':                   { type:'support', damage:'1D6+2 [SH+1]',         modes:'[B][A]',         short:'1-12" +0',  medium:'12-24" -1', long:'24-40" -2',  special:'Prone/Bracing: first 2 bands +1',      ce:0 },
  'Anti-Material Rifle':        { type:'support', damage:'2D10 [AP][T][SH+4]',   modes:'[PS]',           short:'1-6" -1',   medium:'6-30" +0',  long:'30+" -1',    special:'Must be Prone/Bracing. -1" Move.',     ce:1 },
  'Carbine w/ Underslung GL':   { type:'support', damage:'1D6+1',                modes:'[PS][A]',        short:'1-12" +1',  medium:'12-20" +0', long:'20-25" +0',  special:'Combined weapon',                      ce:1 },
  'Grenade Launcher':           { type:'support', damage:'Per grenade',           modes:'[PS]',           short:'1-6" +0',   medium:'6-15" -1',  long:'—',          special:'2 shots; Phosphorus = 2 shots',        ce:0 },
  // Secondary
  'Revolver':                   { type:'secondary', damage:'1D6',                modes:'[PS]',           short:'1-4" +2',   medium:'4-10" +0',  long:'—',          special:'No Low Ammo/Ammo Out tokens',          ce:0 },
  'Semi-Auto Pistol':           { type:'secondary', damage:'1D6',                modes:'[SA2]',          short:'1-4" +1',   medium:'4-10" -1',  long:'—',          special:'No Low Ammo/Ammo Out tokens',          ce:0 },
  // Melee
  'Stiletto Style':             { type:'melee', damage:'1D4+1 [AP]',             modes:'Rapid Strikes',                  short:'0-1"', medium:'—', long:'—' },
  'Chopper Style':              { type:'melee', damage:'1D8 (-1 MC)[T]',         modes:'Rapid Strikes + Heavy Blow',     short:'0-1"', medium:'—', long:'—' },
  'Cutting Style':              { type:'melee', damage:'1D6+1',                  modes:'Rapid Strikes + Heavy Blow',     short:'0-1"', medium:'—', long:'—' },
  'Blunt Style':                { type:'melee', damage:'1D8+1 [T]',              modes:'Heavy Blow',                     short:'0-1"', medium:'—', long:'—' },
  'Fists and Kicks':            { type:'melee', damage:'1D4',                    modes:'Rapid Strikes + Heavy Blow',     short:'0-1"', medium:'—', long:'—' },
};

const GRENADES = [
  { id:'smoke',     name:'Defensive Smoke',     slots:1, range:'½ Tech +2"', blast:'BL4"', damage:'—',           duration:'3 Turns',  effect:'Blocks LoS in/out. 4" high cylinder.' },
  { id:'explosive', name:'Offensive Explosive', slots:1, range:'½ Tech +2"', blast:'BL3"', damage:'3D3',          duration:'Instant',  effect:'Units hit are automatically Shaken.' },
  { id:'phosphorus',name:'Offensive Phosphorus',slots:2, range:'½ Tech +2"', blast:'BL4"', damage:'1D6 [DEV][AP]',duration:'2 Turns',  effect:'Automatically Shaken. 4" high cylinder cloud.' },
  { id:'flashbang', name:'Defensive Flashbang', slots:1, range:'Tech +2"',   blast:'BL3"', damage:'1',            duration:'Instant',  effect:'-5 Combat/Technical, -3" Movement until end of next turn. Civilians cannot be taken OOA.' },
  { id:'stun',      name:'Defensive Stun',      slots:1, range:'½ Tech +2"', blast:'BL3"', damage:'1',            duration:'Instant',  effect:'Hit units cannot activate next Contact! card draw. Civilians cannot be taken OOA.' },
];


/* ── Tactical gear ──────────────────────────────────────────
   Rulebook section 12.7. `ce` is the Breacher Combat
   Effectiveness modifier; 0 means the table shows "-".
   `icon` maps to a slug in ICON_SET (card-icons.js).
   ──────────────────────────────────────────────────────────*/
const TACTICAL_GEAR = [
  { id:'suppressor', name:'Suppressor', slots:1, ce:0, icon:'ranged',
    effect:'The first **(PS)** shot of each Combat Maneuver is at an additional **+2 to hit**. In addition, Units targeted with this weapon may not spend Momentum Points to turn and face this Unit.' },
  { id:'coms', name:'Coms', slots:1, ce:0, icon:'command',
    effect:'At the start of this Breacher’s activation, roll a **D10**. On a **9-10**, get 1 Momentum point.' },
  { id:'breaching-charge', name:'Breaching Charge', slots:1, ce:0, icon:'grenade',
    effect:'Placed on a wall within 1" of the Breacher as a Movement Maneuver and detonated as a Combat Maneuver. Makes a 2"x1" opening in a solid surface of Cover 2 or less. All enemy Units within 3" of the breaching charge become **Shaken**.' },
  { id:'rope-fast-rig', name:'Rope and Fast Rig', slots:1, ce:0, icon:'movement',
    effect:'When the Breacher is in contact with a **wall**, they may make their movement **vertically**. The Breacher may use the Run Maneuver up and down vertical surfaces.' },
  { id:'hydration-bladder', name:'Hydration Bladder', slots:1, ce:0, icon:'wounds',
    effect:'At the start of each Breacher activation, roll a **d10**. On a roll of **10**, heal 3 wounds.' },
  { id:'shemagh', name:'Shemagh', slots:1, ce:0, icon:'grit',
    effect:'Start the game with an **additional Momentum point**.' },
  { id:'ghillie-suit', name:'Ghillie Suit', slots:1, ce:0, icon:'terrain',
    effect:'When this Unit is **Prone or Bracing**, it increases its Cover level by 1. When not in Cover, it counts as partially obscured; when partially obscured, it counts as heavily obscured.' },
  { id:'ballistic-helmet', name:'Ballistic Helmet', slots:1, ce:0, icon:'armor',
    effect:'Ignore the **first critical hit** against this Unit.' },
  { id:'survival-tool-kit', name:'Survival Tool Kit', slots:1, ce:1, icon:'technical',
    effect:'**1 use** per Operation. May be used after any **non-damage roll** to reroll the die/dice, choosing either result.' },
  { id:'mag-clamp', name:'Mag Clamp', slots:1, ce:0, icon:'magazine',
    effect:'The **first reload** of the game is a free Maneuver with any other Maneuver.' },
  { id:'quickdraw-holster', name:'Quickdraw Holster', slots:1, ce:0, icon:'belt',
    effect:'Choose a Secondary weapon for the holster. When making **(SA)** or **Melee** attacks, the Breacher may switch to its Secondary weapon and finish the rest of the attacks with the other weapon. Once per turn.' },
  { id:'stab-plates', name:'Stab Plates', slots:1, ce:0, icon:'armor',
    effect:'Armor may be applied to **Melee** attack damage in addition to Ranged attack damage.' },
  { id:'monocular', name:'Monocular', slots:1, ce:0, icon:'eye',
    effect:'**+2 to Technical rolls** to spot Concealment tokens and Traps.' },
  { id:'chrono', name:'Chrono', slots:1, ce:0, icon:'dice',
    effect:'**+1 to Initiative** rolls.' },
  { id:'spare-mag', name:'Spare Mag', slots:1, ce:0, icon:'magazine',
    effect:'The Breacher gains an **additional reload**.' },
  { id:'laser-sight', name:'Laser Sight', slots:1, ce:0, icon:'ranged',
    effect:'**+1 bonus** to the chosen weapon’s **Short Range Band**.' },
  { id:'underslung-gl', name:'Underslung Grenade Launcher', slots:2, ce:1, icon:'grenade',
    effect:'See the stats and rules for this weapon in Support Weapons. This weapon **replaces** the Unit’s Secondary weapon.' },
  { id:'floating-rail', name:'Floating Rail System', slots:1, ce:0, icon:'ranged',
    effect:'**+1 bonus** to the weapon’s **Medium Range Band**.' },
  { id:'bipod', name:'Bipod', slots:1, ce:0, icon:'ranged',
    effect:'**+1 bonus** to the chosen weapon’s **Medium and Long Range Bands** when the shooting Unit is **Prone or Bracing**.' },
  { id:'short-optic', name:'Short Range Optic', slots:1, ce:0, icon:'eye',
    effect:'**+1 Ranged Combat** bonus on the first shot a Unit makes within the weapon’s **Short Range Band** with a (SA) or (PS) each Ranged Combat Maneuver.' },
  { id:'medium-optic', name:'Medium Range Optic', slots:1, ce:0, icon:'eye',
    effect:'**+1 Ranged Combat** bonus on the first shot a Unit makes within the weapon’s **Medium Range Band** with a (SA) or (PS) Ranged Combat Maneuver.' },
  { id:'long-optic', name:'Long Range Optic', slots:1, ce:0, icon:'eye',
    effect:'**+1 Ranged Combat** bonus on the first shot a Unit makes within the weapon’s **Long Range Band** with a (SA) or (PS) Ranged Combat Maneuver.' },
  { id:'backup-piece', name:'Backup Piece', slots:1, ce:1, icon:'ranged',
    effect:'Unit adds the **Compact SMG** in addition to its other Primary weapon choices. This weapon tracks its own Low Ammo and Ammo Out tokens and ignores those of any other Primary weapon.' },
  { id:'akimbo-pistols', name:'Akimbo Pistols', slots:1, ce:0, icon:'ranged',
    effect:'The Unit fights with two Secondary weapons that become an **additional Primary weapon**, gaining Low Ammo tokens as normal. Choose either profile: **Semi-Auto Pistol** becomes (SA3) and adds +2 to each Range Band; **Revolver** adds (DEV) and +1 to each Range Band.' },
  { id:'personal-drone', name:'Personal Drone', slots:2, ce:1, icon:'eye',
    effect:'Deploy a drone (25mm base with flight stand) in contact with the Unit as a Maneuver. When the Unit takes a Movement Maneuver, the drone may also move up to 8". Spend 1 Momentum (choose 1 per activation) to: use the drone’s Line of Sight for a grenade attack (range still measured from the Unit); reduce a Unit’s Cover level by 1; or make a Technical check to reveal a Concealment token within 8" and LoS of the drone. The drone may be shot and always counts as running — the OPFOR gains 1 Momentum when it is destroyed.' },
  { id:'bullet-resistant-suit', name:'Bullet Resistant Suit With Silk Tie', slots:0, ce:-1, icon:'armor',
    effect:'May only be taken if a Unit forgoes 1 standard loadout. Grenade slots: 1. Reloads: 2. Tactical Gear: 2. **Armor: 1** in a weapon’s Short Range Band or Engaged, and **D3** at Medium and Long Range Bands.' },
  { id:'ifak', name:'IFAK', slots:2, ce:0, icon:'wounds',
    effect:'**2 uses** per Operation. As a Movement or Combat Maneuver, choose 1: make a Technical skill test and on a success heal **2D5** wounds and remove all Trauma (a failure still counts as a use); remove up to 2 instances of **Trauma**; or remove up to 2 instances of **Shaken**.' },
  { id:'civilian-med-kit', name:'Civilian Medical Kit', slots:1, ce:0, icon:'wounds',
    effect:'**2 uses** per Operation. As a Movement or Combat Maneuver, choose 1: make a Technical skill test and on a success heal **D5** wounds; or remove 1 instance of **Trauma**.' },
  { id:'guard-dog', name:'Guard Dog', slots:2, ce:1, icon:'grit',
    effect:'Place a Guard Dog model within 2" of the Breacher and keep it within 2" after any movement. The Breacher gains **+2 Melee Combat** and **+2 damage** with Fists and Kicks, and **+2 Technical** when rolling to reveal a Concealment token. When the OPFOR deals 2 or more damage to the Unit, they may remove the Guard Dog instead.' },
];

/* ============================================================
   OPFOR unit types — used by the card designer's OPFOR library.
   FOP costs, base stats and upgrade rules live here so both the
   force builder (index.html) and card designer (cards.html) share
   the same source of truth.
   ============================================================ */
const OPFOR_UNITS = [
  {
    id: 'street-thug',
    name: 'Street Thug',
    group: 'Basic',
    fopPerModel: 1,
    stats: { rc:'8', mc:'6', tech:'5', wnd:'4', arm:'0', mov:'3"' },
    formation: 'coordinated',      // 'coordinated' | 'individual' | 'both'
    modelsDefault: 4,
    modelsMin: 4, modelsMax: 8,
    upgrades: [],
    rules: ['Up to 50% of available FOP may be spent on Street Thugs.'],
    notes: 'Always Coordinated.',
  },
  {
    id: 'militia',
    name: 'Militia',
    group: 'Basic',
    fopPerModel: 2,
    stats: { rc:'9', mc:'9', tech:'8', wnd:'6', arm:'0', mov:'4"' },
    formation: 'both',
    modelsDefault: 3,
    modelsMin: 2, modelsMax: 5,
    upgrades: [
      { id:'cohesion', label:'Extended Cohesion (2"→4")', cost:1, perUnit:true,  coordOnly:true },
      { id:'support',  label:'Support Weapon (3+ models)', cost:1, perUnit:true,  coordOnly:true, minModels:3 },
    ],
    rules: [],
    notes: '',
  },
  {
    id: 'trained',
    name: 'Trained',
    group: 'Elite',
    fopPerModel: 3,
    stats: { rc:'11', mc:'10', tech:'10', wnd:'7', arm:'0', mov:'4"' },
    formation: 'both',
    modelsDefault: 2,
    modelsMin: 2, modelsMax: 4,
    upgrades: [
      { id:'armor2',    label:'+2 Armor (coord)',         cost:1, perModel:true,  coordOnly:true  },
      { id:'cohesion',  label:'Extended Cohesion (2"→4")', cost:1, perUnit:true,  coordOnly:true  },
      { id:'support',   label:'Support Weapon (1 per 2 models)', cost:1, perPair:true, coordOnly:true },
      { id:'concealed', label:'Concealed (individual)',   cost:2, perModel:true,  indOnly:true    },
    ],
    rules: [],
    notes: '',
  },
  {
    id: 'hired-gun',
    name: 'Hired Gun',
    group: 'Elite',
    fopPerModel: 6,
    stats: { rc:'12', mc:'12', tech:'12', wnd:'12', arm:'1', mov:'5"' },
    formation: 'individual',
    modelsDefault: 1,
    modelsMin: 1, modelsMax: 1,
    upgrades: [
      { id:'armor3',    label:'+1 Armor (→3)',  cost:2, perUnit:true },
      { id:'concealed', label:'Concealed',       cost:2, perUnit:true },
    ],
    rules: ['Maximum 1 Hired Gun per Breacher in the Operation. Always Individual.'],
    notes: 'Always Individual.',
  },
];

/* ============================================================
   BREACHER_CLASSES — generic class archetypes for the card
   designer's "Fill from library" picker. Stats represent a
   standard build for each role; the user edits from there.
   ============================================================ */
const BREACHER_CLASSES = [
  {
    id: 'class-assault',
    name: 'ASSAULT',
    subtitle: '',
    badge: '11',
    stats: { rc:'14', mc:'12', tech:'12', mor:'11', wnd:'20', mov:'4"', arm:'3', mag:'4', grid:'4', gren:'2' },
    bands: [
      { text:'PRIMARY WEAPON: Short or Medium Range', span:'full', tone:'dark' },
      { text:'SECONDARY WEAPON', span:'half', tone:'dark' },
      { text:'MELEE WEAPON', span:'half', tone:'dark' },
    ],
    rules: [
      'Once per turn, a (SAx) gets +1 shot max.',
      'If Stacked Mag kills a Unit, gain +2 MP.',
      'No Low Ammo from Stacked Mags.',
    ],
    footer: '',
  },
  {
    id: 'class-marksman',
    name: 'MARKSMAN',
    subtitle: '',
    badge: '',
    stats: { rc:'16', mc:'10', tech:'11', mor:'12', wnd:'20', mov:'6"', arm:'2', mag:'3', grid:'3', gren:'1' },
    bands: [
      { text:'PRIMARY WEAPON: Long Range', span:'full', tone:'dark' },
      { text:'SECONDARY WEAPON', span:'half', tone:'dark' },
      { text:'MELEE WEAPON', span:'half', tone:'dark' },
    ],
    rules: [],
    footer: '',
  },
  {
    id: 'class-heavy-assault',
    name: 'HEAVY ASSAULT',
    subtitle: '',
    badge: '',
    stats: { rc:'14', mc:'11', tech:'12', mor:'12', wnd:'20', mov:'5"', arm:'2', mag:'5', grid:'3', gren:'1' },
    bands: [
      { text:'PRIMARY WEAPON: Support', span:'full', tone:'dark' },
      { text:'SECONDARY WEAPON', span:'half', tone:'dark' },
      { text:'MELEE WEAPON', span:'half', tone:'dark' },
    ],
    rules: [],
    footer: '',
  },
  {
    id: 'class-covert',
    name: 'COVERT',
    subtitle: '',
    badge: '',
    stats: { rc:'13', mc:'13', tech:'13', mor:'9', wnd:'20', mov:'6"', arm:'2', mag:'3', grid:'3', gren:'1' },
    bands: [
      { text:'PRIMARY WEAPON: Short Range', span:'full', tone:'dark' },
      { text:'SECONDARY WEAPON', span:'half', tone:'dark' },
      { text:'MELEE WEAPON', span:'half', tone:'dark' },
    ],
    rules: [
      'May begin the Operation in Concealment.',
      'Concealment tokens may move up to 5".',
    ],
    footer: '',
  },
  {
    id: 'class-hand-to-hand',
    name: 'HAND TO HAND',
    subtitle: '',
    badge: '',
    stats: { rc:'10', mc:'15', tech:'13', mor:'10', wnd:'20', mov:'6"', arm:'2', mag:'2', grid:'2', gren:'1' },
    bands: [
      { text:'PRIMARY WEAPON: Short Range', span:'full', tone:'dark' },
      { text:'SECONDARY WEAPON', span:'half', tone:'dark' },
      { text:'MELEE WEAPON', span:'half', tone:'dark' },
    ],
    rules: [],
    footer: '',
  },
];

/* ============================================================
   BREACHER_PREMADES — named characters from the rulebook.
   abilities = full text for the paired Reference card.
   ============================================================ */
const BREACHER_PREMADES = [
  {
    id: 'mutt',
    name: 'ASSAULT',
    subtitle: 'MUTT (ASSAULT)',
    badge: '11',
    stats: { rc:'14', mc:'12', tech:'12', mor:'11', wnd:'20', mov:'5"', arm:'2', mag:'4', grid:'5', gren:'2' },
    bands: [
      { text:'Assault Rifle (Medium Rounds)', span:'full', tone:'dark' },
      { text:'Revolver', span:'half', tone:'dark' },
      { text:'Blunt Style', span:'half', tone:'dark' },
    ],
    rules: [
      '(SAX) Ranged Combat Maneuvers have a max of +1 shots.',
      'Stacked Mag OoA: gain +2 MP; no Low Ammo token.',
    ],
    footer: '',
    abilities: [
      '1. Once per turn, a (SAX) Ranged Combat Maneuver this Breacher makes has a max of +1 shots.',
      '2. When this Breacher takes an enemy unit Out of Action using the Stacked Mag Momentum Ability, gain 2 Momentum points. In addition, Stacked Mags does not give this Breacher a Low Ammo token.',
      '**Fire Superiority (cost 1 Momentum or Grit):** Add a Low Ammo token to this Unit and then the next (A) Ranged attack this Unit makes this activation gains +1D4 damage.',
      '**Courage Under Fire (cost 1 Momentum or Grit):** This Unit takes 2 damage (ignoring armor) and removes an instance of Shaken. The Unit\'s next attack this activation is +1 damage for each of its Low Ammo tokens.',
    ],
  },
  {
    id: 'oasis-1',
    name: 'MARKSMAN',
    subtitle: 'OASIS-1 (MARKSMAN)',
    badge: '',
    stats: { rc:'16', mc:'10', tech:'11', mor:'12', wnd:'20', mov:'6"', arm:'2', mag:'3', grid:'3', gren:'1' },
    bands: [
      { text:'Semi-Auto Sniper Rifle', span:'full', tone:'dark' },
      { text:'Semi-Auto Pistol', span:'half', tone:'dark' },
      { text:'Cutting Style', span:'half', tone:'dark' },
    ],
    rules: [
      '1 free Aim Maneuver per turn as part of a Movement Maneuver.',
      'Full-health OoA: gain 1 Momentum.',
    ],
    footer: '',
    abilities: [
      '1. This Breacher may take 1 free Aim Maneuver each turn as part of a Movement Maneuver.',
      '2. When this Breacher takes an enemy Unit Out of Action that started the activation at full health, gain 1 Momentum point.',
      '**Advanced Deception (cost 1 Momentum and/or Grit):** Before placing Breachers in Breach Points at the start of the Operation, choose a Breach Point and move it up to 4".',
      '**Collateral (cost 1 Momentum or Grit):** After hitting with a Ranged attack, choose 1 additional target up to 4" behind and outside the original target\'s front 180° Line of Sight and within Line of Sight of the Breacher. This Unit is also hit by the attack. Roll damage separately for each target.',
    ],
  },
  {
    id: 'kraken',
    name: 'HEAVY ASSAULT',
    subtitle: 'KRAKEN (HEAVY ASSAULT)',
    badge: '',
    stats: { rc:'14', mc:'11', tech:'12', mor:'12', wnd:'20', mov:'5"', arm:'2', mag:'5', grid:'3', gren:'1' },
    bands: [
      { text:'Light Machine Gun (PARA)', span:'full', tone:'dark' },
      { text:'Revolver', span:'half', tone:'dark' },
      { text:'Blunt Style', span:'half', tone:'dark' },
    ],
    rules: [
      'Reduce Low Ammo tokens received by 1 (min. 1).',
      'Full Auto OoA: gain 1 Momentum.',
    ],
    footer: '',
    abilities: [
      '1. This Breacher reduces the number of Low Ammo tokens they receive from Combat Maneuvers by 1 to a minimum of 1.',
      '2. When this Breacher takes an enemy Unit Out of Action using the Full Auto Combat Maneuver, gain 1 Momentum.',
      '**Dominate The A.O. (cost 1 Momentum or Grit):** If the Unit is within 2" of an objective or Breach Point, the next attack this Unit makes this activation gains the bonuses of (AP) and (DEV).',
    ],
  },
  {
    id: 'broker',
    name: 'COVERT',
    subtitle: 'BROKER (COVERT)',
    badge: '',
    stats: { rc:'13', mc:'13', tech:'13', mor:'9', wnd:'20', mov:'6"', arm:'2', mag:'3', grid:'3', gren:'1' },
    bands: [
      { text:'SMG (Light Rounds)', span:'full', tone:'dark' },
      { text:'Semi-Auto Pistol', span:'half', tone:'dark' },
      { text:'Stiletto Style', span:'half', tone:'dark' },
    ],
    rules: [
      'May begin the Operation in Concealment. Tokens move up to 5".',
      'Concealment OoA: gain 1 Momentum.',
    ],
    footer: '',
    abilities: [
      '1. This Breacher may begin the Operation in Concealment. Covert Concealment tokens may move up to 5".',
      '2. When an enemy Unit is taken Out of Action by an attack from this Breacher\'s Concealment tokens, gain 1 Momentum point.',
      '**Blend In (cost 1 Momentum and/or Grit):** Makes this activation count as Flanking. In addition, for each Civilian within 2" of this Unit, all attacks this Unit makes this Maneuver add +2 damage.',
    ],
  },
  {
    id: 'akimitsu',
    name: 'HAND TO HAND',
    subtitle: 'AKIMITSU (HAND TO HAND)',
    badge: '',
    stats: { rc:'10', mc:'15', tech:'13', mor:'10', wnd:'20', mov:'6"', arm:'2', mag:'2', grid:'2', gren:'1' },
    bands: [
      { text:'Compact SMG', span:'full', tone:'dark' },
      { text:'Revolver', span:'half', tone:'dark' },
      { text:'Melee Chopper', span:'half', tone:'dark' },
    ],
    rules: [
      '1 free Heavy Blow Maneuver per turn as part of another Combat Maneuver.',
      'Heavy Blow OoA: gain 1 Momentum.',
    ],
    footer: '',
    abilities: [
      '1. This Breacher may make 1 free Heavy Blow Maneuver each turn as part of another Combat Maneuver.',
      '2. When this Breacher takes an enemy Unit Out of Action with the Heavy Blow Combat Maneuver, gain 1 Momentum point.',
      '**Shukuchi (cost 1 Momentum or Grit):** For the rest of this activation, this Unit counts all of its Melee Combat skill attacks as Flanking.',
      '**Roll With It (cost 1 Momentum or Grit):** In response to an attack that targets this Unit, the targeted Unit counts its armor as 2 higher. May only be used once per attack that targets this Unit.',
    ],
  },
  {
    id: 'spall',
    name: 'COVERT',
    subtitle: 'SPALL (COVERT)',
    badge: '',
    stats: { rc:'13', mc:'13', tech:'13', mor:'9', wnd:'20', mov:'5"', arm:'2', mag:'4', grid:'5', gren:'2' },
    bands: [
      { text:'Assault Rifle (Heavy Rounds)', span:'full', tone:'dark' },
      { text:'Semi-Auto Pistol', span:'half', tone:'dark' },
      { text:'Cutting Style', span:'half', tone:'dark' },
    ],
    rules: [
      'May begin the Operation in Concealment. Tokens move up to 5".',
      'Concealment OoA: gain 1 Momentum.',
    ],
    footer: '',
    abilities: [
      '1. This Breacher may begin the Operation in Concealment. Covert Concealment tokens may move up to 5".',
      '2. When an enemy Unit is taken Out of Action by an attack from this Breacher\'s Concealment tokens, gain 1 Momentum point.',
      '**At The Ready (cost 1 Momentum and/or Grit):** This Unit gains a free Aim Maneuver before making a Combat Maneuver.',
    ],
  },
];

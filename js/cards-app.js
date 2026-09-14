/* ============================================================
   cards-app.js
   UI wiring for the card designer. Loaded last — depends on
   card-schema, card-icons, card-render and card-store.
   ============================================================ */

const state = {
  template: 'breacher',
  card: null,        // working card object
  img: null,         // loaded HTMLImageElement for card.art
  dirty: false,
  sheet: [],         // ids queued for the print sheet
};

const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ── Card lifecycle ─────────────────────────────────────── */

function blankCard(template) {
  const tpl = TEMPLATES[template];
  return {
    id: null,
    template,
    ...JSON.parse(JSON.stringify(tpl.defaults)),
    art: null, artX: 0.5, artY: 0.5, artZoom: 1,
  };
}

async function loadArt(dataUrl) {
  if (!dataUrl) { state.img = null; return null; }
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => { state.img = img; resolve(img); };
    img.onerror = () => { state.img = null; resolve(null); };
    img.src = dataUrl;
  });
}

function setCard(card) {
  state.card = card;
  state.template = card.template;
  $$('.tpl-btn').forEach(b => b.classList.toggle('active', b.dataset.tpl === card.template));
  buildForm();
  loadArt(card.art).then(draw);
  $('#card-title-label').textContent = card.id ? 'Editing saved card' : 'New card (unsaved)';
  updateSpecNote();
}

/* ── Form building ──────────────────────────────────────── */

function buildForm() {
  const tpl = TEMPLATES[state.template];
  const form = $('#form');
  form.innerHTML = '';
  $('#tpl-blurb').textContent = tpl.blurb;

  if (state.template === 'opfor') {
    /* OPFOR: FOP calculator (unit type quick-select + controls) replaces library search. */
    form.append(buildFopCalc());
  } else {
    const picker = buildLibraryField();
    if (picker) {
      const head = document.createElement('div');
      head.className = 'form-group-head';
      head.textContent = 'Library';
      form.append(head, picker);
    }
  }

  tpl.fields.forEach(f => {
    if (f.group) {
      const h = document.createElement('div');
      h.className = 'form-group-head';
      h.textContent = f.group;
      form.appendChild(h);
      return;
    }
    form.appendChild(buildField(f));
  });
}

function buildField(f) {
  const wrap = document.createElement('div');
  wrap.className = 'field' + (f.width ? ' w-' + f.width : '');

  const lab = document.createElement('label');
  lab.textContent = f.label;
  lab.htmlFor = 'f_' + f.key;
  wrap.appendChild(lab);

  let el;
  switch (f.type) {

    case 'bullets': {
      el = document.createElement('textarea');
      el.rows = 5;
      el.value = (state.card[f.key] || []).join('\n');
      el.addEventListener('input', () => {
        state.card[f.key] = el.value.split('\n').filter(l => l.trim() !== '');
        touch();
      });
      break;
    }

    case 'richtext': {
      el = document.createElement('textarea');
      el.rows = 6;
      el.value = state.card[f.key] || '';
      el.addEventListener('input', () => { state.card[f.key] = el.value; touch(); });
      break;
    }

    case 'pills': {
      el = document.createElement('input');
      el.type = 'text';
      el.value = (state.card[f.key] || []).join(', ');
      el.addEventListener('input', () => {
        state.card[f.key] = el.value.split(',').map(s => s.trim()).filter(Boolean);
        touch();
      });
      break;
    }

    case 'select': {
      el = document.createElement('select');
      (f.options || []).forEach(o => {
        const op = document.createElement('option');
        op.value = o.id; op.textContent = o.label;
        el.appendChild(op);
      });
      el.value = state.card[f.key] || (f.options[0] && f.options[0].id);
      el.addEventListener('change', () => { state.card[f.key] = el.value; touch(); });
      break;
    }

    case 'entries':
      wrap.className = 'field w-full';
      if (f.hint) { const h = document.createElement('p'); h.className='hint'; h.textContent=f.hint; wrap.appendChild(h); }
      wrap.appendChild(buildEntriesField(f));
      return wrap;

    case 'image':
      wrap.className = 'field w-full';
      wrap.appendChild(buildImageField(f));
      return wrap;

    case 'bands':
      wrap.className = 'field w-full';
      if (f.hint) { const h = document.createElement('p'); h.className='hint'; h.textContent=f.hint; wrap.appendChild(h); }
      wrap.appendChild(buildBandsField(f));
      return wrap;

    case 'fop-calc':
      wrap.className = 'field w-full';
      if (f.hint) { const h = document.createElement('p'); h.className='hint'; h.textContent=f.hint; wrap.appendChild(h); }
      wrap.appendChild(buildFopCalc());
      return wrap;

    default: {
      el = document.createElement('input');
      el.type = 'text';
      if (f.maxlength) el.maxLength = f.maxlength;
      el.value = state.card[f.key] ?? '';
      el.addEventListener('input', () => { state.card[f.key] = el.value; touch(); });
    }
  }

  el.id = 'f_' + f.key;
  if (f.placeholder) el.placeholder = f.placeholder;
  wrap.appendChild(el);
  if (f.hint && f.type !== 'bands') {
    const h = document.createElement('p'); h.className = 'hint'; h.textContent = f.hint;
    wrap.appendChild(h);
  }
  return wrap;
}

/* ── FOP Auto-Calculator ─────────────────────────────────────
   Renders a compact calculator inside the OPFOR form.
   Writes its result directly to state.card.badge and calls touch().

   State is stored in state.card._fop_* keys so it persists with
   the card (IndexedDB stores the whole card object).
   ──────────────────────────────────────────────────────────── */

function calcFop() {
  const unitId   = state.card._fop_unitId;
  const unit     = (typeof OPFOR_UNITS !== 'undefined') && OPFOR_UNITS.find(u => u.id === unitId);
  if (!unit) return null;

  const models   = Math.max(unit.modelsMin, Math.min(unit.modelsMax,
                     parseInt(state.card._fop_models, 10) || unit.modelsDefault));
  const isCoord  = state.card._fop_formation !== 'individual';
  const upgrades = state.card._fop_upgrades || {};

  let fop = unit.fopPerModel * models;

  unit.upgrades.forEach(up => {
    if (!upgrades[up.id]) return;
    if (up.coordOnly && !isCoord) return;
    if (up.indOnly   &&  isCoord) return;
    if (up.minModels && models < up.minModels) return;

    if (up.perUnit)  fop += up.cost;
    if (up.perModel) fop += up.cost * models;
    if (up.perPair)  fop += up.cost * Math.floor(models / 2);
  });

  return { fop, models, unit, isCoord };
}

function buildFopCalc() {
  const box = document.createElement('div');
  box.className = 'fop-calc';

  /* If no unit is set yet, show unit-type picker buttons. */
  const unitId = state.card._fop_unitId;
  const unit   = (typeof OPFOR_UNITS !== 'undefined') && OPFOR_UNITS.find(u => u.id === unitId);

  function refresh() {
    box.innerHTML = '';

    /* --- Unit type row --- */
    const typeRow = document.createElement('div');
    typeRow.className = 'fop-row fop-unit-row';
    OPFOR_UNITS.forEach(u => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fop-type-btn' + (state.card._fop_unitId === u.id ? ' active' : '');
      btn.textContent = u.name;
      btn.addEventListener('click', () => {
        const oldId = state.card._fop_unitId;
        state.card._fop_unitId = u.id;
        state.card._fop_models = String(u.modelsDefault);
        state.card._fop_formation = u.formation === 'individual' ? 'individual' : 'coordinated';
        state.card._fop_upgrades = {};
        /* If switching unit type, also prefill card stats from library. */
        if (oldId !== u.id) {
          if (u.id === 'hired-gun') { state.card._fop_hgMode = 'generic'; state.card._fop_hgPremadeId = null; }
          const lib = getLibrary('opfor');
          const entry = lib && lib.find(it => it.meta && it.meta.unitId === u.id);
          if (entry) {
            Object.keys(entry.fields).forEach(k => {
              const v = entry.fields[k];
              state.card[k] = Array.isArray(v) ? v.slice() : v;
            });
          }
        }
        applyFopCalc();
        buildForm();
      });
      typeRow.appendChild(btn);
    });
    box.appendChild(typeRow);

    const curUnit = (typeof OPFOR_UNITS !== 'undefined') &&
                    OPFOR_UNITS.find(u => u.id === state.card._fop_unitId);
    if (!curUnit) return;

    /* --- Hired Gun: Generic / Premade selector --- */
    if (state.card._fop_unitId === 'hired-gun') {
      const hgMode = state.card._fop_hgMode || 'generic';
      const hgModeRow = document.createElement('div');
      hgModeRow.className = 'fop-row';
      const modeLabel = document.createElement('label');
      modeLabel.textContent = 'Type:';
      hgModeRow.appendChild(modeLabel);
      const modeSelect = document.createElement('select');
      modeSelect.className = 'fop-hg-select';
      [['generic', 'Generic Hired Gun'], ['premade', 'Premade']].forEach(([val, txt]) => {
        const opt = document.createElement('option');
        opt.value = val; opt.textContent = txt; opt.selected = hgMode === val;
        modeSelect.appendChild(opt);
      });
      modeSelect.addEventListener('change', () => {
        state.card._fop_hgMode = modeSelect.value;
        if (modeSelect.value === 'premade') {
          if (!state.card._fop_hgPremadeId && typeof HIRED_GUN_PREMADES !== 'undefined' && HIRED_GUN_PREMADES.length)
            state.card._fop_hgPremadeId = HIRED_GUN_PREMADES[0].id;
          applyFopHGPremade();
        } else {
          state.card._fop_hgPremadeId = null;
          const hgUnit = OPFOR_UNITS.find(u => u.id === 'hired-gun');
          if (hgUnit) state.card._fop_models = String(hgUnit.modelsDefault);
          state.card._fop_upgrades = {};
          applyFopCalc();
        }
        buildForm();
      });
      hgModeRow.appendChild(modeSelect);
      if (hgMode === 'premade' && typeof HIRED_GUN_PREMADES !== 'undefined') {
        const premadeSelect = document.createElement('select');
        premadeSelect.className = 'fop-hg-select';
        HIRED_GUN_PREMADES.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name + ' (' + p.fopPerModel + ' FOP)';
          opt.selected = state.card._fop_hgPremadeId === p.id;
          premadeSelect.appendChild(opt);
        });
        premadeSelect.addEventListener('change', () => {
          state.card._fop_hgPremadeId = premadeSelect.value;
          applyFopHGPremade();
          buildForm();
        });
        hgModeRow.appendChild(premadeSelect);
      }
      box.appendChild(hgModeRow);
      if (hgMode === 'premade') {
        const premade = typeof HIRED_GUN_PREMADES !== 'undefined' &&
          HIRED_GUN_PREMADES.find(p => p.id === (state.card._fop_hgPremadeId || (HIRED_GUN_PREMADES[0] && HIRED_GUN_PREMADES[0].id)));
        if (premade) {
          const fopRow = document.createElement('div');
          fopRow.className = 'fop-row fop-total';
          fopRow.innerHTML = `<strong>FOP: ${premade.fopPerModel}</strong> <span>(Individual — ${premade.name})</span>`;
          box.appendChild(fopRow);
        }
        return;
      }
    }

    /* --- Models count --- */
    const modRow = document.createElement('div');
    modRow.className = 'fop-row';
    const modLabel = document.createElement('label');
    modLabel.textContent = 'Models:';
    modRow.appendChild(modLabel);

    for (let m = curUnit.modelsMin; m <= curUnit.modelsMax; m++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fop-num-btn' + (String(state.card._fop_models) === String(m) ? ' active' : '');
      btn.textContent = m;
      btn.addEventListener('click', () => {
        state.card._fop_models = String(m);
        applyFopCalc(); refresh();
      });
      modRow.appendChild(btn);
    }
    box.appendChild(modRow);

    /* --- Formation toggle (only for units that support both) --- */
    if (curUnit.formation === 'both') {
      const formRow = document.createElement('div');
      formRow.className = 'fop-row';
      const formLabel = document.createElement('label');
      formLabel.textContent = 'Formation:';
      formRow.appendChild(formLabel);

      ['coordinated','individual'].forEach(f => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fop-form-btn' + (state.card._fop_formation === f ? ' active' : '');
        btn.textContent = f === 'coordinated' ? 'Coordinated' : 'Individual';
        btn.addEventListener('click', () => {
          state.card._fop_formation = f;
          state.card._fop_upgrades = {};   // clear incompatible upgrades
          applyFopCalc(); refresh();
        });
        formRow.appendChild(btn);
      });
      box.appendChild(formRow);
    }

    /* --- Upgrade checkboxes --- */
    const isCoord = state.card._fop_formation !== 'individual';
    const models  = parseInt(state.card._fop_models, 10) || curUnit.modelsDefault;
    const validUps = curUnit.upgrades.filter(up => {
      if (up.coordOnly && !isCoord) return false;
      if (up.indOnly   &&  isCoord) return false;
      if (up.minModels && models < up.minModels) return false;
      return true;
    });

    if (validUps.length) {
      const upRow = document.createElement('div');
      upRow.className = 'fop-row fop-upgrades';
      const upLabel = document.createElement('label');
      upLabel.textContent = 'Upgrades:';
      upRow.appendChild(upLabel);

      validUps.forEach(up => {
        const lbl = document.createElement('label');
        lbl.className = 'fop-check';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!(state.card._fop_upgrades && state.card._fop_upgrades[up.id]);
        const costNote = up.perModel ? `(+${up.cost}/model)` : up.perPair ? `(+${up.cost}/2 models)` : `(+${up.cost})`;
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(' ' + up.label + ' ' + costNote));
        cb.addEventListener('change', () => {
          if (!state.card._fop_upgrades) state.card._fop_upgrades = {};
          state.card._fop_upgrades[up.id] = cb.checked;
          applyFopCalc(); refresh();
        });
        upRow.appendChild(lbl);
      });
      box.appendChild(upRow);
    }

    /* --- FOP total display --- */
    const result = calcFop();
    const totalRow = document.createElement('div');
    totalRow.className = 'fop-row fop-total';
    totalRow.innerHTML = result
      ? `<strong>FOP: ${result.fop}</strong> <span>(${result.models} × ${result.unit.fopPerModel}${result.fop - result.models * result.unit.fopPerModel ? ' + ' + (result.fop - result.models * result.unit.fopPerModel) + ' upgrades' : ''})</span>`
      : '<em>Select a unit type above</em>';
    box.appendChild(totalRow);
  }

  refresh();
  return box;
}

function applyFopCalc() {
  const result = calcFop();
  if (!result) return;

  const { fop, models, unit: u, isCoord } = result;
  const upgrades = state.card._fop_upgrades || {};

  state.card.badge = String(fop);
  state.card.formation = isCoord
    ? 'Coordinated: [' + models + '/' + u.modelsMax + ']'
    : 'Individual';

  /* Recompute arm stat */
  let armVal = parseInt(u.stats.arm, 10) || 0;
  if (upgrades['armor2'] && isCoord) armVal += 2;
  if (upgrades['armor3'])            armVal  = 3;
  state.card.arm = String(armVal);

  /* Rebuild rules array from calculator state */
  const newRules = [];
  newRules.push(u.fopPerModel + ' FOP Per Model');
  if (isCoord) {
    newRules.push('Cohesion: ' + (upgrades['cohesion'] ? '4"' : '2"'));
  }
  if (upgrades['support'] && isCoord) {
    const sup = u.upgrades.find(up => up.id === 'support');
    if (sup && sup.perPair) {
      const pairs = Math.floor(models / 2);
      if (pairs > 0)
        newRules.push(pairs + ' model' + (pairs !== 1 ? 's' : '') + ' equipped with Support weapon');
    } else {
      newRules.push('1 model equipped with Support weapon');
    }
  }
  if (upgrades['concealed'] && !isCoord) {
    newRules.push('Concealed');
  }
  u.rules.forEach(r => newRules.push(r));
  state.card.rules = newRules;

  /* Sync DOM inputs */
  const badgeEl = document.getElementById('f_badge');
  if (badgeEl) badgeEl.value = state.card.badge;
  const formEl = document.getElementById('f_formation');
  if (formEl) formEl.value = state.card.formation;
  const rulesEl = document.getElementById('f_rules');
  if (rulesEl) rulesEl.value = state.card.rules.join('\n');
  const armEl = document.getElementById('f_arm');
  if (armEl) armEl.value = state.card.arm;

  touch();
}

/* ── Library picker ─────────────────────────────────────────
   Breacher / Reference: grouped <select> dropdowns.
   Weapon / Gear: type-ahead search + Browse button.
   ──────────────────────────────────────────────────────────*/
function applyFopHGPremade() {
  const premadeId = state.card._fop_hgPremadeId;
  if (!premadeId || typeof HIRED_GUN_PREMADES === 'undefined') return;
  const p = HIRED_GUN_PREMADES.find(hg => hg.id === premadeId);
  if (!p) return;

  state.card.badge     = String(p.fopPerModel);
  state.card.name      = p.name;
  state.card.formation = p.formation;
  state.card.rc        = p.stats.rc;
  state.card.mc        = p.stats.mc;
  state.card.arm       = p.stats.arm;
  state.card.mov       = p.stats.mov;
  state.card.wnd       = p.stats.wnd;
  state.card.tech      = p.stats.tech;
  state.card.rules     = [p.fopPerModel + ' FOP Per Model', ...p.rules];
  if (p.bands) state.card.bands = p.bands.map(b => ({ ...b }));
  touch();
}

function buildLibraryField() {
  const lib = getLibrary(state.template);
  if (!lib) return null;

  /* ── Breacher: two dropdowns (Generic Classes | Premade Breachers) ── */
  if (state.template === 'breacher') {
    return buildLibraryDropdowns([
      { label: 'Generic',  items: lib.filter(i => i.group === 'Generic Classes') },
      { label: 'Premade',  items: lib.filter(i => i.group === 'Premade Breachers') },
    ]);
  }

  /* ── Reference: one dropdown (Premade Breachers) ── */
  if (state.template === 'reference') {
    return buildLibraryDropdowns([
      { label: 'Premade Breachers', items: lib },
    ]);
  }

  /* ── Hired Gun: two dropdowns (Generic | Premade) ── */
  if (state.template === 'hired-gun') {
    return buildLibraryDropdowns([
      { label: 'Generic',  items: lib.filter(i => i.group === 'Generic') },
      { label: 'Premade',  items: lib.filter(i => i.group === 'Premade') },
    ]);
  }

  /* ── Weapon / Gear: type-ahead search + Browse button ── */
  const box = document.createElement('div');
  box.className = 'library-field';

  const row = document.createElement('div');
  row.className = 'library-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'library-search';
  input.placeholder = `Start typing to search ${lib.length} entries…`;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');

  const browse = document.createElement('button');
  browse.type = 'button'; browse.className = 'mini-btn';
  browse.textContent = 'Browse library';
  browse.addEventListener('click', () => openLibraryBrowser());

  row.append(input, browse);

  const menu = document.createElement('div');
  menu.className = 'ac-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;

  let matches = [], active = -1;

  const close = () => {
    menu.hidden = true; active = -1;
    input.setAttribute('aria-expanded', 'false');
  };

  const render = () => {
    menu.innerHTML = '';
    if (!matches.length) {
      menu.innerHTML = '<div class="ac-empty">No match</div>';
      menu.hidden = false;
      return;
    }
    matches.slice(0, 12).forEach((item, i) => {
      const opt = document.createElement('div');
      opt.className = 'ac-item' + (i === active ? ' active' : '');
      opt.setAttribute('role', 'option');
      opt.innerHTML =
        `<span class="ac-label">${escapeHtml(item.label)}</span>` +
        (item.sublabel ? `<span class="ac-sub">${escapeHtml(item.sublabel)}</span>` : '') +
        `<span class="ac-group">${escapeHtml(item.group)}</span>`;
      opt.addEventListener('mousedown', e => {   // mousedown beats blur
        e.preventDefault();
        applyLibraryItem(item);
        input.value = '';
        close();
      });
      menu.appendChild(opt);
    });
    menu.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) { close(); return; }
    matches = searchLibrary(state.template, q);
    active = matches.length ? 0 : -1;
    render();
  });

  input.addEventListener('keydown', e => {
    if (menu.hidden) {
      if (e.key === 'ArrowDown') { matches = searchLibrary(state.template, input.value); active = 0; render(); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown')      { active = Math.min(active + 1, Math.min(matches.length, 12) - 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp')   { active = Math.max(active - 1, 0); render(); e.preventDefault(); }
    else if (e.key === 'Enter')     {
      if (matches[active]) { applyLibraryItem(matches[active]); input.value = ''; close(); }
      e.preventDefault();
    }
    else if (e.key === 'Escape')    { close(); }
  });

  input.addEventListener('blur', () => setTimeout(close, 120));

  box.append(row, menu);
  return box;
}

/* Build a row of <select> dropdowns, one per group. Each selection
   immediately calls applyLibraryItem(), which rebuilds the whole form
   so there is no stale selected value to reset. */
function buildLibraryDropdowns(groups) {
  const wrap = document.createElement('div');
  wrap.className = 'library-dropdowns';

  const row = document.createElement('div');
  row.className = 'library-dropdown-row';
  row.style.gridTemplateColumns = groups.map(() => '1fr').join(' ');

  groups.forEach(({ label, items }) => {
    const col = document.createElement('div');
    col.className = 'library-dropdown-col';

    const lbl = document.createElement('label');
    lbl.className = 'library-dropdown-label';
    lbl.textContent = label;

    const sel = document.createElement('select');
    sel.className = 'library-select';

    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = '— Select —';
    ph.disabled = true;
    ph.selected = true;
    sel.appendChild(ph);

    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.label;
      opt.textContent = item.label;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', () => {
      const found = items.find(i => i.label === sel.value);
      if (found) applyLibraryItem(found);
      // applyLibraryItem → buildForm() recreates this select, so no reset needed
    });

    col.append(lbl, sel);
    row.appendChild(col);
  });

  wrap.appendChild(row);
  return wrap;
}

/* Copy a library entry's fields onto the working card and rebuild
   the form so every input shows the new value. Artwork and the
   card's identity are preserved — only data fields are replaced. */
function applyLibraryItem(item) {
  Object.keys(item.fields).forEach(k => {
    const v = item.fields[k];
    state.card[k] = Array.isArray(v) ? v.slice() : v;
  });
  /* For OPFOR library entries, seed the FOP calculator with the unit's metadata. */
  if (item.meta && item.meta.unitId) {
    state.card._fop_unitId    = item.meta.unitId;
    state.card._fop_models    = String(item.meta.modelsDefault);
    state.card._fop_formation = item.meta.formation === 'individual' ? 'individual' : 'coordinated';
    state.card._fop_upgrades  = {};
    applyFopCalc();
  }
  buildForm();
  touch();
  flash(`Filled from library: ${item.label}`);
}

function openLibraryBrowser() {
  const lib = getLibrary(state.template);
  if (!lib) return;

  const host = $('#browse-list');
  const title = $('#browse-title');
  title.textContent = LIBRARIES[state.template].title;
  host.innerHTML = '';

  const filter = $('#browse-filter');
  filter.value = '';

  const paint = (items) => {
    host.innerHTML = '';
    if (!items.length) { host.innerHTML = '<p class="empty">No match.</p>'; return; }
    const groups = {};
    items.forEach(it => (groups[it.group] = groups[it.group] || []).push(it));
    Object.keys(groups).forEach(g => {
      const h = document.createElement('div');
      h.className = 'browse-group';
      h.textContent = g;
      host.appendChild(h);
      groups[g].forEach(it => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'browse-item';
        b.innerHTML =
          `<strong>${escapeHtml(it.label)}</strong>` +
          (it.sublabel ? `<em>${escapeHtml(it.sublabel)}</em>` : '');
        b.addEventListener('click', () => {
          applyLibraryItem(it);
          $('#browse-view').classList.remove('open');
        });
        host.appendChild(b);
      });
    });
  };

  filter.oninput = () => paint(searchLibrary(state.template, filter.value));
  paint(lib);
  $('#browse-view').classList.add('open');
  setTimeout(() => filter.focus(), 50);
}

function buildEntriesField(f) {
  const box = document.createElement('div');
  box.className = 'entries-field';

  function render() {
    box.innerHTML = '';
    const list = state.card[f.key] || (state.card[f.key] = []);
    list.forEach((text, i) => {
      const row = document.createElement('div');
      row.className = 'entry-row';

      const ta = document.createElement('textarea');
      ta.rows = 3;
      ta.value = text;
      ta.placeholder = '**Ability Name (cost 1 Momentum or Grit):** what it does.';
      ta.addEventListener('input', () => { list[i] = ta.value; touch(); });

      const acts = document.createElement('div');
      acts.className = 'entry-acts';
      const up = document.createElement('button');
      up.type='button'; up.className='mini-btn'; up.textContent='↑'; up.title='Move up';
      up.addEventListener('click', () => {
        if (i === 0) return;
        [list[i-1], list[i]] = [list[i], list[i-1]];
        render(); touch();
      });
      const rm = document.createElement('button');
      rm.type='button'; rm.className='mini-btn danger'; rm.textContent='×'; rm.title='Remove';
      rm.addEventListener('click', () => { list.splice(i, 1); render(); touch(); });
      acts.append(up, rm);

      row.append(ta, acts);
      box.appendChild(row);
    });

    const add = document.createElement('button');
    add.type='button'; add.className='mini-btn add';
    add.textContent = '+ Add ability';
    add.addEventListener('click', () => { list.push(''); render(); touch(); });
    box.appendChild(add);
  }

  render();
  return box;
}

function buildImageField(f) {
  const box = document.createElement('div');
  box.className = 'art-field';

  const drop = document.createElement('div');
  drop.className = 'dropzone';
  drop.innerHTML = '<strong>Drop artwork here</strong><span>or click to choose a PNG / JPG</span>';

  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.hidden = true;

  const read = file => {
    if (!file || !file.type.startsWith('image/')) return;
    const fr = new FileReader();
    fr.onload = async () => {
      state.card.art = fr.result;
      await loadArt(fr.result);
      renderThumb();
      touch();
    };
    fr.readAsDataURL(file);
  };

  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => read(input.files[0]));
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.add('over');
  }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.remove('over');
  }));
  drop.addEventListener('drop', e => read(e.dataTransfer.files[0]));

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'art-thumb-wrap';

  function renderThumb() {
    thumbWrap.innerHTML = '';
    if (!state.card.art) { drop.style.display = ''; return; }
    drop.style.display = 'none';
    const im = document.createElement('img');
    im.src = state.card.art; im.className = 'art-thumb';
    const bar = document.createElement('div');
    bar.className = 'art-controls';

    const mkSlider = (key, label, min, max, step) => {
      const w = document.createElement('label');
      w.className = 'slider';
      w.innerHTML = `<span>${label}</span>`;
      const s = document.createElement('input');
      s.type = 'range'; s.min = min; s.max = max; s.step = step;
      s.value = state.card[key] ?? (key === 'artZoom' ? 1 : 0.5);
      s.addEventListener('input', () => { state.card[key] = parseFloat(s.value); draw(); state.dirty = true; });
      w.appendChild(s);
      return w;
    };
    bar.appendChild(mkSlider('artX', 'Pan X', 0, 1, 0.01));
    bar.appendChild(mkSlider('artY', 'Pan Y', 0, 1, 0.01));
    bar.appendChild(mkSlider('artZoom', 'Zoom', 1, 2.5, 0.01));

    const btnRow = document.createElement('div');
    btnRow.className = 'art-btn-row';

    const reset = document.createElement('button');
    reset.type = 'button'; reset.className = 'mini-btn'; reset.textContent = 'Reset position';
    reset.addEventListener('click', () => {
      state.card.artX = 0.5; state.card.artY = 0.5; state.card.artZoom = 1;
      renderThumb(); draw(); state.dirty = true;
    });

    const rm = document.createElement('button');
    rm.type = 'button'; rm.className = 'mini-btn danger'; rm.textContent = 'Remove art';
    rm.addEventListener('click', () => {
      state.card.art = null; state.img = null; renderThumb(); touch();
    });

    btnRow.append(reset, rm);
    thumbWrap.append(im, bar, btnRow);
  }

  box.append(drop, input, thumbWrap);
  renderThumb();
  return box;
}

function buildBandsField(f) {
  const box = document.createElement('div');
  box.className = 'bands-field';

  function render() {
    box.innerHTML = '';
    (state.card.bands || []).forEach((b, i) => {
      const row = document.createElement('div');
      row.className = 'band-row';

      const t = document.createElement('input');
      t.type = 'text'; t.value = b.text || '';
      t.placeholder = 'PRIMARY WEAPON: Short or Medium Range';
      t.addEventListener('input', () => { b.text = t.value; touch(); });

      const sp = document.createElement('select');
      [['half','Half width'],['full','Full width']].forEach(([v, l]) => {
        const o = document.createElement('option'); o.value = v; o.textContent = l; sp.appendChild(o);
      });
      sp.value = b.span || 'half';
      sp.addEventListener('change', () => { b.span = sp.value; touch(); });

      const up = document.createElement('button');
      up.type='button'; up.className='mini-btn'; up.textContent='↑'; up.title='Move up';
      up.addEventListener('click', () => {
        if (i === 0) return;
        const a = state.card.bands;
        [a[i-1], a[i]] = [a[i], a[i-1]];
        render(); touch();
      });

      const rm = document.createElement('button');
      rm.type='button'; rm.className='mini-btn danger'; rm.textContent='×'; rm.title='Remove';
      rm.addEventListener('click', () => {
        state.card.bands.splice(i, 1); render(); touch();
      });

      row.append(t, sp, up, rm);
      box.appendChild(row);
    });

    const add = document.createElement('button');
    add.type = 'button'; add.className = 'mini-btn add';
    add.textContent = '+ Add band';
    add.addEventListener('click', () => {
      state.card.bands = state.card.bands || [];
      state.card.bands.push({ text: '', span: 'half', tone: 'dark' });
      render(); touch();
    });
    box.appendChild(add);
  }

  render();
  return box;
}

/* ── Preview ────────────────────────────────────────────── */

let drawQueued = false;
function draw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    const c = $('#preview');
    renderCard(c, state.card, state.img, {
      bleed: $('#opt-bleed').checked,
      cropMarks: $('#opt-bleed').checked && $('#opt-marks').checked,
    });
  });
}

function touch() { state.dirty = true; draw(); }

/* The two card sizes print differently, so the spec line under the
   preview always states the one in play. */
function updateSpecNote() {
  const sizeKey = (TEMPLATES[state.template] || {}).size || 'poker';
  const s = LAYOUT.SIZES[sizeKey];
  const note = sizeKey === 'poker'
    ? `Poker 2.5&Prime; &times; 3.5&Prime; &middot; 9 per sheet`
    : `Mini American 41 &times; 63&nbsp;mm &middot; 16 per sheet`;
  $('#spec-note').innerHTML = `${note} &middot; 300&nbsp;DPI &middot; ${s.W} &times; ${s.H}&nbsp;px`;
}

/* ── Library ────────────────────────────────────────────── */

async function refreshLibrary() {
  const filter = $('#lib-filter').value;
  const cards = await listCards(filter === 'all' ? null : filter);
  const list = $('#library');
  list.innerHTML = '';

  if (!cards.length) {
    list.innerHTML = '<p class="empty">No saved cards yet. Build one and hit Save.</p>';
    $('#sheet-count').textContent = state.sheet.length;
    return;
  }

  cards.forEach(c => {
    const row = document.createElement('div');
    row.className = 'lib-row';

    const thumb = document.createElement('canvas');
    thumb.className = 'lib-thumb';
    thumb.width = 100; thumb.height = 140;

    const meta = document.createElement('div');
    meta.className = 'lib-meta';
    meta.innerHTML = `<strong>${escapeHtml(c.name || 'Untitled')}</strong>
                      <span class="tag tag-${c.template}">${TEMPLATES[c.template].label}</span>
                      <em>${new Date(c.updatedAt).toLocaleDateString()}</em>`;

    const acts = document.createElement('div');
    acts.className = 'lib-acts';
    acts.append(
      mkBtn('Edit',  () => openCard(c.id)),
      mkBtn('Copy',  async () => {
        const dup = { ...c, id: null, name: (c.name || '') + ' copy' };
        await saveCard({ ...dup, id: newId() });
        refreshLibrary();
      }),
      mkBtn(state.sheet.includes(c.id) ? 'On sheet ✓' : 'To sheet', () => {
        const i = state.sheet.indexOf(c.id);
        if (i >= 0) state.sheet.splice(i, 1); else state.sheet.push(c.id);
        refreshLibrary();
      }, state.sheet.includes(c.id) ? 'on' : ''),
      mkBtn('Delete', async () => { await trashCard(c.id); refreshLibrary(); }, 'danger'),
    );

    row.append(thumb, meta, acts);
    list.appendChild(row);

    /* Thumbnails render off the same renderer, downscaled. */
    renderThumbnail(thumb, c);
  });

  $('#sheet-count').textContent = state.sheet.length;
}

function mkBtn(label, fn, cls = '') {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'mini-btn ' + cls; b.textContent = label;
  b.addEventListener('click', fn);
  return b;
}

const _thumbCanvas = document.createElement('canvas');
async function renderThumbnail(target, card) {
  let img = null;
  if (card.art) img = await new Promise(r => {
    const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = card.art;
  });
  renderCard(_thumbCanvas, card, img, {});
  const ctx = target.getContext('2d');
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(_thumbCanvas, 0, 0, target.width, target.height);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

async function openCard(id) {
  const c = await getCard(id);
  if (c) setCard(c);
  $('#my-cards-view').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Actions ────────────────────────────────────────────── */

async function doSave() {
  const rec = await saveCard(state.card);
  state.card.id = rec.id;
  state.dirty = false;
  $('#card-title-label').textContent = 'Saved';
  refreshLibrary();
  flash('Card saved');
}

function doExportPNG() {
  const c = document.createElement('canvas');
  renderCard(c, state.card, state.img, {
    bleed: $('#opt-bleed').checked,
    cropMarks: $('#opt-bleed').checked && $('#opt-marks').checked,
  });
  const name = (state.card.name || 'card').replace(/[^\w\-]+/g, '_').toLowerCase();
  c.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `breacher_${state.card.template}_${name}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

function flash(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(flash._t);
  flash._t = setTimeout(() => el.classList.remove('show'), 1800);
}

/* ── Print sheet ────────────────────────────────────────── */

async function buildPrintSheet() {
  const ids = state.sheet.length ? state.sheet : (await listCards()).map(c => c.id);
  if (!ids.length) { flash('Nothing queued for the sheet'); return; }

  /* Cards of different physical sizes cannot share a page, so the
     sheet is split by size: poker prints 3x3, mini prints 4x4. */
  const bySize = { poker: [], mini: [] };
  for (const id of ids) {
    const card = await getCard(id);
    if (!card) continue;
    const key = (TEMPLATES[card.template] || {}).size || 'poker';
    bySize[key].push(card);
  }

  const host = $('#sheet-pages');
  host.innerHTML = '';

  for (const sizeKey of ['poker', 'mini']) {
    const cards = bySize[sizeKey];
    if (!cards.length) continue;
    const perPage = sizeKey === 'poker' ? 9 : 16;

    for (let p = 0; p < Math.ceil(cards.length / perPage); p++) {
      const page = document.createElement('div');
      page.className = 'sheet-page size-' + sizeKey;
      for (const card of cards.slice(p * perPage, (p + 1) * perPage)) {
        let img = null;
        if (card.art) img = await new Promise(r => {
          const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = card.art;
        });
        const cv = document.createElement('canvas');
        cv.className = 'sheet-card';
        renderCard(cv, card, img, { bleed: false });
        page.appendChild(cv);
      }
      host.appendChild(page);
    }
  }
  $('#sheet-view').classList.add('open');
}

/* ── Boot ───────────────────────────────────────────────── */

async function boot() {
  await Promise.all([document.fonts.ready, iconsReady]);
  await purgeExpiredTrash().catch(() => {});

  $$('.tpl-btn').forEach(b => b.addEventListener('click', () => {
    if (state.dirty && !confirm('Discard unsaved changes to this card?')) return;
    setCard(blankCard(b.dataset.tpl));
  }));

  $('#btn-new').addEventListener('click', () => {
    if (state.dirty && !confirm('Discard unsaved changes to this card?')) return;
    setCard(blankCard(state.template));
  });
  $('#btn-save').addEventListener('click', doSave);
  $('#btn-my-cards').addEventListener('click', () => {
    refreshLibrary();
    $('#my-cards-view').classList.add('open');
  });
  $('#btn-my-cards-close').addEventListener('click', () => $('#my-cards-view').classList.remove('open'));
  $('#btn-png').addEventListener('click', doExportPNG);
  $('#btn-sheet').addEventListener('click', buildPrintSheet);
  $('#btn-sheet-close').addEventListener('click', () => $('#sheet-view').classList.remove('open'));
  $('#btn-sheet-print').addEventListener('click', () => window.print());
  $('#btn-clear-sheet').addEventListener('click', () => { state.sheet = []; refreshLibrary(); });

  $('#opt-bleed').addEventListener('change', draw);
  $('#opt-marks').addEventListener('change', draw);
  $('#lib-filter').addEventListener('change', refreshLibrary);

  $('#btn-export').addEventListener('click', async () => {
    const data = await exportBackup();
    downloadJSON(data, `breacher-cards-backup-${new Date().toISOString().slice(0,10)}.json`);
    flash(`Exported ${data.cards.length} card(s)`);
  });
  $('#import-input').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const report = await importBackup(JSON.parse(await f.text()));
      flash(`Imported: ${report.added} new, ${report.updated} updated, ${report.skipped} skipped`);
      refreshLibrary();
    } catch (err) { alert(err.message); }
    e.target.value = '';
  });
  $('#btn-import').addEventListener('click', () => $('#import-input').click());

  $('#btn-browse-close').addEventListener('click', () => $('#browse-view').classList.remove('open'));
  $('#btn-trash').addEventListener('click', showTrash);
  $('#btn-trash-close').addEventListener('click', () => $('#trash-view').classList.remove('open'));

  window.addEventListener('beforeunload', e => {
    if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  setCard(blankCard('breacher'));
  refreshLibrary();
}

async function showTrash() {
  const items = await listTrash();
  const host = $('#trash-list');
  host.innerHTML = items.length ? '' :
    `<p class="empty">Recently Deleted is empty. Cards stay here for ${TRASH_DAYS} days.</p>`;
  items.forEach(c => {
    const row = document.createElement('div');
    row.className = 'lib-row';
    const days = TRASH_DAYS - Math.floor((Date.now() - c.deletedAt) / 86400000);
    row.innerHTML = `<div class="lib-meta"><strong>${escapeHtml(c.name || 'Untitled')}</strong>
      <span class="tag tag-${c.template}">${TEMPLATES[c.template].label}</span>
      <em>${days} day(s) left</em></div>`;
    const acts = document.createElement('div');
    acts.className = 'lib-acts';
    acts.append(
      mkBtn('Restore', async () => { await restoreCard(c.id); showTrash(); refreshLibrary(); }),
      mkBtn('Delete forever', async () => {
        if (confirm('Permanently delete this card? This cannot be undone.')) {
          await destroyCard(c.id); showTrash();
        }
      }, 'danger'),
    );
    row.appendChild(acts);
    host.appendChild(row);
  });
  $('#trash-view').classList.add('open');
}

document.addEventListener('DOMContentLoaded', boot);

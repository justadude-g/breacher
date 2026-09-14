/* ============================================================
   card-store.js
   IndexedDB persistence, backup export/import, and a
   Recently Deleted bin with a real retention window.

   Deliberately the only file that knows the storage shape.
   Everything else talks to it through these functions.
   ============================================================ */

const DB_NAME    = 'breacher-cards';
const DB_VERSION = 1;
const STORE      = 'cards';
const TRASH_DAYS = 30;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('template', 'template', { unique: false });
        os.createIndex('deletedAt', 'deletedAt', { unique: false });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror   = () => reject(req.error);
  });
}

function tx(mode) {
  return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE));
}

function newId() {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

async function saveCard(card) {
  const store = await tx('readwrite');
  const rec = {
    ...card,
    id: card.id || newId(),
    updatedAt: Date.now(),
    createdAt: card.createdAt || Date.now(),
    deletedAt: card.deletedAt || null,
  };
  return new Promise((resolve, reject) => {
    const r = store.put(rec);
    r.onsuccess = () => resolve(rec);
    r.onerror   = () => reject(r.error);
  });
}

async function getCard(id) {
  const store = await tx('readonly');
  return new Promise((resolve, reject) => {
    const r = store.get(id);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror   = () => reject(r.error);
  });
}

async function allCards() {
  const store = await tx('readonly');
  return new Promise((resolve, reject) => {
    const r = store.getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror   = () => reject(r.error);
  });
}

async function listCards(template) {
  const all = await allCards();
  return all
    .filter(c => !c.deletedAt)
    .filter(c => !template || c.template === template)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

async function listTrash() {
  const all = await allCards();
  return all.filter(c => c.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt);
}

/* Soft delete — recoverable for TRASH_DAYS. */
async function trashCard(id) {
  const c = await getCard(id);
  if (!c) return null;
  c.deletedAt = Date.now();
  return saveCard(c);
}

async function restoreCard(id) {
  const c = await getCard(id);
  if (!c) return null;
  c.deletedAt = null;
  return saveCard(c);
}

async function destroyCard(id) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const r = store.delete(id);
    r.onsuccess = () => resolve(true);
    r.onerror   = () => reject(r.error);
  });
}

/* Run on boot: hard-delete anything past the retention window. */
async function purgeExpiredTrash() {
  const cutoff = Date.now() - TRASH_DAYS * 86400000;
  const items = await listTrash();
  const expired = items.filter(c => c.deletedAt < cutoff);
  for (const c of expired) await destroyCard(c.id);
  return expired.length;
}

/* ── Backup ────────────────────────────────────────────────
   One JSON file holds every card, artwork included (art is a
   data URL, so a backup is genuinely self-contained).
   ──────────────────────────────────────────────────────────*/
async function exportBackup() {
  const cards = await allCards();
  return {
    format: 'breacher-cards',
    version: 1,
    exportedAt: new Date().toISOString(),
    cards,
  };
}

/* De-duplicates by id: an existing card is only overwritten when
   the incoming copy is newer. Returns a small report. */
async function importBackup(payload) {
  if (!payload || payload.format !== 'breacher-cards' || !Array.isArray(payload.cards)) {
    throw new Error('Not a Breacher card backup file.');
  }
  const existing = new Map((await allCards()).map(c => [c.id, c]));
  let added = 0, updated = 0, skipped = 0;
  for (const c of payload.cards) {
    if (!c || !c.id || !c.template) { skipped++; continue; }
    const prev = existing.get(c.id);
    if (!prev)                                   { await saveCard(c); added++; }
    else if ((c.updatedAt || 0) > (prev.updatedAt || 0)) { await saveCard(c); updated++; }
    else                                         { skipped++; }
  }
  return { added, updated, skipped };
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

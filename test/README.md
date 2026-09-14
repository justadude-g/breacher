# Tests

Playwright regression suite. One file per fix or feature; the top comment in
each file says **what regression it exists to catch**, not just what it checks.

Run the whole suite before every commit.

```bash
npm install playwright          # once
npx playwright install chromium # once
node test/verify1.js
```

## Conventions

- **Never hardcode a layout number in a test.** Read it live from `LAYOUT`
  via `page.evaluate(() => LAYOUT.CARD_W)`. A test that copy-pastes a
  coordinate breaks on every layout tweak — or worse, keeps "passing" while
  sampling a stale pixel that happens to satisfy the assertion.
- For pixel checks, sample actual canvas pixels against live-read constants
  rather than diffing screenshots. It tells you *why* something is wrong.
- One-off visual checks during development go in `test/_*.js` and get deleted
  once the change is confirmed. They are throwaway and must not accumulate.

## Files

| File | Guards against |
|------|----------------|
| `verify1.js` | Templates failing to render; stat columns drifting out of vertical alignment between Breacher (5 stats) and OPFOR (3 stats); bleed maths; artwork not compositing. |

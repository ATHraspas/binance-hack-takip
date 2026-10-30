// Sayfayı başsız tarayıcıda açar, tüm cüzdanlar yüklenince durumu snapshot.json'a yazar.
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const url = process.env.PAGE_URL || 'http://127.0.0.1:8000/index.html';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto(url);
const t0 = Date.now();
let st;
while (Date.now() - t0 < 240000) {
  await page.waitForTimeout(3000);
  st = await page.evaluate(() => window.__bhDone && window.__bhDone());
  if (st && st.done === st.total && st.busy === 0 && st.errs === 0 && st.drainPending === 0 && st.frz !== null && st.tfrz && Date.now() - t0 > 20000) break;
}
console.log('state', JSON.stringify(st), Math.round((Date.now() - t0) / 1000) + 's');
if (!st || st.done < st.total * 0.9) { console.log('incomplete, skip'); process.exit(1); }
const added = await page.evaluate(() => window.__bhHistory().catch(e => 'err ' + e));
console.log('history added', added);
await page.waitForTimeout(3000);
const d = await page.evaluate(() => window.__bhDump());
writeFileSync('snapshot.json', JSON.stringify(d));
console.log('wallets', d.wallets.length, 'events', d.events.length, 'bytes', JSON.stringify(d).length);
await browser.close();

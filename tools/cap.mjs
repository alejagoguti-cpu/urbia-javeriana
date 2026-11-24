import { createRequire } from 'module';
const require = createRequire('C:/Users/aleja/Documents/BACOHLF/package.json');
const puppeteer = require('puppeteer-core');
const out = process.argv[2]; const pasos = (process.argv[3] || '0').split(',').map(Number);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900'], userDataDir: out + '/prof' });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 900 });
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('CONSOLE', m.type(), m.text().slice(0, 200)); });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message.slice(0, 300)));
await p.goto('http://localhost:4318/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 4500));
await p.screenshot({ path: out + '/s00.png' });
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Iniciar presentación'))?.click());
let n = 0;
for (const k of pasos) {
  for (let i = 0; i < k; i++) { await p.keyboard.press('ArrowRight'); await new Promise((r) => setTimeout(r, 900)); }
  await new Promise((r) => setTimeout(r, 4000));
  await p.screenshot({ path: `${out}/s${String(++n).padStart(2, '0')}.png` });
}
await b.close();

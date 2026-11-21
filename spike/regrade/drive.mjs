// Drive Chrome over the DevTools protocol: open a URL, evaluate expressions, take screenshots.
// No dependencies (Node's WebSocket). Usage:
//   node drive.mjs <url> <out-dir> [--headed] [--gl=swiftshader|gpu] -- <step> ...
// A step is `wait:<ms>`, `eval:<js expression>` (printed as JSON), or `shot:<name>`.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const argv = process.argv.slice(2);
const cut = argv.indexOf('--');
const [url, out, ...flags] = argv.slice(0, cut);
const steps = argv.slice(cut + 1);
mkdirSync(out, { recursive: true });

const gl = (flags.find((f) => f.startsWith('--gl=')) || '--gl=gpu').slice(5);
const args = [
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'spike-chrome-'))}`,
  '--remote-debugging-port=0',
  '--no-first-run',
  '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required',
  '--window-size=1600,1000',
  ...(flags.includes('--headed') ? [] : ['--headless=new']),
  ...(gl === 'swiftshader'
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']),
  'about:blank',
];
const chrome = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((ok, no) => {
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = /DevTools listening on (ws:\S+)/.exec(buf);
    if (m) ok(m[1]);
  });
  setTimeout(() => no(new Error('chrome did not start')), 15000);
});

const port = new URL(wsUrl).port;
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(
  targets.find((t) => t.type === 'page').webSocketDebuggerUrl
);
await new Promise((ok) => (ws.onopen = ok));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.method) onEvent(msg);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
const send = (method, params = {}) =>
  new Promise((ok) => {
    const i = ++id;
    pending.set(i, ok);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

const errors = [];
const onEvent = (msg) => {
  if (msg.method === 'Runtime.exceptionThrown')
    errors.push(
      msg.params.exceptionDetails.exception?.description ||
        msg.params.exceptionDetails.text
    );
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error')
    errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
};
await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url });
const log = [];
for (const s of steps) {
  const [kind, ...rest] = s.split(':');
  const arg = rest.join(':');
  if (kind === 'wait') await new Promise((ok) => setTimeout(ok, Number(arg)));
  else if (kind === 'eval') {
    const r = await send('Runtime.evaluate', {
      expression: arg,
      awaitPromise: true,
      returnByValue: true,
    });
    const v = r.result?.exceptionDetails
      ? { error: r.result.exceptionDetails.exception?.description }
      : r.result?.result?.value;
    log.push({ eval: arg.slice(0, 60), value: v });
    console.log(JSON.stringify({ eval: arg.slice(0, 60), value: v }));
  } else if (kind === 'file') {
    // file:<css selector>|<absolute path>  — what a user does with the file picker
    const [sel, path] = arg.split('|');
    const doc = await send('DOM.getDocument');
    const q = await send('DOM.querySelector', {
      nodeId: doc.result.root.nodeId,
      selector: sel,
    });
    await send('DOM.setFileInputFiles', {
      nodeId: q.result.nodeId,
      files: [path],
    });
  } else if (kind === 'drag') {
    // drag:<js expression returning [x1, y1, x2, y2] in page pixels>  — a real mouse drag
    const r = await send('Runtime.evaluate', {
      expression: arg,
      returnByValue: true,
    });
    const [x1, y1, x2, y2] = r.result.result.value;
    const mouse = (type, x, y, buttons) =>
      send('Input.dispatchMouseEvent', {
        type,
        x,
        y,
        button: 'left',
        buttons,
        clickCount: 1,
      });
    await mouse('mouseMoved', x1, y1, 0);
    await mouse('mousePressed', x1, y1, 1);
    for (let i = 1; i <= 20; i++) {
      await mouse(
        'mouseMoved',
        x1 + ((x2 - x1) * i) / 20,
        y1 + ((y2 - y1) * i) / 20,
        1
      );
      await new Promise((ok) => setTimeout(ok, 16));
    }
    await mouse('mouseReleased', x2, y2, 0);
  } else if (kind === 'errors') {
    console.log(JSON.stringify({ errors }));
  } else if (kind === 'shot') {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(
      join(out, `${arg}.png`),
      Buffer.from(r.result.data, 'base64')
    );
  } else throw new Error(`unknown step ${s}`);
}
writeFileSync(join(out, 'log.json'), JSON.stringify(log, null, 2));
ws.close();
chrome.kill();

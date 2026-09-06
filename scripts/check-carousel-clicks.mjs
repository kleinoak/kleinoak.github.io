// Prove the hero carousel's controls can actually be CLICKED — not merely that
// they are present, styled and unobstructed on screen.
//
// This exists because of a bug that shipped. The dots' wrapper is `inset-x-0`,
// a transparent strip across the full width of the carousel, painted after the
// arrows: it swallowed every click on them, on every screen size, while looking
// completely correct in a screenshot. Type checking, lint, the build and a
// rectangle-overlap audit were all green.
//
// The trap that let it through is `element.click()`. That dispatches straight
// at the node and bypasses hit-testing entirely, so it works perfectly on a
// button buried under an overlay. Everything here goes through
// `Input.dispatchMouseEvent` at the control's measured centre instead, which is
// what a real mouse does, and asserts the live region's announcement changed.
//
// Usage — needs a headless Chrome with a debugger on 9333 and the site served:
//
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --remote-debugging-port=9333 \
//     --user-data-dir=/tmp/ko-chrome about:blank &
//   npm run dev
//   node scripts/check-carousel-clicks.mjs http://localhost:3000/ 1280 900
//
// Exits non-zero if any control does not respond, so it can gate a deploy.
// Nothing runs it automatically yet.
const [, , url, width, height] = process.argv;
const targets = await (await fetch("http://localhost:9333/json/list")).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params }));
});
const loaded = new Promise((resolve) => {
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
    if (m.method === "Page.loadEventFired") resolve();
  });
});
await new Promise((r) => ws.addEventListener("open", r));
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: +width, height: +height, deviceScaleFactor: 1, mobile: +width < 700,
});
await send("Page.navigate", { url });
await loaded;
await new Promise((r) => setTimeout(r, 1500));

const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception));
  return r.result.value;
};

const label = () => evaluate(`document.querySelector('[aria-roledescription="carousel"] .sr-only[aria-live]').textContent.trim()`);
const centre = (sel) => evaluate(`(() => {
  const b = document.querySelector('[aria-roledescription="carousel"]').querySelector(${JSON.stringify(sel)});
  const r = b.getBoundingClientRect();
  return [Math.round(r.left + r.width/2), Math.round(r.top + r.height/2)];
})()`);

// Stop the timer so an auto-rotation cannot be mistaken for a working click.
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: +width / 2, y: 200 });
await new Promise((r) => setTimeout(r, 200));

const click = async ([x, y]) => {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  await new Promise((r) => setTimeout(r, 500));
};

const results = [];
const before1 = await label();
await click(await centre('button[aria-label="Next banner"]'));
const afterNext = await label();
results.push({ action: "click Next arrow", before: before1, after: afterNext, worked: before1 !== afterNext });

await click(await centre('button[aria-label="Previous banner"]'));
const afterPrev = await label();
results.push({ action: "click Prev arrow", before: afterNext, after: afterPrev, worked: afterNext !== afterPrev });

const beforeDot = afterPrev;
await click(await centre('button[aria-label="Show Waller ISD Champions"]'));
const afterDot = await label();
results.push({ action: "click dot 3", before: beforeDot, after: afterDot, worked: beforeDot !== afterDot });

const beforePause = await evaluate(`document.querySelector('[aria-roledescription="carousel"] button[aria-label*="rotation"]').getAttribute('aria-label')`);
await click(await centre('button[aria-label*="rotation"]'));
const afterPause = await evaluate(`document.querySelector('[aria-roledescription="carousel"] button[aria-label*="rotation"]').getAttribute('aria-label')`);
results.push({ action: "click pause", before: beforePause, after: afterPause, worked: beforePause !== afterPause });

const failed = results.filter((r) => !r.worked);
for (const r of results) {
  console.log(`${width}px  ${r.action.padEnd(20)} ${r.worked ? "PASS" : "FAIL"}  ${r.before} -> ${r.after}`);
}
ws.close();
process.exit(failed.length === 0 ? 0 : 1);

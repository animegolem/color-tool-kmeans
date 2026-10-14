import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PARITY_PNG = resolve('..', 'test-patterns', 'hsl_ligthness.png');
const PARITY_BYTES = readFileSync(PARITY_PNG);
const PARITY_BASE64 = PARITY_BYTES.toString('base64');
const PARITY_DIGEST =
  'e50479b91d9ea898a29934b71d21adf8b1510228d8a59ed786028bb316f31d8b';

interface ConsoleRecord {
  type: string;
  text: string;
  args: unknown[];
}

async function installRuntimeTrace(page: Page) {
  await page.addInitScript(() => {
    const runtimeTrace = {
      requests: [] as Array<{
        requestId: string;
        at: number;
        encodedByteLength: number;
        params: Record<string, unknown>;
      }>,
      replies: [] as Array<{
        requestId: string;
        at: number;
        type: string;
        resultDigest?: string;
      }>,
      terminated: [] as Array<{ at: number }>,
      timerBeats: [] as number[],
      rafBeats: [] as number[],
      visibleStates: [] as Array<{
        at: number;
        state: string;
        clusterCount: string | null;
      }>,
      supersedeAt: null as number | null,
      autoSupersedeK: null as number | null,
    };
    (window as any).__f1RuntimeTrace = runtimeTrace;

    let lastVisibleState = '';
    window.setInterval(() => {
      const at = performance.now();
      runtimeTrace.timerBeats.push(at);
      const home = document.querySelector('.home');
      if (!(home instanceof HTMLElement)) return;
      const state = home.dataset.analysisState ?? '';
      const clusterCount = home.dataset.resultClusterCount ?? null;
      const signature = `${state}:${clusterCount ?? ''}`;
      if (signature === lastVisibleState) return;
      lastVisibleState = signature;
      runtimeTrace.visibleStates.push({ at, state, clusterCount });
    }, 16);
    const beat = (at: number) => {
      runtimeTrace.rafBeats.push(at);
      window.requestAnimationFrame(beat);
    };
    window.requestAnimationFrame(beat);

    const NativeWorker = window.Worker;
    const TracedWorker = new Proxy(NativeWorker, {
      construct(Target, args) {
        const worker = Reflect.construct(Target, args) as Worker;
        const nativePostMessage = worker.postMessage.bind(worker);
        const nativeTerminate = worker.terminate.bind(worker);

        worker.addEventListener('message', (event: MessageEvent<unknown>) => {
          const reply = event.data as {
            type?: string;
            requestId?: string;
            result?: { resultDigest?: string };
          };
          runtimeTrace.replies.push({
            requestId: reply.requestId ?? '',
            at: performance.now(),
            type: reply.type ?? 'unknown',
            resultDigest: reply.result?.resultDigest,
          });
        });
        worker.postMessage = ((message: unknown, options?: unknown) => {
          const request = message as {
            requestId?: string;
            encodedBytes?: ArrayBuffer;
            params?: Record<string, unknown>;
          };
          runtimeTrace.requests.push({
            requestId: request.requestId ?? '',
            at: performance.now(),
            encodedByteLength: request.encodedBytes?.byteLength ?? 0,
            params: { ...(request.params ?? {}) },
          });
          const result = nativePostMessage(
            message,
            options as StructuredSerializeOptions
          );
          if (
            runtimeTrace.autoSupersedeK !== null &&
            runtimeTrace.requests.length === 1
          ) {
            const input = document.querySelector('.controls .number-input');
            if (input instanceof HTMLInputElement) {
              runtimeTrace.supersedeAt = performance.now();
              input.value = String(runtimeTrace.autoSupersedeK);
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
          return result;
        }) as Worker['postMessage'];
        worker.terminate = () => {
          runtimeTrace.terminated.push({ at: performance.now() });
          nativeTerminate();
        };
        return worker;
      },
    });
    Object.defineProperty(window, 'Worker', {
      configurable: true,
      value: TracedWorker,
      writable: true,
    });
  });
}

function collectConsole(page: Page): ConsoleRecord[] {
  const records: ConsoleRecord[] = [];
  page.on('console', (message: ConsoleMessage) => {
    void Promise.all(
      message
        .args()
        .map((argument) => argument.jsonValue().catch(() => '[unserializable]'))
    ).then((args) => {
      records.push({ type: message.type(), text: message.text(), args });
    });
  });
  return records;
}

async function gotoApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute(
    'data-runtime-target',
    'browser'
  );
}

async function chooseParityPng(page: Page) {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('.dropzone .upload').click();
  const chooser = await chooserPromise;
  await chooser.setFiles(PARITY_PNG);
}

async function dropFile(
  page: Page,
  name: string,
  type: string,
  base64: string
) {
  await page.locator('.dropzone').evaluate(
    (target, file) => {
      const raw = atob(file.base64);
      const bytes = Uint8Array.from(raw, (character) =>
        character.charCodeAt(0)
      );
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], file.name, { type: file.type }));
      target.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        })
      );
    },
    { name, type, base64 }
  );
}

async function waitForDigest(page: Page, digest = PARITY_DIGEST) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const trace = (window as any).__f1RuntimeTrace;
          return trace.replies.find(
            (reply: { type: string; resultDigest?: string }) =>
              reply.type === 'result'
          )?.resultDigest;
        }),
      { timeout: 55_000 }
    )
    .toBe(digest);
  await expect(page.locator('.home')).toHaveAttribute(
    'data-analysis-state',
    'ready'
  );
}

function expectResponsiveHeartbeat(
  trace: {
    timerBeats: number[];
    rafBeats: number[];
  },
  request: { at: number },
  reply: { at: number }
) {
  const maxGaps: number[] = [];
  for (const beats of [trace.timerBeats, trace.rafBeats]) {
    const pendingBeats = beats.filter(
      (at) => at >= request.at && at <= reply.at
    );
    expect(pendingBeats.length).toBeGreaterThan(0);
    const points = [request.at, ...pendingBeats, reply.at];
    const gaps = points.slice(1).map((at, index) => at - points[index]);
    const maxGap = Math.max(...gaps);
    expect(maxGap).toBeLessThanOrEqual(1_000);
    maxGaps.push(maxGap);
  }
  return { timerMaxGapMs: maxGaps[0], rafMaxGapMs: maxGaps[1] };
}

test.beforeEach(async ({ page }) => {
  await installRuntimeTrace(page);
});

test('selects one browser target and reports the complete adapter record', async ({
  page,
}) => {
  const consoleRecords = collectConsole(page);
  await gotoApp(page);

  await expect
    .poll(() =>
      consoleRecords.find((record) =>
        record.text.startsWith('[runtime] target')
      )
    )
    .toBeTruthy();
  const runtimeRecord = consoleRecords.find((record) =>
    record.text.startsWith('[runtime] target')
  );
  expect(runtimeRecord?.args[1]).toMatchObject({
    target: 'browser',
    file: 'browser-file',
    compute: 'browser-worker-wasm',
    preferences: 'browser-local-storage',
    save: false,
    values: false,
    batch: false,
    exports: false,
    exportDirectory: false,
    video: false,
    webviewZoom: false,
  });
  expect(
    consoleRecords.filter(
      (record) =>
        ['warning', 'error'].includes(record.type) &&
        /tauri.*(unavailable|failed|error)|(?:unavailable|failed|error).*tauri/i.test(
          record.text
        )
    )
  ).toEqual([]);
});

test('chooser retains Blob authority and reaches the exact worker digest', async ({
  page,
}) => {
  const startedAt = Date.now();
  const consoleRecords = collectConsole(page);
  await gotoApp(page);
  await chooseParityPng(page);
  await waitForDigest(page);

  await expect(page.getByAltText('hsl_ligthness.png').first()).toHaveAttribute(
    'src',
    /^blob:/
  );
  const trace = await page.evaluate(() => (window as any).__f1RuntimeTrace);
  expect(trace.requests).toHaveLength(1);
  expect(trace.requests[0]).toMatchObject({
    encodedByteLength: PARITY_BYTES.byteLength,
    params: { path: '', k: 45, quality: 2 },
  });
  expect(trace.replies).toHaveLength(1);
  expect(trace.replies[0]).toMatchObject({
    requestId: trace.requests[0].requestId,
    type: 'result',
    resultDigest: PARITY_DIGEST,
  });
  const heartbeat = expectResponsiveHeartbeat(
    trace,
    trace.requests[0],
    trace.replies[0]
  );
  const elapsedMs = Date.now() - startedAt;
  expect(elapsedMs).toBeLessThan(60_000);
  console.info(
    '[browser-e2e] fixed parity hang alarm',
    JSON.stringify({ elapsedMs, ...heartbeat })
  );

  await page.locator('.chart').first().click({ button: 'right' });
  await expect(page.getByRole('menu')).toHaveCount(0);
  expect(
    consoleRecords.filter((record) =>
      record.text.startsWith('[tauri-invoke] command:')
    )
  ).toEqual([]);
});

test('drop supersedes a pending request, stays responsive, and finishes under the hang alarm', async ({
  page,
}) => {
  const startedAt = Date.now();
  await gotoApp(page);
  await page.evaluate(() => {
    (window as any).__f1RuntimeTrace.autoSupersedeK = 46;
  });
  await dropFile(page, 'hsl_ligthness.png', 'image/png', PARITY_BASE64);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).__f1RuntimeTrace.requests.length as number
      )
    )
    .toBeGreaterThanOrEqual(1);

  const numberInput = page.locator('.controls .number-input').first();
  await expect(numberInput).toHaveValue('46');
  await expect
    .poll(
      () =>
        page.evaluate(
          () => (window as any).__f1RuntimeTrace.requests.length as number
        ),
      { timeout: 10_000 }
    )
    .toBe(2);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const replies = (window as any).__f1RuntimeTrace.replies;
          return replies.find(
            (reply: { type: string; resultDigest?: string }) =>
              reply.type === 'result'
          )?.requestId;
        }),
      { timeout: 55_000 }
    )
    .toBeTruthy();
  await expect(page.locator('.home')).toHaveAttribute(
    'data-analysis-state',
    'ready'
  );
  await expect(page.locator('.home')).toHaveAttribute(
    'data-result-cluster-count',
    '46'
  );

  const trace = await page.evaluate(() => (window as any).__f1RuntimeTrace);
  const predecessor = trace.requests[0];
  const successor = trace.requests[1];
  expect(predecessor.params).toMatchObject({ path: '', k: 45 });
  expect(successor.params).toMatchObject({ path: '', k: 46 });
  expect(successor.requestId).not.toBe(predecessor.requestId);
  expect(trace.terminated.length).toBeGreaterThanOrEqual(2);
  expect(trace.replies.at(-1)).toEqual(
    expect.objectContaining({
      requestId: successor.requestId,
      type: 'result',
    })
  );
  expect(
    trace.visibleStates.filter(
      (entry: { at: number; state: string }) =>
        entry.at >= trace.supersedeAt &&
        (entry.state === 'ready' || entry.state === 'error')
    )
  ).toEqual([expect.objectContaining({ state: 'ready', clusterCount: '46' })]);
  await expect(
    page.getByRole('dialog', { name: 'Analysis failed' })
  ).toHaveCount(0);

  const successorReply = trace.replies.at(-1);
  expectResponsiveHeartbeat(trace, successor, successorReply);
  expect(Date.now() - startedAt).toBeLessThan(60_000);
});

test('persists a browser preference across reload', async ({ page }) => {
  await gotoApp(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  const pngFormat = page.getByRole('radio', {
    name: 'PNG (rasterized at scale)',
  });
  await pngFormat.check();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('color-tool.preferences.v1'))
    )
    .toContain('"graphExportFormat":"png"');

  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(pngFormat).toBeChecked();
});

test('reports localStorage write denial through the accessible warning', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value() {
        throw new DOMException('denied by browser test', 'SecurityError');
      },
    });
  });
  await gotoApp(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'PNG (rasterized at scale)' }).check();
  await expect(page.getByRole('alert')).toContainText(
    'Preferences could not be saved'
  );
  await expect(page.getByRole('alert')).toHaveAttribute(
    'data-preference-operation',
    'save'
  );
});

test('keeps later routes and native-only controls honest without Tauri invokes', async ({
  page,
}) => {
  const consoleRecords = collectConsole(page);
  await gotoApp(page);

  for (const capability of ['Values', 'Batch', 'Exports'] as const) {
    await page.getByRole('button', { name: capability }).click();
    await expect(page.getByRole('status')).toContainText(
      `${capability} is unavailable in the browser`
    );
    await expect(
      page.getByRole('button', { name: 'Open library' })
    ).toHaveCount(0);
  }

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(
    page.locator('[data-capability-unavailable="export-directory"]')
  ).toContainText('available in the desktop app only');
  await expect(page.getByRole('button', { name: 'Browse' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Colors' }).click();
  await dropFile(page, 'unsupported.mp4', 'video/mp4', 'AAAA');
  await expect(page.getByRole('dialog', { name: 'Notice' })).toContainText(
    'Browser video is not supported yet'
  );
  await page.keyboard.press('Control++');
  await page.keyboard.press('Meta++');
  expect(
    consoleRecords.filter((record) =>
      record.text.startsWith('[tauri-invoke] command:')
    )
  ).toEqual([]);
});

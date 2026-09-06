import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { compile, compileModule } from 'svelte/compiler';
// @ts-expect-error The installed internal runtime intentionally has no public declaration.
import { bind_value, effect_root } from 'svelte/internal/client';
import { writable } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  analyzeImage: vi.fn(),
}));

vi.mock('../../compute/bridge', () => ({
  analyzeImage: mocks.analyzeImage,
}));

import {
  appendProfileBatch,
  type ProfileRendererBatch,
} from '../../bridges/profiling';
import type {
  AnalysisParams,
  AnalysisResult,
  SelectedImage,
} from '../../stores/ui';
import type {
  ProfileAcceptedResultContext,
  RendererProfileTrace,
} from '../../profiling/trace';
import { createProfileTraceHarness } from '../../profiling/trace-fixtures';
import { createAnalysisRunner } from '../home/analysis-runner.svelte';
import { createProfilingCoordinator } from '../home/profiling-coordinator.svelte';

const PARAMS: AnalysisParams = {
  clusters: 46,
  quality: 2,
  ignoreTopN: 0,
  mergeThreshold: 0,
  symbolScale: 1,
  showClusterOutline: false,
  showAxisLabels: true,
  polarMode: 'okhsv',
  hueLightnessSizeMode: 'chroma',
  histogramSort: 'frequency',
  snapToReal: true,
  showHistogram: true,
  showPolarChart: false,
  showHueLightness: false,
};

const RESULT: AnalysisResult = {
  clusters: [],
  iterations: 1,
  durationMs: 1,
  totalSamples: 1,
  variant: 'test',
};

const FILE = {
  id: 'image-a',
  path: '/private/image.png',
} as SelectedImage;

function installRuneShims() {
  const state = Object.assign(<T>(value: T) => value, {
    raw: <T>(value: T) => value,
  });
  Object.defineProperty(globalThis, '$state', {
    configurable: true,
    value: state,
  });
}

function coordinatorDeps(overrides: Record<string, unknown> = {}) {
  return {
    getFile: () => FILE,
    getParams: () => PARAMS,
    getDisplayResult: () => RESULT,
    getStudyRoot: () => null,
    getRenderExtras: () => ({
      showSimplifiedTones: true,
      frameLabel: 'timestamp' as const,
      stripMode: 'barcode' as const,
      compactSidebars: false,
    }),
    settle: async () => undefined,
    ...overrides,
  };
}

function assertParameterInputCaptureContract(source: string) {
  const compiled = compile(source, {
    filename: 'ParameterControls.svelte',
    generate: 'client',
    dev: false,
  }).js.code;
  const valueBindings = [
    ...compiled.matchAll(
      /\$\.bind_value\((input_\d+), \(\) => \$params\(\)\.(\w+)/g
    ),
  ].map((match) => ({
    input: match[1],
    field: match[2],
    index: match.index,
  }));
  const checkedBindings = [
    ...compiled.matchAll(
      /\$\.bind_checked\((input_\d+), \(\) => \$params\(\)\.(\w+)/g
    ),
  ].map((match) => ({
    input: match[1],
    field: match[2],
    index: match.index,
  }));
  const captureInputs = [
    ...compiled.matchAll(
      /\$\.event\(\s*'input',\s*(input_\d+),([\s\S]*?)\n\t\);/g
    ),
  ].map((match) => ({
    input: match[1],
    body: match[2],
    index: match.index,
  }));

  expect(valueBindings.map(({ input, field }) => [input, field])).toEqual([
    ['input_1', 'clusters'],
    ['input_2', 'clusters'],
    ['input_3', 'quality'],
    ['input_4', 'ignoreTopN'],
    ['input_5', 'mergeThreshold'],
    ['input_6', 'symbolScale'],
  ]);
  expect(checkedBindings.map(({ input, field }) => [input, field])).toEqual([
    ['input_7', 'showClusterOutline'],
    ['input_8', 'showAxisLabels'],
    ['input_9', 'snapToReal'],
  ]);
  expect(captureInputs).toHaveLength(6);

  const expectedHooks = [
    { label: 'clusters range', input: 'input_1', control: 'clusters' },
    { label: 'clusters number', input: 'input_2', control: 'clusters' },
    { label: 'quality range', input: 'input_3', control: 'quality' },
    { label: 'ignoreTopN range', input: 'input_4', control: 'ignoreTopN' },
    {
      label: 'mergeThreshold range',
      input: 'input_5',
      control: 'mergeThreshold',
    },
    { label: 'snapToReal checkbox', input: 'input_9', control: 'snapToReal' },
  ];

  for (const expected of expectedHooks) {
    const capture = captureInputs.find(({ input }) => input === expected.input);
    const binding = [...valueBindings, ...checkedBindings].find(
      ({ input }) => input === expected.input
    );
    expect(capture, `${expected.label} capture hook`).toBeDefined();
    expect(binding, `${expected.label} binding`).toBeDefined();
    expect(capture?.body).toContain(
      `observeAnalysisInput('${expected.control}', event)`
    );
    expect(capture?.body).toMatch(/,\s*true\s*$/);
    expect(
      capture?.index,
      `${expected.label} capture-before-bind`
    ).toBeLessThan(binding?.index ?? -1);
  }

  const delegatedTail = compiled.match(/\$\.delegate\(\[([^\]]*)\]\);/)?.[1];
  expect(delegatedTail).toBeDefined();
  expect(delegatedTail).not.toContain("'input'");
  expect(delegatedTail).toContain("'pointerdown'");
  expect(delegatedTail).toContain("'pointerup'");
}

describe('Svelte profiling integration', () => {
  beforeEach(() => {
    installRuneShims();
    mocks.analyzeImage.mockReset();
  });

  it('uses the installed Svelte client runtime to preserve raw result identity', async () => {
    const source = `
      export function createAssociation(value) {
        let oldDisplay = $state(value);
        let display = $state.raw(value);
        let accepted = $state.raw({ result: value });
        return {
          get oldDisplay() { return oldDisplay; },
          get display() { return display; },
          get accepted() { return accepted; }
        };
      }
    `;
    const compiled = compileModule(source, {
      filename: 'profiling-identity-proof.svelte.js',
      generate: 'client',
    }).js.code;
    const runtime = pathToFileURL(
      createRequire(import.meta.url).resolve('svelte/internal/client')
    ).href;
    const executable = compiled.replace(
      "'svelte/internal/client'",
      JSON.stringify(runtime)
    );
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(executable).toString('base64')}#${Date.now()}`;
    const loaded = (await import(moduleUrl)) as {
      createAssociation: (value: object) => {
        oldDisplay: object;
        display: object;
        accepted: { result: object };
      };
    };
    const raw = { clusters: [] };
    const association = loaded.createAssociation(raw);

    expect(association.oldDisplay).not.toBe(raw);
    expect(association.display).toBe(raw);
    expect(association.accepted.result).toBe(raw);
    expect(association.accepted.result).toBe(association.display);
  });

  it('does not read the clock or call an observer on the disabled figure path', async () => {
    const now = vi.fn(() => 1);
    const trace = {
      startDeliveredAction: vi.fn(),
    } as unknown as RendererProfileTrace;
    const coordinator = createProfilingCoordinator(
      coordinatorDeps({
        now,
        getTrace: () => trace,
        initializeTrace: async () => null,
      })
    );
    await coordinator.initialize();

    expect(coordinator.beginFigure('histogram', RESULT)).toBeNull();
    coordinator.handleInput({
      control: 'clusters',
      rawValue: '46',
      targetValue: 46,
      deliveredAt: 1,
    });
    expect(now).not.toHaveBeenCalled();
    expect(trace.startDeliveredAction).not.toHaveBeenCalled();
  });

  it('swallows observer exceptions after profiling is enabled', async () => {
    const trace = {
      cancelAction: vi.fn(),
      startDeliveredAction: vi.fn(() => {
        throw new Error('observer failed');
      }),
    } as unknown as RendererProfileTrace;
    const coordinator = createProfilingCoordinator(
      coordinatorDeps({
        getTrace: () => trace,
        initializeTrace: async () => trace,
      })
    );
    await coordinator.initialize();

    expect(() =>
      coordinator.handleInput({
        control: 'clusters',
        rawValue: '46',
        targetValue: 46,
        deliveredAt: 1,
      })
    ).not.toThrow();
  });

  it.each(['clusters', 'quality', 'ignoreTopN', 'mergeThreshold'] as const)(
    'captures invalid %s before resolved analysis config construction',
    async (control) => {
      const { trace, batches } = createProfileTraceHarness();
      const coordinator = createProfilingCoordinator(
        coordinatorDeps({
          getTrace: () => trace,
          initializeTrace: async () => trace,
        })
      );
      await coordinator.initialize();

      expect(() =>
        coordinator.handleInput({
          control,
          rawValue: '',
          targetValue: null,
          deliveredAt: 1,
        })
      ).not.toThrow();
      await expect(trace.finishCapture()).resolves.toMatchObject({
        phase: 'sealed',
      });
      expect(batches).toHaveLength(1);
      expect(batches[0].analysisConfig).toEqual({
        state: 'unavailable',
        reasonCode: 'input-target-invalid',
      });
      expect(batches[0].input).toEqual({
        control,
        targetState: 'invalid-or-empty',
      });
    }
  );

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    'fails closed without IPC on hostile runtime quality %s outside the null arm',
    async (quality) => {
      const { trace, batches } = createProfileTraceHarness();
      const hostile = { ...PARAMS, quality } as unknown as AnalysisParams;
      const coordinator = createProfilingCoordinator(
        coordinatorDeps({
          getParams: () => hostile,
          getTrace: () => trace,
          initializeTrace: async () => trace,
        })
      );
      await coordinator.initialize();

      expect(() =>
        coordinator.handleInput({
          control: 'clusters',
          rawValue: '46',
          targetValue: 46,
          deliveredAt: 1,
        })
      ).not.toThrow();
      await expect(trace.finishCapture()).resolves.toMatchObject({
        phase: 'failed',
        errorCode: 'renderer-persistence-failed',
      });
      expect(batches).toHaveLength(0);
    }
  );

  it('retains the resolved wire arm for boolean input', async () => {
    const { trace, batches } = createProfileTraceHarness();
    const coordinator = createProfilingCoordinator(
      coordinatorDeps({
        getTrace: () => trace,
        initializeTrace: async () => trace,
      })
    );
    await coordinator.initialize();
    coordinator.handleInput({
      control: 'snapToReal',
      rawValue: 'false',
      targetValue: false,
      deliveredAt: 1,
    });
    const action = coordinator.resolveAction(FILE, {
      ...PARAMS,
      snapToReal: false,
    });
    trace.cancelAction(action, 'view-unmounted');
    await trace.getPersistence(action);

    expect(batches[0].analysisConfig).toMatchObject({
      state: 'resolved',
      value: { snapToReal: false },
    });
  });

  it('lets a legitimate post-Finish coordinator input truthfully supersede existing work', async () => {
    const { trace, batches } = createProfileTraceHarness();
    const coordinator = createProfilingCoordinator(
      coordinatorDeps({
        getTrace: () => trace,
        initializeTrace: async () => trace,
      })
    );
    await coordinator.initialize();
    coordinator.handleInput({
      control: 'clusters',
      rawValue: '46',
      targetValue: 46,
      deliveredAt: 1,
    });
    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'renderer-pending',
      rendererOpenCount: 1,
    });

    coordinator.handleInput({
      control: 'clusters',
      rawValue: '47',
      targetValue: 47,
      deliveredAt: 2,
    });
    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'sealed',
    });
    expect(batches).toHaveLength(1);
    expect(batches[0].observedOutcome).toMatchObject({
      status: 'cancelled',
      reasonCode: 'input-superseded',
    });
  });

  it('retains coordinator ownership after store acceptance through unmount', async () => {
    const action = {
      sessionId: 'session-a',
      actionId: 'action-a',
      rendererClockId: 'renderer-a',
    } as const;
    const accepted = {
      analysis: {
        action,
        expectedSourcePath: FILE.path,
        nativeRequest: {},
      },
      result: RESULT,
      resultObservationId: 'result-a',
    } as unknown as ProfileAcceptedResultContext;
    const trace = {
      cancelAction: vi.fn(),
    } as unknown as RendererProfileTrace;
    const coordinator = createProfilingCoordinator(
      coordinatorDeps({
        getTrace: () => trace,
        initializeTrace: async () => trace,
      })
    );
    await coordinator.initialize();
    coordinator.acceptResult(accepted);
    coordinator.cancel('view-unmounted');

    expect(trace.cancelAction).toHaveBeenCalledWith(action, 'view-unmounted');
    expect(coordinator.acceptedResult).toBeNull();
  });

  it('persists the synthetic numeric-binding/null wire sequence without claiming browser listener order', async () => {
    vi.useFakeTimers();
    const priorDocument = Object.getOwnPropertyDescriptor(
      globalThis,
      'document'
    );
    const priorInput = Object.getOwnPropertyDescriptor(
      globalThis,
      'HTMLInputElement'
    );
    class NativeTransportStubInput extends EventTarget {
      type = 'number';
      value = '45';
      defaultValue = '45';
      selectionStart = 0;
      selectionEnd = 0;

      get valueAsNumber() {
        return this.value === '' ? Number.NaN : Number(this.value);
      }
    }
    const documentStub = new EventTarget() as EventTarget & {
      activeElement: null;
    };
    documentStub.activeElement = null;
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: documentStub,
    });
    Object.defineProperty(globalThis, 'HTMLInputElement', {
      configurable: true,
      value: NativeTransportStubInput,
    });

    try {
      let expectedSequence = 1;
      const batches: ProfileRendererBatch[] = [];
      const nativeTransportStub = vi.fn(async (batch: ProfileRendererBatch) => {
        expect(batch.batchSequence).toBe(expectedSequence++);
        batches.push(batch);
        return {
          sessionId: batch.sessionId,
          batchSequence: batch.batchSequence,
          actionId: batch.actionId,
          acceptedCount: batch.events.length,
          acceptedByteCount: JSON.stringify(batch).length,
          droppedCount: 0,
          closed: true as const,
          outcomeAccepted: true,
          nativeReceiveRecorded: false,
          nativeReturnRecorded: false,
          sessionTainted: false,
        };
      });
      const { trace } = createProfileTraceHarness({
        append: (batch, status) => {
          // Validation remains production appendProfileBatch; only its native
          // transport is replaced after the validated invocation is formed.
          const tauri = globalThis as typeof globalThis & {
            __TAURI__?: {
              core: {
                invoke: (
                  command: string,
                  args?: Record<string, unknown>
                ) => Promise<unknown>;
              };
            };
          };
          tauri.__TAURI__ = {
            core: {
              invoke: async (command, args) => {
                expect(command).toBe('profile_append_batch');
                return nativeTransportStub(
                  (args as { batch: ProfileRendererBatch }).batch
                );
              },
            },
          };
          return appendProfileBatch(batch, status);
        },
      });
      let params = { ...PARAMS, clusters: 45 } as AnalysisParams;
      const coordinator = createProfilingCoordinator(
        coordinatorDeps({
          getParams: () => params,
          getTrace: () => trace,
          initializeTrace: async () => trace,
        })
      );
      await coordinator.initialize();
      const runner = createAnalysisRunner({
        setAnalysisPending: () => 1,
        setAnalysisSuccess: () => ({ status: 'accepted', imageId: FILE.id }),
        setAnalysisError: () => ({ status: 'accepted-error' }),
        recordDevEvent: () => undefined,
        getProfileTrace: () => trace,
        onProfileAccepted: (accepted) => coordinator.acceptResult(accepted),
      });
      runner.seedLastRequestKey(FILE, params);

      const input = new NativeTransportStubInput();
      const values = writable<number | null>(45);
      let boundValue: number | null = 45;
      const ordering: string[] = [];
      const unsubscribe = values.subscribe((value) => {
        boundValue = value;
        params = { ...params, clusters: value } as AnalysisParams;
        ordering.push(`store:${String(value)}`);
      });
      const destroy = effect_root(() => {
        bind_value(
          input as unknown as HTMLInputElement,
          () => boundValue,
          (value) => values.set(value as number | null)
        );
        input.addEventListener('input', (event) => {
          // This EventTarget/dispatchEvent surrogate validates binding conversion
          // and persisted wire outcomes; it does not reproduce trusted browser
          // listener ordering. B12 retains that separate mounted proof.
          ordering.push(`observer:${String(boundValue)}`);
          const targetValue = Number.isFinite(input.valueAsNumber)
            ? input.valueAsNumber
            : null;
          coordinator.handleInput({
            control: 'clusters',
            rawValue: input.value,
            targetValue,
            deliveredAt: performance.now(),
          });
          ordering.push(`effect:${String(params.clusters)}`);
          runner.scheduleAnalysisWith(
            FILE,
            params,
            'ready',
            coordinator.resolveAction(FILE, params)
          );
        });
      });

      for (const value of ['', '46', '', '45']) {
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }
      runner.cancelPending('view-unmounted');
      coordinator.cancel('view-unmounted');
      await expect(trace.finishCapture()).resolves.toMatchObject({
        phase: 'sealed',
      });

      expect(boundValue).toBe(45);
      expect(ordering).toEqual([
        'store:45',
        'store:null',
        'observer:null',
        'effect:null',
        'store:46',
        'observer:46',
        'effect:46',
        'store:null',
        'observer:null',
        'effect:null',
        'store:45',
        'observer:45',
        'effect:45',
      ]);
      expect(nativeTransportStub).toHaveBeenCalledTimes(4);
      expect(batches.map((batch) => batch.batchSequence)).toEqual([1, 2, 3, 4]);
      expect(
        batches.map((batch) => [
          batch.analysisConfig.state,
          batch.observedOutcome.status,
          batch.observedOutcome.reasonCode,
        ])
      ).toEqual([
        ['unavailable', 'unverified', 'input-target-invalid'],
        ['resolved', 'cancelled', 'input-superseded'],
        ['unavailable', 'unverified', 'input-target-invalid'],
        ['resolved', 'cancelled', 'view-unmounted'],
      ]);
      expect(
        batches
          .filter((batch) => batch.analysisConfig.state === 'unavailable')
          .every(
            (batch) =>
              batch.events.length === 3 &&
              !batch.events.some((event) => event.type === 'request_admitted')
          )
      ).toBe(true);

      destroy();
      unsubscribe();
      delete (globalThis as typeof globalThis & { __TAURI__?: unknown })
        .__TAURI__;
    } finally {
      if (priorDocument)
        Object.defineProperty(globalThis, 'document', priorDocument);
      else
        delete (globalThis as typeof globalThis & { document?: unknown })
          .document;
      if (priorInput)
        Object.defineProperty(globalThis, 'HTMLInputElement', priorInput);
      else
        delete (
          globalThis as typeof globalThis & { HTMLInputElement?: unknown }
        ).HTMLInputElement;
      vi.useRealTimers();
    }
  });

  it('takes a settled valid action through the real runner and accepted DOM endpoint', async () => {
    vi.useFakeTimers();
    try {
      const { trace, batches, frames } = createProfileTraceHarness();
      const params = { ...PARAMS, clusters: 47 };
      const studyRoot = {
        querySelectorAll: () => [
          {
            dataset: {
              profileAction: coordinator.profileActionId,
              profileFigure: 'histogram',
            },
            children: [{ tagName: 'svg' }],
          },
        ],
      } as unknown as HTMLElement;
      const coordinator = createProfilingCoordinator(
        coordinatorDeps({
          getParams: () => params,
          getDisplayResult: () => RESULT,
          getStudyRoot: () => studyRoot,
          getTrace: () => trace,
          initializeTrace: async () => trace,
        })
      );
      await coordinator.initialize();
      mocks.analyzeImage.mockImplementation(
        async (_dataset, _params, observer) => {
          observer?.requestIssued({
            actualSourcePath: FILE.path,
            request: {
              k: params.clusters,
              quality: params.quality,
              ignoreTopN: params.ignoreTopN,
              mergeThreshold: params.mergeThreshold,
              snapToReal: params.snapToReal,
              minLum: 0,
              tol: 1e-3,
              maxIter: 40,
              seed: 1,
              maxSamples: 300_000,
            },
          });
          observer?.requestSettled('success');
          observer?.responseParsed();
          return RESULT;
        }
      );
      const runner = createAnalysisRunner({
        setAnalysisPending: () => 1,
        setAnalysisSuccess: () => ({ status: 'accepted', imageId: FILE.id }),
        setAnalysisError: () => ({ status: 'accepted-error' }),
        recordDevEvent: () => undefined,
        getProfileTrace: () => trace,
        onProfileAccepted: (accepted) => coordinator.acceptResult(accepted),
      });

      coordinator.handleInput({
        control: 'clusters',
        rawValue: '47',
        targetValue: 47,
        deliveredAt: 1,
      });
      const action = coordinator.resolveAction(FILE, params);
      runner.scheduleAnalysisWith(FILE, params, 'ready', action);
      await vi.advanceTimersByTimeAsync(400);
      expect(coordinator.acceptedResult?.analysis.action).toBe(action);

      const startedAt = coordinator.beginFigure('histogram', RESULT);
      coordinator.finishFigure(
        'histogram',
        RESULT,
        { svg: '<svg/>', width: 1, height: 1 },
        startedAt
      );
      coordinator.coordinate();
      await Promise.resolve();
      frames.shift()?.(20);
      await Promise.resolve();
      frames.shift()?.(21);
      for (let index = 0; index < 4 && !trace.getOutcome(action); index += 1)
        await Promise.resolve();
      expect(trace.getOutcome(action)?.status).toBe('completed');
      await trace.getPersistence(action);

      expect(mocks.analyzeImage).toHaveBeenCalledOnce();
      expect(batches).toHaveLength(1);
      expect(batches[0].observedOutcome).toMatchObject({
        status: 'completed',
        reasonCode: null,
        endpoint: 'associated_result_dom_raf2_approx',
      });
      expect(
        batches[0].events.some((event) => event.type === 'request_admitted')
      ).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a debounce-expired empty value outside native profiling admission', async () => {
    vi.useFakeTimers();
    try {
      const { trace, batches } = createProfileTraceHarness();
      const params = { ...PARAMS, clusters: null } as unknown as AnalysisParams;
      const coordinator = createProfilingCoordinator(
        coordinatorDeps({
          getParams: () => params,
          getTrace: () => trace,
          initializeTrace: async () => trace,
        })
      );
      await coordinator.initialize();
      mocks.analyzeImage.mockResolvedValue(RESULT);
      const runner = createAnalysisRunner({
        setAnalysisPending: () => 1,
        setAnalysisSuccess: () => ({ status: 'accepted', imageId: FILE.id }),
        setAnalysisError: () => ({ status: 'accepted-error' }),
        recordDevEvent: () => undefined,
        getProfileTrace: () => trace,
        onProfileAccepted: (accepted) => coordinator.acceptResult(accepted),
      });

      coordinator.handleInput({
        control: 'clusters',
        rawValue: '',
        targetValue: null,
        deliveredAt: 1,
      });
      runner.scheduleAnalysisWith(
        FILE,
        params,
        'ready',
        coordinator.resolveAction(FILE, params)
      );
      await vi.advanceTimersByTimeAsync(400);
      await expect(trace.finishCapture()).resolves.toMatchObject({
        phase: 'sealed',
      });

      expect(mocks.analyzeImage).toHaveBeenCalledOnce();
      expect(mocks.analyzeImage.mock.calls[0][2]).toBeUndefined();
      expect(coordinator.acceptedResult).toBeNull();
      expect(batches).toHaveLength(1);
      expect(batches[0].analysisConfig.state).toBe('unavailable');
      expect(
        batches[0].events.some((event) => event.type === 'request_admitted')
      ).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps disabled input and chart call sites ahead of clock reads', async () => {
    const parameterSource = await readFile(
      new URL('../home/ParameterControls.svelte', import.meta.url),
      'utf8'
    );
    const homeSource = await readFile(
      new URL('../HomeView.svelte', import.meta.url),
      'utf8'
    );
    const coordinatorSource = await readFile(
      new URL('../home/profiling-coordinator.svelte.ts', import.meta.url),
      'utf8'
    );

    expect(
      parameterSource.indexOf('if (!onAnalysisInput) return')
    ).toBeLessThan(parameterSource.indexOf('performance.now()'));
    expect(
      parameterSource.match(/oninputcapture=\{onAnalysisInput/g)
    ).toHaveLength(6);
    expect(parameterSource).not.toContain('oninput={onAnalysisInput');
    expect(homeSource).not.toContain('const startedAt = performance.now()');
    expect(coordinatorSource.indexOf('if (!enabled')).toBeLessThan(
      coordinatorSource.indexOf('return now()')
    );
    expect(coordinatorSource).toContain(
      'let profiledFigures: Set<string> | null = null'
    );
    expect(
      coordinatorSource.match(/enabled \? new Set<string>\(\) : null/g)
    ).toHaveLength(2);
  });

  it('compiles every profiled input as capture-before-binding and rejects the old delegated hookup', async () => {
    const parameterSource = await readFile(
      new URL('../home/ParameterControls.svelte', import.meta.url),
      'utf8'
    );

    expect(() =>
      assertParameterInputCaptureContract(parameterSource)
    ).not.toThrow();

    const oldHookSource = parameterSource.replaceAll(
      'oninputcapture={onAnalysisInput',
      'oninput={onAnalysisInput'
    );
    expect(oldHookSource).not.toBe(parameterSource);
    expect(() => assertParameterInputCaptureContract(oldHookSource)).toThrow();
  });

  it('compiles the identity-safe persistent header control without timers or disabled DOM', async () => {
    const componentSource = await readFile(
      new URL('../../components/ProfileCaptureControl.svelte', import.meta.url),
      'utf8'
    );
    const appSource = await readFile(
      new URL('../../../App.svelte', import.meta.url),
      'utf8'
    );
    const traceSource = await readFile(
      new URL('../../profiling/trace.ts', import.meta.url),
      'utf8'
    );

    expect(() =>
      compile(componentSource, {
        filename: 'ProfileCaptureControl.svelte',
        generate: 'client',
      })
    ).not.toThrow();
    expect(componentSource).toContain(
      'let trace = $state.raw<RendererProfileTrace | null>(null)'
    );
    expect(componentSource).toContain(
      'let finishState = $state.raw<ProfileFinishState>(READY_STATE)'
    );
    expect(componentSource).toContain('{#if !initializing && trace}');
    expect(componentSource).toContain('Profiling launch enabled');
    expect(componentSource).toContain('Finish capture');
    expect(componentSource).toContain('Retry finish');
    expect(componentSource).toContain('Trace sealed · validation pending');
    expect(componentSource).toContain('Trace sealed with loss · not usable');
    expect(componentSource).not.toMatch(
      /setInterval|setTimeout|localStorage|sessionStorage/
    );
    expect(traceSource).toContain('initialization ??= getProfileStatus()');
    expect(appSource).toContain(
      "import ProfileCaptureControl from './lib/components/ProfileCaptureControl.svelte'"
    );
    expect(appSource.indexOf('<ProfileCaptureControl />')).toBeLessThan(
      appSource.indexOf('<section class="view-container">')
    );
  });
});

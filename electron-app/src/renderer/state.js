import { defaultChartOptions, normalizeAxisType } from '../shared/types.js';

export function createChartState() {
  return {
    clusters: [],
    options: defaultChartOptions(),
    pendingJobId: null,
    warmStart: null
  };
}

export function applyResult(state, result) {
  state.clusters = result.clusters || [];
  state.warmStart = result.centroids instanceof Float32Array ? result.centroids : null;
  state.pendingJobId = null;
  return state;
}

export function updateOptions(state, overrides) {
  state.options = {
    ...state.options,
    ...overrides,
    axisType: normalizeAxisType(overrides.axisType ?? state.options.axisType)
  };
  return state.options;
}

export function getChartOptions(state) {
  return state.options;
}

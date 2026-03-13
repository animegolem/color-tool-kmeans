import { get } from 'svelte/store';
import type { SelectedImage } from '../../stores/ui';
import {
  valueAnalysisLevels,
  valueAnalysisNotanMode,
  setValueAnalysisPending,
  setValueAnalysisSuccess,
  setValueAnalysisError
} from '../../stores/ui';
import { generateValueAnalysisSvg } from '../../exports/value-analysis';
import {
  generateNotanStudySvg,
  generateSingleCellSvg,
  type NotanCellData
} from '../../exports/notan-study';
import { composeValueStudy } from '../../exports/value-study-compositor';
import { getFsBridge, saveFromPath } from '../../bridges/fs';
import { svgToPngBlob } from '../../exports/png';
import { requestValueAnalysis } from '../../bridges/value-analysis';
import { assetUrl } from '../../utils/asset-url';

export interface ValuesExportDeps {
  getFile(): SelectedImage | null;
  getExportScale(): number;
  getCheckboxState(): {
    valuesNeutral: boolean;
    valuesIncludeOriginal: boolean;
    valuesRangeFinder: boolean;
    valuesHistogram: boolean;
    valuesSimplified: boolean;
    valuesAllStudies: boolean;
  };
  getGraphExportFormat(): string;
  performSave(action: () => Promise<void>): Promise<void>;
  baseName(): string;
  setStatus(value: string | null, variant: 'info' | 'error'): void;
}

export function createValuesExportRunner(deps: ValuesExportDeps) {
  async function loadValueAnalysisForExport(levels: number, notanMode: boolean) {
    const file = deps.getFile();
    if (!file?.path) {
      throw new Error('Values analysis export requires a native file path.');
    }
    setValueAnalysisPending(file.id, levels, notanMode);
    try {
      const loaded = await requestValueAnalysis(file.path, file.id, levels, notanMode);
      setValueAnalysisSuccess(file.id, levels, notanMode, loaded);
      return loaded;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setValueAnalysisError(file.id, levels, notanMode, msg);
      throw error;
    }
  }

  async function ensureValuesData() {
    const levels = get(valueAnalysisLevels);
    const notanMode = get(valueAnalysisNotanMode);
    return loadValueAnalysisForExport(levels, notanMode);
  }

  async function buildValuesSectionSvg(
    section: 'rangeFinder' | 'histogram' | 'simplified'
  ): Promise<{ svg: string; width: number; height: number }> {
    const file = deps.getFile();
    const currentStudy = await ensureValuesData();
    const originalSrc = file!.previewUrl || '';
    const neutralSrc = assetUrl(currentStudy.neutral);
    const previewSrc = assetUrl(currentStudy.preview);
    return generateValueAnalysisSvg({
      originalSrc,
      neutralSrc,
      previewSrc,
      neutralWidth: currentStudy.neutralWidth,
      neutralHeight: currentStudy.neutralHeight,
      previewWidth: currentStudy.previewWidth,
      previewHeight: currentStudy.previewHeight,
      p10: currentStudy.p10,
      p90: currentStudy.p90,
      p01: currentStudy.p01,
      p99: currentStudy.p99,
      bucketValues: currentStudy.bucketValues,
      boundaries: currentStudy.boundaries,
      counts: currentStudy.counts,
      histogramBins: currentStudy.histogramBins,
      levels: currentStudy.levels,
      background: 'none',
      includeNeutral: false,
      includeOriginal: false,
      includeRangeFinder: section === 'rangeFinder',
      includeHistogram: section === 'histogram',
      includeSimplified: section === 'simplified'
    });
  }

  async function exportValuesComposite() {
    const file = deps.getFile();
    if (!file) return;
    await deps.performSave(async () => {
      const levels = get(valueAnalysisLevels);
      const notanMode = get(valueAnalysisNotanMode);
      const currentStudy = await loadValueAnalysisForExport(levels, notanMode);
      const originalSrc = file.previewUrl || '';
      if (!originalSrc) {
        throw new Error('Original image preview unavailable for export.');
      }
      const neutralSrc = assetUrl(currentStudy.neutral);
      const previewSrc = assetUrl(currentStudy.preview);

      const baseInput = {
        originalSrc,
        neutralSrc,
        previewSrc,
        neutralWidth: currentStudy.neutralWidth,
        neutralHeight: currentStudy.neutralHeight,
        previewWidth: currentStudy.previewWidth,
        previewHeight: currentStudy.previewHeight,
        p10: currentStudy.p10,
        p90: currentStudy.p90,
        p01: currentStudy.p01,
        p99: currentStudy.p99,
        bucketValues: currentStudy.bucketValues,
        boundaries: currentStudy.boundaries,
        counts: currentStudy.counts,
        histogramBins: currentStudy.histogramBins,
        levels: currentStudy.levels
      };

      const cb = deps.getCheckboxState();
      let svg: string;
      let width: number;
      let height: number;

      if (cb.valuesSimplified) {
        const col1Result = await generateValueAnalysisSvg({
          ...baseInput,
          includeNeutral: cb.valuesNeutral,
          includeOriginal: cb.valuesIncludeOriginal,
          includeRangeFinder: cb.valuesRangeFinder,
          includeHistogram: cb.valuesHistogram,
          includeSimplified: false
        });

        let col2Result: { svg: string; width: number; height: number };
        if (cb.valuesAllStudies) {
          const [level2, level3, level4, level5] = await Promise.all([
            loadValueAnalysisForExport(2, true),
            loadValueAnalysisForExport(3, false),
            loadValueAnalysisForExport(4, false),
            loadValueAnalysisForExport(5, false)
          ]);
          const toCell = (study: typeof level2): NotanCellData => ({
            previewSrc: assetUrl(study.preview),
            previewWidth: study.previewWidth,
            previewHeight: study.previewHeight,
            bucketValues: study.bucketValues,
            counts: study.counts
          });
          col2Result = await generateNotanStudySvg({
            cells: [toCell(level2), toCell(level3), toCell(level4), toCell(level5)]
          });
        } else {
          col2Result = await generateSingleCellSvg({
            previewSrc,
            previewWidth: currentStudy.previewWidth,
            previewHeight: currentStudy.previewHeight,
            bucketValues: currentStudy.bucketValues,
            counts: currentStudy.counts
          });
        }

        const composed = composeValueStudy({
          col1Svg: col1Result.svg,
          col2Svg: col2Result.svg
        });
        svg = composed.svg;
        width = composed.width;
        height = composed.height;
      } else {
        const result = await generateValueAnalysisSvg({
          ...baseInput,
          includeNeutral: cb.valuesNeutral,
          includeOriginal: cb.valuesIncludeOriginal,
          includeRangeFinder: cb.valuesRangeFinder,
          includeHistogram: cb.valuesHistogram,
          includeSimplified: false
        });
        svg = result.svg;
        width = result.width;
        height = result.height;
      }

      const scale = Math.max(1, Math.min(4, deps.getExportScale()));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${deps.baseName()}-values.png`);
      if (canceled) {
        deps.setStatus('Export canceled.', 'info');
      } else {
        deps.setStatus('Values analysis PNG saved.', 'info');
      }
    });
  }

  async function saveNeutralImage() {
    const file = deps.getFile();
    if (!file) return;
    await deps.performSave(async () => {
      const currentStudy = await ensureValuesData();
      const cb = deps.getCheckboxState();
      if (cb.valuesIncludeOriginal) {
        const originalSrc = file.previewUrl || '';
        if (!originalSrc) throw new Error('Original image preview unavailable for export.');
        const neutralSrc = assetUrl(currentStudy.neutral);
        const { svg, width, height } = await generateValueAnalysisSvg({
          originalSrc,
          neutralSrc,
          previewSrc: '',
          neutralWidth: currentStudy.neutralWidth,
          neutralHeight: currentStudy.neutralHeight,
          previewWidth: currentStudy.previewWidth,
          previewHeight: currentStudy.previewHeight,
          p10: currentStudy.p10,
          p90: currentStudy.p90,
          p01: currentStudy.p01,
          p99: currentStudy.p99,
          bucketValues: currentStudy.bucketValues,
          boundaries: currentStudy.boundaries,
          counts: currentStudy.counts,
          histogramBins: currentStudy.histogramBins,
          levels: currentStudy.levels,
          background: 'none',
          includeNeutral: true,
          includeOriginal: true,
          includeRangeFinder: false,
          includeHistogram: false,
          includeSimplified: false
        });
        const scale = Math.max(1, Math.min(4, deps.getExportScale()));
        const blob = await svgToPngBlob(svg, width, height, scale);
        const bridge = await getFsBridge();
        const { canceled } = await bridge.saveBlob(blob, `${deps.baseName()}-neutral.png`);
        if (canceled) deps.setStatus('Export canceled.', 'info');
        else deps.setStatus('Neutral values PNG saved.', 'info');
      } else {
        const { canceled } = await saveFromPath(
          currentStudy.neutral,
          `${deps.baseName()}-neutral.png`
        );
        if (canceled) deps.setStatus('Export canceled.', 'info');
        else deps.setStatus('Neutral image saved.', 'info');
      }
    });
  }

  async function saveRangeFinderChart() {
    const file = deps.getFile();
    if (!file) return;
    await deps.performSave(async () => {
      const { svg, width, height } = await buildValuesSectionSvg('rangeFinder');
      const format = deps.getGraphExportFormat();
      const bridge = await getFsBridge();
      if (format === 'svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const { canceled } = await bridge.saveBlob(blob, `${deps.baseName()}-range-finder.svg`);
        if (canceled) deps.setStatus('Export canceled.', 'info');
        else deps.setStatus('Range finder SVG saved.', 'info');
      } else {
        const scale = Math.max(1, Math.min(4, deps.getExportScale()));
        const blob = await svgToPngBlob(svg, width, height, scale);
        const { canceled } = await bridge.saveBlob(blob, `${deps.baseName()}-range-finder.png`);
        if (canceled) deps.setStatus('Export canceled.', 'info');
        else deps.setStatus('Range finder PNG saved.', 'info');
      }
    });
  }

  async function saveValuesHistogramChart() {
    const file = deps.getFile();
    if (!file) return;
    await deps.performSave(async () => {
      const { svg, width, height } = await buildValuesSectionSvg('histogram');
      const format = deps.getGraphExportFormat();
      const bridge = await getFsBridge();
      if (format === 'svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const { canceled } = await bridge.saveBlob(blob, `${deps.baseName()}-values-histogram.svg`);
        if (canceled) deps.setStatus('Export canceled.', 'info');
        else deps.setStatus('Values histogram SVG saved.', 'info');
      } else {
        const scale = Math.max(1, Math.min(4, deps.getExportScale()));
        const blob = await svgToPngBlob(svg, width, height, scale);
        const { canceled } = await bridge.saveBlob(blob, `${deps.baseName()}-values-histogram.png`);
        if (canceled) deps.setStatus('Export canceled.', 'info');
        else deps.setStatus('Values histogram PNG saved.', 'info');
      }
    });
  }

  async function saveNotanStudyPng() {
    const file = deps.getFile();
    if (!file) return;
    await deps.performSave(async () => {
      const cb = deps.getCheckboxState();
      let svg: string, width: number, height: number;
      if (cb.valuesAllStudies) {
        const [level2, level3, level4, level5] = await Promise.all([
          loadValueAnalysisForExport(2, true),
          loadValueAnalysisForExport(3, false),
          loadValueAnalysisForExport(4, false),
          loadValueAnalysisForExport(5, false)
        ]);
        const toCell = (study: typeof level2): NotanCellData => ({
          previewSrc: assetUrl(study.preview),
          previewWidth: study.previewWidth,
          previewHeight: study.previewHeight,
          bucketValues: study.bucketValues,
          counts: study.counts
        });
        ({ svg, width, height } = await generateNotanStudySvg({
          cells: [toCell(level2), toCell(level3), toCell(level4), toCell(level5)]
        }));
      } else {
        const currentStudy = await ensureValuesData();
        ({ svg, width, height } = await generateSingleCellSvg({
          previewSrc: assetUrl(currentStudy.preview),
          previewWidth: currentStudy.previewWidth,
          previewHeight: currentStudy.previewHeight,
          bucketValues: currentStudy.bucketValues,
          counts: currentStudy.counts
        }));
      }
      const scale = Math.max(1, Math.min(4, deps.getExportScale()));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${deps.baseName()}-notan.png`);
      if (canceled) deps.setStatus('Export canceled.', 'info');
      else deps.setStatus('Notan study PNG saved.', 'info');
    });
  }

  return {
    exportValuesComposite,
    saveNeutralImage,
    saveRangeFinderPng: saveRangeFinderChart,
    saveValuesHistogramPng: saveValuesHistogramChart,
    saveNotanStudyPng
  };
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { getActivePath, setActivePath } from '../services/active-image';
import { subscribePendingVideoSwitch } from '../services/view-subscriptions';
import { analysisState, setAnalysisPending } from './analysis';
import {
  activeImageId,
  appendFile,
  beginSelection,
  clearActiveSelection,
  clearFile,
  getCurrentSelection,
  getResourceCounts,
  images,
  isCurrentSelection,
  pendingVideoSwitch,
  removeFile,
  selectedFile,
  setFile,
  switchToFile,
  switchToVideo,
  type ImageEntry,
  type SelectionAuthority,
} from './image';

const DATASET = { width: 1, height: 1, pixels: new Uint8Array([0, 0, 0, 255]) };

function still(id: string, path = `/tmp/${id}.png`): ImageEntry {
  return {
    id,
    name: `${id}.png`,
    path,
    size: 4,
    source: { kind: 'path', path },
    previewUrl: `asset://${path}`,
  };
}

function video(id: string, path = `/tmp/${id}.mp4`): ImageEntry {
  return {
    id,
    name: `${id}.mp4`,
    path,
    videoPath: path,
    size: 0,
    source: { kind: 'path', path },
    previewUrl: null,
  };
}

describe('canonical image selection and pending-video lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearFile();
  });

  afterEach(() => {
    clearFile();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('SWEEP-013: binds a null target on accepted settlement without advancing its immutable epoch', () => {
    const selection = beginSelection(null);
    const entry = still('normalized');

    expect(setFile(entry, DATASET, { selection })).toBe(true);

    expect(Object.isFrozen(selection)).toBe(true);
    expect(selection).toEqual({ epoch: selection.epoch, mediaId: null });
    expect(getCurrentSelection()).toEqual({
      epoch: selection.epoch,
      mediaId: entry.id,
    });
    expect(isCurrentSelection(selection)).toBe(true);
  });

  it('SWEEP-013: settles current pixels under the same epoch while content revision advances', () => {
    const first = still('frame');
    setFile(first, DATASET);
    const selection = getCurrentSelection();
    const firstRevision = first.contentRevision!;
    const replacement = still('frame');

    expect(setFile(replacement, { ...DATASET, width: 2 }, { selection })).toBe(
      true
    );

    expect(getCurrentSelection().epoch).toBe(selection.epoch);
    expect(replacement.contentRevision).toBeGreaterThan(firstRevision);
    expect(get(selectedFile)?.dataset.width).toBe(2);
  });

  it('SWEEP-013: rejects stale settlement before revision, resources, path, or activation mutate', () => {
    const accepted = still('accepted');
    setFile(accepted, DATASET);
    setActivePath(accepted.path!);
    const stale = beginSelection(null);
    beginSelection('newer-intent');
    const before = getResourceCounts();
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    const rejected: ImageEntry = {
      ...still('rejected'),
      source: { kind: 'blob' },
      previewUrl: 'blob:rejected',
    };

    expect(setFile(rejected, DATASET, { selection: stale })).toBe(false);

    expect(rejected.contentRevision).toBeUndefined();
    expect(getResourceCounts()).toEqual(before);
    expect(get(images).map((entry) => entry.id)).toEqual([accepted.id]);
    expect(get(activeImageId)).toBe(accepted.id);
    expect(getActivePath()).toBe(accepted.path);
    expect(revoke).toHaveBeenCalledWith('blob:rejected');
  });

  it('SWEEP-013: same-ID return gets a new epoch and cannot revive the first visit', () => {
    appendFile(video('a'), DATASET);
    const firstA = switchToVideo('a');
    beginSelection('b');
    const secondA = switchToVideo('a');

    expect(secondA.epoch).toBeGreaterThan(firstA.epoch);
    expect(isCurrentSelection(firstA)).toBe(false);
    expect(
      setFile(still('first-a-frame'), DATASET, { selection: firstA })
    ).toBe(false);
    expect(isCurrentSelection(secondA)).toBe(true);
  });

  it('SWEEP-013: stored selection advances epoch without changing content revision', () => {
    const entry = still('stored');
    setFile(entry, DATASET);
    const revision = entry.contentRevision;
    const firstEpoch = getCurrentSelection().epoch;

    expect(switchToFile(entry.id)).toBe(true);

    expect(getCurrentSelection()).toMatchObject({ mediaId: entry.id });
    expect(getCurrentSelection().epoch).toBe(firstEpoch + 1);
    expect(get(selectedFile)?.contentRevision).toBe(revision);
  });

  it('SWEEP-013: inactive append preserves intent while current-target replacement revokes it', () => {
    const current = still('current');
    setFile(current, DATASET);
    const active = getCurrentSelection();

    appendFile(still('inactive'), DATASET);
    expect(getCurrentSelection()).toEqual(active);

    appendFile(still('current', '/tmp/current-replacement.png'), DATASET);
    expect(getCurrentSelection().epoch).toBe(active.epoch + 1);
    expect(getCurrentSelection().mediaId).toBe(current.id);
  });

  it.each<{
    label: string;
    act: () => void;
  }>([
    { label: 'stored still selection', act: () => void switchToFile('still') },
    {
      label: 'new still admission',
      act: () => void setFile(still('new'), DATASET),
    },
    { label: 'active clear', act: () => clearActiveSelection() },
    { label: 'full clear', act: () => clearFile() },
    { label: 'intended removal', act: () => removeFile('video') },
    {
      label: 'intended replacement',
      act: () => appendFile(video('video', '/tmp/video-replaced.mp4'), DATASET),
    },
  ])(
    'SWEEP-013: $label cancels a pre-dispatch video switch',
    async ({ act }) => {
      appendFile(still('still'), DATASET);
      appendFile(video('video'), DATASET);
      const callback = vi.fn();
      const unsubscribe = subscribePendingVideoSwitch(callback);
      switchToVideo('video');

      act();
      await vi.advanceTimersByTimeAsync(150);

      expect(callback).not.toHaveBeenCalled();
      expect(get(pendingVideoSwitch)).toBeNull();
      unsubscribe();
    }
  );

  it('SWEEP-013: delivers the captured current authority with a pending video event', async () => {
    appendFile(video('video'), DATASET);
    const callback = vi.fn();
    const unsubscribe = subscribePendingVideoSwitch(callback);
    const selection = switchToVideo('video');

    await vi.advanceTimersByTimeAsync(150);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'video',
        videoPath: '/tmp/video.mp4',
        selection,
      })
    );
    expect(get(pendingVideoSwitch)).toBeNull();
    unsubscribe();
  });

  it('SWEEP-013: suppresses an obsolete event at delivery', () => {
    appendFile(video('video'), DATASET);
    const stale = beginSelection('video');
    const current = beginSelection('other');
    pendingVideoSwitch.set({ id: 'video', cid: 'stale', selection: stale });
    const callback = vi.fn();

    const unsubscribe = subscribePendingVideoSwitch(callback);

    expect(callback).not.toHaveBeenCalled();
    expect(isCurrentSelection(current)).toBe(true);
    expect(get(pendingVideoSwitch)).toBeNull();
    unsubscribe();
  });

  it('SWEEP-013: removing the old displayed still preserves a newer pending video intent', async () => {
    setFile(still('displayed'), DATASET);
    appendFile(video('wanted'), DATASET);
    const wanted = switchToVideo('wanted');

    removeFile('displayed');

    expect(isCurrentSelection(wanted)).toBe(true);
    expect(get(activeImageId)).toBeNull();
    await vi.advanceTimersByTimeAsync(150);
    expect(get(pendingVideoSwitch)?.selection).toBe(wanted);
  });

  it('SWEEP-013: removing the intended target selects a successor under one new epoch', () => {
    setFile(still('target'), DATASET);
    appendFile(still('successor'), DATASET);
    const before = getCurrentSelection();

    removeFile('target');

    expect(getCurrentSelection()).toEqual({
      epoch: before.epoch + 1,
      mediaId: 'successor',
    });
    expect(get(selectedFile)?.id).toBe('successor');
  });

  it('SWEEP-013: inactive removal and bare epoch changes leave current work untouched', () => {
    setFile(still('current'), DATASET);
    appendFile(still('inactive'), DATASET);
    const pendingToken = setAnalysisPending();
    const selected = getCurrentSelection();

    removeFile('inactive');
    expect(getCurrentSelection()).toEqual(selected);
    beginSelection('another');

    expect(get(analysisState)).toBe('pending');
    expect(pendingToken).toBeGreaterThan(0);
  });
});

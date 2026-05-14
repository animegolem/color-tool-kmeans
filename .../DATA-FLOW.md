# Data Flow Reference

Reference document for the Tauri desktop app (Svelte 5 + Rust) data flow paths.
Based on codebase audit of media ingestion, analysis triggers, video state, and store dependencies.

---

## 1. Media Ingestion Flow

Three entry points, all converging at shared store functions.

### Entry Points

| Entry Point | Location | Trigger | Notes |
|---|---|---|---|
| **A. App Shell** | `App.svelte:65-108` | `globalChooseMedia()` | Fallback for Exports/Settings views |
| **B. HomeView** | `file-ingestion.svelte.ts` | `chooseMedia()` or drag-drop | Immediate analysis scheduling |
| **C. ValuesView** | `ValuesView.svelte:214-283` | `handleUpload()` or drag-drop | Includes video probe logic |

### A. App Shell (`globalChooseMedia()`)

```
globalChooseMedia()
  -> getFsBridge().openMediaFiles()          # native file dialog
  -> create ImageEntry objects (empty datasets)
  -> first file:  setFile() + set __ACTIVE_IMAGE_PATH__
     additional:  appendFile()
```

Used as fallback when current view is Exports or Settings. Home and Values views delegate via `requestMediaLoad`.

### B. HomeView (`file-ingestion.svelte.ts`)

```
createFileIngestion() factory
  -> chooseMedia()
  -> processBatch()
  -> ingestSelection()
       |
       +--> native mode: empty dataset (Tauri bridge handles pixels)
       +--> browser mode: loadImageDataset(blob)
       |
       +--> video files  -> loadVideoSelection() (video controller)
       +--> image files  -> ingestFileAsEntry() with thumbnail
       |
       -> scheduleAnalysisWith()   # immediate analysis for activated files

Drag-drop: setupTauriDragDrop() -> same processBatch() pipeline
```

### C. ValuesView (`ValuesView.svelte:214-283`)

```
handleUpload()
  -> processBatch()
       |
       +--> handleVideoFile()
       |      -> probeAndSetVideoState()   # checks cache first, probes if needed
       |
       +--> handleImageFile()
              -> ingestFileAsEntry()
              -> first: setFile()  /  additional: appendFile()

Drag-drop: inline listener in onMount()
```

### Convergence Point (Store Functions)

All three paths write through these store functions in `ui.ts`:

| Function | Behavior |
|---|---|
| `setFile(entry, dataset)` | Adds to `images`, sets `activeImageId`, checks analysis cache |
| `appendFile(entry, dataset)` | Adds to `images` without changing active selection |
| `switchToFile(id)` | Changes `activeImageId`, clears video state |
| `switchToVideo(id)` | Debounced 150ms, sets `pendingVideoSwitch` |

---

## 2. Color Analysis Trigger Flow

### HomeView (two trigger mechanisms)

```
                      +-- Reactive: $effect watches selectedFile + params
                      |
scheduleAnalysisWith <-+
                      |
                      +-- Imperative: ingestSelection() calls directly after setFile()
                      |
                      v
           analysis-runner.svelte.ts
                      |
              debounce 400ms
              dedup key check
                      |
                      v
           analyzeImage() Tauri command
                      |
                      v
           analysisById[imageId] = result
```

### ExportsView (independent auto-trigger)

```
$effect
  -> file exists but no cached result?
  -> ensureColorAnalysis()
  -> analyzeImage() Tauri command
     (no dedup key, no scroll lock -- simpler than HomeView)
```

---

## 3. Value Analysis Trigger Flow

ValuesView uses `value-analysis-runner.svelte.ts`:

```
ensureAnalysis(file, levels, notanMode)
  -> runValueAnalysis() Tauri command
  -> result cached by composite key: imageId:levels:mode
```

| Trigger | Context |
|---|---|
| Store subscription on `selectedFile` change | Normal file switch |
| `onFrameExtracted` callback | After video frame decode |
| `$effect` at ValuesView:312 | Edge case: raw video file needing frame extraction first |

---

## 4. Video State Propagation

```
User clicks video in MediaBucket
  -> switchToVideo(id)                [ui.ts:442]
  -> debounce 150ms
  -> pendingVideoSwitch.set({id, cid})
     |
     +---------------------------+---------------------------+
     |                           |                           |
     v                           v                           |
HomeView subscriber          ValuesView subscriber           |
  (line 282)                   (line 287)                    |
     |                           |                           |
     v                           v                           |
entry lookup                 entry lookup                    |
clear active image           handleVideoFile()               |
video.loadVideoSelection()   probeAndSetVideoState()         |
     |                           |                           |
     v                           v                           |
Check session cache          Check session cache             |
  -> getCachedVideoState()     -> getCachedVideoState()      |
  -> restore time/poster/      -> restore time/poster        |
     strip                     OR probe via ffmpeg           |
  OR probe via ffmpeg            |                           |
     |                           |                           |
     v                           v                           |
setVideoState(store)         setVideoState(store)            |
     |                           |                           |
     +---------------------------+                           |
     |                                                       |
     v                                                       |
Both views subscribe to videoState for cross-view sync
```

**Session cache:** `videoStateCache` (Map in `ui.ts`) preserves scrub position, strip path, and poster path across view switches. Not persisted to disk.

---

## 5. Export Data Dependencies

ExportsView is a **read-only consumer** with no ingestion code.

```
           selectedFile ----+
          analysisResult ---+--> ExportsView
                params -----+       |
            videoState -----+       +--> ensureColorAnalysis()
        export settings ----+       |      (auto-trigger if file exists, no cached result)
                                    |
                                    +--> createValuesExportRunner()
                                           reads valueAnalysisResult internally
```

All file changes flow through: MediaBucket -> store -> derived stores -> ExportsView.

---

## 6. Store Dependency Graph

```
navigation.ts      <- no deps
     |
image.ts           <- depends on analysis.ts (resetAnalysis),
     |                            video.ts (setVideoState)
     |
analysis.ts        <- depends on image.ts (activeImageId) [via derived stores]
     |
value-analysis.ts  <- depends on image.ts (activeImageId) [via derived stores]

video.ts           <- no store deps (standalone)
exports.ts         <- no store deps (standalone)
zoom.ts            <- no store deps (standalone)
preferences.ts     <- reads from all stores for persistence write-back
```

All dependencies are **one-directional**. No circular dependencies detected during audit.

### Dependency Direction Summary

| Store | Reads From | Written By |
|---|---|---|
| `images`, `activeImageId` | -- | `setFile`, `appendFile`, `switchToFile` |
| `analysisById` | `activeImageId` (derived) | `analysis-runner` |
| `valueAnalysisByKey` | `activeImageId` (derived) | `value-analysis-runner` |
| `videoState` | -- | `video-controller`, `probeAndSetVideoState` |
| `params` | -- | `ParameterControls` UI |
| `zoomOverlay` | -- | `openZoomOverlay`, `closeZoomOverlay` |

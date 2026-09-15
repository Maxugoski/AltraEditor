import { create } from 'zustand';
import {
  ProjectState,
  Track,
  Clip,
  MediaType,
  TrackType,
  AspectRatio,
  Transform,
  ChromaKeySettings,
  FilterSettings,
  SubtitleCue,
  MediaAsset,
  TextStyle,
  CaptionTemplateId,
} from '@/types/editor';
import { getTemplateConfig } from '@/lib/caption/captionTemplates';

const DEFAULT_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
};

const DEFAULT_CHROMA_KEY: ChromaKeySettings = {
  enabled: false,
  color: '#00FF00',
  similarity: 0.35,
  smoothness: 0.1,
  spill: 0.4,
};

const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  hueRotate: 0,
  sepia: 0,
  grayscale: 0,
};

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 48,
  fontWeight: 'bold',
  color: '#FFFFFF',
  textAlign: 'center',
  outlineColor: '#000000',
  outlineWidth: 3,
  shadowColor: 'rgba(0,0,0,0.7)',
  shadowBlur: 10,
};

const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '21:9': { width: 2560, height: 1080 },
};

interface HistoryState {
  tracks: Track[];
  durationMs: number;
}

interface EditorStore extends ProjectState {
  mediaAssets: MediaAsset[];
  history: HistoryState[];
  historyIndex: number;

  // Navigation & Playback
  setPlayhead: (ms: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setZoom: (zoom: number) => void;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  setProjectTitle: (title: string) => void;

  // Media Bin
  addMediaAsset: (asset: MediaAsset) => void;
  removeMediaAsset: (id: string) => void;

  // Selection
  selectClip: (clipId: string | null) => void;
  selectTrack: (trackId: string | null) => void;

  // Clips Management
  clipboardClip: Clip | null;
  addClip: (trackId: string, clipData: Partial<Clip>, atMs?: number) => Clip;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  updateClipTransform: (clipId: string, transform: Partial<Transform>) => void;
  updateClipTrim: (clipId: string, startMs: number, durationMs: number, sourceStartMs: number, saveUndo?: boolean) => void;
  moveClip: (clipId: string, targetTrackId: string, newStartMs: number, saveUndo?: boolean) => void;
  splitClipAtPlayhead: (clipId?: string) => void;
  duplicateClip: (clipId: string) => void;
  copyClip: (clipId?: string) => void;
  pasteClip: (atMs?: number) => void;

  // Tracks Management
  addTrack: (type: TrackType, name?: string) => string;
  removeTrack: (trackId: string) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  reorderTracks: (startIndex: number, endIndex: number) => void;

  // Visual Effects & AI
  setChromaKey: (clipId: string, settings: Partial<ChromaKeySettings>) => void;
  setFilters: (clipId: string, filters: Partial<FilterSettings>) => void;
  addSubtitleCues: (clipId: string, cues: SubtitleCue[]) => void;
  updateSubtitleCue: (clipId: string, cueId: string, text: string) => void;
  updateSubtitleWord: (clipId: string, cueId: string, wordId: string, newText: string) => void;
  deleteSubtitleCue: (clipId: string, cueId: string) => void;
  applyCaptionTemplate: (clipId: string, templateId: CaptionTemplateId) => void;

  // Export & Processing Status
  setExportState: (isExporting: boolean, progress?: number, message?: string) => void;
  setTranscriptionState: (isTranscribing: boolean, progress?: number) => void;

  // Undo / Redo
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Starter demo project generator
  loadSampleProject: () => void;
}

// No pre-defined tracks — tracks are created dynamically when content is added
const INITIAL_TRACKS: Track[] = [];

function calculateProjectDuration(tracks: Track[]): number {
  let maxDuration = 10000; // minimum 10 seconds
  for (const track of tracks) {
    for (const clip of track.clips) {
      const clipEnd = clip.startMs + clip.durationMs;
      if (clipEnd > maxDuration) {
        maxDuration = clipEnd;
      }
    }
  }
  return maxDuration + 2000; // 2s padding
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  id: 'project-1',
  title: 'Altra Cinematic Project',
  aspectRatio: '16:9',
  canvasWidth: 1920,
  canvasHeight: 1080,
  fps: 30,
  durationMs: 30000,
  tracks: INITIAL_TRACKS,
  selectedClipId: null,
  selectedTrackId: null,
  playheadMs: 0,
  isPlaying: false,
  zoom: 80, // 80px per second default
  isExporting: false,
  exportProgress: 0,
  exportStatusMessage: '',
  isTranscribing: false,
  transcriptionProgress: 0,
  clipboardClip: null,
  mediaAssets: [],
  history: [{ tracks: INITIAL_TRACKS, durationMs: 30000 }],
  historyIndex: 0,

  setPlayhead: (ms) => {
    const duration = get().durationMs;
    const clamped = Math.max(0, Math.min(ms, duration));
    set({ playheadMs: clamped });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => {
    const isPlaying = get().isPlaying;
    const playhead = get().playheadMs;
    const duration = get().durationMs;
    if (!isPlaying && playhead >= duration) {
      set({ playheadMs: 0, isPlaying: true });
    } else {
      set({ isPlaying: !isPlaying });
    }
  },

  setZoom: (zoom) => set({ zoom: Math.max(20, Math.min(zoom, 400)) }),

  setAspectRatio: (aspectRatio) => {
    const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio];
    set({
      aspectRatio,
      canvasWidth: dims.width,
      canvasHeight: dims.height,
    });
  },

  setProjectTitle: (title) => set({ title }),

  addMediaAsset: (asset) =>
    set((state) => ({
      mediaAssets: [asset, ...state.mediaAssets],
    })),

  removeMediaAsset: (id) =>
    set((state) => ({
      mediaAssets: state.mediaAssets.filter((a) => a.id !== id),
    })),

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),

  saveHistory: () => {
    const { tracks, durationMs, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      tracks: JSON.parse(JSON.stringify(tracks)),
      durationMs,
    });
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        tracks: JSON.parse(JSON.stringify(prev.tracks)),
        durationMs: prev.durationMs,
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        tracks: JSON.parse(JSON.stringify(next.tracks)),
        durationMs: next.durationMs,
        historyIndex: historyIndex + 1,
      });
    }
  },

  addClip: (trackId, clipData, atMs) => {
    const { tracks, playheadMs, saveHistory } = get();
    const startMs = atMs !== undefined ? atMs : playheadMs;

    const newClip: Clip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackId,
      name: clipData.name || 'New Clip',
      type: clipData.type || 'video',
      src: clipData.src || '',
      startMs: Math.max(0, startMs),
      durationMs: clipData.durationMs || 5000,
      sourceStartMs: clipData.sourceStartMs || 0,
      sourceDurationMs: clipData.sourceDurationMs || clipData.durationMs || 5000,
      volume: clipData.volume !== undefined ? clipData.volume : 1,
      playbackRate: clipData.playbackRate || 1,
      muted: clipData.muted || false,
      transform: clipData.transform || { ...DEFAULT_TRANSFORM },
      chromaKey: clipData.chromaKey || { ...DEFAULT_CHROMA_KEY },
      filters: clipData.filters || { ...DEFAULT_FILTERS },
      textContent: clipData.textContent || '',
      textStyle: clipData.textStyle || (clipData.type === 'text' || clipData.type === 'subtitle' ? { ...DEFAULT_TEXT_STYLE } : undefined),
      subtitleCues: clipData.subtitleCues,
      waveform: clipData.waveform,
      thumbnail: clipData.thumbnail,
    };

    const newTracks = tracks.map((track) => {
      if (track.id === trackId) {
        return {
          ...track,
          clips: [...track.clips, newClip],
        };
      }
      return track;
    });

    const newDuration = calculateProjectDuration(newTracks);
    set({
      tracks: newTracks,
      durationMs: newDuration,
      selectedClipId: newClip.id,
    });
    saveHistory();
    return newClip;
  },

  removeClip: (clipId) => {
    const { tracks, saveHistory } = get();
    const newTracks = tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((c) => c.id !== clipId),
    }));
    const newDuration = calculateProjectDuration(newTracks);
    set({
      tracks: newTracks,
      durationMs: newDuration,
      selectedClipId: get().selectedClipId === clipId ? null : get().selectedClipId,
    });
    saveHistory();
  },

  updateClip: (clipId, updates) => {
    const { tracks, saveHistory } = get();
    const newTracks = tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id === clipId) {
          return { ...clip, ...updates };
        }
        return clip;
      }),
    }));
    const newDuration = calculateProjectDuration(newTracks);
    set({ tracks: newTracks, durationMs: newDuration });
    saveHistory();
  },

  updateClipTransform: (clipId, transformUpdates) => {
    const { tracks } = get();
    const newTracks = tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id === clipId) {
          return {
            ...clip,
            transform: {
              ...clip.transform,
              ...transformUpdates,
            },
          };
        }
        return clip;
      }),
    }));
    set({ tracks: newTracks });
  },

  updateClipTrim: (clipId, startMs, durationMs, sourceStartMs, saveUndo = false) => {
    const { tracks, saveHistory } = get();
    const newTracks = tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id === clipId) {
          return {
            ...clip,
            startMs: Math.max(0, startMs),
            durationMs: Math.max(200, durationMs), // minimum 200ms
            sourceStartMs: Math.max(0, sourceStartMs),
          };
        }
        return clip;
      }),
    }));
    const newDuration = calculateProjectDuration(newTracks);
    set({ tracks: newTracks, durationMs: newDuration });
    if (saveUndo) {
      saveHistory();
    }
  },

  moveClip: (clipId, targetTrackId, newStartMs, saveUndo = false) => {
    const { tracks, saveHistory } = get();
    let movingClip = null;
    const tracksWithoutClip = tracks.map(track => {
      const found = track.clips.find(c => c.id === clipId);
      if (found) {
        movingClip = { ...found, trackId: targetTrackId, startMs: Math.max(0, newStartMs) };
        // Same-track move: just update start time
        if (track.id === targetTrackId) {
          return {
            ...track,
            clips: track.clips.map(c => (c.id === clipId ? movingClip : c)),
          };
        }
        // Remove from source track
        return { ...track, clips: track.clips.filter(c => c.id !== clipId) };
      }
      return track;
    });

    if (!movingClip) return;

    // Add to target track if different
    const finalTracks = tracksWithoutClip.map(track => {
      if (track.id === targetTrackId && !track.clips.find(c => c.id === movingClip.id)) {
        return { ...track, clips: [...track.clips, movingClip] };
      }
      return track;
    });

    // Sort clips by startMs for proper rendering
    const sortedTracks = finalTracks.map(t => ({
      ...t,
      clips: t.clips.slice().sort((a, b) => a.startMs - b.startMs),
    }));

    const newDuration = calculateProjectDuration(sortedTracks);
    set({ tracks: sortedTracks, durationMs: newDuration });
    if (saveUndo) {
      saveHistory();
    }
  },

  splitClipAtPlayhead: (clipId) => {
    const { tracks, playheadMs, selectedClipId, saveHistory } = get();
    const targetClipId = clipId || selectedClipId;

    let didSplit = false;
    const newTracks = tracks.map((track) => {
      const clipIndex = track.clips.findIndex((c) => {
        if (targetClipId) return c.id === targetClipId;
        return playheadMs > c.startMs && playheadMs < c.startMs + c.durationMs;
      });

      if (clipIndex === -1) return track;

      const clip = track.clips[clipIndex];
      const offsetMs = playheadMs - clip.startMs;

      // Ensure cut is not at immediate boundaries
      if (offsetMs <= 200 || offsetMs >= clip.durationMs - 200) {
        return track;
      }

      const leftClipDuration = offsetMs;
      const rightClipDuration = clip.durationMs - offsetMs;
      const rightSourceStart = clip.sourceStartMs + offsetMs;

      const leftClip: Clip = {
        ...clip,
        durationMs: leftClipDuration,
      };

      const rightClip: Clip = {
        ...clip,
        id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        startMs: playheadMs,
        durationMs: rightClipDuration,
        sourceStartMs: rightSourceStart,
      };

      const updatedClips = [...track.clips];
      updatedClips.splice(clipIndex, 1, leftClip, rightClip);
      didSplit = true;

      return {
        ...track,
        clips: updatedClips,
      };
    });

    if (didSplit) {
      set({ tracks: newTracks });
      saveHistory();
    }
  },

  duplicateClip: (clipId) => {
    const { tracks, saveHistory } = get();
    let newClip: Clip | null = null;

    const newTracks = tracks.map((track) => {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) {
        newClip = {
          ...JSON.parse(JSON.stringify(clip)),
          id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          startMs: clip.startMs + clip.durationMs + 200,
        };
        return {
          ...track,
          clips: [...track.clips, newClip!],
        };
      }
      return track;
    });

    if (newClip) {
      const newDuration = calculateProjectDuration(newTracks);
      set({ tracks: newTracks, durationMs: newDuration, selectedClipId: (newClip as Clip).id });
      saveHistory();
    }
  },

  copyClip: (clipId) => {
    const { tracks, selectedClipId } = get();
    const targetId = clipId || selectedClipId;
    if (!targetId) return;

    const clip = tracks.flatMap((t) => t.clips).find((c) => c.id === targetId);
    if (clip) {
      set({ clipboardClip: JSON.parse(JSON.stringify(clip)) });
    }
  },

  pasteClip: (atMs) => {
    const { clipboardClip, playheadMs, tracks, saveHistory } = get();
    if (!clipboardClip) return;

    const targetStartMs = atMs !== undefined ? atMs : playheadMs;
    // Find track of matching type, or original track, or first track
    let targetTrack = tracks.find((t) => t.id === clipboardClip.trackId);
    if (!targetTrack) {
      targetTrack = tracks.find((t) => t.type === clipboardClip.type) || tracks[0];
    }
    if (!targetTrack) return;

    const newClip: Clip = {
      ...JSON.parse(JSON.stringify(clipboardClip)),
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackId: targetTrack.id,
      startMs: Math.max(0, targetStartMs),
    };

    const newTracks = tracks.map((t) => {
      if (t.id === targetTrack!.id) {
        return {
          ...t,
          clips: [...t.clips, newClip],
        };
      }
      return t;
    });

    const newDuration = calculateProjectDuration(newTracks);
    set({
      tracks: newTracks,
      durationMs: newDuration,
      selectedClipId: newClip.id,
    });
    saveHistory();
  },

  addTrack: (type, name) => {
    const { tracks, saveHistory } = get();
    const id = `track-${type}-${Date.now()}`;
    const newTrack: Track = {
      id,
      name: name || `${type.toUpperCase()} Track ${tracks.filter((t) => t.type === type).length + 1}`,
      type,
      clips: [],
      muted: false,
      locked: false,
      visible: true,
      volume: 1,
    };
    set({ tracks: [...tracks, newTrack] });
    saveHistory();
    return id;
  },

  removeTrack: (trackId) => {
    const { tracks, saveHistory } = get();
    const newTracks = tracks.filter((t) => t.id !== trackId);
    set({ tracks: newTracks });
    saveHistory();
  },

  toggleTrackMute: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
    })),

  toggleTrackLock: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t)),
    })),

  toggleTrackVisibility: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t)),
    })),

  setTrackVolume: (trackId, volume) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, volume } : t)),
    })),

  reorderTracks: (startIndex, endIndex) => {
    const { tracks, saveHistory } = get();
    const result = Array.from(tracks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    set({ tracks: result });
    saveHistory();
  },

  setChromaKey: (clipId, settings) => {
    const { tracks } = get();
    const newTracks = tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) =>
        c.id === clipId ? { ...c, chromaKey: { ...c.chromaKey, ...settings } } : c
      ),
    }));
    set({ tracks: newTracks });
  },

  setFilters: (clipId, filters) => {
    const { tracks } = get();
    const newTracks = tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) =>
        c.id === clipId ? { ...c, filters: { ...c.filters, ...filters } } : c
      ),
    }));
    set({ tracks: newTracks });
  },

  addSubtitleCues: (clipId, cues) => {
    const { tracks, saveHistory } = get();
    const newTracks = tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) =>
        c.id === clipId ? { ...c, subtitleCues: cues } : c
      ),
    }));
    set({ tracks: newTracks });
    saveHistory();
  },

  updateSubtitleCue: (clipId, cueId, text) => {
    const { tracks, saveHistory } = get();
    const newTracks = tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id === clipId && c.subtitleCues) {
          return {
            ...c,
            subtitleCues: c.subtitleCues.map((cue) =>
              cue.id === cueId ? { ...cue, text } : cue
            ),
          };
        }
        return c;
      }),
    }));
    set({ tracks: newTracks });
    saveHistory();
  },

  updateSubtitleWord: (clipId, cueId, wordId, newText) => {
    const { tracks, saveHistory } = get();
    const newTracks = tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id === clipId && c.subtitleCues) {
          return {
            ...c,
            subtitleCues: c.subtitleCues.map((cue) => {
              if (cue.id === cueId && cue.words) {
                const updatedWords = cue.words.map((w) =>
                  w.id === wordId ? { ...w, text: newText } : w
                );
                return {
                  ...cue,
                  text: updatedWords.map((w) => w.text).join(' '),
                  words: updatedWords,
                };
              }
              return cue;
            }),
          };
        }
        return c;
      }),
    }));
    set({ tracks: newTracks });
    saveHistory();
  },

  deleteSubtitleCue: (clipId, cueId) => {
    const { tracks, saveHistory } = get();
    const newTracks = tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id === clipId && c.subtitleCues) {
          return {
            ...c,
            subtitleCues: c.subtitleCues.filter((cue) => cue.id !== cueId),
          };
        }
        return c;
      }),
    }));
    set({ tracks: newTracks });
    saveHistory();
  },

  applyCaptionTemplate: (clipId, templateId) => {
    const { tracks, saveHistory } = get();
    const templateConfig = getTemplateConfig(templateId);
    const newTracks = tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id === clipId) {
          return {
            ...c,
            textStyle: {
              ...(c.textStyle || {}),
              ...templateConfig.style,
            },
          };
        }
        return c;
      }),
    }));
    set({ tracks: newTracks });
    saveHistory();
  },

  setExportState: (isExporting, progress = 0, message = '') =>
    set({
      isExporting,
      exportProgress: progress,
      exportStatusMessage: message,
    }),

  setTranscriptionState: (isTranscribing, progress = 0) =>
    set({
      isTranscribing,
      transcriptionProgress: progress,
    }),

  loadSampleProject: () => {
    set({
      tracks: [],
      durationMs: 30000,
      playheadMs: 0,
      selectedClipId: null,
      selectedTrackId: null,
      mediaAssets: [],
      history: [{ tracks: [], durationMs: 30000 }],
      historyIndex: 0,
    });
  },
}));

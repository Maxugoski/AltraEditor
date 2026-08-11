export type MediaType = 'video' | 'audio' | 'image' | 'text' | 'subtitle' | 'overlay';

export type TrackType = 'video' | 'audio' | 'text' | 'overlay';

export interface Transform {
  x: number; // offset in px relative to canvas center
  y: number; // offset in px relative to canvas center
  scale: number; // 1.0 = 100%
  rotation: number; // degrees 0-360
  opacity: number; // 0.0 - 1.0
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string; // hex color code (e.g. #00FF00)
  similarity: number; // 0.0 - 1.0 (threshold tolerance)
  smoothness: number; // 0.0 - 1.0
  spill: number; // 0.0 - 1.0 (spill reduction)
}

export interface FilterSettings {
  brightness: number; // 0 - 200% (default 100)
  contrast: number; // 0 - 200% (default 100)
  saturation: number; // 0 - 200% (default 100)
  blur: number; // 0 - 50px (default 0)
  hueRotate: number; // 0 - 360 deg (default 0)
  sepia: number; // 0 - 100% (default 0)
  grayscale: number; // 0 - 100% (default 0)
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number; // px
  fontWeight: 'normal' | 'bold' | '600' | '800';
  color: string; // hex color
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  shadowColor?: string;
  shadowBlur?: number;
}

export interface Transition {
  type: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'crossfade' | 'wipe-left';
  duration: number; // ms
}

export interface Keyframe {
  id: string;
  timeMs: number;
  transform: Partial<Transform>;
}

export interface SubtitleCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  type: MediaType;
  src: string; // object URL or data URL
  
  // Timing on timeline
  startMs: number; // start time in the overall project timeline
  durationMs: number; // duration of the clip on timeline
  
  // Source trim bounds
  sourceStartMs: number; // start offset within original source media
  sourceDurationMs: number; // original source media total duration
  
  // Audio & Playback
  volume: number; // 0.0 - 2.0 (1.0 = 100%)
  playbackRate: number; // 0.25 - 4.0 (1.0 = normal)
  muted: boolean;
  
  // Visuals & Effects
  transform: Transform;
  fitMode?: 'contain' | 'cover'; // default 'contain' (preserve aspect ratio)
  chromaKey: ChromaKeySettings;
  filters: FilterSettings;
  transitionIn?: Transition;
  transitionOut?: Transition;
  
  // Type specific properties
  textContent?: string;
  textStyle?: TextStyle;
  subtitleCues?: SubtitleCue[];
  
  // Keyframes
  keyframes?: Keyframe[];

  // Waveform data (for audio/video visualization)
  waveform?: number[];
  thumbnail?: string;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
  volume: number; // track master volume
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export interface ProjectState {
  id: string;
  title: string;
  aspectRatio: AspectRatio;
  canvasWidth: number;
  canvasHeight: number;
  fps: number;
  durationMs: number;
  tracks: Track[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  playheadMs: number;
  isPlaying: boolean;
  zoom: number; // px per second
  isExporting: boolean;
  exportProgress: number;
  exportStatusMessage: string;
  isTranscribing: boolean;
  transcriptionProgress: number;
}

export interface ExportSettings {
  format: 'mp4' | 'webm' | 'gif';
  resolution: '1080p' | '720p' | '4k' | 'custom';
  width: number;
  height: number;
  fps: number;
  quality: 'high' | 'medium' | 'low';
  bitrateKbps: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  src: string;
  durationMs: number;
  sizeBytes: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  waveform?: number[];
}

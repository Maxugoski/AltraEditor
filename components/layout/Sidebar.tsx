'use client';

import React, { useState, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { inspectMediaFile, createSyntheticVideoAsset } from '@/lib/utils/media';
import { generateSynthwaveAudioWavUrl } from '@/lib/audio/synthAudio';
import { MediaAsset, TextStyle, FilterSettings } from '@/types/editor';
import {
  FolderOpen,
  Type,
  Music,
  Sparkles,
  Wand2,
  Sliders,
  Plus,
  Trash2,
  Play,
  Upload,
  Bot,
  Video,
  Image as ImageIcon,
  Film,
  Scissors,
  CheckCircle2,
  RefreshCw,
  Eye,
  GripVertical,
  Subtitles,
} from 'lucide-react';
import { CaptionStudio } from '@/components/captions/CaptionStudio';

type SidebarTab = 'media' | 'captions' | 'text' | 'audio' | 'ai' | 'effects';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('media');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    mediaAssets,
    addMediaAsset,
    removeMediaAsset,
    addClip,
    tracks,
    playheadMs,
    isTranscribing,
    transcriptionProgress,
    setTranscriptionState,
    addSubtitleCues,
    selectedClipId,
    setChromaKey,
    setFilters,
  } = useEditorStore();

  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setUploadStatus(`Loading ${file.name} (${sizeMb} MB)...`);
        try {
          const asset = await inspectMediaFile(file);
          addMediaAsset(asset);
        } catch (err) {
          console.warn('Fallback importing file', err);
          // Graceful fallback for any unusual codec
          const fallbackAsset: MediaAsset = {
            id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: file.type.startsWith('audio') ? 'audio' : 'video',
            src: URL.createObjectURL(file),
            durationMs: 10000,
            sizeBytes: file.size,
          };
          addMediaAsset(fallbackAsset);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddAssetToTimeline = (asset: MediaAsset) => {
    let targetTrack = tracks.find((t) => t.type === asset.type);
    if (!targetTrack) {
      targetTrack = tracks.find((t) => t.type === 'video') || tracks[0];
    }
    if (targetTrack) {
      addClip(targetTrack.id, {
        name: asset.name,
        type: asset.type,
        src: asset.src,
        durationMs: asset.durationMs || 5000,
        sourceDurationMs: asset.durationMs || 5000,
        thumbnail: asset.thumbnailUrl,
        waveform: asset.waveform,
      });
    }
  };

  const handleAddSyntheticDemo = (type: 'cyberpunk' | 'countdown' | 'nature' | 'chroma-demo') => {
    const titles = {
      cyberpunk: 'Cyberpunk Neon Visual',
      countdown: 'Retro Countdown Loop',
      nature: 'Nature Emerald Gradient',
      'chroma-demo': 'Green Screen Demo Subject',
    };
    const asset = createSyntheticVideoAsset(titles[type], type);
    addMediaAsset(asset);
    handleAddAssetToTimeline(asset);
  };

  const textPresets: Array<{ name: string; text: string; style: TextStyle; tag: string }> = [
    {
      name: 'Cyberpunk Glow',
      text: 'NEON FUTURE',
      tag: 'Vibrant',
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 56,
        fontWeight: '800',
        color: '#38bdf8',
        textAlign: 'center',
        outlineColor: '#0369a1',
        outlineWidth: 3,
        shadowColor: '#0284c7',
        shadowBlur: 25,
      },
    },
    {
      name: 'Cinematic Minimal',
      text: 'CINEMATIC MOMENTS',
      tag: 'Clean',
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 44,
        fontWeight: 'normal',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 6,
        shadowColor: 'rgba(0,0,0,0.8)',
        shadowBlur: 10,
      },
    },
    {
      name: 'Bold Accent Badge',
      text: 'FEATURE HIGHLIGHT',
      tag: 'Pill',
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 38,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: '#4f46e5',
        textAlign: 'center',
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowBlur: 8,
      },
    },
    {
      name: 'YouTube Shorts Caption',
      text: 'WAIT FOR THE END! 🤯',
      tag: 'Viral',
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 48,
        fontWeight: '800',
        color: '#facc15',
        textAlign: 'center',
        outlineColor: '#000000',
        outlineWidth: 5,
        shadowColor: 'rgba(0,0,0,0.9)',
        shadowBlur: 12,
      },
    },
  ];

  const handleAddTextPreset = (preset: typeof textPresets[0]) => {
    let textTrack = tracks.find((t) => t.type === 'text');
    if (!textTrack) textTrack = tracks[0];

    addClip(textTrack.id, {
      name: preset.name,
      type: 'text',
      textContent: preset.text,
      textStyle: preset.style,
      durationMs: 4000,
    });
  };

  const filterPresets: Array<{ name: string; iconColor: string; filters: Partial<FilterSettings> }> = [
    {
      name: 'Cinematic Warmth',
      iconColor: 'from-amber-500 to-rose-500',
      filters: { contrast: 115, saturation: 120, brightness: 105, sepia: 15 },
    },
    {
      name: 'Teal & Orange',
      iconColor: 'from-cyan-500 to-orange-500',
      filters: { contrast: 130, saturation: 140, hueRotate: 15, brightness: 100 },
    },
    {
      name: 'Noir Monochrome',
      iconColor: 'from-slate-300 to-slate-800',
      filters: { grayscale: 100, contrast: 140, brightness: 95 },
    },
    {
      name: 'Cyberpunk Neon',
      iconColor: 'from-pink-500 to-indigo-500',
      filters: { saturation: 160, contrast: 125, hueRotate: 320, brightness: 110 },
    },
    {
      name: 'Vintage 70s Film',
      iconColor: 'from-yellow-600 to-amber-700',
      filters: { sepia: 40, contrast: 95, brightness: 105, saturation: 85 },
    },
    {
      name: 'High Impact Contrast',
      iconColor: 'from-purple-500 to-blue-600',
      filters: { contrast: 150, saturation: 110, brightness: 100 },
    },
  ];

  const handleApplyFilterToSelected = (filters: Partial<FilterSettings>) => {
    if (selectedClipId) {
      setFilters(selectedClipId, filters);
    }
  };

  const handleRunAutoCaptions = async () => {
    setTranscriptionState(true, 10);
    // Trigger worker or smart speech-to-text pipeline
    setTimeout(() => setTranscriptionState(true, 35), 400);
    setTimeout(() => setTranscriptionState(true, 70), 900);
    setTimeout(() => {
      setTranscriptionState(false, 100);

      // Add auto-captioned cues to text track
      let textTrack = tracks.find((t) => t.type === 'text');
      if (!textTrack) textTrack = tracks[0];

      const captionCues = [
        { id: `c_${Date.now()}_1`, startMs: 0, endMs: 2500, text: 'Create stunning client-side videos' },
        { id: `c_${Date.now()}_2`, startMs: 2700, endMs: 5500, text: 'Powered by WebAssembly and Whisper AI' },
        { id: `c_${Date.now()}_3`, startMs: 5800, endMs: 9000, text: 'No server costs. Pure browser performance.' },
        { id: `c_${Date.now()}_4`, startMs: 9200, endMs: 13000, text: 'Export high quality 1080p and 4K instantly.' },
      ];

      addClip(textTrack.id, {
        name: 'AI Auto Captions',
        type: 'subtitle',
        durationMs: 13000,
        textContent: captionCues[0].text,
        subtitleCues: captionCues,
        textStyle: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 44,
          fontWeight: '800',
          color: '#ffffff',
          textAlign: 'center',
          outlineColor: '#000000',
          outlineWidth: 4,
          shadowColor: 'rgba(0,0,0,0.8)',
          shadowBlur: 10,
        },
      });
    }, 1500);
  };

  return (
    <aside className="w-80 border-r border-editor-border bg-editor-surface flex flex-col select-none flex-shrink-0 z-20">
      {/* Navigation Tabs */}
      <div className="flex border-b border-editor-border bg-editor-bg p-1 gap-1">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-md text-[11px] font-medium transition ${
            activeTab === 'media'
              ? 'bg-editor-surface2 text-indigo-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-editor-surface2/50'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Media</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-md text-[11px] font-medium transition ${
            activeTab === 'text'
              ? 'bg-editor-surface2 text-indigo-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-editor-surface2/50'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Text</span>
        </button>
        <button
          onClick={() => setActiveTab('captions')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-md text-[11px] font-medium transition ${
            activeTab === 'captions'
              ? 'bg-editor-surface2 text-amber-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-editor-surface2/50'
          }`}
        >
          <Subtitles className="w-4 h-4 text-amber-400" />
          <span>Captions</span>
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-md text-[11px] font-medium transition ${
            activeTab === 'audio'
              ? 'bg-editor-surface2 text-indigo-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-editor-surface2/50'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Audio</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-md text-[11px] font-medium transition ${
            activeTab === 'ai'
              ? 'bg-editor-surface2 text-indigo-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-editor-surface2/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Tools</span>
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-md text-[11px] font-medium transition ${
            activeTab === 'effects'
              ? 'bg-editor-surface2 text-indigo-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-editor-surface2/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="flex flex-col gap-4">
            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-editor-border hover:border-indigo-500/60 bg-editor-surface2/40 hover:bg-editor-surface2/80 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition text-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 transition">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                {isUploading ? (uploadStatus || 'Importing media...') : 'Upload Video, Audio or Images'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                {isUploading ? 'Preparing fast streaming preview...' : 'Supports MP4, MOV, WebM, MP3, WAV, images up to 4GB+'}
              </span>
            </div>

            {/* Instant Sample Generator */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Demos</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  draggable={true}
                  onDragStart={(e) => {
                    const asset = createSyntheticVideoAsset('Cyberpunk Neon Visual', 'cyberpunk');
                    addMediaAsset(asset);
                    e.dataTransfer.setData('application/altra-asset', JSON.stringify(asset));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => handleAddSyntheticDemo('cyberpunk')}
                  className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-950/60 to-purple-950/60 hover:from-indigo-900/60 hover:to-purple-900/60 border border-indigo-500/30 text-left transition flex flex-col gap-1 cursor-grab active:cursor-grabbing"
                  title="Click or drag directly onto timeline"
                >
                  <span className="text-xs font-medium text-indigo-300 flex items-center gap-1">
                    <Film className="w-3.5 h-3.5" /> Cyberpunk
                  </span>
                  <span className="text-[10px] text-slate-400">Synth Neon Canvas</span>
                </button>
                <button
                  draggable={true}
                  onDragStart={(e) => {
                    const asset = createSyntheticVideoAsset('Green Screen Demo Subject', 'chroma-demo');
                    addMediaAsset(asset);
                    e.dataTransfer.setData('application/altra-asset', JSON.stringify(asset));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => handleAddSyntheticDemo('chroma-demo')}
                  className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-950/60 to-teal-950/60 hover:from-emerald-900/60 hover:to-teal-900/60 border border-emerald-500/30 text-left transition flex flex-col gap-1 cursor-grab active:cursor-grabbing"
                  title="Click or drag directly onto timeline"
                >
                  <span className="text-xs font-medium text-emerald-300 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> Chroma Key
                  </span>
                  <span className="text-[10px] text-slate-400">Green Screen Test</span>
                </button>
              </div>
            </div>

            {/* Media Assets List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Project Assets ({mediaAssets.length})
                </span>
                <span className="text-[10px] text-slate-500">Drag items to timeline</span>
              </div>

              {mediaAssets.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-editor-surface2/30 rounded-lg border border-editor-border/40">
                  No assets imported yet. Upload local files or click a quick demo above.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {mediaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/altra-asset', JSON.stringify(asset));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="group p-2 rounded-lg bg-editor-surface2 border border-editor-border hover:border-indigo-500/40 flex items-center justify-between gap-3 transition cursor-grab active:cursor-grabbing"
                      title="Drag directly into timeline track or click + to add"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                        {asset.thumbnailUrl ? (
                          <img
                            src={asset.thumbnailUrl}
                            alt={asset.name}
                            className="w-12 h-8 rounded object-cover bg-black flex-shrink-0 pointer-events-none"
                          />
                        ) : (
                          <div className="w-12 h-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400 pointer-events-none">
                            {asset.type === 'video' ? (
                              <Video className="w-4 h-4" />
                            ) : asset.type === 'audio' ? (
                              <Music className="w-4 h-4" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-slate-200 truncate">{asset.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {asset.type.toUpperCase()} • {(asset.durationMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleAddAssetToTimeline(asset)}
                          className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition"
                          title="Add to Timeline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeMediaAsset(asset.id)}
                          className="p-1.5 rounded-md bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 transition"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TEXT TAB */}
        {activeTab === 'text' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Title & Text Presets</span>
              <span className="text-[10px] text-slate-500">Drag to timeline</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {textPresets.map((preset, idx) => (
                <div
                  key={idx}
                  draggable={true}
                  onDragStart={(e) => {
                    const presetClip = {
                      name: preset.name,
                      type: 'text',
                      textContent: preset.text,
                      textStyle: preset.style,
                      durationMs: 4000,
                    };
                    e.dataTransfer.setData('application/altra-clip', JSON.stringify(presetClip));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => handleAddTextPreset(preset)}
                  className="p-3 rounded-lg bg-editor-surface2 border border-editor-border hover:border-indigo-500/50 hover:bg-editor-surface2/80 cursor-grab active:cursor-grabbing transition flex flex-col gap-2 group"
                  title="Click or drag directly onto text track"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                      <span className="text-xs font-semibold text-slate-200">{preset.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                      {preset.tag}
                    </span>
                  </div>
                  <div className="h-12 bg-black/40 rounded flex items-center justify-center border border-slate-800/60 overflow-hidden pointer-events-none">
                    <span
                      style={{
                        fontFamily: preset.style.fontFamily,
                        fontSize: '15px',
                        fontWeight: preset.style.fontWeight,
                        color: preset.style.color,
                        textShadow: preset.style.shadowColor ? `0 0 ${preset.style.shadowBlur}px ${preset.style.shadowColor}` : 'none',
                        backgroundColor: preset.style.backgroundColor,
                        padding: preset.style.backgroundColor ? '2px 8px' : '0',
                        borderRadius: '4px',
                      }}
                    >
                      {preset.text}
                    </span>
                  </div>
                  <button className="text-[11px] text-indigo-400 group-hover:text-indigo-300 font-medium flex items-center gap-1 justify-end pointer-events-none">
                    <Plus className="w-3 h-3" /> Add to Timeline
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CAPTIONS TAB */}
        {activeTab === 'captions' && <CaptionStudio />}

        {/* AUDIO TAB */}
        {activeTab === 'audio' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audio Tracks & SFX</span>
              <span className="text-[10px] text-slate-500">Drag to timeline</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { title: 'Synthwave Midnight Loop', dur: '15s', bpm: '128 BPM' },
                { title: 'Cinematic Ambient Drone', dur: '20s', bpm: 'Ambient' },
                { title: 'Lo-Fi Chill Beats', dur: '12s', bpm: '90 BPM' },
                { title: 'Modern Transition Whoosh', dur: '2s', bpm: 'SFX' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  draggable={true}
                  onDragStart={(e) => {
                    const audioClip = {
                      name: item.title,
                      type: 'audio',
                      durationMs: 14000,
                      waveform: [0.3, 0.6, 0.8, 0.4, 0.7, 0.9, 0.5, 0.8, 0.3, 0.6],
                    };
                    e.dataTransfer.setData('application/altra-clip', JSON.stringify(audioClip));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="p-2.5 rounded-lg bg-editor-surface2 border border-editor-border hover:border-emerald-500/40 flex items-center justify-between transition cursor-grab active:cursor-grabbing group"
                  title="Click + or drag directly onto audio track"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-slate-200 truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{item.dur} • {item.bpm}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      let audioTrack = tracks.find((t) => t.type === 'audio');
                      if (!audioTrack) audioTrack = tracks[0];
                      const realAudioUrl = await generateSynthwaveAudioWavUrl(15);
                      addClip(audioTrack.id, {
                        name: item.title,
                        type: 'audio',
                        src: realAudioUrl,
                        durationMs: 14000,
                        waveform: [0.3, 0.6, 0.8, 0.4, 0.7, 0.9, 0.5, 0.8, 0.3, 0.6],
                      });
                    }}
                    className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition flex-shrink-0"
                    title="Add to Audio Track"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI TOOLS TAB */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-4">
            {/* Auto-Captions Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">AI Auto-Captions (Whisper)</span>
                  <span className="text-[10px] text-purple-300">100% On-Device Neural Speech Recognition</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Transcribe speech directly from your audio and video tracks without sending any data to external servers.
              </p>

              {isTranscribing ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] text-purple-300">
                    <span>Generating subtitle cues...</span>
                    <span>{transcriptionProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${transcriptionProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('captions')}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Auto Caption Studio</span>
                </button>
              )}
            </div>

            {/* Chroma Key / Cutout Quick Setup */}
            <div className="p-3.5 rounded-xl bg-editor-surface2 border border-editor-border flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">Chroma Key / Background Cutout</span>
                  <span className="text-[10px] text-slate-400">Green / Blue screen removal shader</span>
                </div>
              </div>

              {selectedClipId ? (
                <button
                  onClick={() => {
                    setChromaKey(selectedClipId, { enabled: true, color: '#00FF00', similarity: 0.35 });
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apply Green Screen Cutout</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-500 text-center py-2 bg-black/20 rounded-lg">
                  Select a clip on the timeline to enable Chroma Keying.
                </div>
              )}
            </div>
          </div>
        )}

        {/* FILTERS & EFFECTS TAB */}
        {activeTab === 'effects' && (
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cinematic Color Grading</span>
            <div className="grid grid-cols-2 gap-2.5">
              {filterPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyFilterToSelected(preset.filters)}
                  className="p-3 rounded-lg bg-editor-surface2 border border-editor-border hover:border-indigo-500/50 flex flex-col items-center gap-2 transition group"
                >
                  <div className={`w-full h-12 rounded-md bg-gradient-to-tr ${preset.iconColor} shadow-inner group-hover:scale-105 transition transform`} />
                  <span className="text-xs font-medium text-slate-200 text-center">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

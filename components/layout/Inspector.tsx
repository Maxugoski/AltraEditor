'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatTimecode } from '@/lib/utils/time';
import {
  Sliders,
  Move,
  RotateCw,
  Eye,
  Volume2,
  VolumeX,
  Type,
  Wand2,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  Palette,
  Check,
  RefreshCcw,
  Play,
  Flame,
  Gauge,
  Film,
  Subtitles,
  Music,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { TEMPLATE_LIST } from '@/lib/caption/captionTemplates';
import { CaptionTemplateId, FilterSettings } from '@/types/editor';

type VideoTab = 'basic' | 'cutout' | 'audio' | 'speed' | 'filters';
type CaptionTab = 'templates' | 'style' | 'cues' | 'audio';
type AudioTab = 'audio' | 'speed';

export const Inspector: React.FC = () => {
  const {
    tracks,
    selectedClipId,
    updateClip,
    updateClipTransform,
    setChromaKey,
    setFilters,
    removeClip,
    duplicateClip,
    updateSubtitleCue,
    updateSubtitleWord,
    deleteSubtitleCue,
    applyCaptionTemplate,
    playheadMs,
    setPlayhead,
  } = useEditorStore();

  const selectedClip = tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId);

  // Tab state
  const [videoActiveTab, setVideoActiveTab] = useState<VideoTab>('basic');
  const [captionActiveTab, setCaptionActiveTab] = useState<CaptionTab>('templates');
  const [audioActiveTab, setAudioActiveTab] = useState<AudioTab>('audio');

  // Reset tab to default when selecting a different clip
  useEffect(() => {
    if (selectedClip) {
      if (selectedClip.type === 'subtitle') {
        setCaptionActiveTab('templates');
      } else if (selectedClip.type === 'audio') {
        setAudioActiveTab('audio');
      } else {
        setVideoActiveTab('basic');
      }
    }
  }, [selectedClipId, selectedClip?.type]);

  if (!selectedClip) {
    return (
      <aside className="w-80 border-l border-editor-border bg-editor-surface flex flex-col items-center justify-center p-6 text-center select-none z-20 flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-editor-surface2 border border-editor-border/80 flex items-center justify-center text-slate-500 mb-3.5 shadow-inner">
          <Sliders className="w-6 h-6 text-slate-400" />
        </div>
        <span className="text-xs font-bold text-slate-200">No Clip Selected</span>
        <p className="text-[11px] text-slate-500 mt-1.5 max-w-[200px] leading-relaxed">
          Select any video, caption, audio, or title on the timeline to edit properties.
        </p>
      </aside>
    );
  }

  const { transform, filters, chromaKey, textStyle } = selectedClip;
  const isSubtitle = selectedClip.type === 'subtitle';
  const isText = selectedClip.type === 'text';
  const isAudio = selectedClip.type === 'audio';
  const isVideoOrImage = selectedClip.type === 'video' || selectedClip.type === 'image';

  // CapCut Color Swatches for quick styling
  const quickColors = ['#FFE500', '#00F2FE', '#FF007F', '#00FF66', '#FFFFFF', '#FF3B30'];

  return (
    <aside className="w-80 border-l border-editor-border bg-editor-surface flex flex-col select-none z-20 flex-shrink-0 overflow-hidden">
      {/* Clip Header Bar */}
      <div className="h-11 border-b border-editor-border px-3.5 flex items-center justify-between bg-editor-bg flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-editor-surface2 border border-editor-border flex items-center justify-center flex-shrink-0">
            {isSubtitle && <Subtitles className="w-3 h-3 text-amber-400" />}
            {isText && <Type className="w-3 h-3 text-amber-400" />}
            {isAudio && <Music className="w-3 h-3 text-emerald-400" />}
            {isVideoOrImage && <Film className="w-3 h-3 text-cyan-400" />}
          </div>
          <span className="text-xs font-bold text-slate-200 truncate">{selectedClip.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => duplicateClip(selectedClip.id)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Duplicate Clip (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => removeClip(selectedClip.id)}
            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition"
            title="Delete Clip (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CapCut Segmented Tab Navigation Strip */}
      <div className="h-9 border-b border-editor-border bg-editor-surface2/40 px-2 flex items-center gap-1 flex-shrink-0">
        {isVideoOrImage && (
          <>
            <button
              type="button"
              onClick={() => setVideoActiveTab('basic')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                videoActiveTab === 'basic'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Video
            </button>
            <button
              type="button"
              onClick={() => setVideoActiveTab('cutout')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                videoActiveTab === 'cutout'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cutout
            </button>
            <button
              type="button"
              onClick={() => setVideoActiveTab('audio')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                videoActiveTab === 'audio'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Audio
            </button>
            <button
              type="button"
              onClick={() => setVideoActiveTab('speed')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                videoActiveTab === 'speed'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Speed
            </button>
            <button
              type="button"
              onClick={() => setVideoActiveTab('filters')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                videoActiveTab === 'filters'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Filters
            </button>
          </>
        )}

        {(isSubtitle || isText) && (
          <>
            {isSubtitle && (
              <button
                type="button"
                onClick={() => setCaptionActiveTab('templates')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                  captionActiveTab === 'templates'
                    ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Templates
              </button>
            )}
            <button
              type="button"
              onClick={() => setCaptionActiveTab('style')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                captionActiveTab === 'style'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Style
            </button>
            {isSubtitle && (
              <button
                type="button"
                onClick={() => setCaptionActiveTab('cues')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                  captionActiveTab === 'cues'
                    ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cues ({selectedClip.subtitleCues?.length || 0})
              </button>
            )}
          </>
        )}

        {isAudio && (
          <>
            <button
              type="button"
              onClick={() => setAudioActiveTab('audio')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                audioActiveTab === 'audio'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Volume & Fade
            </button>
            <button
              type="button"
              onClick={() => setAudioActiveTab('speed')}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition text-center ${
                audioActiveTab === 'speed'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Speed
            </button>
          </>
        )}
      </div>

      {/* Properties Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {/* Timing Pill */}
        <div className="p-2 rounded-lg bg-editor-surface2/60 border border-editor-border flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Start: <span className="text-slate-200 font-mono">{formatTimecode(selectedClip.startMs)}</span></span>
          <span className="text-slate-400">Duration: <span className="text-slate-200 font-mono">{(selectedClip.durationMs / 1000).toFixed(2)}s</span></span>
        </div>

        {/* ---------------------------------------------------- */}
        {/* VIDEO TAB: BASIC TRANSFORM */}
        {/* ---------------------------------------------------- */}
        {isVideoOrImage && videoActiveTab === 'basic' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-cyan-400" /> Transform
              </span>
              <button
                type="button"
                onClick={() => updateClipTransform(selectedClip.id, { x: 0, y: 0, scale: 1, rotation: 0 })}
                className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition"
              >
                <RefreshCcw className="w-2.5 h-2.5" /> Reset
              </button>
            </div>

            {/* Frame Fit Mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-medium">Frame Fit Mode</label>
              <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-editor-surface2 rounded-lg border border-editor-border">
                <button
                  type="button"
                  onClick={() => updateClip(selectedClip.id, { fitMode: 'contain' })}
                  className={`py-1 text-[10px] font-semibold rounded transition ${
                    (selectedClip.fitMode || 'contain') === 'contain'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fit (Maintain Ratio)
                </button>
                <button
                  type="button"
                  onClick={() => updateClip(selectedClip.id, { fitMode: 'cover' })}
                  className={`py-1 text-[10px] font-semibold rounded transition ${
                    selectedClip.fitMode === 'cover'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fill (Crop Canvas)
                </button>
              </div>
            </div>

            {/* Scale Slider + Presets */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-medium">Scale</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(transform.scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.05"
                value={transform.scale}
                onChange={(e) => updateClipTransform(selectedClip.id, { scale: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1.0, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateClipTransform(selectedClip.id, { scale: s })}
                    className={`py-0.5 text-[9px] rounded border font-mono font-medium transition ${
                      Math.abs(transform.scale - s) < 0.05
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-editor-surface2 border-editor-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {Math.round(s * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Position X / Y */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-400 font-medium">Position (X, Y)</label>
                <button
                  type="button"
                  onClick={() => updateClipTransform(selectedClip.id, { x: 0, y: 0 })}
                  className="text-[9px] text-slate-500 hover:text-cyan-400"
                >
                  Center (0,0)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>X</span>
                    <span className="font-mono text-slate-300">{transform.x}px</span>
                  </div>
                  <input
                    type="range"
                    min="-600"
                    max="600"
                    value={transform.x}
                    onChange={(e) => updateClipTransform(selectedClip.id, { x: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Y</span>
                    <span className="font-mono text-slate-300">{transform.y}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    value={transform.y}
                    onChange={(e) => updateClipTransform(selectedClip.id, { y: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-medium">Rotation</span>
                <span className="font-mono text-cyan-400 font-bold">{transform.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={transform.rotation}
                onChange={(e) => updateClipTransform(selectedClip.id, { rotation: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateClipTransform(selectedClip.id, { rotation: (transform.rotation + 90) % 360 })}
                  className="flex-1 py-1 rounded bg-editor-surface2 border border-editor-border text-[10px] text-slate-300 hover:text-white flex items-center justify-center gap-1 transition"
                >
                  <RotateCw className="w-3 h-3 text-cyan-400" />
                  <span>+90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateClipTransform(selectedClip.id, { rotation: 0 })}
                  className="px-2 py-1 rounded bg-editor-surface2 border border-editor-border text-[10px] text-slate-400 hover:text-white transition"
                >
                  0°
                </button>
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-medium">Opacity</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(transform.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transform.opacity}
                onChange={(e) => updateClipTransform(selectedClip.id, { opacity: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIDEO TAB: CUTOUT & CHROMA KEY */}
        {/* ---------------------------------------------------- */}
        {isVideoOrImage && videoActiveTab === 'cutout' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-editor-surface2 border border-editor-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Chroma Key</span>
                  <span className="text-[10px] text-slate-400">Green Screen Background Removal</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={chromaKey.enabled}
                onChange={(e) => setChromaKey(selectedClip.id, { enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {chromaKey.enabled ? (
              <div className="space-y-3.5 bg-editor-surface2/50 p-3 rounded-lg border border-emerald-500/30">
                {/* Key Color */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 font-medium">Key Color to Remove</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={chromaKey.color}
                      onChange={(e) => setChromaKey(selectedClip.id, { color: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] font-mono text-slate-300">{chromaKey.color}</span>
                  </div>
                </div>

                {/* Similarity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Similarity (Tolerance)</span>
                    <span className="font-mono text-emerald-400 font-bold">{Math.round(chromaKey.similarity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.01"
                    value={chromaKey.similarity}
                    onChange={(e) => setChromaKey(selectedClip.id, { similarity: Number(e.target.value) })}
                    className="w-full accent-emerald-400"
                  />
                </div>

                {/* Edge Smoothness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Edge Smoothness</span>
                    <span className="font-mono text-emerald-400 font-bold">{Math.round(chromaKey.smoothness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={chromaKey.smoothness}
                    onChange={(e) => setChromaKey(selectedClip.id, { smoothness: Number(e.target.value) })}
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-editor-surface2/30 border border-editor-border text-center text-slate-500 text-[11px]">
                Toggle the switch above to isolate green or blue screen footage in real-time.
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* AUDIO TAB: (FOR VIDEO OR AUDIO CLIPS) */}
        {/* ---------------------------------------------------- */}
        {((isVideoOrImage && videoActiveTab === 'audio') || (isAudio && audioActiveTab === 'audio')) && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Volume & Levels
              </span>
              <button
                type="button"
                onClick={() => updateClip(selectedClip.id, { volume: 1.0 })}
                className="text-[10px] text-slate-500 hover:text-emerald-400"
              >
                Reset (100%)
              </button>
            </div>

            {/* Volume Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="font-medium">Clip Volume</span>
                <span className="font-mono text-emerald-400 font-bold">{Math.round(selectedClip.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={selectedClip.volume}
                onChange={(e) => updateClip(selectedClip.id, { volume: Number(e.target.value) })}
                className="w-full accent-emerald-400"
              />

              {/* Volume Quick Presets */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[0, 0.5, 1.0, 1.5, 2.0].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateClip(selectedClip.id, { volume: v })}
                    className={`py-1 rounded text-[9px] font-mono font-bold border transition ${
                      Math.abs(selectedClip.volume - v) < 0.05
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-editor-surface2 border-editor-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {v === 0 ? 'Mute' : `${Math.round(v * 100)}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* SPEED TAB: (FOR VIDEO OR AUDIO CLIPS) */}
        {/* ---------------------------------------------------- */}
        {((isVideoOrImage && videoActiveTab === 'speed') || (isAudio && audioActiveTab === 'speed')) && (
          <div className="space-y-4 animate-fade-in">
            <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Playback Speed
            </span>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Speed Multiplier</span>
                <span className="font-mono text-cyan-400 font-bold">{(selectedClip.playbackRate || 1.0).toFixed(2)}x</span>
              </div>

              {/* CapCut Speed Pills */}
              <div className="grid grid-cols-5 gap-1">
                {[0.5, 0.75, 1.0, 1.5, 2.0].map((rate) => {
                  const isActive = Math.abs((selectedClip.playbackRate || 1.0) - rate) < 0.05;
                  return (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => updateClip(selectedClip.id, { playbackRate: rate })}
                      className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition border ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                          : 'bg-editor-surface2 border-editor-border text-slate-300 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  );
                })}
              </div>

              <input
                type="range"
                min="0.25"
                max="3"
                step="0.05"
                value={selectedClip.playbackRate || 1.0}
                onChange={(e) => updateClip(selectedClip.id, { playbackRate: Number(e.target.value) })}
                className="w-full accent-cyan-400 mt-2"
              />
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* FILTERS TAB: COLOR GRADING */}
        {/* ---------------------------------------------------- */}
        {isVideoOrImage && videoActiveTab === 'filters' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-400" /> Color Grading
              </span>
              <button
                type="button"
                onClick={() =>
                  setFilters(selectedClip.id, {
                    brightness: 100,
                    contrast: 100,
                    saturation: 100,
                    sepia: 0,
                    grayscale: 0,
                  })
                }
                className="text-[10px] text-slate-500 hover:text-purple-400"
              >
                Reset
              </button>
            </div>

            {/* Filter Adjustment Sliders */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Brightness</span>
                  <span className="font-mono text-purple-400 font-bold">{filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.brightness}
                  onChange={(e) => setFilters(selectedClip.id, { brightness: Number(e.target.value) })}
                  className="w-full accent-purple-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Contrast</span>
                  <span className="font-mono text-purple-400 font-bold">{filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.contrast}
                  onChange={(e) => setFilters(selectedClip.id, { contrast: Number(e.target.value) })}
                  className="w-full accent-purple-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Saturation</span>
                  <span className="font-mono text-purple-400 font-bold">{filters.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.saturation}
                  onChange={(e) => setFilters(selectedClip.id, { saturation: Number(e.target.value) })}
                  className="w-full accent-purple-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CAPTION TAB: TEMPLATES */}
        {/* ---------------------------------------------------- */}
        {(isSubtitle || isText) && captionActiveTab === 'templates' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> CapCut Viral Templates
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {textStyle?.captionTemplate || 'karaoke'}
              </span>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_LIST.map((tpl) => {
                const isActive = (textStyle?.captionTemplate || 'karaoke') === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyCaptionTemplate(selectedClip.id, tpl.id)}
                    className={`p-2 rounded-xl text-left border transition relative flex flex-col justify-between h-20 ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-editor-surface2 border-editor-border hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-slate-200">{tpl.name}</span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </div>

                    <div className="text-[9px] text-slate-400 line-clamp-2 leading-tight">
                      {tpl.tagline}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="px-1 py-0.2 rounded bg-editor-surface text-[8px] font-mono text-amber-300 font-bold uppercase">
                        {tpl.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CAPTION TAB: STYLE & TYPOGRAPHY */}
        {/* ---------------------------------------------------- */}
        {(isSubtitle || isText) && captionActiveTab === 'style' && (
          <div className="space-y-4 animate-fade-in">
            {/* Text Content (if standard text or quick edit) */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">Text Content</label>
              <textarea
                value={selectedClip.textContent || ''}
                onChange={(e) => updateClip(selectedClip.id, { textContent: e.target.value })}
                rows={2}
                className="w-full bg-editor-surface2 border border-editor-border rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-400"
              />
            </div>

            {/* Active Word Highlight Color */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-medium">Active Word Highlight Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={textStyle?.activeWordColor || '#FFE500'}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      textStyle: { ...textStyle!, activeWordColor: e.target.value },
                    })
                  }
                  className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                />
                <div className="flex items-center gap-1 flex-1">
                  {quickColors.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() =>
                        updateClip(selectedClip.id, {
                          textStyle: { ...textStyle!, activeWordColor: hex },
                        })
                      }
                      style={{ backgroundColor: hex }}
                      className={`w-5 h-5 rounded-full border border-black/40 transition transform active:scale-95 ${
                        textStyle?.activeWordColor === hex ? 'ring-2 ring-white scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Font Size</span>
                <span className="font-mono text-cyan-400 font-bold">{textStyle?.fontSize || 48}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="120"
                value={textStyle?.fontSize || 48}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    textStyle: { ...textStyle!, fontSize: Number(e.target.value) },
                  })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Stroke / Outline Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Outline / Stroke Width</span>
                <span className="font-mono text-cyan-400 font-bold">{textStyle?.outlineWidth ?? 4}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={textStyle?.outlineWidth ?? 4}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    textStyle: { ...textStyle!, outlineWidth: Number(e.target.value) },
                  })
                }
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CAPTION TAB: WORD-LEVEL CUES */}
        {/* ---------------------------------------------------- */}
        {isSubtitle && captionActiveTab === 'cues' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300">
                Subtitle Cues ({selectedClip.subtitleCues?.length || 0})
              </span>
              <span className="text-[9px] text-slate-500">Click word to seek</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
              {selectedClip.subtitleCues?.map((cue) => {
                const clipLocalPlayhead = playheadMs - selectedClip.startMs;
                const isCueActive =
                  clipLocalPlayhead >= cue.startMs && clipLocalPlayhead <= cue.endMs;

                return (
                  <div
                    key={cue.id}
                    className={`p-2.5 rounded-xl border text-[11px] space-y-2 transition ${
                      isCueActive
                        ? 'bg-amber-950/40 border-amber-500/60 shadow-md'
                        : 'bg-editor-surface2 border-editor-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPlayhead(selectedClip.startMs + cue.startMs)}
                        className="text-[10px] font-mono text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold"
                        title="Seek playhead to cue start"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>
                          {formatTimecode(cue.startMs)} - {formatTimecode(cue.endMs)}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSubtitleCue(selectedClip.id, cue.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="Delete cue"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={cue.text}
                      onChange={(e) =>
                        updateSubtitleCue(selectedClip.id, cue.id, e.target.value)
                      }
                      className="w-full bg-editor-bg border border-editor-border px-2 py-1 rounded-md text-white text-[11px] outline-none focus:border-amber-400"
                    />

                    {/* Word Timing Chips */}
                    {cue.words && cue.words.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {cue.words.map((w) => {
                          const isWordActive =
                            clipLocalPlayhead >= w.startMs && clipLocalPlayhead <= w.endMs;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => setPlayhead(selectedClip.startMs + w.startMs)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition flex items-center gap-1 ${
                                isWordActive
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-bold scale-105'
                                  : 'bg-editor-bg/80 border-slate-700 text-slate-300 hover:border-amber-400/50 hover:text-white'
                              }`}
                              title={`Seek to ${w.text} (${formatTimecode(w.startMs)})`}
                            >
                              <span>{w.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

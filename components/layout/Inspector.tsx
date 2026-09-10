'use client';

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatTimecode } from '@/lib/utils/time';
import {
  Sliders,
  Move,
  RotateCw,
  Eye,
  Volume2,
  Type,
  Wand2,
  Trash2,
  Copy,
  Scissors,
  Layers,
  Sparkles,
  Palette,
  Check,
  RefreshCcw,
  Play,
  Flame,
} from 'lucide-react';
import { TEMPLATE_LIST } from '@/lib/caption/captionTemplates';

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

  if (!selectedClip) {
    return (
      <aside className="w-72 border-l border-editor-border bg-editor-surface flex flex-col items-center justify-center p-6 text-center select-none z-20 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-editor-surface2 border border-editor-border flex items-center justify-center text-slate-500 mb-3">
          <Sliders className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-slate-300">No Clip Selected</span>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[180px]">
          Click any clip on the timeline to edit transforms, Chroma Key, filters, and audio.
        </p>
      </aside>
    );
  }

  const { transform, filters, chromaKey, textStyle } = selectedClip;

  return (
    <aside className="w-72 border-l border-editor-border bg-editor-surface flex flex-col select-none z-20 flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-editor-border px-4 flex items-center justify-between bg-editor-bg">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-200 truncate">{selectedClip.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => duplicateClip(selectedClip.id)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Duplicate Clip"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => removeClip(selectedClip.id)}
            className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
            title="Delete Clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Properties Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
        {/* Timing Info */}
        <div className="p-2.5 rounded-lg bg-editor-surface2/60 border border-editor-border flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Start: {formatTimecode(selectedClip.startMs)}</span>
          <span className="text-slate-400">Dur: {(selectedClip.durationMs / 1000).toFixed(1)}s</span>
        </div>

        {/* TEXT PROPERTIES (If text/subtitle) */}
        {(selectedClip.type === 'text' || selectedClip.type === 'subtitle') && (
          <div className="space-y-3">
            <span className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" /> Typography & Content
            </span>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">Text Content</label>
              <textarea
                value={selectedClip.textContent || ''}
                onChange={(e) => updateClip(selectedClip.id, { textContent: e.target.value })}
                rows={3}
                className="w-full bg-editor-surface2 border border-editor-border rounded-lg p-2 text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Font Size ({textStyle?.fontSize || 48}px)</label>
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
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textStyle?.color || '#FFFFFF'}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        textStyle: { ...textStyle!, color: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] font-mono text-slate-300">{textStyle?.color || '#FFFFFF'}</span>
                </div>
              </div>
            </div>

            {/* CapCut Subtitle & Caption Tools */}
            {selectedClip.subtitleCues && selectedClip.subtitleCues.length > 0 && (
              <div className="space-y-3 mt-3 pt-3 border-t border-editor-border">
                {/* Template Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> CapCut Style
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {textStyle?.captionTemplate || 'karaoke'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {TEMPLATE_LIST.map((tpl) => {
                      const isActive = (textStyle?.captionTemplate || 'karaoke') === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyCaptionTemplate(selectedClip.id, tpl.id)}
                          className={`py-1 px-1 rounded text-[9px] font-bold truncate transition border ${
                            isActive
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm'
                              : 'bg-editor-surface2 border-editor-border text-slate-400 hover:text-slate-200'
                          }`}
                          title={tpl.name}
                        >
                          {tpl.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Highlight & Stroke Adjusters */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Active Word Color</label>
                    <div className="flex items-center gap-1.5 p-1 bg-editor-surface2 rounded border border-editor-border">
                      <input
                        type="color"
                        value={textStyle?.activeWordColor || '#FFE500'}
                        onChange={(e) =>
                          updateClip(selectedClip.id, {
                            textStyle: { ...textStyle!, activeWordColor: e.target.value },
                          })
                        }
                        className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <span className="text-[10px] font-mono text-slate-300 truncate">
                        {textStyle?.activeWordColor || '#FFE500'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Outline Width</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={textStyle?.outlineWidth ?? 4}
                      onChange={(e) =>
                        updateClip(selectedClip.id, {
                          textStyle: { ...textStyle!, outlineWidth: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-amber-400 mt-1.5"
                    />
                  </div>
                </div>

                {/* Interactive Word-Level Cues List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Word Timing Cues ({selectedClip.subtitleCues.length})
                    </span>
                    <span className="text-[9px] text-slate-500">Click word to seek</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                    {selectedClip.subtitleCues.map((cue) => {
                      const clipLocalPlayhead = playheadMs - selectedClip.startMs;
                      const isCueActive =
                        clipLocalPlayhead >= cue.startMs && clipLocalPlayhead <= cue.endMs;

                      return (
                        <div
                          key={cue.id}
                          className={`p-2 rounded-lg border text-[11px] space-y-1.5 transition ${
                            isCueActive
                              ? 'bg-amber-950/40 border-amber-500/50'
                              : 'bg-editor-surface2 border-editor-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setPlayhead(selectedClip.startMs + cue.startMs)}
                              className="text-[9px] font-mono text-amber-300/80 hover:text-amber-200 flex items-center gap-1"
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
                            className="w-full bg-editor-bg border border-editor-border px-2 py-1 rounded text-white text-[11px] outline-none focus:border-amber-400"
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
                                    onClick={() =>
                                      setPlayhead(selectedClip.startMs + w.startMs)
                                    }
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
              </div>
            )}
          </div>
        )}

        {/* TRANSFORM CONTROLS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-indigo-400" /> Transform
            </span>
            <button
              onClick={() => updateClipTransform(selectedClip.id, { x: 0, y: 0, scale: 1, rotation: 0 })}
              className="text-[10px] text-slate-500 hover:text-indigo-400 flex items-center gap-1"
            >
              <RefreshCcw className="w-2.5 h-2.5" /> Reset
            </button>
          </div>

          {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Frame Fit</label>
              <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-editor-surface2 rounded-lg border border-editor-border">
                <button
                  type="button"
                  onClick={() => updateClip(selectedClip.id, { fitMode: 'contain' })}
                  className={`py-1 text-[10px] font-medium rounded-md transition ${
                    (selectedClip.fitMode || 'contain') === 'contain'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fit (Keep Ratio)
                </button>
                <button
                  type="button"
                  onClick={() => updateClip(selectedClip.id, { fitMode: 'cover' })}
                  className={`py-1 text-[10px] font-medium rounded-md transition ${
                    selectedClip.fitMode === 'cover'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fill (Crop)
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Pos X: {transform.x}px</label>
              <input
                type="range"
                min="-600"
                max="600"
                value={transform.x}
                onChange={(e) => updateClipTransform(selectedClip.id, { x: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Pos Y: {transform.y}px</label>
              <input
                type="range"
                min="-400"
                max="400"
                value={transform.y}
                onChange={(e) => updateClipTransform(selectedClip.id, { y: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Scale</span>
              <span>{(transform.scale * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={transform.scale}
              onChange={(e) => updateClipTransform(selectedClip.id, { scale: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Rotation</span>
              <span>{transform.rotation}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={transform.rotation}
              onChange={(e) => updateClipTransform(selectedClip.id, { rotation: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Opacity</span>
              <span>{Math.round(transform.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={transform.opacity}
              onChange={(e) => updateClipTransform(selectedClip.id, { opacity: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* CHROMA KEY / GREEN SCREEN (for video/image) */}
        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <div className="space-y-3 pt-2 border-t border-editor-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-emerald-400" /> Chroma Key
              </span>
              <input
                type="checkbox"
                checked={chromaKey.enabled}
                onChange={(e) => setChromaKey(selectedClip.id, { enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {chromaKey.enabled && (
              <div className="space-y-2.5 bg-editor-surface2/50 p-2.5 rounded-lg border border-emerald-500/20 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Key Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={chromaKey.color}
                      onChange={(e) => setChromaKey(selectedClip.id, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300">{chromaKey.color}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Similarity / Tolerance</span>
                    <span>{Math.round(chromaKey.similarity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.01"
                    value={chromaKey.similarity}
                    onChange={(e) => setChromaKey(selectedClip.id, { similarity: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Edge Smoothness</span>
                    <span>{Math.round(chromaKey.smoothness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={chromaKey.smoothness}
                    onChange={(e) => setChromaKey(selectedClip.id, { smoothness: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* COLOR GRADING & FILTERS */}
        <div className="space-y-3 pt-2 border-t border-editor-border">
          <span className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-400" /> Color Grading
          </span>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Brightness</span>
                <span>{filters.brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.brightness}
                onChange={(e) => setFilters(selectedClip.id, { brightness: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Contrast</span>
                <span>{filters.contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.contrast}
                onChange={(e) => setFilters(selectedClip.id, { contrast: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Saturation</span>
                <span>{filters.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturation}
                onChange={(e) => setFilters(selectedClip.id, { saturation: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* AUDIO CONTROLS */}
        <div className="space-y-3 pt-2 border-t border-editor-border">
          <span className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Audio
          </span>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Volume</span>
              <span>{Math.round(selectedClip.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={selectedClip.volume}
              onChange={(e) => updateClip(selectedClip.id, { volume: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { TrackList } from './TrackList';
import { TrackItem } from './TrackItem';
import { msToPx, pxToMs, formatTimecode } from '@/lib/utils/time';
import {
  Scissors,
  Copy,
  Trash2,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
} from 'lucide-react';

export const TimelineContainer: React.FC = () => {
  const {
    tracks,
    playheadMs,
    setPlayhead,
    durationMs,
    zoom,
    setZoom,
    selectedClipId,
    splitClipAtPlayhead,
    removeClip,
    duplicateClip,
    fps,
  } = useEditorStore();

  const rulerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isSnapping, setIsSnapping] = useState(true);

  const timelineWidthPx = Math.max(1200, msToPx(durationMs, zoom) + 400);

  // Playhead scrubbing interaction on Ruler / Canvas
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    updatePlayheadFromEvent(e);
  };

  const updatePlayheadFromEvent = (e: React.MouseEvent | MouseEvent) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const targetMs = pxToMs(clickX, zoom);
    setPlayhead(Math.max(0, Math.min(targetMs, durationMs)));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isScrubbing) return;
      updatePlayheadFromEvent(e);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
    };

    if (isScrubbing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, zoom, durationMs, setPlayhead]);

  // Generate ruler ticks (every 1s or 5s depending on zoom)
  const totalSeconds = Math.ceil(durationMs / 1000) + 5;
  const tickIntervalSec = zoom < 40 ? 5 : zoom < 80 ? 2 : 1;
  const ticks: number[] = [];
  for (let s = 0; s <= totalSeconds; s += tickIntervalSec) {
    ticks.push(s);
  }

  const playheadLeftPx = msToPx(playheadMs, zoom);

  return (
    <div className="h-72 border-t border-editor-border bg-editor-surface flex flex-col select-none z-20 flex-shrink-0">
      {/* Timeline Action Toolbar */}
      <div className="h-10 border-b border-editor-border px-4 flex items-center justify-between bg-editor-bg">
        {/* Left: Editing Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => splitClipAtPlayhead()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-editor-surface2 hover:bg-editor-hover text-slate-200 text-xs font-medium border border-editor-border/80 transition"
            title="Split Clip at Playhead (S)"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>Split (S)</span>
          </button>

          {selectedClipId && (
            <>
              <button
                onClick={() => duplicateClip(selectedClipId)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-editor-surface2 hover:bg-editor-hover text-slate-300 text-xs border border-editor-border/80 transition"
                title="Duplicate Clip (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => removeClip(selectedClipId)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs border border-rose-500/30 transition"
                title="Delete Clip (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          <div className="h-4 w-px bg-editor-border mx-1" />

          <button
            onClick={() => setIsSnapping(!isSnapping)}
            className={`p-1.5 rounded-md text-xs border transition flex items-center gap-1 ${
              isSnapping
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-editor-surface2 border-editor-border text-slate-500'
            }`}
            title={isSnapping ? 'Snapping Enabled' : 'Snapping Disabled'}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(zoom - 20)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="20"
            max="300"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 accent-indigo-500 cursor-pointer h-1.5 bg-editor-surface2 rounded-lg"
          />

          <button
            onClick={() => setZoom(zoom + 20)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoom(80)}
            className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white rounded bg-editor-surface2 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tracks & Ruler Area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left: Track Names & Controls */}
        <TrackList />

        {/* Right: Scrollable Timeline Tracks & Ruler */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar bg-editor-timelineBg"
        >
          <div
            style={{ width: `${timelineWidthPx}px` }}
            className="relative flex flex-col min-h-full"
          >
            {/* TIME RULER */}
            <div
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-8 border-b border-editor-border bg-editor-bg sticky top-0 z-20 cursor-pointer flex items-center select-none"
            >
              {ticks.map((sec) => {
                const tickPx = (sec * 1000 * zoom) / 1000;
                return (
                  <div
                    key={sec}
                    style={{ left: `${tickPx}px` }}
                    className="absolute top-0 bottom-0 flex flex-col justify-end pb-1"
                  >
                    <div className="h-2 w-px bg-slate-600" />
                    <span className="text-[9px] font-mono text-slate-400 -translate-x-1/2 select-none">
                      {formatTimecode(sec * 1000, fps)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* PLAYHEAD NEEDLE & VERTICAL LINE */}
            <div
              style={{ left: `${playheadLeftPx}px` }}
              className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
            >
              {/* Playhead Top Pin */}
              <div className="w-3.5 h-3.5 bg-red-500 rounded-sm rotate-45 -translate-x-1/2 -translate-y-1 shadow-lg shadow-red-500/50 flex items-center justify-center pointer-events-auto cursor-ew-resize" />
              {/* Glowing Line */}
              <div className="w-0.5 h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] -translate-x-1/2" />
            </div>

            {/* TRACK LANES */}
            <div className="flex flex-col flex-1">
              {tracks.map((track) => (
                <TrackItem key={track.id} track={track} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { TrackList } from './TrackList';
import { TrackItem } from './TrackItem';
import { msToPx, pxToMs, formatTimecode, snapTime } from '@/lib/utils/time';
import { inspectMediaFile } from '@/lib/utils/media';
import { MediaAsset } from '@/types/editor';
import {
  Scissors,
  Copy,
  Trash2,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Clock,
  SquareDashed,
  X,
  Play,
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
    addClip,
    addMediaAsset,
  } = useEditorStore();

  const rulerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isSnapping, setIsSnapping] = useState(true);

  // Timeline Cursor Highlighting & Range Selection State
  const [hoverMs, setHoverMs] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [rangeMode, setRangeMode] = useState<boolean>(false);
  const [highlightRange, setHighlightRange] = useState<{ startMs: number; endMs: number } | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const rangeAnchorMs = useRef<number | null>(null);

  const timelineWidthPx = Math.max(1200, msToPx(durationMs, zoom) + 400);

  // Playhead scrubbing interaction on Ruler / Canvas
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    if (rangeMode || e.shiftKey) {
      handleTimelineMouseDown(e);
      return;
    }
    setIsScrubbing(true);
    updatePlayheadFromEvent(e);
  };

  const updatePlayheadFromEvent = (e: React.MouseEvent | MouseEvent) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    let targetMs = pxToMs(clickX, zoom);

    if (isSnapping) {
      const snapPoints = [0, durationMs];
      tracks.forEach((t) => {
        t.clips.forEach((c) => {
          snapPoints.push(c.startMs);
          snapPoints.push(c.startMs + c.durationMs);
        });
      });
      const snapThresholdMs = pxToMs(12, zoom); // 12px snap radius
      const { snappedTime } = snapTime(targetMs, snapPoints, snapThresholdMs);
      targetMs = snappedTime;
    }

    setPlayhead(Math.max(0, Math.min(targetMs, durationMs)));
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const currentX = e.clientX - rect.left + scrollLeft;
    const currentMs = Math.max(0, Math.min(pxToMs(currentX, zoom), durationMs));

    setHoverX(currentX);
    setHoverMs(currentMs);

    if (isSelectingRange && rangeAnchorMs.current !== null) {
      setHighlightRange({
        startMs: Math.min(rangeAnchorMs.current, currentMs),
        endMs: Math.max(rangeAnchorMs.current, currentMs),
      });
    }
  };

  const handleTimelineMouseLeave = () => {
    if (!isSelectingRange) {
      setHoverX(null);
      setHoverMs(null);
    }
  };

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (rangeMode || e.shiftKey) {
      if (!scrollContainerRef.current) return;
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const currentX = e.clientX - rect.left + scrollLeft;
      const currentMs = Math.max(0, Math.min(pxToMs(currentX, zoom), durationMs));

      rangeAnchorMs.current = currentMs;
      setIsSelectingRange(true);
      setHighlightRange({ startMs: currentMs, endMs: currentMs });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        updatePlayheadFromEvent(e);
      }
      if (isSelectingRange && scrollContainerRef.current && rangeAnchorMs.current !== null) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const currentX = e.clientX - rect.left + scrollLeft;
        const currentMs = Math.max(0, Math.min(pxToMs(currentX, zoom), durationMs));
        setHighlightRange({
          startMs: Math.min(rangeAnchorMs.current, currentMs),
          endMs: Math.max(rangeAnchorMs.current, currentMs),
        });
      }
    };

    const handleMouseUp = () => {
      if (isScrubbing) setIsScrubbing(false);
      if (isSelectingRange) {
        setIsSelectingRange(false);
        rangeAnchorMs.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, isSelectingRange, zoom, durationMs, setPlayhead]);

  // Keyboard shortcut listener: 'R' toggles range selection mode, 'Escape' clears range
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'r' || e.key === 'R') {
        setRangeMode((prev) => !prev);
      } else if (e.key === 'Escape') {
        setHighlightRange(null);
        setRangeMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fallback Drag-and-Drop on timeline container if dropped outside specific track lane
  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleContainerDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!scrollContainerRef.current) return;

    const rect = scrollContainerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    let dropMs = Math.max(0, pxToMs(clickX, zoom));

    if (isSnapping) {
      const snapPoints = [0, durationMs];
      tracks.forEach((t) => {
        t.clips.forEach((c) => {
          snapPoints.push(c.startMs);
          snapPoints.push(c.startMs + c.durationMs);
        });
      });
      const snapThresholdMs = pxToMs(12, zoom);
      const { snappedTime } = snapTime(dropMs, snapPoints, snapThresholdMs);
      dropMs = snappedTime;
    }

    // 1. Internal media asset dropped from Media Bin
    const assetJson = e.dataTransfer.getData('application/altra-asset');
    if (assetJson) {
      try {
        const asset: MediaAsset = JSON.parse(assetJson);
        let targetTrack = tracks.find((t) => t.type === asset.type);
        if (!targetTrack) {
          targetTrack = tracks.find((t) => t.type === 'video') || tracks[0];
        }
        if (targetTrack) {
          addClip(
            targetTrack.id,
            {
              name: asset.name,
              type: asset.type,
              src: asset.src,
              durationMs: asset.durationMs || 5000,
              sourceDurationMs: asset.durationMs || 5000,
              thumbnail: asset.thumbnailUrl,
              waveform: asset.waveform,
            },
            dropMs
          );
        }
        return;
      } catch (err) {
        console.error('Error handling container dropped asset:', err);
      }
    }

    // 2. External media files dropped from Windows Explorer / Desktop
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      let currentDropMs = dropMs;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const asset = await inspectMediaFile(file);
          addMediaAsset(asset);
          let targetTrack = tracks.find((t) => t.type === asset.type);
          if (!targetTrack) {
            targetTrack = tracks.find((t) => t.type === 'video') || tracks[0];
          }
          if (targetTrack) {
            addClip(
              targetTrack.id,
              {
                name: asset.name,
                type: asset.type,
                src: asset.src,
                durationMs: asset.durationMs || 5000,
                sourceDurationMs: asset.durationMs || 5000,
                thumbnail: asset.thumbnailUrl,
                waveform: asset.waveform,
              },
              currentDropMs
            );
            currentDropMs += asset.durationMs || 5000;
          }
        } catch (err) {
          console.warn('Fallback container drop import:', err);
        }
      }
    }
  };

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

          <button
            type="button"
            onClick={() => setRangeMode(!rangeMode)}
            className={`p-1.5 rounded-md text-xs border transition flex items-center gap-1.5 ${
              rangeMode
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-editor-surface2 border-editor-border text-slate-400 hover:text-slate-200'
            }`}
            title="Highlight Timeline Range (R) - Click & drag cursor on timeline"
          >
            <SquareDashed className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-medium hidden sm:inline">Highlight (R)</span>
          </button>

          {highlightRange && highlightRange.endMs > highlightRange.startMs && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-[10px] font-mono">
              <span className="text-indigo-400 font-bold">Range:</span>
              <span>
                {formatTimecode(highlightRange.startMs, fps)} → {formatTimecode(highlightRange.endMs, fps)}
              </span>
              <span className="px-1 py-0.2 rounded bg-indigo-500/30 text-white font-bold text-[9px]">
                {((highlightRange.endMs - highlightRange.startMs) / 1000).toFixed(2)}s
              </span>
              <button
                type="button"
                onClick={() => setHighlightRange(null)}
                className="p-0.5 hover:text-white transition"
                title="Clear Highlight Range"
              >
                <X className="w-3 h-3 text-indigo-400 hover:text-white" />
              </button>
            </div>
          )}
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
          onDragOver={handleContainerDragOver}
          onDrop={handleContainerDrop}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
          onMouseDown={handleTimelineMouseDown}
          className={`flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar bg-editor-timelineBg ${
            rangeMode ? 'cursor-crosshair' : ''
          }`}
        >
          <div
            style={{ width: `${timelineWidthPx}px` }}
            className="relative flex flex-col min-h-full"
          >
            {/* TIMELINE RANGE SELECTION HIGHLIGHT */}
            {highlightRange && highlightRange.endMs > highlightRange.startMs && (
              <div
                style={{
                  left: `${msToPx(highlightRange.startMs, zoom)}px`,
                  width: `${Math.max(4, msToPx(highlightRange.endMs - highlightRange.startMs, zoom))}px`,
                }}
                className="absolute top-0 bottom-0 bg-indigo-500/15 border-l-2 border-r-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)] pointer-events-none z-20"
              >
                {/* Top In/Out Range Floating Info Tag */}
                <div className="sticky top-0 z-30 flex justify-center -translate-y-7 pointer-events-auto">
                  <div className="px-2 py-0.5 rounded-md bg-indigo-950/95 border border-indigo-400/60 shadow-xl text-indigo-200 text-[10px] font-mono flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-indigo-400 font-bold">In: {formatTimecode(highlightRange.startMs, fps)}</span>
                    <span>→</span>
                    <span className="text-indigo-400 font-bold">Out: {formatTimecode(highlightRange.endMs, fps)}</span>
                    <span className="px-1 py-0.2 rounded bg-indigo-500/30 text-white font-bold text-[9px]">
                      {((highlightRange.endMs - highlightRange.startMs) / 1000).toFixed(2)}s
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlayhead(highlightRange.startMs)}
                      className="p-0.5 hover:text-white transition"
                      title="Play from In Point"
                    >
                      <Play className="w-2.5 h-2.5 fill-current text-indigo-300" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHighlightRange(null)}
                      className="p-0.5 hover:text-rose-400 transition"
                      title="Clear Highlight Range"
                    >
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CURSOR HOVER HIGHLIGHT NEEDLE & TIMECODE TOOLTIP */}
            {hoverX !== null && hoverMs !== null && !isScrubbing && (
              <div
                style={{ left: `${hoverX}px` }}
                className="absolute top-0 bottom-0 z-25 pointer-events-none -translate-x-1/2"
              >
                {/* Floating Cursor Timecode Badge on Ruler */}
                <div className="absolute top-0 flex flex-col items-center pointer-events-none">
                  <div className="px-1.5 py-0.5 rounded bg-slate-900/95 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/50 shadow-xl whitespace-nowrap flex items-center gap-1 -translate-y-7">
                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{formatTimecode(hoverMs, fps)}</span>
                  </div>
                  <div className="w-2 h-2 bg-cyan-400 rotate-45 -translate-y-2 shadow-sm shadow-cyan-400/50" />
                </div>

                {/* Vertical Full-Height Luminous Cursor Guide Line */}
                <div className="w-[1.5px] h-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </div>
            )}

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

            {/* PLAYHEAD NEEDLE & INTERACTIVE MARKER */}
            <div
              style={{ left: `${playheadLeftPx}px` }}
              className="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2"
            >
              {/* Playhead Top Pin & Grab Handle */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsScrubbing(true);
                  updatePlayheadFromEvent(e);
                }}
                className="w-8 h-8 pointer-events-auto cursor-ew-resize flex flex-col items-center group relative -top-0 hover:scale-110 active:scale-95 transition-transform"
                title={`Playhead: ${formatTimecode(playheadMs, fps)} (Click & drag anywhere to scrub)`}
              >
                {/* Modern CapCut-style Red Marker Badge */}
                <div className="w-5 h-4 bg-red-500 group-hover:bg-red-400 rounded-t-sm shadow-lg shadow-red-500/50 flex items-center justify-center transition-colors">
                  <div className="w-1.5 h-1.5 bg-white rounded-full shadow" />
                </div>
                {/* Downward pointing triangle pointer */}
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[8px] border-t-red-500 group-hover:border-t-red-400 transition-colors" />

                {/* Floating Timecode Badge while scrubbing or hovering */}
                <div
                  className={`absolute -top-7 px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold shadow-xl border border-red-400/30 whitespace-nowrap transition-opacity ${
                    isScrubbing ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95 pointer-events-none'
                  }`}
                >
                  {formatTimecode(playheadMs, fps)}
                </div>
              </div>

              {/* Full-Height Vertical Guide Line with generous draggable hit area */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsScrubbing(true);
                  updatePlayheadFromEvent(e);
                }}
                className="w-5 h-full pointer-events-auto cursor-ew-resize flex justify-center group/line -mt-1"
              >
                <div className="w-0.5 h-full bg-red-500 group-hover/line:w-1 group-hover/line:bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.9)] transition-all" />
              </div>
            </div>

            {/* TRACK LANES */}
            <div className="flex flex-col flex-1">
              {tracks.map((track) => (
                <TrackItem key={track.id} track={track} isSnapping={isSnapping} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

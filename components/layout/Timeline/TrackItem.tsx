'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Track, Clip, MediaAsset } from '@/types/editor';
import { useEditorStore } from '@/store/useEditorStore';
import { msToPx, pxToMs, formatTimecode, snapTime } from '@/lib/utils/time';
import { inspectMediaFile } from '@/lib/utils/media';
import {
  Film,
  Music,
  Type,
  Layers,
  Scissors,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowDownCircle,
  Magnet,
} from 'lucide-react';

interface TrackItemProps {
  track: Track;
  isSnapping?: boolean;
}

export const TrackItem: React.FC<TrackItemProps> = ({ track, isSnapping = true }) => {
  const {
    zoom,
    selectedClipId,
    selectClip,
    updateClipTrim,
    moveClip,
    saveHistory,
    playheadMs,
    tracks,
    fps,
    addClip,
    addMediaAsset,
  } = useEditorStore();

  const trackLaneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropIndicatorMs, setDropIndicatorMs] = useState<number | null>(null);

  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'trim-left' | 'trim-right' | null>(null);
  const [snapGuideMs, setSnapGuideMs] = useState<number | null>(null);

  // Mutable ref for high-performance 60FPS dragging without React re-bind lag
  const dragRef = useRef<{
    clipId: string;
    type: 'move' | 'trim-left' | 'trim-right';
    startX: number;
    startY: number;
    startMs: number;
    durationMs: number;
    sourceStartMs: number;
    clipType: string;
    targetTrackId: string;
  } | null>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    clip: Clip,
    type: 'move' | 'trim-left' | 'trim-right'
  ) => {
    // Only respond to primary (left) mouse button
    if (e.button !== 0) return;
    e.stopPropagation();
    // Critical: prevent browser native text/image drag-selection from hijacking mouse tracking
    e.preventDefault();
    if (track.locked) return;

    selectClip(clip.id);
    dragRef.current = {
      clipId: clip.id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      startMs: clip.startMs,
      durationMs: clip.durationMs,
      sourceStartMs: clip.sourceStartMs,
      clipType: clip.type,
      targetTrackId: track.id,
    };
    setDraggingClipId(clip.id);
    setDragType(type);

    document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!draggingClipId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { clipId, type, startX, startMs, durationMs, sourceStartMs, clipType } = dragRef.current;

      const deltaPx = e.clientX - startX;
      const deltaMs = pxToMs(deltaPx, zoom);

      if (type === 'move') {
        let newStartMs = Math.max(0, startMs + deltaMs);

        // Magnetic Snapping
        let currentSnapGuide: number | null = null;
        if (isSnapping) {
          const snapPoints = [0, playheadMs];
          tracks.forEach((t) => {
            t.clips.forEach((c) => {
              if (c.id !== clipId) {
                snapPoints.push(c.startMs);
                snapPoints.push(c.startMs + c.durationMs);
              }
            });
          });
          const snapThresholdMs = pxToMs(14, zoom);

          // 1. Try snapping left edge
          const snapLeft = snapTime(newStartMs, snapPoints, snapThresholdMs);
          if (snapLeft.didSnap) {
            newStartMs = snapLeft.snappedTime;
            currentSnapGuide = snapLeft.snappedTime;
          } else {
            // 2. Try snapping right edge
            const currentEndMs = newStartMs + durationMs;
            const snapRight = snapTime(currentEndMs, snapPoints, snapThresholdMs);
            if (snapRight.didSnap) {
              newStartMs = Math.max(0, snapRight.snappedTime - durationMs);
              currentSnapGuide = snapRight.snappedTime;
            }
          }
        }
        setSnapGuideMs(currentSnapGuide);

        // Vertical Track Detection (move clips between tracks)
        let targetTrackId = dragRef.current.targetTrackId;
        const elem = document.elementFromPoint(e.clientX, e.clientY);
        const trackLane = elem?.closest('[data-track-id]');
        if (trackLane) {
          const hoverTrackId = trackLane.getAttribute('data-track-id');
          const hoverTrackType = trackLane.getAttribute('data-track-type');
          if (hoverTrackId) {
            const isAudioClip = clipType === 'audio';
            const isTrackAudio = hoverTrackType === 'audio';
            if ((isAudioClip && isTrackAudio) || (!isAudioClip && !isTrackAudio)) {
              targetTrackId = hoverTrackId;
              dragRef.current.targetTrackId = hoverTrackId;
            }
          }
        }

        // Fast update without adding hundreds of history steps
        moveClip(clipId, targetTrackId, Math.round(newStartMs), false);
      } else if (type === 'trim-left') {
        const potentialStart = startMs + deltaMs;
        const potentialDuration = durationMs - deltaMs;
        const potentialSourceStart = sourceStartMs + deltaMs;

        if (potentialDuration >= 200 && potentialSourceStart >= 0) {
          updateClipTrim(
            clipId,
            Math.round(potentialStart),
            Math.round(potentialDuration),
            Math.round(potentialSourceStart),
            false
          );
        }
      } else if (type === 'trim-right') {
        const potentialDuration = durationMs + deltaMs;
        if (potentialDuration >= 200) {
          updateClipTrim(
            clipId,
            startMs,
            Math.round(potentialDuration),
            sourceStartMs,
            false
          );
        }
      }
    };

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      saveHistory(); // Single atomic history commit for undo/redo
      dragRef.current = null;
      setDraggingClipId(null);
      setDragType(null);
      setSnapGuideMs(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingClipId, zoom, isSnapping, playheadMs, tracks, moveClip, updateClipTrim, saveHistory]);

  // Compute snapped timestamp from clientX on track lane
  const computeTimeFromClientX = (clientX: number): number => {
    if (!trackLaneRef.current) return playheadMs;
    const rect = trackLaneRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    let targetMs = Math.max(0, pxToMs(clickX, zoom));

    if (isSnapping) {
      const snapPoints = [0, playheadMs];
      tracks.forEach((t) => {
        t.clips.forEach((c) => {
          snapPoints.push(c.startMs);
          snapPoints.push(c.startMs + c.durationMs);
        });
      });
      const snapThresholdMs = pxToMs(12, zoom);
      const { snappedTime } = snapTime(targetMs, snapPoints, snapThresholdMs);
      targetMs = snappedTime;
    }
    return targetMs;
  };

  // Drag-and-drop event handlers for dropping files & assets onto this track
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (track.locked) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'copy';

    const targetMs = computeTimeFromClientX(e.clientX);
    setIsDragOver(true);
    setDropIndicatorMs(targetMs);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!track.locked) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !trackLaneRef.current ||
      !e.relatedTarget ||
      !trackLaneRef.current.contains(e.relatedTarget as Node)
    ) {
      setIsDragOver(false);
      setDropIndicatorMs(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropIndicatorMs(null);

    if (track.locked) return;

    const dropMs = computeTimeFromClientX(e.clientX);

    // 1. Check for Media Asset dropped from Project Assets in Sidebar
    const assetJson = e.dataTransfer.getData('application/altra-asset');
    if (assetJson) {
      try {
        const asset: MediaAsset = JSON.parse(assetJson);
        addClip(
          track.id,
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
        return;
      } catch (err) {
        console.error('Error adding dropped asset to track:', err);
      }
    }

    // 2. Check for Clip Preset dropped from Sidebar (Text, Subtitle)
    const clipJson = e.dataTransfer.getData('application/altra-clip');
    if (clipJson) {
      try {
        const clipData: Partial<Clip> = JSON.parse(clipJson);
        addClip(track.id, clipData, dropMs);
        return;
      } catch (err) {
        console.error('Error adding dropped clip preset to track:', err);
      }
    }

    // 3. External media files dropped directly from Windows Explorer / Desktop
    // Handled by the container drop handler; skip here to prevent duplicate imports
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      return;
    }
  };

  const getClipColorClasses = (clip: Clip, isSelected: boolean, isDragging: boolean) => {
    if (isDragging) {
      return 'bg-cyan-600 text-white ring-2 ring-cyan-300 shadow-2xl scale-[1.01] z-40 opacity-95';
    }
    if (clip.type === 'video') {
      return isSelected
        ? 'bg-blue-600/90 border-cyan-400 ring-2 ring-cyan-400/50 text-white shadow-lg shadow-cyan-500/25'
        : 'bg-blue-950/80 border-blue-700/60 text-blue-200 hover:border-cyan-500/60';
    }
    if (clip.type === 'audio') {
      return isSelected
        ? 'bg-emerald-600/90 border-cyan-400 ring-2 ring-cyan-400/50 text-white shadow-lg shadow-cyan-500/25'
        : 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200 hover:border-cyan-500/60';
    }
    if (clip.type === 'text' || clip.type === 'subtitle') {
      return isSelected
        ? 'bg-amber-600/90 border-amber-300 ring-2 ring-amber-400/50 text-white shadow-lg shadow-amber-500/25'
        : 'bg-amber-950/80 border-amber-700/60 text-amber-200 hover:border-amber-500/70';
    }
    return isSelected
      ? 'bg-purple-600/90 border-cyan-400 ring-2 ring-cyan-400/50 text-white shadow-lg shadow-cyan-500/25'
      : 'bg-purple-950/80 border-purple-700/60 text-purple-200 hover:border-cyan-500/60';
  };

  return (
    <div
      ref={trackLaneRef}
      data-track-id={track.id}
      data-track-type={track.type}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-14 relative border-b select-none flex items-center transition-all ${
        isDragOver
          ? 'bg-indigo-950/50 border-indigo-400 ring-1 ring-inset ring-indigo-500/80'
          : 'bg-editor-trackBg border-editor-border/40'
      }`}
    >
      {/* Visual Drop Target Highlight & Placement Timecode Guide */}
      {isDragOver && dropIndicatorMs !== null && (
        <div
          style={{ left: `${msToPx(dropIndicatorMs, zoom)}px` }}
          className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
        >
          <div className="w-0.5 h-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,1)]" />
          <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono text-[10px] font-bold whitespace-nowrap shadow-xl border border-indigo-400/50 flex items-center gap-1">
            <ArrowDownCircle className="w-3 h-3 text-indigo-200" />
            <span>Drop at {formatTimecode(dropIndicatorMs, fps)}</span>
          </div>
        </div>
      )}

      {/* Snap Alignment Guide Line */}
      {snapGuideMs !== null && (
        <div
          style={{ left: `${msToPx(snapGuideMs, zoom)}px` }}
          className="absolute top-0 bottom-0 z-40 pointer-events-none flex flex-col items-center"
        >
          <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />
          <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-cyan-600 text-white font-mono text-[9px] font-bold shadow-md flex items-center gap-0.5">
            <Magnet className="w-2.5 h-2.5" />
            <span>{formatTimecode(snapGuideMs, fps)}</span>
          </div>
        </div>
      )}

      {/* Render existing Track Clips */}
      {track.clips.map((clip) => {
        const leftPx = msToPx(clip.startMs, zoom);
        const widthPx = Math.max(20, msToPx(clip.durationMs, zoom));
        const isSelected = selectedClipId === clip.id;
        const isDraggingThisClip = draggingClipId === clip.id;

        return (
          <div
            key={clip.id}
            onMouseDown={(e) => handleMouseDown(e, clip, 'move')}
            style={{
              left: `${leftPx}px`,
              width: `${widthPx}px`,
            }}
            className={`absolute top-1 bottom-1 rounded-md border flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing transition-shadow ${getClipColorClasses(
              clip,
              isSelected,
              isDraggingThisClip
            )}`}
          >
            {/* Live Dragging Timecode Pill */}
            {isDraggingThisClip && dragType === 'move' && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold shadow-2xl border border-indigo-400/60 whitespace-nowrap pointer-events-none z-50 flex items-center gap-1">
                <span>{formatTimecode(clip.startMs, fps)}</span>
                <span className="text-indigo-200">→</span>
                <span>{formatTimecode(clip.startMs + clip.durationMs, fps)}</span>
              </div>
            )}

            {/* Left Trim Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, clip, 'trim-left')}
              className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-white/10 hover:bg-white/40 cursor-ew-resize transition-all z-10 flex items-center justify-center group"
              title="Drag to trim start"
            >
              <div className="w-0.5 h-4 bg-white/60 rounded" />
            </div>

            {/* Clip Header Label */}
            <div className="px-3 pt-1 flex items-center gap-1.5 min-w-0 z-0">
              {clip.type === 'video' && <Film className="w-3 h-3 flex-shrink-0 text-blue-300" />}
              {clip.type === 'audio' && <Music className="w-3 h-3 flex-shrink-0 text-emerald-300" />}
              {(clip.type === 'text' || clip.type === 'subtitle') && (
                <Type className="w-3 h-3 flex-shrink-0 text-amber-300" />
              )}
              {clip.type === 'overlay' && <Layers className="w-3 h-3 flex-shrink-0 text-purple-300" />}

              <span className="text-[11px] font-semibold truncate leading-none">
                {clip.name}
              </span>

              {clip.chromaKey?.enabled && (
                <span className="px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-200 text-[9px] font-mono">
                  KEY
                </span>
              )}
            </div>

            {/* Waveform / Visual Content Strip */}
            <div className="h-4 px-2 flex items-center gap-1.5 overflow-hidden opacity-75">
              {clip.waveform ? (
                clip.waveform.map((peak, i) => (
                  <div
                    key={i}
                    className="w-1 bg-current rounded-full"
                    style={{ height: `${Math.max(2, peak * 14)}px` }}
                  />
                ))
              ) : clip.subtitleCues && clip.subtitleCues.length > 0 ? (
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-300 font-semibold truncate">
                  <span className="px-1 py-0.2 rounded bg-amber-500/30 text-amber-200">
                    {clip.textStyle?.captionTemplate || 'karaoke'}
                  </span>
                  <span className="truncate opacity-80">{clip.subtitleCues[0]?.text}</span>
                </div>
              ) : clip.textContent ? (
                <span className="text-[10px] italic truncate">{clip.textContent}</span>
              ) : (
                <div className="w-full h-1 bg-white/20 rounded-full" />
              )}
            </div>

            {/* Subtitle Cue Division Markers */}
            {clip.subtitleCues && clip.subtitleCues.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden pointer-events-none opacity-80">
                {clip.subtitleCues.map((cue, idx) => {
                  const cueLeftPct = Math.min(100, Math.max(0, (cue.startMs / Math.max(1, clip.durationMs)) * 100));
                  return (
                    <div
                      key={idx}
                      style={{ left: `${cueLeftPct}%` }}
                      className="absolute bottom-0 w-0.5 h-full bg-amber-400 rounded-t shadow-sm"
                    />
                  );
                })}
              </div>
            )}

            {/* Right Trim Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, clip, 'trim-right')}
              className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-white/10 hover:bg-white/40 cursor-ew-resize transition-all z-10 flex items-center justify-center group"
              title="Drag to trim end"
            >
              <div className="w-0.5 h-4 bg-white/60 rounded" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Track, Clip } from '@/types/editor';
import { useEditorStore } from '@/store/useEditorStore';
import { msToPx, pxToMs, formatTimecode } from '@/lib/utils/time';
import {
  Film,
  Music,
  Type,
  Layers,
  Scissors,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

interface TrackItemProps {
  track: Track;
}

export const TrackItem: React.FC<TrackItemProps> = ({ track }) => {
  const {
    zoom,
    selectedClipId,
    selectClip,
    updateClipTrim,
    moveClip,
    playheadMs,
  } = useEditorStore();

  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'trim-left' | 'trim-right' | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [initialClipState, setInitialClipState] = useState<{
    startMs: number;
    durationMs: number;
    sourceStartMs: number;
  } | null>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    clip: Clip,
    type: 'move' | 'trim-left' | 'trim-right'
  ) => {
    e.stopPropagation();
    if (track.locked) return;

    selectClip(clip.id);
    setDraggingClipId(clip.id);
    setDragType(type);
    setDragStartX(e.clientX);
    setInitialClipState({
      startMs: clip.startMs,
      durationMs: clip.durationMs,
      sourceStartMs: clip.sourceStartMs,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingClipId || !dragType || !initialClipState) return;

      const deltaPx = e.clientX - dragStartX;
      const deltaMs = pxToMs(deltaPx, zoom);

      if (dragType === 'move') {
        const newStartMs = Math.max(0, initialClipState.startMs + deltaMs);
        moveClip(draggingClipId, track.id, Math.round(newStartMs));
      } else if (dragType === 'trim-left') {
        const potentialStart = initialClipState.startMs + deltaMs;
        const potentialDuration = initialClipState.durationMs - deltaMs;
        const potentialSourceStart = initialClipState.sourceStartMs + deltaMs;

        if (potentialDuration >= 200 && potentialSourceStart >= 0) {
          updateClipTrim(
            draggingClipId,
            Math.round(potentialStart),
            Math.round(potentialDuration),
            Math.round(potentialSourceStart)
          );
        }
      } else if (dragType === 'trim-right') {
        const potentialDuration = initialClipState.durationMs + deltaMs;
        if (potentialDuration >= 200) {
          updateClipTrim(
            draggingClipId,
            initialClipState.startMs,
            Math.round(potentialDuration),
            initialClipState.sourceStartMs
          );
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingClipId(null);
      setDragType(null);
      setInitialClipState(null);
    };

    if (draggingClipId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingClipId, dragType, dragStartX, initialClipState, zoom, track.id, moveClip, updateClipTrim]);

  const getClipColorClasses = (clip: Clip, isSelected: boolean) => {
    if (clip.type === 'video') {
      return isSelected
        ? 'bg-blue-600/90 border-blue-400 text-white shadow-lg shadow-blue-500/20'
        : 'bg-blue-950/80 border-blue-700/60 text-blue-200 hover:border-blue-500';
    }
    if (clip.type === 'audio') {
      return isSelected
        ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
        : 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200 hover:border-emerald-500';
    }
    if (clip.type === 'text' || clip.type === 'subtitle') {
      return isSelected
        ? 'bg-amber-600/90 border-amber-400 text-white shadow-lg shadow-amber-500/20'
        : 'bg-amber-950/80 border-amber-700/60 text-amber-200 hover:border-amber-500';
    }
    return isSelected
      ? 'bg-purple-600/90 border-purple-400 text-white shadow-lg shadow-purple-500/20'
      : 'bg-purple-950/80 border-purple-700/60 text-purple-200 hover:border-purple-500';
  };

  return (
    <div className="h-14 relative bg-editor-trackBg border-b border-editor-border/40 select-none flex items-center">
      {track.clips.map((clip) => {
        const leftPx = msToPx(clip.startMs, zoom);
        const widthPx = Math.max(20, msToPx(clip.durationMs, zoom));
        const isSelected = selectedClipId === clip.id;

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
              isSelected
            )}`}
          >
            {/* Left Trim Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, clip, 'trim-left')}
              className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-white/10 hover:bg-white/40 cursor-ew-resize transition-all z-10 flex items-center justify-center group"
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
            <div className="h-4 px-2 flex items-center gap-0.5 overflow-hidden opacity-60">
              {clip.waveform ? (
                clip.waveform.map((peak, i) => (
                  <div
                    key={i}
                    className="w-1 bg-current rounded-full"
                    style={{ height: `${Math.max(2, peak * 14)}px` }}
                  />
                ))
              ) : clip.textContent ? (
                <span className="text-[10px] italic truncate">{clip.textContent}</span>
              ) : (
                <div className="w-full h-1 bg-white/20 rounded-full" />
              )}
            </div>

            {/* Right Trim Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, clip, 'trim-right')}
              className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-white/10 hover:bg-white/40 cursor-ew-resize transition-all z-10 flex items-center justify-center group"
            >
              <div className="w-0.5 h-4 bg-white/60 rounded" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

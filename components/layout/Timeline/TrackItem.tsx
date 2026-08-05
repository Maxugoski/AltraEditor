'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Track, Clip, MediaAsset } from '@/types/editor';
import { useEditorStore } from '@/store/useEditorStore';
import { msToPx, pxToMs, formatTimecode, snapTime } from '@/lib/utils/time';
import { inspectMediaFile } from '@/lib/utils/media';
import { generateSynthwaveAudioWavUrl } from '@/lib/audio/synthAudio';
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

    // 2. Check for Clip Preset dropped from Sidebar (Text, Subtitle, Audio SFX)
    const clipJson = e.dataTransfer.getData('application/altra-clip');
    if (clipJson) {
      try {
        const clipData: Partial<Clip> = JSON.parse(clipJson);
        if (clipData.type === 'audio' && !clipData.src) {
          clipData.src = await generateSynthwaveAudioWavUrl(15);
        }
        addClip(track.id, clipData, dropMs);
        return;
      } catch (err) {
        console.error('Error adding dropped clip preset to track:', err);
      }
    }

    // 3. Check for external media files dropped directly from Windows Explorer / Desktop
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      let currentDropMs = dropMs;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const asset = await inspectMediaFile(file);
          addMediaAsset(asset);
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
            currentDropMs
          );
          currentDropMs += asset.durationMs || 5000;
        } catch (err) {
          console.warn('Fallback importing dropped file:', err);
          const fallbackType = file.type.startsWith('audio')
            ? 'audio'
            : file.type.startsWith('image')
            ? 'image'
            : 'video';
          const fallbackAsset: MediaAsset = {
            id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: fallbackType,
            src: URL.createObjectURL(file),
            durationMs: 5000,
            sizeBytes: file.size,
          };
          addMediaAsset(fallbackAsset);
          addClip(
            track.id,
            {
              name: fallbackAsset.name,
              type: fallbackAsset.type,
              src: fallbackAsset.src,
              durationMs: 5000,
              sourceDurationMs: 5000,
            },
            currentDropMs
          );
          currentDropMs += 5000;
        }
      }
    }
  };

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
    <div
      ref={trackLaneRef}
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
          {/* Vertical alignment guide line */}
          <div className="w-0.5 h-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,1)]" />

          {/* Floating Timecode Pill */}
          <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono text-[10px] font-bold whitespace-nowrap shadow-xl border border-indigo-400/50 flex items-center gap-1">
            <ArrowDownCircle className="w-3 h-3 text-indigo-200" />
            <span>Drop at {formatTimecode(dropIndicatorMs, fps)}</span>
          </div>
        </div>
      )}

      {/* Render existing Track Clips */}
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

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { CanvasRenderer } from '@/lib/render/canvasRenderer';
import { formatTimecode } from '@/lib/utils/time';
import { audioManager } from '@/lib/audio/audioManager';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  ZoomIn,
  Move,
  Maximize,
  Sparkles,
} from 'lucide-react';

export const PreviewPlayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const {
    tracks,
    playheadMs,
    isPlaying,
    setPlayhead,
    setIsPlaying,
    togglePlay,
    durationMs,
    fps,
    aspectRatio,
    canvasWidth,
    canvasHeight,
    selectedClipId,
    updateClipTransform,
  } = useEditorStore();

  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomScale, setZoomScale] = useState<'fit' | '50%' | '100%'>('fit');

  // Find currently selected clip
  const selectedClip = tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId);

  // Initialize CanvasRenderer instance
  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  const playheadRef = useRef<number>(playheadMs);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const tracksRef = useRef(tracks);
  const durationMsRef = useRef(durationMs);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    durationMsRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) {
      lastTimeRef.current = performance.now();
    } else {
      if (rendererRef.current) {
        rendererRef.current.pauseAllAudio();
      }
    }
  }, [isPlaying]);

  // Sync external seek/scrub updates to playheadRef
  useEffect(() => {
    playheadRef.current = playheadMs;
    if (!isPlayingRef.current && rendererRef.current && canvasRef.current) {
      rendererRef.current.syncMediaPlayback(tracksRef.current, playheadMs, false);
      rendererRef.current.render(tracksRef.current, playheadMs, canvasWidth, canvasHeight);
    }
  }, [playheadMs, canvasWidth, canvasHeight]);

  // Main High-Performance Render & Playback Loop
  useEffect(() => {
    let animId: number;
    let lastStoreUpdateTime = 0;

    const loop = (currentTime: number) => {
      const delta = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (isPlayingRef.current) {
        let nextTime = playheadRef.current + delta;
        if (nextTime >= durationMsRef.current) {
          nextTime = durationMsRef.current;
          setIsPlaying(false);
        }
        playheadRef.current = nextTime;

        // Throttle Zustand store sync to ~30 FPS to prevent React render queue saturation
        if (currentTime - lastStoreUpdateTime > 32) {
          setPlayhead(nextTime);
          lastStoreUpdateTime = currentTime;
        }
      }

      if (rendererRef.current && canvasRef.current) {
        rendererRef.current.syncMediaPlayback(
          tracksRef.current,
          playheadRef.current,
          isPlayingRef.current
        );
        rendererRef.current.render(
          tracksRef.current,
          playheadRef.current,
          canvasWidth,
          canvasHeight
        );
      }

      animId = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [canvasWidth, canvasHeight, setIsPlaying, setPlayhead]);

  // Handle Dragging clip on Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedClip) return;
    setIsDraggingClip(true);
    setDragStartPos({ x: e.clientX - selectedClip.transform.x, y: e.clientY - selectedClip.transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingClip || !dragStartPos || !selectedClip) return;
    const newX = Math.round(e.clientX - dragStartPos.x);
    const newY = Math.round(e.clientY - dragStartPos.y);
    updateClipTransform(selectedClip.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDraggingClip(false);
    setDragStartPos(null);
  };



  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-editor-bg select-none min-w-0 relative overflow-hidden"
    >
      {/* Top Floating Viewport Info */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 shadow-md">
          {canvasWidth} × {canvasHeight} ({aspectRatio})
        </span>
        {selectedClip && (
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-[11px] font-medium text-indigo-300 flex items-center gap-1.5 animate-fade-in shadow-md">
            <Move className="w-3 h-3" /> Drag on canvas to reposition
          </span>
        )}
      </div>

      {/* Canvas Viewport Container */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0 relative overflow-hidden">
        <div
          className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-editor-border/80 bg-black"
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            width: zoomScale === 'fit' ? '100%' : zoomScale === '50%' ? '50%' : '100%',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full object-contain ${
              selectedClip ? (isDraggingClip ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
          />
        </div>
      </div>

      {/* Bottom Playback Control Bar */}
      <div className="h-11 border-t border-editor-border bg-editor-surface flex items-center justify-between px-3.5 z-10 flex-shrink-0">
        {/* Left: Timecode Display */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="font-bold text-cyan-400 tracking-wider">
            {formatTimecode(playheadMs, fps)}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 font-medium">
            {formatTimecode(durationMs, fps)}
          </span>
        </div>

        {/* Center: CapCut Signature Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPlayhead(0)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Jump to Start (Home)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setPlayhead(Math.max(0, playheadMs - 1000))}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Step Back 1s"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* CapCut Circular Play Button */}
          <button
            onClick={() => {
              audioManager.unlock();
              togglePlay();
            }}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-950 flex items-center justify-center transition shadow-[0_0_12px_rgba(255,255,255,0.35)] transform active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setPlayhead(Math.min(durationMs, playheadMs + 1000))}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Step Forward 1s"
          >
            <RotateCcw className="w-3 h-3 rotate-180" />
          </button>

          <button
            onClick={() => setPlayhead(durationMs)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Jump to End (End)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Viewport Controls */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:text-white hover:bg-editor-surface2 transition"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

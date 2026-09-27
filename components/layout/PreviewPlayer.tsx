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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Move,
  Grid,
  Shield,
  Repeat,
  Gauge,
  Sparkles,
  Crosshair,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const PreviewPlayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
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
  const [showGrid, setShowGrid] = useState(false);
  const [showSafeAreas, setShowSafeAreas] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

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
  const speedRef = useRef(playbackSpeed);
  const isLoopingRef = useRef(isLooping);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    durationMsRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

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
      const delta = (currentTime - lastTimeRef.current) * speedRef.current;
      lastTimeRef.current = currentTime;

      if (isPlayingRef.current) {
        let nextTime = playheadRef.current + delta;
        if (nextTime >= durationMsRef.current) {
          if (isLoopingRef.current) {
            nextTime = 0;
          } else {
            nextTime = durationMsRef.current;
            setIsPlaying(false);
          }
        }
        playheadRef.current = nextTime;

        // Throttle Zustand store sync to ~30 FPS
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

  const stepFrames = (frames: number) => {
    const frameMs = 1000 / fps;
    const nextMs = Math.max(0, Math.min(durationMs, playheadMs + frames * frameMs));
    setPlayhead(nextMs);
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
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
      {/* Top Floating Viewport Info Bar & Composition Tools */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Resolution & Aspect Ratio Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono font-medium text-slate-300 shadow-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {canvasWidth} × {canvasHeight} ({aspectRatio})
          </span>

          {selectedClip && (
            <div className="px-2.5 py-1 rounded-lg bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-[11px] font-medium text-cyan-200 flex items-center gap-1.5 animate-fade-in shadow-lg">
              <Move className="w-3 h-3 text-cyan-400" />
              <span>
                {selectedClip.name} (X: {selectedClip.transform.x}px, Y: {selectedClip.transform.y}px, {Math.round(selectedClip.transform.scale * 100)}%)
              </span>
            </div>
          )}
        </div>

        {/* Right: Composition Overlays & Zoom Toggles */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
          {/* Rule of Thirds Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg text-xs transition ${
              showGrid
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
            title="Rule of Thirds Composition Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Safe Margins / Creator Guidelines */}
          <button
            onClick={() => setShowSafeAreas(!showSafeAreas)}
            className={`p-1.5 rounded-lg text-xs transition ${
              showSafeAreas
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
            title="Action & Title Safe Area Guides"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-white/20 mx-0.5" />

          {/* Zoom scale selector */}
          <div className="flex items-center gap-0.5 text-[10px] font-medium text-slate-300">
            {(['fit', '50%', '100%'] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setZoomScale(scale)}
                className={`px-1.5 py-0.5 rounded-md transition ${
                  zoomScale === scale
                    ? 'bg-cyan-500/30 text-cyan-200 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {scale === 'fit' ? 'Fit' : scale}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Viewport Container */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-editor-bg to-editor-bg">
        <div
          className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-xl overflow-hidden border border-editor-border/90 bg-black group"
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            width: zoomScale === 'fit' ? '100%' : zoomScale === '50%' ? '50%' : '100%',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {/* Main 60FPS Video Canvas */}
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

          {/* COMPOSITION GUIDES OVERLAY */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
              <div className="border-r border-b border-cyan-400/25" />
              <div className="border-r border-b border-cyan-400/25" />
              <div className="border-b border-cyan-400/25" />
              <div className="border-r border-b border-cyan-400/25" />
              <div className="border-r border-b border-cyan-400/25" />
              <div className="border-b border-cyan-400/25" />
              <div className="border-r border-cyan-400/25" />
              <div className="border-r border-cyan-400/25" />
              <div />
            </div>
          )}

          {/* SAFE AREAS OVERLAY */}
          {showSafeAreas && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              {/* Action Safe (90%) */}
              <div className="w-[90%] h-[90%] border border-cyan-400/30 rounded-lg flex items-center justify-center relative">
                <span className="absolute top-1 left-2 text-[9px] font-mono text-cyan-400/50">Action Safe (90%)</span>
                {/* Title Safe (80%) */}
                <div className="w-[88%] h-[88%] border border-amber-400/30 rounded-md relative">
                  <span className="absolute top-1 left-2 text-[9px] font-mono text-amber-400/50">Title Safe (80%)</span>
                </div>
              </div>
            </div>
          )}

          {/* SELECTED CLIP TRANSFORM GIZMO OVERLAY */}
          {selectedClip && !isPlaying && (
            <div
              className="absolute pointer-events-none border border-cyan-400/60 shadow-[0_0_12px_rgba(0,242,254,0.3)] transition-all duration-75"
              style={{
                left: `calc(50% + ${(selectedClip.transform.x / canvasWidth) * 100}% - 40%)`,
                top: `calc(50% + ${(selectedClip.transform.y / canvasHeight) * 100}% - 35%)`,
                width: `${Math.max(120, 80 * selectedClip.transform.scale)}%`,
                height: `${Math.max(80, 70 * selectedClip.transform.scale)}%`,
                transform: `rotate(${selectedClip.transform.rotation}deg)`,
              }}
            >
              {/* Corner Handles */}
              <div className="w-2.5 h-2.5 bg-white border border-cyan-500 rounded-sm absolute -top-1.5 -left-1.5 shadow" />
              <div className="w-2.5 h-2.5 bg-white border border-cyan-500 rounded-sm absolute -top-1.5 -right-1.5 shadow" />
              <div className="w-2.5 h-2.5 bg-white border border-cyan-500 rounded-sm absolute -bottom-1.5 -left-1.5 shadow" />
              <div className="w-2.5 h-2.5 bg-white border border-cyan-500 rounded-sm absolute -bottom-1.5 -right-1.5 shadow" />
              {/* Center Crosshair Anchor */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-cyan-400/80 flex items-center justify-center">
                <div className="w-1 h-1 bg-cyan-400 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Playback Control Bar */}
      <div className="h-12 border-t border-editor-border bg-editor-surface flex items-center justify-between px-4 z-10 flex-shrink-0 shadow-sm">
        {/* Left: Timecode Display */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-editor-surface2 px-2.5 py-1 rounded-lg border border-editor-border/80">
            <span className="font-bold text-cyan-400 tracking-wider">
              {formatTimecode(playheadMs, fps)}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 font-medium">
              {formatTimecode(durationMs, fps)}
            </span>
          </div>

          <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">
            {fps} FPS
          </span>
        </div>

        {/* Center: Precision Playback & Stepping Controls */}
        <div className="flex items-center gap-1.5">
          {/* Jump to Beginning */}
          <button
            onClick={() => setPlayhead(0)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Jump to Start (Home)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Step Back 1s */}
          <button
            onClick={() => setPlayhead(Math.max(0, playheadMs - 1000))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Step Back 1s (Shift+Left)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Step Back 1 Frame */}
          <button
            onClick={() => stepFrames(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Step Back 1 Frame (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Glowing Play / Pause Button */}
          <button
            onClick={() => {
              audioManager.unlock();
              togglePlay();
            }}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 flex items-center justify-center transition shadow-[0_0_16px_rgba(0,242,254,0.45)] transform active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-slate-950 text-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-slate-950 text-slate-950 ml-0.5" />
            )}
          </button>

          {/* Step Forward 1 Frame */}
          <button
            onClick={() => stepFrames(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Step Forward 1 Frame (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Step Forward 1s */}
          <button
            onClick={() => setPlayhead(Math.min(durationMs, playheadMs + 1000))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Step Forward 1s (Shift+Right)"
          >
            <RotateCcw className="w-3.5 h-3.5 rotate-180" />
          </button>

          {/* Jump to End */}
          <button
            onClick={() => setPlayhead(durationMs)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Jump to End (End)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Speed, Loop, Fullscreen */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {/* Playback Speed Switcher */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-lg bg-editor-surface2 hover:bg-editor-hover text-slate-300 hover:text-white border border-editor-border text-[11px] font-mono font-bold transition flex items-center gap-1"
            title="Playback Speed"
          >
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>{playbackSpeed}x</span>
          </button>

          {/* Loop Playback Toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg transition ${
              isLooping
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'hover:text-white hover:bg-editor-surface2 text-slate-400'
            }`}
            title={isLooping ? 'Looping Enabled' : 'Looping Disabled'}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:text-white hover:bg-editor-surface2 transition"
            title="Fullscreen (F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


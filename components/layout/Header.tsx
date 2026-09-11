'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { AspectRatio } from '@/types/editor';
import {
  Play,
  Pause,
  Download,
  Undo2,
  Redo2,
  Sparkles,
  Layers,
  Monitor,
  Smartphone,
  Square,
  Film,
  Video,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenExport }) => {
  const {
    title,
    setProjectTitle,
    aspectRatio,
    setAspectRatio,
    undo,
    redo,
    historyIndex,
    history,
    tracks,
  } = useEditorStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      setProjectTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const aspectRatios: Array<{ value: AspectRatio; label: string; icon: any }> = [
    { value: '16:9', label: '16:9 (Landscape)', icon: Monitor },
    { value: '9:16', label: '9:16 (Shorts/TikTok)', icon: Smartphone },
    { value: '1:1', label: '1:1 (Square)', icon: Square },
    { value: '4:5', label: '4:5 (Portrait)', icon: Film },
    { value: '21:9', label: '21:9 (Cinematic)', icon: Video },
  ];

  const totalClips = tracks.reduce((sum, t) => sum + t.clips.length, 0);

  return (
    <header className="h-13 border-b border-editor-border bg-editor-surface flex items-center justify-between px-3 select-none z-30">
      {/* Left: CapCut Brand Mark & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* CapCut-style Geometric Neon Cut Logo */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 via-teal-400 to-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,242,254,0.35)]">
            <div className="w-3.5 h-3.5 bg-slate-950 rounded-sm transform rotate-45 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm tracking-tight text-white leading-none">
              Cap<span className="text-cyan-400">Cut</span>
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/30">
              PRO
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-editor-border mx-1" />

        {/* Project Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="bg-editor-surface2 text-xs text-white px-2 py-0.5 rounded border border-cyan-400 outline-none w-44 font-medium"
          />
        ) : (
          <button
            onClick={() => {
              setTempTitle(title);
              setIsEditingTitle(true);
            }}
            title="Click to rename project"
            className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-0.5 rounded hover:bg-editor-surface2 transition flex items-center gap-1.5"
          >
            <span>{title}</span>
            <span className="text-[10px] text-slate-500 font-mono">({totalClips})</span>
          </button>
        )}
      </div>

      {/* Center: Undo/Redo & Aspect Ratio & Demo */}
      <div className="flex items-center gap-2.5">
        {/* Undo / Redo */}
        <div className="flex items-center bg-editor-surface2/90 rounded-lg p-0.5 border border-editor-border/80">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              canUndo ? 'text-slate-200 hover:bg-editor-hover hover:text-white' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              canRedo ? 'text-slate-200 hover:bg-editor-hover hover:text-white' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center bg-editor-surface2/90 rounded-lg px-2.5 py-1 border border-editor-border/80 text-xs">
          <span className="text-slate-400 mr-2 flex items-center gap-1 text-[11px] font-medium">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" /> Ratio:
          </span>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-transparent text-slate-200 font-bold text-[11px] outline-none cursor-pointer hover:text-white"
          >
            {aspectRatios.map((r) => (
              <option key={r.value} value={r.value} className="bg-editor-surface text-slate-200">
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Export & Engine Status */}
      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Offline AI Engine</span>
        </div>

        {/* CapCut Signature Rounded-Full Cyan Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-bold text-xs shadow-[0_0_16px_rgba(0,242,254,0.35)] transition transform active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

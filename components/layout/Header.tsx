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
    loadSampleProject,
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
    <header className="h-14 border-b border-editor-border bg-editor-surface flex items-center justify-between px-4 select-none z-30">
      {/* Left: Brand & Project Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-none">
              ALTRA<span className="text-indigo-400 font-extrabold ml-0.5">STUDIO</span>
            </span>
            <span className="text-[10px] text-indigo-400/80 font-medium tracking-wider">CLIENT-SIDE AI EDITOR</span>
          </div>
        </div>

        <div className="h-5 w-px bg-editor-border mx-1" />

        {/* Project Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="bg-editor-surface2 text-sm text-white px-2.5 py-1 rounded border border-indigo-500 outline-none w-48"
          />
        ) : (
          <button
            onClick={() => {
              setTempTitle(title);
              setIsEditingTitle(true);
            }}
            title="Click to rename project"
            className="text-xs font-medium text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-editor-surface2 transition flex items-center gap-1.5"
          >
            <span>{title}</span>
            <span className="text-[10px] text-slate-500">({totalClips} clips)</span>
          </button>
        )}
      </div>

      {/* Center: Undo/Redo & Aspect Ratio & Demo Template */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center bg-editor-surface2/80 rounded-lg p-0.5 border border-editor-border/60">
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
        <div className="flex items-center bg-editor-surface2/80 rounded-lg px-2 py-1 border border-editor-border/60 text-xs">
          <span className="text-slate-400 mr-2 flex items-center gap-1 text-[11px]">
            <Monitor className="w-3.5 h-3.5 text-slate-400" /> Ratio:
          </span>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer hover:text-white"
          >
            {aspectRatios.map((r) => (
              <option key={r.value} value={r.value} className="bg-editor-surface text-slate-200">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Demo Loader */}
        <button
          onClick={loadSampleProject}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition shadow-sm"
          title="Load interactive sample project"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Demo Template</span>
        </button>
      </div>

      {/* Right: Export & Engine Status */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>100% Client-Side WASM</span>
        </div>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-indigo-500/25 transition transform active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};

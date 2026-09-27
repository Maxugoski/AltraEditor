'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { AspectRatio } from '@/types/editor';
import {
  Download,
  Undo2,
  Redo2,
  Sparkles,
  Monitor,
  Smartphone,
  Square,
  Film,
  Video,
  HelpCircle,
  PlaySquare,
  Keyboard,
  CheckCircle2,
} from 'lucide-react';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';

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
    loadSampleProject,
  } = useEditorStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [demoLoadedNotification, setDemoLoadedNotification] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      setProjectTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleLoadDemo = () => {
    loadSampleProject();
    setDemoLoadedNotification(true);
    setTimeout(() => setDemoLoadedNotification(false), 3000);
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
    <>
      <header className="h-14 border-b border-editor-border bg-editor-surface flex items-center justify-between px-4 select-none z-30 shadow-sm">
        {/* Left: Altra Studio Pro Branding & Project Name */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5 group cursor-pointer" title="Altra Studio Video Suite">
            {/* Luminous Prism Aperture Logo */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-500 p-0.5 shadow-[0_0_16px_rgba(0,242,254,0.4)] group-hover:scale-105 transition transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-purple-500/20" />
                <div className="w-3.5 h-3.5 border-2 border-cyan-400 rounded-sm rotate-45 flex items-center justify-center shadow-[0_0_8px_rgba(0,242,254,0.8)]">
                  <div className="w-1.5 h-1.5 bg-white rounded-full shadow" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white leading-none">
                ALTRA <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">STUDIO</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                PRO
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-editor-border/80 mx-1" />

          {/* Project Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-editor-surface2 text-xs text-white px-2.5 py-1 rounded-lg border border-cyan-400 outline-none w-48 font-medium shadow-inner"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename project"
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-editor-surface2 transition flex items-center gap-2 group"
            >
              <span className="truncate max-w-[160px]">{title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-editor-surface2 text-slate-400 font-mono font-normal group-hover:text-slate-200">
                {totalClips} {totalClips === 1 ? 'clip' : 'clips'}
              </span>
            </button>
          )}

          {/* Interactive Demo Project Generator Button */}
          <button
            onClick={handleLoadDemo}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-editor-surface2 hover:bg-cyan-500/15 border border-editor-border hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-medium transition"
            title="Load ready-to-edit demo project with synchronized video, music, and auto-captions"
          >
            <PlaySquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Demo</span>
          </button>

          {demoLoadedNotification && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-medium animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Demo project loaded!</span>
            </div>
          )}
        </div>

        {/* Center: Undo/Redo & Aspect Ratio */}
        <div className="flex items-center gap-3">
          {/* Undo / Redo */}
          <div className="flex items-center bg-editor-surface2 rounded-lg p-0.5 border border-editor-border">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition ${
                canUndo ? 'text-slate-200 hover:bg-editor-hover hover:text-white' : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition ${
                canRedo ? 'text-slate-200 hover:bg-editor-hover hover:text-white' : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center bg-editor-surface2 rounded-lg px-2.5 py-1 border border-editor-border text-xs">
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

        {/* Right: Shortcuts Guide, Status, Export Button */}
        <div className="flex items-center gap-2.5">
          {/* Shortcuts Guide Button */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-1.5 rounded-lg bg-editor-surface2 hover:bg-editor-hover text-slate-400 hover:text-white border border-editor-border transition flex items-center gap-1 text-xs"
            title="Keyboard Shortcuts Cheat Sheet"
          >
            <Keyboard className="w-4 h-4 text-slate-300" />
            <span className="hidden lg:inline text-[11px]">Shortcuts</span>
          </button>

          {/* Engine Status Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>WebGL 60FPS • Client Engine</span>
          </div>

          {/* Glowing Pro Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-bold text-xs shadow-[0_0_18px_rgba(0,242,254,0.4)] transition transform active:scale-95"
            title="Export Video (MP4 / WebM up to 4K)"
          >
            <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span className="tracking-wide">Export Video</span>
          </button>
        </div>
      </header>

      {/* Shortcuts Modal */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </>
  );
};


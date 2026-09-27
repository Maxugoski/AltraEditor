'use client';

import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Playback & Navigation',
      items: [
        { key: 'Space', desc: 'Play / Pause video preview' },
        { key: '← / →', desc: 'Step 1 frame backward / forward' },
        { key: 'Shift + ← / →', desc: 'Step 1 second backward / forward' },
        { key: 'Home / End', desc: 'Jump to beginning / end of timeline' },
      ],
    },
    {
      category: 'Timeline & Editing',
      items: [
        { key: 'S  /  Ctrl + K', desc: 'Split clip at playhead (Blade cut)' },
        { key: 'Delete', desc: 'Delete selected clip' },
        { key: 'Ctrl + D', desc: 'Duplicate selected clip' },
        { key: 'Ctrl + C  /  V', desc: 'Copy and paste clip at playhead' },
        { key: 'N', desc: 'Toggle magnetic clip snapping' },
        { key: 'R', desc: 'In / Out range selection mode' },
        { key: 'Esc', desc: 'Deselect active clip' },
      ],
    },
    {
      category: 'View & History',
      items: [
        { key: 'Ctrl + Z', desc: 'Undo last change' },
        { key: 'Ctrl + Y', desc: 'Redo previously undone change' },
        { key: 'Ctrl + + / -', desc: 'Zoom in / out on timeline ruler' },
        { key: 'Ctrl + 0', desc: 'Reset timeline zoom to default' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-editor-surface border border-editor-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-editor-border bg-editor-surface2/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-slate-400">Professional Studio Shortcuts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-editor-surface2 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                {group.category}
              </span>
              <div className="grid grid-cols-1 gap-1.5 bg-editor-surface2/30 rounded-xl p-2.5 border border-editor-border/50">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-editor-surface2/60 transition"
                  >
                    <span className="text-xs text-slate-300 font-medium">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-editor-surface2 border border-editor-border text-[11px] font-mono text-cyan-300 font-bold shadow-sm whitespace-nowrap">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="h-11 px-5 border-t border-editor-border bg-editor-surface2/20 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Press ESC anytime to close</span>
          <span className="text-slate-400">Altra Studio Pro</span>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { TrackType } from '@/types/editor';
import {
  Film,
  Music,
  Type,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Subtitles,
} from 'lucide-react';

export const TrackList: React.FC = () => {
  const {
    tracks,
    toggleTrackMute,
    toggleTrackLock,
    toggleTrackVisibility,
    addTrack,
    removeTrack,
  } = useEditorStore();

  // Compute track label badge (e.g. V1, A1, CC, T1)
  const getTrackBadge = (track: { type: TrackType; name: string }, index: number) => {
    const isSubtitle = track.name.toLowerCase().includes('caption') || track.name.toLowerCase().includes('subtitle');
    
    switch (track.type) {
      case 'video':
        return {
          code: `V${index + 1}`,
          color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          icon: <Film className="w-3 h-3 text-cyan-400" />,
        };
      case 'audio':
        return {
          code: `A${index + 1}`,
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: <Music className="w-3 h-3 text-emerald-400" />,
        };
      case 'text':
        return {
          code: isSubtitle ? 'CC' : `T${index + 1}`,
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: isSubtitle ? <Subtitles className="w-3 h-3 text-amber-400" /> : <Type className="w-3 h-3 text-amber-400" />,
        };
      case 'overlay':
        return {
          code: `OV${index + 1}`,
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: <Layers className="w-3 h-3 text-purple-400" />,
        };
    }
  };

  return (
    <div className="w-56 flex-shrink-0 border-r border-editor-border bg-editor-surface flex flex-col select-none z-10">
      {/* Top Header of Track List (matches ruler height: 32px / h-8) */}
      <div className="h-8 border-b border-editor-border px-3 flex items-center justify-between bg-editor-bg text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Tracks</span>
          <span className="px-1 py-0.2 rounded-full bg-editor-surface2 text-slate-400 text-[9px] font-mono">
            {tracks.length}
          </span>
        </div>

        {/* Quick Add Track Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => addTrack('video')}
            className="px-1.5 py-0.5 rounded bg-editor-surface2 hover:bg-editor-surface text-cyan-300 border border-editor-border/80 text-[10px] font-semibold flex items-center gap-0.5 transition"
            title="Add Video Track"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>V</span>
          </button>
          <button
            onClick={() => addTrack('text')}
            className="px-1.5 py-0.5 rounded bg-editor-surface2 hover:bg-editor-surface text-amber-300 border border-editor-border/80 text-[10px] font-semibold flex items-center gap-0.5 transition"
            title="Add Text / Caption Track"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>T</span>
          </button>
          <button
            onClick={() => addTrack('audio')}
            className="px-1.5 py-0.5 rounded bg-editor-surface2 hover:bg-editor-surface text-emerald-300 border border-editor-border/80 text-[10px] font-semibold flex items-center gap-0.5 transition"
            title="Add Audio Track"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>A</span>
          </button>
        </div>
      </div>

      {/* Track Rows Header */}
      <div className="flex flex-col">
        {tracks.map((track, idx) => {
          const badge = getTrackBadge(track, idx);

          return (
            <div
              key={track.id}
              className="h-14 border-b border-editor-border/50 px-2.5 flex items-center justify-between hover:bg-editor-surface2/30 transition group"
            >
              {/* Left: CapCut Badge & Name */}
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                {/* CapCut Style Pill Badge (V1, A1, CC) */}
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 shadow-sm ${badge.color}`}
                  title={`${track.name} (${badge.code})`}
                >
                  {badge.code}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate leading-tight">
                    {track.name}
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium">
                    {track.clips.length} {track.clips.length === 1 ? 'clip' : 'clips'}
                  </span>
                </div>
              </div>

              {/* Right: CapCut Quick Controls (Visibility, Lock, Mute) */}
              <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                <button
                  onClick={() => toggleTrackVisibility(track.id)}
                  className={`p-1 rounded hover:bg-editor-surface2 transition ${
                    track.visible ? 'hover:text-white' : 'text-slate-600'
                  }`}
                  title={track.visible ? 'Hide Track' : 'Show Track'}
                >
                  {track.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <button
                  onClick={() => toggleTrackLock(track.id)}
                  className={`p-1 rounded hover:bg-editor-surface2 transition ${
                    track.locked ? 'text-amber-400 bg-amber-400/10' : 'hover:text-white'
                  }`}
                  title={track.locked ? 'Unlock Track' : 'Lock Track'}
                >
                  {track.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                {track.type === 'audio' || track.type === 'video' ? (
                  <button
                    onClick={() => toggleTrackMute(track.id)}
                    className={`p-1 rounded hover:bg-editor-surface2 transition ${
                      track.muted ? 'text-rose-400 bg-rose-500/10' : 'hover:text-white'
                    }`}
                    title={track.muted ? 'Unmute Track' : 'Mute Track'}
                  >
                    {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                ) : null}

                {tracks.length > 2 && (
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="p-1 rounded hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                    title="Delete Track"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

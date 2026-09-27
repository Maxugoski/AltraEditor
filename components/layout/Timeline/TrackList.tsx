'use client';

import React, { useState } from 'react';
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
  Trash2,
  Subtitles,
  Plus,
} from 'lucide-react';

export const TrackList: React.FC = () => {
  const {
    tracks,
    toggleTrackMute,
    toggleTrackLock,
    toggleTrackVisibility,
    removeTrack,
    addTrack,
  } = useEditorStore();

  const [showAddMenu, setShowAddMenu] = useState(false);

  // Compute track label badge (e.g. V1, A1, CC, T1)
  const getTrackBadge = (track: { type: TrackType; name: string }, index: number) => {
    const isSubtitle =
      track.name.toLowerCase().includes('caption') ||
      track.name.toLowerCase().includes('subtitle');

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
          icon: isSubtitle ? (
            <Subtitles className="w-3 h-3 text-amber-400" />
          ) : (
            <Type className="w-3 h-3 text-amber-400" />
          ),
        };
      case 'overlay':
        return {
          code: `OV${index + 1}`,
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: <Layers className="w-3 h-3 text-purple-400" />,
        };
    }
  };

  // Count by type for correct numbering (V1, V2…)
  const typeCounters: Partial<Record<TrackType, number>> = {};
  const getBadgeIndex = (type: TrackType) => {
    typeCounters[type] = (typeCounters[type] ?? 0) + 1;
    return (typeCounters[type] ?? 1) - 1;
  };

  const handleCreateTrack = (type: TrackType) => {
    const count = tracks.filter((t) => t.type === type).length + 1;
    const name = type === 'video' ? `Video Track ${count}` : type === 'audio' ? `Audio Track ${count}` : `Titles ${count}`;
    addTrack(type, name);
    setShowAddMenu(false);
  };

  return (
    <div className="w-60 flex-shrink-0 border-r border-editor-border bg-editor-surface flex flex-col select-none z-10">
      {/* Header */}
      <div className="h-8 border-b border-editor-border px-3 flex items-center justify-between bg-editor-bg text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
            Timeline Tracks
          </span>
          <span className="px-1.5 py-0.2 rounded bg-editor-surface2 text-slate-400 text-[9px] font-mono">
            {tracks.length}
          </span>
        </div>

        {/* Quick Add Track Menu */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-1 rounded-md hover:bg-editor-surface2 text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 text-[10px] font-semibold"
            title="Add New Track"
          >
            <Plus className="w-3 h-3" />
            <span>Track</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-7 w-36 bg-editor-surface2 border border-editor-border rounded-xl shadow-2xl py-1 z-50 flex flex-col animate-fade-in">
              <button
                onClick={() => handleCreateTrack('video')}
                className="px-3 py-1.5 text-xs text-left hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 flex items-center gap-2"
              >
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Video Track</span>
              </button>
              <button
                onClick={() => handleCreateTrack('text')}
                className="px-3 py-1.5 text-xs text-left hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 flex items-center gap-2"
              >
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Text Track</span>
              </button>
              <button
                onClick={() => handleCreateTrack('audio')}
                className="px-3 py-1.5 text-xs text-left hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 flex items-center gap-2"
              >
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Audio Track</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Track Rows */}
      <div className="flex flex-col flex-1">
        {tracks.map((track) => {
          const idx = getBadgeIndex(track.type);
          const badge = getTrackBadge(track, idx);

          return (
            <div
              key={track.id}
              className="h-14 border-b border-editor-border/60 px-3 flex items-center justify-between hover:bg-editor-surface2/40 transition group"
            >
              {/* Left: Badge & Name */}
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-1.5">
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
                  <span className="text-[10px] text-slate-500 font-medium">
                    {track.clips.length} {track.clips.length === 1 ? 'clip' : 'clips'}
                  </span>
                </div>
              </div>

              {/* Right: Pro Controls */}
              <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                <button
                  onClick={() => toggleTrackVisibility(track.id)}
                  className={`p-1.5 rounded-md hover:bg-editor-surface2 transition ${
                    track.visible ? 'hover:text-white' : 'text-slate-600 bg-black/20'
                  }`}
                  title={track.visible ? 'Hide Track' : 'Show Track'}
                >
                  {track.visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>

                <button
                  onClick={() => toggleTrackLock(track.id)}
                  className={`p-1.5 rounded-md hover:bg-editor-surface2 transition ${
                    track.locked
                      ? 'text-amber-400 bg-amber-400/10'
                      : 'hover:text-white'
                  }`}
                  title={track.locked ? 'Unlock Track' : 'Lock Track'}
                >
                  {track.locked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                </button>

                {(track.type === 'audio' || track.type === 'video') && (
                  <button
                    onClick={() => toggleTrackMute(track.id)}
                    className={`p-1.5 rounded-md hover:bg-editor-surface2 transition ${
                      track.muted
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'hover:text-white'
                    }`}
                    title={track.muted ? 'Unmute Track' : 'Mute Track'}
                  >
                    {track.muted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Delete track if more than 1 track */}
                {tracks.length > 1 && (
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="p-1 rounded-md hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                    title="Remove Track"
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


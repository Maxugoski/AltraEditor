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

  const getTrackIcon = (type: TrackType) => {
    switch (type) {
      case 'video':
        return <Film className="w-3.5 h-3.5 text-blue-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'overlay':
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="w-56 flex-shrink-0 border-r border-editor-border bg-editor-surface flex flex-col select-none z-10">
      {/* Top Header of Track List (matches ruler height) */}
      <div className="h-8 border-b border-editor-border px-3 flex items-center justify-between bg-editor-bg text-xs">
        <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Tracks</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addTrack('video')}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Add Video Track"
          >
            <Plus className="w-3 h-3 text-blue-400" />
          </button>
          <button
            onClick={() => addTrack('audio')}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
            title="Add Audio Track"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Track Rows Header */}
      <div className="flex flex-col">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="h-14 border-b border-editor-border/40 px-3 flex items-center justify-between hover:bg-editor-surface2/40 transition group"
          >
            {/* Left: Icon & Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded bg-editor-surface2 border border-editor-border/60">
                {getTrackIcon(track.type)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-200 truncate">{track.name}</span>
                <span className="text-[9px] text-slate-500 uppercase">{track.clips.length} clips</span>
              </div>
            </div>

            {/* Right: Controls (Visibility, Lock, Mute) */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => toggleTrackVisibility(track.id)}
                className={`p-1 rounded hover:bg-editor-surface2 transition ${
                  track.visible ? 'hover:text-white' : 'text-slate-600'
                }`}
                title={track.visible ? 'Hide Track' : 'Show Track'}
              >
                {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                onClick={() => toggleTrackLock(track.id)}
                className={`p-1 rounded hover:bg-editor-surface2 transition ${
                  track.locked ? 'text-amber-400' : 'hover:text-white'
                }`}
                title={track.locked ? 'Unlock Track' : 'Lock Track'}
              >
                {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>

              {track.type === 'audio' || track.type === 'video' ? (
                <button
                  onClick={() => toggleTrackMute(track.id)}
                  className={`p-1 rounded hover:bg-editor-surface2 transition ${
                    track.muted ? 'text-rose-400' : 'hover:text-white'
                  }`}
                  title={track.muted ? 'Unmute Track' : 'Mute Track'}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
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
        ))}
      </div>
    </div>
  );
};

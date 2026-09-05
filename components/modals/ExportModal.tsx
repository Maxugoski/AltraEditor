'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { ExportSettings } from '@/types/editor';
import { exportProjectToVideo, downloadBlob } from '@/lib/export/exportPipeline';
import {
  Download,
  X,
  CheckCircle2,
  Film,
  Video,
  Monitor,
  Smartphone,
  Square,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const {
    tracks,
    durationMs,
    title,
    aspectRatio,
    canvasWidth,
    canvasHeight,
    isExporting,
    exportProgress,
    exportStatusMessage,
    setExportState,
  } = useEditorStore();

  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [resolution, setResolution] = useState<'1080p' | '720p' | '4k' | 'custom'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [completedBlob, setCompletedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const getExportDimensions = () => {
    if (aspectRatio === '9:16') {
      if (resolution === '720p') return { width: 720, height: 1280 };
      if (resolution === '4k') return { width: 2160, height: 3840 };
      return { width: 1080, height: 1920 };
    } else if (aspectRatio === '1:1') {
      if (resolution === '720p') return { width: 720, height: 720 };
      if (resolution === '4k') return { width: 2160, height: 2160 };
      return { width: 1080, height: 1080 };
    } else {
      if (resolution === '720p') return { width: 1280, height: 720 };
      if (resolution === '4k') return { width: 3840, height: 2160 };
      return { width: 1920, height: 1080 };
    }
  };

  const bitrateMap = {
    high: 8000,
    medium: 4500,
    low: 2500,
  };

  const handleStartExport = async () => {
    setErrorMsg(null);
    setDownloadUrl(null);
    setCompletedBlob(null);

    const dims = getExportDimensions();
    const settings: ExportSettings = {
      format,
      resolution,
      width: dims.width,
      height: dims.height,
      fps,
      quality,
      bitrateKbps: bitrateMap[quality],
    };

    setExportState(true, 0, 'Starting export pipeline...');

    try {
      const blob = await exportProjectToVideo(
        tracks,
        durationMs,
        settings,
        (progress, message) => {
          setExportState(true, progress, message);
        }
      );

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setCompletedBlob(blob);
      setExportState(false, 100, 'Done');
    } catch (err: unknown) {
      console.error('Export failed', err);
      setErrorMsg(err instanceof Error ? err.message : 'Video export failed');
      setExportState(false, 0, '');
    }
  };

  const handleDownloadFile = () => {
    if (completedBlob) {
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadBlob(completedBlob, `${safeTitle}_export.${format}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg bg-editor-surface border border-editor-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-editor-border flex items-center justify-between bg-editor-bg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Export Video Project</h2>
              <span className="text-[11px] text-slate-400">Zero-Cost Client-Side MP4 / WebM Muxing</span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Format & Resolution */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('mp4')}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                    format === 'mp4'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-editor-surface2 border-editor-border text-slate-400 hover:text-white'
                  }`}
                >
                  MP4 (H.264)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('webm')}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                    format === 'webm'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-editor-surface2 border-editor-border text-slate-400 hover:text-white'
                  }`}
                >
                  WebM (VP9)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full py-2 px-3 rounded-lg bg-editor-surface2 border border-editor-border text-white outline-none cursor-pointer"
              >
                <option value="1080p">1080p Full HD (Recommended)</option>
                <option value="720p">720p Fast Render</option>
                <option value="4k">4K Ultra HD (High Detail)</option>
              </select>
            </div>
          </div>

          {/* Framerate & Quality */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Framerate</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFps(30)}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                    fps === 30
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-editor-surface2 border-editor-border text-slate-400 hover:text-white'
                  }`}
                >
                  30 FPS
                </button>
                <button
                  type="button"
                  onClick={() => setFps(60)}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                    fps === 60
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-editor-surface2 border-editor-border text-slate-400 hover:text-white'
                  }`}
                >
                  60 FPS
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Quality Bitrate</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                className="w-full py-2 px-3 rounded-lg bg-editor-surface2 border border-editor-border text-white outline-none cursor-pointer"
              >
                <option value="high">High (8 Mbps - Crisp)</option>
                <option value="medium">Medium (4.5 Mbps - Balanced)</option>
                <option value="low">Low (2.5 Mbps - Compact File)</option>
              </select>
            </div>
          </div>

          {/* Progress / Status Area */}
          {isExporting && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  {exportStatusMessage || 'Rendering video frames...'}
                </span>
                <span className="font-bold text-white">{exportProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Completed Download Card */}
          {completedBlob && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Video Render Complete! ({(completedBlob.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>

              <button
                onClick={handleDownloadFile}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download {format.toUpperCase()} Video</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-editor-border flex items-center justify-end gap-3 bg-editor-bg">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-editor-surface2 transition"
          >
            Close
          </button>
          {!completedBlob && (
            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Encoding...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Export</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

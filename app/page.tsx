'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PreviewPlayer } from '@/components/layout/PreviewPlayer';
import { Inspector } from '@/components/layout/Inspector';
import { TimelineContainer } from '@/components/layout/Timeline/TimelineContainer';
import { ExportModal } from '@/components/modals/ExportModal';
import { useEditorStore } from '@/store/useEditorStore';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

export default function EditorPage() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { loadSampleProject, tracks } = useEditorStore();

  // Activate Windows keyboard shortcuts globally
  useKeyboardShortcuts();

  // Load sample project on initial mount if empty
  useEffect(() => {
    const hasClips = tracks.some((t) => t.clips.length > 0);
    if (!hasClips) {
      loadSampleProject();
    }
  }, [loadSampleProject, tracks]);

  return (
    <main className="h-screen w-screen flex flex-col bg-editor-bg text-slate-100 overflow-hidden select-none">
      {/* Top Application Header */}
      <Header onOpenExport={() => setIsExportModalOpen(true)} />

      {/* Main Center Area: Sidebar + Preview Canvas + Inspector */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Sidebar (Media, Text, Audio, AI Tools, Filters) */}
        <Sidebar />

        {/* Center Canvas Preview Player */}
        <PreviewPlayer />

        {/* Right Properties Inspector */}
        <Inspector />
      </div>

      {/* Bottom Multi-Track Timeline */}
      <TimelineContainer />

      {/* Client-Side Video Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </main>
  );
}

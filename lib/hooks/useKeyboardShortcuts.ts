import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    togglePlay,
    playheadMs,
    setPlayhead,
    durationMs,
    fps,
    selectedClipId,
    selectClip,
    splitClipAtPlayhead,
    removeClip,
    duplicateClip,
    copyClip,
    pasteClip,
    zoom,
    setZoom,
    tracks,
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut if user is currently typing in an input, textarea, or contentEditable
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // --- 1. Undo (Ctrl+Z) ---
      if (isCtrl && !e.shiftKey && key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // --- 2. Redo (Ctrl+Y or Ctrl+Shift+Z) ---
      if ((isCtrl && key === 'y') || (isCtrl && e.shiftKey && key === 'z')) {
        e.preventDefault();
        redo();
        return;
      }

      // --- 3. Copy (Ctrl+C) ---
      if (isCtrl && key === 'c') {
        if (selectedClipId) {
          e.preventDefault();
          copyClip(selectedClipId);
        }
        return;
      }

      // --- 4. Paste (Ctrl+V) ---
      if (isCtrl && key === 'v') {
        e.preventDefault();
        pasteClip(playheadMs);
        return;
      }

      // --- 5. Duplicate (Ctrl+D) ---
      if (isCtrl && key === 'd') {
        if (selectedClipId) {
          e.preventDefault();
          duplicateClip(selectedClipId);
        }
        return;
      }

      // --- 6. Select All / First Clip (Ctrl+A) ---
      if (isCtrl && key === 'a') {
        e.preventDefault();
        const firstClip = tracks.flatMap((t) => t.clips)[0];
        if (firstClip) {
          selectClip(firstClip.id);
        }
        return;
      }

      // --- 7. Zoom In (Ctrl + Plus / Ctrl + =) ---
      if (isCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(zoom + 25);
        return;
      }

      // --- 8. Zoom Out (Ctrl + Minus / Ctrl + _) ---
      if (isCtrl && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom(zoom - 25);
        return;
      }

      // --- 9. Zoom Reset (Ctrl + 0) ---
      if (isCtrl && e.key === '0') {
        e.preventDefault();
        setZoom(80);
        return;
      }

      // --- 10. Split at Playhead (S or Ctrl+K) ---
      if (key === 's' || (isCtrl && key === 'k')) {
        e.preventDefault();
        splitClipAtPlayhead(selectedClipId || undefined);
        return;
      }

      // --- 11. Delete / Remove (Delete or Backspace) ---
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          removeClip(selectedClipId);
        }
        return;
      }

      // --- 12. Play / Pause (Space) ---
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // --- 13. Step Frame Left (ArrowLeft) ---
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const stepMs = e.shiftKey ? 1000 : 1000 / fps;
        setPlayhead(Math.max(0, playheadMs - stepMs));
        return;
      }

      // --- 14. Step Frame Right (ArrowRight) ---
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const stepMs = e.shiftKey ? 1000 : 1000 / fps;
        setPlayhead(Math.min(durationMs, playheadMs + stepMs));
        return;
      }

      // --- 15. Jump to Start (Home) ---
      if (e.code === 'Home') {
        e.preventDefault();
        setPlayhead(0);
        return;
      }

      // --- 16. Jump to End (End) ---
      if (e.code === 'End') {
        e.preventDefault();
        setPlayhead(durationMs);
        return;
      }

      // --- 17. Deselect (Escape) ---
      if (e.key === 'Escape') {
        if (selectedClipId) {
          e.preventDefault();
          selectClip(null);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    undo,
    redo,
    togglePlay,
    playheadMs,
    setPlayhead,
    durationMs,
    fps,
    selectedClipId,
    selectClip,
    splitClipAtPlayhead,
    removeClip,
    duplicateClip,
    copyClip,
    pasteClip,
    zoom,
    setZoom,
    tracks,
  ]);
}

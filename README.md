# 🎬 AltraStudio — Client-Side Video Editor (Open-Source CapCut Alternative)

A modern, high-performance, 100% client-side video editor powered by **Next.js 16**, **React 19**, **OpenCut Engine**, **WebGL / WebGPU**, **Tailwind CSS**, and **WebAssembly**.

---

## ✨ Features

- 🎞️ **Multi-Track Timeline**: Unlimited layered tracks (Video, Audio, Text, Stickers, Transitions, Effects) with precise frame snapping, splitting, trimming, and dragging.
- ⚡ **Real-Time WebGL Compositor & Preview**: 60 FPS playback with transformations, rotations, blend modes, masks, and chroma keying.
- 🎨 **Visual Effects & Filters**: Cinematic color grades, customizable masks, speed adjustment, and audio envelopes.
- 🎵 **Integrated Audio & Waveforms**: Multi-track audio mixing, volume automation, and waveform visualization via Wavesurfer.
- 🔤 **Subtitles & Rich Text Styles**: Rich typography, font formatting, and animated text overlays.
- 💾 **100% Client-Side Privacy**: All video assets, cache, and project saves are securely stored in your browser using **IndexedDB** and **OPFS** (Origin Private File System).
- 📦 **Hardware-Accelerated Export**: Render MP4 / WebM with custom aspect ratios (16:9, 9:16 Shorts/TikTok, 1:1, 4:5, 21:9).
- ⌨️ **Comprehensive Keybindings**: Full keyboard shortcut management and customizable controls.


---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start editing!

### 3. Build for Production

```bash
npm run build
npm run start
```

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) & [React 19](https://react.dev/)
- **Core Engine**: OpenCut Architecture (`EditorCore`, `TimelineManager`, `PlaybackManager`, `RendererManager`)
- **Video Timing & Math**: `opencut-wasm`
- **State Management**: Zustand v5
- **UI & Components**: Radix UI, Base UI, Lucide Icons, Hugeicons
- **Storage**: IndexedDB & OPFS (zero server dependency required)

---

## 📄 License

MIT License.

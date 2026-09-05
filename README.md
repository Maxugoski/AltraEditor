# 🎬 AltraStudio — Client-Side AI Video Editor

A 100% client-side, zero-cost video editing suite built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **WebGL / Canvas 2D**, **Zustand**, **FFmpeg WASM**, and on-device **Whisper AI**.

---

## ✨ Features

- 🎞️ **Multi-Track Timeline**: Unlimited layered tracks (Video, Audio, Titles, VFX Overlays) with split (`S`), trim, duplicate, and drag-and-drop.
- ⚡ **Real-Time WebGL/Canvas Preview**: 60 FPS playback loop with live on-canvas drag repositioning, scaling, rotation, and opacity control.
- 🤖 **On-Device AI Auto-Captions**: Zero-cost, 100% client-side speech recognition powered by `@xenova/transformers` (Whisper model).
- 🪄 **Real-Time Chroma Key & Background Cutout**: Green & blue screen keying shader with tolerance thresholding, edge smoothness, and color spill reduction.
- 🎨 **Cinematic Color Grading**: Real-time filters (Teal & Orange, Cyberpunk, Noir, Vintage 70s, Warmth).
- 📦 **WASM & MediaRecorder Video Export**: Client-side video encoding to **MP4 (H.264)** or **WebM (VP9)** in 1080p, 720p, or 4K with frame-by-frame progress.
- 📱 **Multi-Aspect Ratio**: Instant switching between **16:9 Landscape**, **9:16 Shorts/TikTok**, **1:1 Square**, and **21:9 Cinema**.
- 🔒 **100% Private & Serverless**: All media processing, AI transcription, and video rendering happen entirely inside the user's browser.

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
npm run start
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Video Processing**: [FFmpeg WASM](https://ffmpegwasm.netlify.app/)
- **On-Device AI**: [@xenova/transformers](https://huggingface.co/docs/transformers.js)

---

## 📄 License

MIT License. Free for personal and commercial use.

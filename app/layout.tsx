import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Altra Studio - Client-Side AI Video Editor',
  description: 'Production-ready, zero-cost, 100% client-side video editor powered by WebAssembly, WebGL, and on-device Whisper AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-editor-bg text-slate-100 flex flex-col antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}

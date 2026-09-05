import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        editor: {
          bg: "#0d0f12",
          surface: "#16191f",
          surface2: "#1f242d",
          border: "#282f3c",
          hover: "#2d3544",
          accent: "#6366f1",
          accentHover: "#4f46e5",
          timelineBg: "#0a0c0e",
          trackBg: "#14171d",
          clipVideo: "#3b82f6",
          clipAudio: "#10b981",
          clipText: "#f59e0b",
          clipOverlay: "#ec4899",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

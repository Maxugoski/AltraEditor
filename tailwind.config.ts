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
          bg: "#0e0e11",
          surface: "#141418",
          surface2: "#1d1d24",
          border: "#262630",
          hover: "#2a2a35",
          accent: "#00F2FE",
          accentHover: "#00C2CB",
          cyan: "#00F2FE",
          teal: "#00C2CB",
          gold: "#FACC15",
          red: "#FF3B30",
          timelineBg: "#0a0a0d",
          trackBg: "#121216",
          clipVideo: "#2563eb",
          clipAudio: "#059669",
          clipText: "#d97706",
          clipOverlay: "#9333ea",
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

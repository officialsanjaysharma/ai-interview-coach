import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070C",
          900: "#0A0F18",
          800: "#121A27",
          700: "#1A2436",
          600: "#243044",
        },
        mist: {
          50: "#F3F6FA",
          100: "#D8E0EC",
          200: "#A8B6C9",
          300: "#7A8BA3",
        },
        signal: {
          DEFAULT: "#3EE0C2",
          dim: "#1FA88F",
          glow: "rgba(62, 224, 194, 0.18)",
        },
        warn: {
          DEFAULT: "#F0B429",
          soft: "rgba(240, 180, 41, 0.15)",
        },
        danger: {
          DEFAULT: "#F07178",
          soft: "rgba(240, 113, 120, 0.14)",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px rgba(62, 224, 194, 0.12)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease both",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

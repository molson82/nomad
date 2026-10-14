import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        fretboard: "var(--color-fretboard)",
        border: "var(--color-border)",
        hover: "var(--color-hover-bg)",
        ink: "var(--color-ink)",
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          ink: "var(--color-accent-ink)",
          tint: "var(--color-accent-tint)",
          on: "var(--color-on-accent)",
        },
        decoder: {
          DEFAULT: "var(--decoder-yellow)",
          soft: "var(--decoder-yellow-soft)",
          pale: "var(--decoder-yellow-pale)",
          "ink-soft": "var(--decoder-ink-soft)",
          muted: "var(--decoder-muted)",
        },
      },
      borderRadius: {
        card: "20px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

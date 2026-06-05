/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#DEDBC8",
          foreground: "#2A2520",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "ring-gold": "#e8b842",
        kb: {
          amber: "#ff6a1f",
          "amber-hot": "#ff8a3d",
          gold: "#e8b842",
          "gold-deep": "#8a6418",
          fg: "#f4f0e6",
          soft: "#c8c2b4",
          mute: "#7a7480",
          faint: "#4d4856",
          card: "#16131c",
          elev: "#1e1a26",
          deep: "#07060a",
          crimson: "#ff3d5e",
          green: "#00d17a",
          glass: "rgba(255, 255, 255, 0.045)",
          "glass-strong": "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.16)",
          hairline: "rgba(255, 255, 255, 0.05)",
        },
        ink: {
          DEFAULT: "#2A2520",
          light: "#4A4540",
          muted: "#8A8580",
        },
        cream: {
          DEFAULT: "#F5F2E8",
          dark: "#EBE7DA",
          card: "#EDE9DC",
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        display: ['Anton', 'Oswald', 'system-ui', 'sans-serif'],
        ui: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

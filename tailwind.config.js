/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Arial", "Helvetica", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "oklch(60% 0.126 221.723)",
          "primary-content": "oklch(93% 0.034 272.788)",
          "secondary": "oklch(58% 0.233 277.117)",
          "secondary-content": "oklch(94% 0.028 342.258)",
          "accent": "oklch(70% 0.213 47.604)",
          "accent-content": "oklch(38% 0.063 188.416)",
          "neutral": "oklch(14% 0.005 285.823)",
          "neutral-content": "oklch(92% 0.004 286.32)",
          "base-100": "oklch(100% 0 0)",
          "base-200": "oklch(98% 0 0)",
          "base-300": "oklch(95% 0 0)",
          "base-content": "oklch(21% 0.006 285.885)",
          "info": "oklch(74% 0.16 232.661)",
          "info-content": "oklch(29% 0.066 243.157)",
          "success": "oklch(76% 0.177 163.223)",
          "success-content": "oklch(37% 0.077 168.94)",
          "warning": "oklch(82% 0.189 84.429)",
          "warning-content": "oklch(41% 0.112 45.904)",
          "error": "oklch(71% 0.194 13.428)",
          "error-content": "oklch(27% 0.105 12.094)",
        }
      }
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
  }
}

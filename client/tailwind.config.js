/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"]
      },
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)"
        },
        brand: {
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca"
        }
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgb(15 23 42 / 0.06), 0 4px 16px -4px rgb(15 23 42 / 0.08)",
        "soft-lg": "0 4px 24px -4px rgb(15 23 42 / 0.08), 0 12px 40px -12px rgb(15 23 42 / 0.12)"
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

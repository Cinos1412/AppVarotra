import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Palette "Liquid Glass — App'Varotra"
 * -----------------------------------------------------------------------
 * ink       #0A1F1B  fond nuit tropicale (remplace le noir pur)
 * malachite #146356  vert profond, couleur de marque
 * ravinala  #2FA88F  vert d'eau (feuille de voyageur), accent secondaire
 * vanille   #F2C879  or chaud (fleur de vanille), accent CTA doux
 * corail    #FF6F59  corail vif (coucher de soleil), alertes / CTA fort
 * brume     rgba(255,255,255,x) — le "verre" lui-même
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A1F1B",
        "ink-soft": "#123028",
        malachite: { DEFAULT: "#146356", light: "#1C8A76" },
        ravinala: { DEFAULT: "#2FA88F", light: "#5FCBB3" },
        vanille: { DEFAULT: "#F2C879", light: "#F8DFA8" },
        corail: { DEFAULT: "#FF6F59", light: "#FF8F7D" },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backdropBlur: { xs: "2px" },
      borderRadius: { "3xl": "1.75rem", "4xl": "2.25rem" },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(6, 20, 17, 0.37)",
        "glass-inset": "inset 0 1px 0 0 rgba(255,255,255,0.35)",
      },
      keyframes: {
        "ring-spin": { to: { transform: "rotate(360deg)" } },
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(3%, -4%) scale(1.06)" },
          "66%": { transform: "translate(-3%, 3%) scale(0.97)" },
        },
        "story-progress": { from: { width: "0%" }, to: { width: "100%" } },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(47, 168, 143, 0.35)" },
          "50%": { boxShadow: "0 0 0 10px rgba(47, 168, 143, 0)" },
        },
        "pulse-glow-corail": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 111, 89, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255, 111, 89, 0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%, 70%, 100%": { opacity: "1" },
          "20%, 50%": { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "ring-spin": "ring-spin 6s linear infinite",
        "blob-drift": "blob-drift 18s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow-corail": "pulse-glow-corail 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slide-up 0.35s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

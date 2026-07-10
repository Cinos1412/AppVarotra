import type { Config } from "tailwindcss";

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
      },
      animation: {
        "ring-spin": "ring-spin 6s linear infinite",
        "blob-drift": "blob-drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

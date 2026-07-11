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
        "premium": "0 20px 60px rgba(6, 20, 17, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        "premium-sm": "0 10px 30px rgba(6, 20, 17, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        "premium-lg": "0 30px 80px rgba(6, 20, 17, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
      },
      backgroundImage: {
        "gradient-premium": "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
        "gradient-vanille": "linear-gradient(135deg, var(--tw-gradient-stops))",
      },
      keyframes: {
        "ring-spin": { to: { transform: "rotate(360deg)" } },
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(3%, -4%) scale(1.06)" },
          "66%": { transform: "translate(-3%, 3%) scale(0.97)" },
        },
        "story-progress": { from: { width: "0%" }, to: { width: "100%" } },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-32px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(32px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "zoom-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "ring-spin": "ring-spin 6s linear infinite",
        "blob-drift": "blob-drift 18s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "slide-down": "slide-down 0.6s ease-out",
        "slide-in-left": "slide-in-left 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.6s ease-out",
        "zoom-in": "zoom-in 0.5s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};

export default config;

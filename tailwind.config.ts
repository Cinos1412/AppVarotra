import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Palette "Studio Premium — App'Varotra"
 * -----------------------------------------------------------------------
 * Les noms de tokens (ink, malachite, ravinala, vanille, corail) sont
 * conservés pour ne pas casser les usages dans les composants — seules
 * les valeurs changent, vers une identité "Cyber-Premium" façon
 * Stripe/Linear/Apple plutôt que la palette organique malgache d'origine.
 *
 * ink       #07090E  noir de studio abyssal (fond principal, mode sombre)
 * ink-soft  #0F131A  gris encre adouci (surfaces secondaires)
 * malachite #00FFC3  vert néon / cyan électrique (accent secondaire)
 * ravinala  #0A84FF  bleu iOS — ACCENT PRINCIPAL (CTA, liens, focus)
 * vanille   #FFD60A  or pur (CTA secondaires, badges boost/prix)
 * corail    #FF3B30  rouge Apple (alertes, suppressions, danger)
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07090E",
        "ink-soft": "#0F131A",
        malachite: { DEFAULT: "#00FFC3", light: "#00E5AF" },
        ravinala: { DEFAULT: "#0A84FF", light: "#409CFF" },
        vanille: { DEFAULT: "#FFD60A", light: "#FFE066" },
        corail: { DEFAULT: "#FF3B30", light: "#FF453A" },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backdropBlur: { xs: "2px" },
      borderRadius: { "3xl": "1.75rem", "4xl": "2.25rem" },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(4, 7, 12, 0.5)",
        "glass-inset": "inset 0 1px 0 0 rgba(255,255,255,0.2)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(10, 132, 255, 0.35)" },
          "50%": { boxShadow: "0 0 0 10px rgba(10, 132, 255, 0)" },
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
        "float-up": {
          "0%": { transform: "translateY(0) scale(0.8)", opacity: "0" },
          "15%": { opacity: "1", transform: "translateY(-10px) scale(1.1)" },
          "100%": { transform: "translateY(-220px) scale(1)", opacity: "0" },
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
        "float-up": "float-up 2s ease-out forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

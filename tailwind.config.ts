import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // StayLocal brand tokens
        ivory: '#f8fafc',
        charcoal: '#121212',
        gold: '#A68E69',
        forest: '#455E4C',
        // Tokens éditoriaux (page recommandations bento)
        cream: '#f7f3ed',
        sand: '#ebe2d5',
        // Shadcn/ui CSS variable tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
        hand: ['var(--font-story)', 'cursive'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        // Spec 054 — écrans secondaires et feuille basse du guide de séjour.
        'guide-slide-in': { from: { opacity: '0', transform: 'translateX(40px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'guide-sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'guide-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'guide-slide-in': 'guide-slide-in 280ms ease-out',
        'guide-sheet-up': 'guide-sheet-up 280ms ease-out',
        'guide-fade-in': 'guide-fade-in 200ms ease-out',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(36, 34, 32, 0.08)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

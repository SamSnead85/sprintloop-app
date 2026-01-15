/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Obsidian Glass Design System Colors
                obsidian: {
                    50: '#f6f7f9',
                    100: '#eceef2',
                    200: '#d5dae2',
                    300: '#b0b9c9',
                    400: '#8591ab',
                    500: '#667391',
                    600: '#515c78',
                    700: '#434b62',
                    800: '#3a4153',
                    900: '#343947',
                    950: '#1e2129',
                },
                slate: {
                    850: '#1a1d24',
                    950: '#0d0f12',
                },
                accent: {
                    blue: '#3b82f6',
                    purple: '#8b5cf6',
                    cyan: '#06b6d4',
                    emerald: '#10b981',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
            boxShadow: {
                'obsidian': '0 4px 20px rgba(0, 0, 0, 0.5)',
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
                'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
            },
            backdropBlur: {
                'xs': '2px',
            },
        },
    },
    plugins: [],
}

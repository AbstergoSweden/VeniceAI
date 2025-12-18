/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            colors: {
                // M3 Primary - Lavender
                primary: {
                    DEFAULT: 'var(--md-sys-color-primary)',
                    container: 'var(--md-sys-color-primary-container)',
                },
                'on-primary': {
                    DEFAULT: 'var(--md-sys-color-on-primary)',
                    container: 'var(--md-sys-color-on-primary-container)',
                },
                // M3 Secondary - Teal
                secondary: {
                    DEFAULT: 'var(--md-sys-color-secondary)',
                    container: 'var(--md-sys-color-secondary-container)',
                },
                'on-secondary': {
                    DEFAULT: 'var(--md-sys-color-on-secondary)',
                    container: 'var(--md-sys-color-on-secondary-container)',
                },
                // M3 Tertiary - Coral
                tertiary: {
                    DEFAULT: 'var(--md-sys-color-tertiary)',
                    container: 'var(--md-sys-color-tertiary-container)',
                },
                'on-tertiary': {
                    DEFAULT: 'var(--md-sys-color-on-tertiary)',
                    container: 'var(--md-sys-color-on-tertiary-container)',
                },
                // M3 Error
                error: {
                    DEFAULT: 'var(--md-sys-color-error)',
                    container: 'var(--md-sys-color-error-container)',
                },
                'on-error': {
                    DEFAULT: 'var(--md-sys-color-on-error)',
                    container: 'var(--md-sys-color-on-error-container)',
                },
                // M3 Surfaces
                surface: {
                    dim: 'var(--md-sys-color-surface-dim)',
                    DEFAULT: 'var(--md-sys-color-surface)',
                    bright: 'var(--md-sys-color-surface-bright)',
                    'container-lowest': 'var(--md-sys-color-surface-container-lowest)',
                    'container-low': 'var(--md-sys-color-surface-container-low)',
                    container: 'var(--md-sys-color-surface-container)',
                    'container-high': 'var(--md-sys-color-surface-container-high)',
                    'container-highest': 'var(--md-sys-color-surface-container-highest)',
                },
                'on-surface': {
                    DEFAULT: 'var(--md-sys-color-on-surface)',
                    variant: 'var(--md-sys-color-on-surface-variant)',
                },
                // M3 Outlines
                outline: {
                    DEFAULT: 'var(--md-sys-color-outline)',
                    variant: 'var(--md-sys-color-outline-variant)',
                },
                // Semantic Colors
                success: {
                    DEFAULT: 'var(--md-sys-color-success)',
                    container: 'var(--md-sys-color-success-container)',
                },
                warning: {
                    DEFAULT: 'var(--md-sys-color-warning)',
                    container: 'var(--md-sys-color-warning-container)',
                },
                info: {
                    DEFAULT: 'var(--md-sys-color-info)',
                    container: 'var(--md-sys-color-info-container)',
                },
            },
            borderRadius: {
                'xs': 'var(--md-sys-shape-corner-extra-small)',
                'sm': 'var(--md-sys-shape-corner-small)',
                'md': 'var(--md-sys-shape-corner-medium)',
                'lg': 'var(--md-sys-shape-corner-large)',
                'xl': 'var(--md-sys-shape-corner-extra-large)',
                '2xl': '20px',
                '3xl': '28px',
            },
            boxShadow: {
                'elevation-1': 'var(--md-sys-elevation-1)',
                'elevation-2': 'var(--md-sys-elevation-2)',
                'elevation-3': 'var(--md-sys-elevation-3)',
                'elevation-4': 'var(--md-sys-elevation-4)',
                'elevation-5': 'var(--md-sys-elevation-5)',
            },
            transitionTimingFunction: {
                'emphasized': 'var(--md-sys-motion-easing-emphasized)',
                'spring': 'var(--md-sys-motion-easing-spring)',
            },
            transitionDuration: {
                'short': 'var(--md-sys-motion-duration-short)',
                'medium': 'var(--md-sys-motion-duration-medium)',
                'long': 'var(--md-sys-motion-duration-long)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}

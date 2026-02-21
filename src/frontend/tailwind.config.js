/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#05070A',
                'nova-blue': '#00d2ff',
                'nova-cyan': '#00f2ff',
                'nova-red': '#ff3e3e',
                'glass-border': 'rgba(255, 255, 255, 0.1)',
            },
            fontFamily: {
                orbitron: ['Orbitron', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        
        colors: {
            'white': '#FFFFFF',
            'black': '#242424',
            'grey': '#F3F3F3',
            'dark-grey': '#6B6B6B',
            'red': '#FF4E4E',
            'transparent': 'transparent',
            'twitter': '#1DA1F2',
            'purple': '#8B46FF',
            // Add gray palette - darker shades for readability
            'gray-50': '#F9FAFB',
            'gray-100': '#F3F4F6',
            'gray-200': '#E5E7EB',
            'gray-300': '#D1D5DB',
            'gray-400': '#9CA3AF',
            'gray-500': '#6B7280',
            'gray-600': '#4B5563',
            'gray-700': '#374151',
            'gray-800': '#1F2937',
            'gray-900': '#111827',
        },

        fontSize: {
            'sm': '12px',
            'base': '14px',
            'xl': '16px',
            '2xl': '20px',
            '3xl': '28px',
            '4xl': '38px',
            '5xl': '50px',
        },

        extend: {
            fontFamily: {
              inter: ["'Inter'", "sans-serif"],
              gelasio: ["'Gelasio'", "serif"],
              playfair: ["'Playfair Display'", "serif"],
            },
        },

    },
    plugins: [],
};


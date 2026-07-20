/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm off-white ground — the wall behind Megan in the portrait
        paper: {
          DEFAULT: '#FAF8F5',
          50: '#FDFCFB',
          100: '#FAF8F5',
          200: '#F3EFEA',
          300: '#EAE4DC',
        },
        // Warm near-black ink — not pure black
        ink: {
          DEFAULT: '#1C1A18',
          soft: '#2A2724',
          muted: '#4A4540',
          faint: '#6B6560',
        },
        // Provisional accent: muted sage from the plants in the portrait.
        // Tested against the portrait for visual balance; final accent
        // may shift toward the soft blue in her shirt if sage reads too muted.
        sage: {
          DEFAULT: '#5C7A61',
          dark: '#48604E',
          light: '#7A9A80',
        },
        // Secondary accent candidate: soft periwinkle from the shirt.
        // Used sparingly; combined with sage for hover and coming-soon states.
        periwinkle: {
          DEFAULT: '#6E7FA8',
          dark: '#586A93',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        editorial: '800px',
        content: '520px',
      },
    },
  },
  plugins: [],
};

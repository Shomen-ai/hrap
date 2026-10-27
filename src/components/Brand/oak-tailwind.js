// Tailwind-пресет фирменного стиля ОАК. Подключение в tailwind.config.js:
//   import oak from './src/components/Brand/oak-tailwind.js'
//   export default { presets: [oak], ... }
//
// Перекрашивает стандартные палитры, поэтому уже написанные классы
// (bg-blue-600, text-slate-500, border-gray-200 …) сразу получают фирменные цвета.
// Значения палитры — из oak-brand.css; опорные оттенки помечены.

const blue = {
  50: '#ECF1FA',
  100: '#D9E3F4',
  200: '#B7C9EB',
  300: '#87A6DD',
  400: '#4F7CCB',
  500: '#2A62C4',
  600: '#0F4DBC', // фирменный синий, PANTONE 2728 C
  700: '#0C3F9C',
  800: '#063180',
  900: '#002664', // фирменный темно-синий, PANTONE 281 C
  950: '#001A47',
}

// Фирменные серые нейтральные (Cool Gray), без голубого оттенка slate
const neutral = {
  50: '#F7F7F7',
  100: '#F2F2F2',
  200: '#E6E6E6',
  300: '#CCCCCC',
  400: '#969696', // PANTONE Cool Gray 7 C
  500: '#767676',
  600: '#5A5A5A', // PANTONE Cool Gray 10 C
  700: '#474747',
  800: '#2E2E2E',
  900: '#1A1A1A',
  950: '#0D0D0D',
}

export default {
  theme: {
    extend: {
      colors: {
        blue,
        slate: neutral,
        gray: neutral,
        oak: {
          navy: blue[900],
          blue: blue[600],
          graphite: neutral[600],
          gray: neutral[400],
        },
      },
      fontFamily: {
        // Arial — наборный шрифт для электронных материалов (2.02)
        sans: ['Arial', '"Helvetica Neue"', 'Helvetica', 'sans-serif'],
        // Stem — основной фирменный (2.01), при отсутствии — Arial
        display: ['Stem', 'Arial', '"Helvetica Neue"', 'Helvetica', 'sans-serif'],
      },
    },
  },
}

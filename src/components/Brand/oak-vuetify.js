// Тема Vuetify 3 в фирменном стиле ОАК. Пара к oak-tailwind.js и oak-primevue.css,
// значения палитры — из oak-brand.css.
//
// Подключение (plugins/vuetify.js):
//   import { createVuetify } from 'vuetify'
//   import 'vuetify/styles'
//   import '@/components/Brand/oak-vuetify.css'
//   import { oakTheme, oakDefaults } from '@/components/Brand/oak-vuetify.js'
//
//   export default createVuetify({ theme: oakTheme, defaults: oakDefaults })
//
// Цвета доступны компонентам по имени (color="primary", color="oak-navy")
// и классами bg-oak-navy, text-oak-blue и т.п. — их Vuetify генерирует сам.

// MARK: - Палитра

// опорные цвета гайдбука (2.03)
const NAVY = '#002664' // PANTONE 281 C
const BLUE = '#0F4DBC' // PANTONE 2728 C
const GRAPHITE = '#5A5A5A' // PANTONE Cool Gray 10 C
const GRAY = '#969696' // PANTONE Cool Gray 7 C

// оттенки и служебные — вне гайдбука, как в oak-brand.css
const BLUE_HOVER = '#0C3F9C'
const BLUE_8 = '#ECF1FA'
const GRAY_5 = '#F2F2F2'
const GRAY_10 = '#E6E6E6'
const TEXT = '#1A1A1A'
const DANGER = '#C62828'
const SUCCESS = '#2E7D32'
const WARNING = '#E8613C'
const INFO = '#5BC4E0'

// MARK: - Тема

const brandColors = {
  'oak-navy': NAVY,
  'oak-blue': BLUE,
  'oak-graphite': GRAPHITE,
  'oak-gray': GRAY,
}

const oakLight = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-light': GRAY_5,
    'surface-variant': GRAPHITE, // фон тултипов и чипов-вариантов
    'on-surface-variant': '#FFFFFF',
    'on-background': TEXT,
    'on-surface': TEXT,

    primary: BLUE,
    'primary-darken-1': BLUE_HOVER,
    secondary: NAVY,
    'secondary-darken-1': '#001A47',

    error: DANGER,
    success: SUCCESS,
    warning: WARNING,
    info: INFO,

    ...brandColors,
    'oak-blue-light': BLUE_8, // фон выделения, как --highlight-bg в PrimeVue
    'oak-gray-light': GRAY_10,
  },
  variables: {
    'border-color': '#000000',
    'border-opacity': 0.2, // ≈ --oak-border #CCCCCC на белом
    'high-emphasis-opacity': 0.9,
    'medium-emphasis-opacity': 0.65, // вторичный текст ≈ графит
    'disabled-opacity': 0.4,
    'hover-opacity': 0.06,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.14,
  },
}

// Темный фон — свыше 60% черного: логотип и графика только в инверсии (гайдбук 1.07)
const oakDark = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#1A1A1A',
    'surface-bright': '#2E2E2E',
    'surface-light': '#2E2E2E',
    'surface-variant': '#E6E6E6',
    'on-surface-variant': '#1A1A1A',

    // фирменный синий на черном слишком темный — берем светлый оттенок той же гаммы
    primary: '#87A6DD',
    'primary-darken-1': '#4F7CCB',
    secondary: '#B7C9EB',
    'secondary-darken-1': '#87A6DD',

    error: '#EF9A9A',
    success: '#81C784',
    warning: '#F29B80',
    info: INFO,

    ...brandColors,
    'oak-blue-light': '#063180',
    'oak-gray-light': '#2E2E2E',
  },
  variables: {
    'border-color': '#FFFFFF',
    'border-opacity': 0.16,
  },
}

export const oakTheme = {
  defaultTheme: 'oakLight',
  themes: { oakLight, oakDark },
}

// MARK: - Умолчания компонентов

// Скругления малые (в знаке скруглены только углы монокрыла), тени почти нет:
// по стилю совпадает с карточками на страницах Orders.
export const oakDefaults = {
  global: {
    ripple: false,
  },
  VBtn: {
    color: 'primary',
    variant: 'flat',
    rounded: 'lg',
  },
  VCard: {
    elevation: 0,
    border: true,
    rounded: 'lg',
  },
  VSheet: {
    rounded: 'lg',
  },
  VChip: {
    rounded: 'lg',
    size: 'small',
  },
  VTextField: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    hideDetails: 'auto',
  },
  VTextarea: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    hideDetails: 'auto',
    autoGrow: true,
  },
  VSelect: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    hideDetails: 'auto',
  },
  VAutocomplete: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    hideDetails: 'auto',
  },
  VCombobox: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    hideDetails: 'auto',
  },
  VCheckbox: { color: 'primary', density: 'comfortable', hideDetails: 'auto' },
  VRadioGroup: { color: 'primary', density: 'comfortable', hideDetails: 'auto' },
  VSwitch: { color: 'primary', inset: true, density: 'comfortable', hideDetails: 'auto' },
  VTabs: { color: 'primary' },
  VProgressLinear: { color: 'primary' },
  VProgressCircular: { color: 'primary' },
  VDataTable: { density: 'comfortable', hover: true },
  VTooltip: { location: 'top' },
  VDialog: { maxWidth: 720 },
  VAlert: { variant: 'tonal', rounded: 'lg' },
}

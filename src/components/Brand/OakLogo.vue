<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    :height="height"
    :width="width"
    role="img"
    :aria-label="title"
    class="oak-logo"
  >
    <title>{{ title }}</title>

    <!-- ОАК: «О», «А» (диагональ, штамб, монокрыло), «К» -->
    <path :fill="colors.text" :d="WORDMARK" />

    <!-- Знак: круг с вырезанным монокрылом -->
    <path :fill="colors.sign" fill-rule="evenodd" :d="SIGN_CIRCLE + SIGN_WING" />
    <path v-if="colors.signInner" :fill="colors.signInner" :d="SIGN_WING" />

    <!-- Расшифровка филиала: базовая линия = базовая линия ОАК, высота прописных = высота монокрыла -->
    <text
      v-if="name"
      :x="NAME_X"
      :y="BASELINE"
      :fill="colors.text"
      :textLength="nameWidth"
      lengthAdjust="spacingAndGlyphs"
      font-family="Stem, Arial, 'Helvetica Neue', Helvetica, sans-serif"
      font-weight="700"
      :font-size="NAME_FONT_SIZE"
    >{{ name }}</text>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

// Геометрия снята с «Руководства по применению фирменного стиля ПАО «ОАК»» (1.03, 1.12, 1.16).
// Единица — высота прописных ОАК = 100. Диаметр знака x = 76.5.
const WORDMARK =
  'M52 17a52 52 0 1 0 0 104a52 52 0 1 0 0-104zM52 35a34 34 0 1 1 0 68a34 34 0 1 1 0-68z' +
  'M86 119L175.6 19H197.6L108 119Z' +
  'M184.5 19H202.5V67.5L184.5 69.5Z' +
  'M159.1 77.3C174.29 85.55 194.25 105.51 202.5 120.7L202.5 80.34Q202.5 77.3 199.46 77.3Z' +
  'M216.3 19H234.3V119H216.3Z' +
  'M234.4 69L278.9 19H300.5L255.7 69L300.5 119H279.5Z'
const SIGN_CIRCLE = 'M345.9 0a38.25 38.25 0 1 0 0 76.5a38.25 38.25 0 1 0 0-76.5z'
const SIGN_WING = 'M319.89 17.98C336.09 26.77 357.38 48.06 366.17 64.26L366.17 21.22Q366.17 17.98 362.93 17.98Z'

const SIGN_DIAMETER = 76.5
const WORDMARK_WIDTH = 384.2
const HEIGHT = 121
const BASELINE = 119
const NAME_X = 405
const NAME_FONT_SIZE = 56 // высота прописных ≈ 40

const BRAND = {
  navy: '#002664',
  blue: '#0F4DBC',
  white: '#FFFFFF',
}

// 1.07, 1.15 — допустимые цветовые решения
const VARIANTS = {
  color: { text: BRAND.navy, sign: BRAND.blue, signInner: BRAND.white },
  inverse: { text: BRAND.white, sign: BRAND.blue, signInner: BRAND.white },
  white: { text: BRAND.white, sign: BRAND.white, signInner: null },
  mono: { text: 'currentColor', sign: 'currentColor', signInner: null },
}

const props = defineProps({
  name: { type: String, default: '' },
  nameWidth: { type: Number, default: 0 },
  // color — на белом и светло-сером (до 30% черного); inverse — двухцветный на темном;
  // white — полностью белый на фирменных и темных фонах; mono — цвет берется из CSS color
  variant: {
    type: String,
    default: 'color',
    validator: (v) => ['color', 'inverse', 'white', 'mono'].includes(v),
  },
  color: { type: String, default: '' },
  signColor: { type: String, default: '' },
  // null/'' — монокрыло вырезано и показывает фон
  signInnerColor: { type: String, default: undefined },
  height: { type: [Number, String], default: 40 },
  // Добавляет охранное поле x (диаметр знака) со всех сторон
  safeArea: { type: Boolean, default: false },
  title: { type: String, default: 'ОАК' },
})

const colors = computed(() => {
  const base = VARIANTS[props.variant]
  return {
    text: props.color || base.text,
    sign: props.signColor || base.sign,
    signInner: props.signInnerColor === undefined ? base.signInner : props.signInnerColor || null,
  }
})

const box = computed(() => {
  const w = props.name ? NAME_X + props.nameWidth : WORDMARK_WIDTH
  const pad = props.safeArea ? SIGN_DIAMETER : 0
  return { x: -pad, y: -pad, w: w + pad * 2, h: HEIGHT + pad * 2 }
})

const viewBox = computed(() => `${box.value.x} ${box.value.y} ${box.value.w} ${box.value.h}`)

const width = computed(() => {
  const h = parseFloat(props.height)
  if (Number.isNaN(h)) return undefined
  const unit = String(props.height).replace(/^[\d.]+/, '')
  if (unit === '%') return undefined
  return `${+(h * box.value.w / box.value.h).toFixed(2)}${unit}`
})
</script>

<style scoped>
.oak-logo {
  display: block;
  flex-shrink: 0;
  overflow: visible;
}
</style>

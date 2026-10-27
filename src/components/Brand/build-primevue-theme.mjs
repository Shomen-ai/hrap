// Генерирует oak-primevue.css — переопределения темы PrimeVue lara-light-blue
// под фирменную палитру ОАК. В теме цвета зашиты прямо в CSS, поэтому из нее
// берутся только декларации с синими цветами и шрифтом, и цвета подменяются.
//
// Запуск из корня проекта (после обновления PrimeVue):
//   node src/components/Brand/build-primevue-theme.mjs

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const postcss = require('postcss')

const THEME = 'primevue/resources/themes/lara-light-blue/theme.css'
const OUT = path.resolve('src/components/Brand/oak-primevue.css')

const FONT = 'Arial, "Helvetica Neue", Helvetica, sans-serif'

// lara-light-blue → ОАК
const COLORS = [
  [/#3B82F6\b/gi, '#0F4DBC'], // primary → фирменный синий
  [/#2563EB\b/gi, '#0C3F9C'], // hover
  [/#1D4ED8\b/gi, '#002664'], // active, текст выделения → фирменный темно-синий
  [/#BFDBFE\b/gi, '#B7C9EB'], // кольцо фокуса
  [/#EFF6FF\b/gi, '#ECF1FA'], // фон выделения
  [/rgba\(59, 130, 246,/g, 'rgba(15, 77, 188,'],
  [/rgba\(219, 234, 254,/g, 'rgba(217, 227, 244,'],
]

const isFont = (d) => d.prop === 'font-family' || d.prop === '--font-family'
const hasBlue = (v) => COLORS.some(([re]) => v.match(new RegExp(re.source, re.flags)))

const themePath = require.resolve(THEME)
const version = require('primevue/package.json').version
const root = postcss.parse(fs.readFileSync(themePath, 'utf8'))

root.walkComments((c) => c.remove())
root.walkAtRules(/font-face|keyframes|import/, (r) => r.remove())
root.walkDecls((d) => {
  if (isFont(d)) {
    d.value = FONT
    return
  }
  if (!hasBlue(d.value)) return d.remove()
  for (const [re, to] of COLORS) d.value = d.value.replace(re, to)
})
root.walk((n) => {
  if ((n.type === 'rule' || n.type === 'atrule') && n.nodes && n.nodes.length === 0) n.remove()
})
// вложенные at-rule могли опустеть после удаления правил
root.walkAtRules((r) => {
  if (r.nodes && r.nodes.length === 0) r.remove()
})

const header = `/*
 * СГЕНЕРИРОВАНО build-primevue-theme.mjs — руками не править.
 * Переопределения PrimeVue ${version} lara-light-blue под фирменный стиль ОАК.
 * Подключать ПОСЛЕ primevue/resources/themes/lara-light-blue/theme.css.
 */
`
fs.writeFileSync(OUT, header + root.toString().replace(/\n{3,}/g, '\n\n').trim() + '\n')

let rules = 0
root.walkRules(() => rules++)
console.log(`${path.relative(process.cwd(), OUT)}: ${rules} правил`)

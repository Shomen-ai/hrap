/**
 * Опции Chart.js в фирменном стиле ОАК: светлая сетка, Arial (наборный
 * шрифт по гайдбуку), нейтральные серые подписи, подсказка в темно-синем.
 * Цвета заданы явно — Chart.js рисует на canvas и CSS-переменные не видит.
 */

const TEXT = '#474747' // slate-700 в фирменной палитре
const MUTED = '#767676' // slate-500
const GRID = '#E6E6E6' // slate-200
const NAVY = '#002664'

const FONT = { family: "Arial, 'Helvetica Neue', Helvetica, sans-serif", size: 12 }

/**
 * @param {object} o
 *   horizontal  столбики горизонтально (indexAxis: 'y')
 *   stacked     серии друг на друге
 *   legend      показывать легенду (по умолчанию — если серий больше одной)
 *   format      (number) => string — значение в подсказке
 *   axisFormat  (number) => string — подпись на оси значений, по умолчанию как format
 *   allLabels   подписывать каждый столбик (наклонно), а не через один
 */
export function barOptions({
  horizontal = false,
  stacked = false,
  legend = true,
  format = (v) => v,
  axisFormat = format,
  allLabels = false,
} = {}) {
  const valueAxis = {
    stacked,
    beginAtZero: true,
    ticks: { color: MUTED, font: FONT, callback: (v) => axisFormat(v), precision: 0 },
    grid: { color: GRID },
    border: { display: false },
  }
  const labelAxis = {
    stacked,
    ticks: allLabels
      ? { color: TEXT, font: { ...FONT, size: 11 }, autoSkip: false, minRotation: 45, maxRotation: 60 }
      : { color: TEXT, font: FONT, autoSkip: true, maxRotation: 0 },
    grid: { display: false },
    border: { color: GRID },
  }

  return {
    indexAxis: horizontal ? 'y' : 'x',
    maintainAspectRatio: false,
    animation: { duration: 250 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: legend,
        position: 'bottom',
        labels: { color: TEXT, font: FONT, boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 14 },
      },
      tooltip: {
        backgroundColor: NAVY,
        titleFont: { ...FONT, weight: '600' },
        bodyFont: FONT,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        // нулевые серии в подсказке только мешают
        filter: (item) => item.parsed[horizontal ? 'x' : 'y'] !== 0,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed[horizontal ? 'x' : 'y']
            return ctx.dataset.label ? ` ${ctx.dataset.label}: ${format(v)}` : ` ${format(v)}`
          },
        },
      },
    },
    scales: horizontal ? { x: valueAxis, y: labelAxis } : { x: labelAxis, y: valueAxis },
  }
}

// столбик со скруглением, как карточки
export const BAR_STYLE = { borderRadius: 4, maxBarThickness: 36 }

// в стопке скругление дает «зазубрины» на стыках серий — без него
export const STACKED_STYLE = { borderRadius: 0, maxBarThickness: 36 }

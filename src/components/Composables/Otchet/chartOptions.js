/**
 * Опции Chart.js в стиле страниц Orders: светлая сетка, шрифт страницы,
 * подписи slate. Цвета заданы явно — раньше VerticalZatrati читал их из
 * CSS-переменных темы PrimeVue, которых в lara-light-blue нет.
 */

const TEXT = '#334155' // slate-700
const MUTED = '#64748b' // slate-500
const GRID = '#e2e8f0' // slate-200

const FONT = { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", size: 12 }

/**
 * @param {object} o
 *   horizontal  столбики горизонтально (indexAxis: 'y')
 *   stacked     серии друг на друге
 *   legend      показывать легенду (по умолчанию — если серий больше одной)
 *   format      (number) => string — подпись значения на оси и в подсказке
 */
export function barOptions({ horizontal = false, stacked = false, legend = true, format = (v) => v } = {}) {
  const valueAxis = {
    stacked,
    beginAtZero: true,
    ticks: { color: MUTED, font: FONT, callback: (v) => format(v), precision: 0 },
    grid: { color: GRID },
    border: { display: false },
  }
  const labelAxis = {
    stacked,
    ticks: { color: TEXT, font: FONT, autoSkip: true, maxRotation: 0 },
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
        backgroundColor: '#0f172a',
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

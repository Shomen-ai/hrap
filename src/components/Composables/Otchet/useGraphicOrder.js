import { ref, computed, watch } from 'vue'
import { useReport } from './useReport'
import { barOptions, STACKED_STYLE } from './chartOptions'
import {
  MONTHS, MONTHS_SHORT, yearOptions, orderDay, orderTypeLabel, dayLabel, dayKey,
  PALETTE, OTHER_COLOR, TYPE_COLORS, exportSheet, formatCount, parseDay,
} from './otchet'

// значения уходят на бэк как есть — те же строки, что были в GraphicOrder
export const PERIODS = ['Текущая неделя', 'Месяц', 'Квартал', 'Полугодие', 'Год', 'Свой период']

export const BREAKDOWNS = [
  { value: 'type', label: 'По типу транспорта' },
  { value: 'podr', label: 'По подразделениям' },
]

// дольше двух месяцев по дням не читается — собираем по месяцам
const MAX_DAYS = 62

// по подразделениям: столько крупнейших отдельно, прочие — одной серией «Остальные».
// Десятки цветных полосок в одном столбике не различить (73 подразделения на проде)
const TOP_PODR = PALETTE.length

const pad = (n) => String(n).padStart(2, '0')

const monday = (now = new Date()) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
  return d
}

const toDay = (d) => ({ day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() })

/**
 * Логика графика «Заказы за период»: период → запрос, фильтр подразделений
 * на клиенте, столбики по дням или месяцам, выгрузка.
 * Разметка — в GraphicOrder.vue.
 */
export function useGraphicOrder() {
  /* ---------- период ---------- */

  const now = new Date()
  const timePeriod = ref('Текущая неделя')
  const selectedMonth = ref(pad(now.getMonth() + 1))
  const selectedYear = ref(now.getFullYear())
  const selectedQuarter = ref('1')
  const selectedHalfYear = ref('1')
  // строки «гггг-мм-дд» из <input type="date"> — в таком виде их и ждёт бэк
  const customStartDate = ref(null)
  const customEndDate = ref(null)

  const monthOptions = MONTHS.map((label, i) => ({ value: pad(i + 1), label }))
  const quarterOptions = [1, 2, 3, 4].map((q) => ({ value: String(q), label: `${q} квартал` }))
  const halfYearOptions = [1, 2].map((h) => ({ value: String(h), label: `${h} полугодие` }))
  const years = yearOptions()

  const customInvalid = computed(
    () =>
      timePeriod.value === 'Свой период' &&
      customStartDate.value &&
      customEndDate.value &&
      customStartDate.value > customEndDate.value
  )
  const customReady = computed(
    () => Boolean(customStartDate.value && customEndDate.value) && !customInvalid.value
  )

  // ключ кеша — только по периоду, как и было
  const periodKey = computed(() => {
    const y = selectedYear.value
    switch (timePeriod.value) {
      case 'Свой период':
        return `custom_${customStartDate.value || 'null'}_${customEndDate.value || 'null'}`
      case 'Месяц':
        return `month_${y}_${selectedMonth.value}`
      case 'Квартал':
        return `quarter_${y}_${selectedQuarter.value}`
      case 'Полугодие':
        return `half_${y}_${selectedHalfYear.value}`
      case 'Год':
        return `year_${y}`
      default: {
        const m = monday()
        return `week_${m.getFullYear()}-${pad(m.getMonth() + 1)}-${pad(m.getDate())}`
      }
    }
  })

  const { orders, loaded, loading } = useReport('GraphicOrder', () => ({
    key: periodKey.value,
    ready: timePeriod.value !== 'Свой период' || customReady.value,
    params: {
      period: timePeriod.value,
      year: selectedYear.value,
      month: selectedMonth.value,
      quarter: selectedQuarter.value,
      halfYear: selectedHalfYear.value,
      startDate: customStartDate.value,
      endDate: customEndDate.value,
    },
  }))

  /* ---------- подразделения ---------- */

  const podrOptions = computed(() =>
    [...new Set(orders.value.map((item) => item.podr).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), 'ru')
    )
  )
  const selectedPodr = ref([])

  // новые данные: если были выбраны все или выбор устарел — выбираем все
  watch(podrOptions, (opts, prev = []) => {
    const sel = selectedPodr.value
    const wasAll = prev.length > 0 && sel.length === prev.length
    if (!sel.length || wasAll || !sel.every((p) => opts.includes(p))) {
      selectedPodr.value = [...opts]
    }
  })

  const filtered = computed(() => {
    const sel = new Set(selectedPodr.value)
    return orders.value.filter((item) => sel.has(item.podr))
  })

  /* ---------- оси ---------- */

  // границы выбранного периода — чтобы на графике были и дни без заказов
  const range = computed(() => {
    const y = Number(selectedYear.value)
    switch (timePeriod.value) {
      case 'Текущая неделя': {
        const from = monday()
        const to = new Date(from)
        to.setDate(to.getDate() + 6)
        return { from: toDay(from), to: toDay(to) }
      }
      case 'Месяц': {
        const m = Number(selectedMonth.value)
        return { from: { day: 1, month: m, year: y }, to: toDay(new Date(y, m, 0)) }
      }
      case 'Квартал': {
        const q = Number(selectedQuarter.value)
        return { from: { day: 1, month: q * 3 - 2, year: y }, to: toDay(new Date(y, q * 3, 0)) }
      }
      case 'Полугодие': {
        const h = Number(selectedHalfYear.value)
        return { from: { day: 1, month: h * 6 - 5, year: y }, to: toDay(new Date(y, h * 6, 0)) }
      }
      case 'Год':
        return { from: { day: 1, month: 1, year: y }, to: { day: 31, month: 12, year: y } }
      default: {
        const from = parseDay(customStartDate.value)
        const to = parseDay(customEndDate.value)
        return from && to ? { from, to } : null
      }
    }
  })

  const byMonth = computed(() => {
    if (!range.value) return false
    const { from, to } = range.value
    const days =
      (new Date(to.year, to.month - 1, to.day) - new Date(from.year, from.month - 1, from.day)) / 864e5 + 1
    return days > MAX_DAYS
  })

  // корзина, в которую попадает день: { key, label, full }
  const bucketOf = (d) => {
    if (byMonth.value) {
      return { key: d.year * 100 + d.month, label: `${MONTHS_SHORT[d.month - 1]} ${d.year}` }
    }
    return { key: dayKey(d), label: dayLabel(d).slice(0, 5), full: dayLabel(d) }
  }

  const buckets = computed(() => {
    const map = new Map()
    const add = (d) => {
      const b = bucketOf(d)
      if (!map.has(b.key)) map.set(b.key, b)
    }

    if (range.value) {
      const { from, to } = range.value
      const cur = new Date(from.year, from.month - 1, from.day)
      const end = new Date(to.year, to.month - 1, to.day)
      while (cur <= end) {
        add(toDay(cur))
        cur.setDate(cur.getDate() + 1)
      }
    }
    // заказы за краем периода (подача машины позже создания) тоже показываем
    for (const item of filtered.value) {
      const d = orderDay(item)
      if (d) add(d)
    }

    return [...map.values()].sort((a, b) => a.key - b.key)
  })

  /* ---------- серии ---------- */

  const breakdown = ref('type')

  // подразделения по числу заказов за период: первые TOP_PODR — отдельными сериями
  const podrRank = computed(() => {
    const counts = new Map()
    for (const item of filtered.value) counts.set(item.podr, (counts.get(item.podr) || 0) + 1)
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ru'))
      .map(([podr]) => podr)
  })

  // если «Остальные» — одно подразделение, честнее показать его самого
  const topPodr = computed(() => {
    const rank = podrRank.value
    return new Set(rank.length <= TOP_PODR + 1 ? rank : rank.slice(0, TOP_PODR))
  })

  const othersCount = computed(() => podrRank.value.length - topPodr.value.size)

  const chartData = computed(() => {
    const index = new Map(buckets.value.map((b, i) => [b.key, i]))
    const byType = breakdown.value === 'type'
    const others = `Остальные (${othersCount.value})`
    const series = new Map()

    const seriesOf = (name, color) => {
      if (!series.has(name)) {
        series.set(name, {
          label: name,
          data: new Array(buckets.value.length).fill(0),
          backgroundColor: color,
          ...STACKED_STYLE,
        })
      }
      return series.get(name)
    }

    if (!byType) {
      // порядок серий = рейтинг: крупнейшее подразделение внизу стопки и первым в легенде
      podrRank.value
        .filter((p) => topPodr.value.has(p))
        // восьмое (вместо «Остальных из одного») — цветом «Остальных»
        .forEach((p, i) => seriesOf(String(p), PALETTE[i] ?? OTHER_COLOR))
    }

    for (const item of filtered.value) {
      const d = orderDay(item)
      if (!d) continue
      const type = orderTypeLabel(item)
      const s = byType
        ? seriesOf(type, TYPE_COLORS[type])
        : topPodr.value.has(item.podr)
          ? seriesOf(String(item.podr))
          : seriesOf(others, OTHER_COLOR)
      s.data[index.get(bucketOf(d).key)] += 1
    }

    const datasets = [...series.values()]
    if (byType) datasets.sort((a, b) => a.label.localeCompare(b.label, 'ru'))
    return { labels: buckets.value.map((b) => b.label), datasets }
  })

  const chartOptions = computed(() => {
    const base = barOptions({ stacked: true, format: formatCount })
    // в подсказке — полная дата
    base.plugins.tooltip.callbacks.title = (items) => {
      const b = buckets.value[items[0]?.dataIndex]
      return b?.full ?? b?.label ?? ''
    }
    // серий не больше TOP_PODR + «Остальные» — легенда помещается
    base.plugins.legend.display = chartData.value.datasets.length > 1
    return base
  })

  /* ---------- итоги ---------- */

  const totals = computed(() => {
    const t = { all: filtered.value.length, Электротранспорт: 0, 'Грузовой транспорт': 0, Другое: 0 }
    for (const item of filtered.value) t[orderTypeLabel(item)] += 1
    return t
  })

  const isEmpty = computed(() => filtered.value.length === 0)

  /* ---------- экспорт ---------- */

  const canExport = computed(() => orders.value.length > 0)

  function exportToExcel() {
    if (!canExport.value) return
    const rows = filtered.value.map((item) => {
      const date = item.provide_car_time || item.created_at
      return [
        item.id,
        item.podr,
        orderTypeLabel(item),
        date instanceof Date ? date.toLocaleString('ru-RU') : date,
        item.total_cost || 0,
      ]
    })
    exportSheet(
      `GraphicOrder_${new Date().toLocaleDateString('ru-RU')}.xlsx`,
      'GraphicOrder',
      ['ID', 'Подразделение', 'Тип заказа', 'Дата', 'Стоимость'],
      rows
    )
  }

  return {
    // период
    periods: PERIODS.map((p) => ({ value: p, label: p })),
    timePeriod,
    selectedMonth,
    selectedYear,
    selectedQuarter,
    selectedHalfYear,
    customStartDate,
    customEndDate,
    customInvalid,
    customReady,
    monthOptions,
    quarterOptions,
    halfYearOptions,
    years,
    // подразделения
    podrOptions,
    selectedPodr,
    // график
    breakdown,
    breakdowns: BREAKDOWNS,
    byMonth,
    chartData,
    chartOptions,
    totals,
    isEmpty,
    loaded,
    loading,
    // выгрузка
    canExport,
    exportToExcel,
  }
}

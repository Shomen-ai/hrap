import { ref, computed } from 'vue'
import { useReport } from './useReport'
import { barOptions, BAR_STYLE } from './chartOptions'
import {
  ORDER_TYPES, monthOptions, yearOptions, orderDay, matchType, toNumber,
  colorFor, exportSheet, formatCount, formatMoney,
} from './otchet'

// высота строки горизонтального столбика: подразделений бывает несколько десятков
const ROW = 26

/**
 * Логика графика «Заказы и затраты по подразделениям» за месяц:
 * количество и сумма по подразделениям, фильтр по типу транспорта.
 * Разметка — в GraphicOtnosheni.vue.
 */
export function useGraphicOtnosheni() {
  const now = new Date()
  const selectedType = ref('all')
  const selectedMonth = ref(now.getMonth() + 1)
  const selectedYear = ref(now.getFullYear())

  const { orders, loaded, loading } = useReport('GraphicOtnosheni', () => ({
    key: `${selectedMonth.value}_${selectedYear.value}`,
    params: { year: selectedYear.value, month: selectedMonth.value },
  }))

  /* ---------- подсчёт ---------- */

  // тип меняется без запроса — только пересчёт
  const byPodr = computed(() => {
    const counts = {}
    const costs = {}
    for (const item of orders.value) {
      const d = orderDay(item)
      if (!d || d.month != selectedMonth.value || d.year != selectedYear.value) continue
      if (!matchType(item, selectedType.value)) continue
      const podr = item.podr
      counts[podr] = (counts[podr] || 0) + 1
      costs[podr] = (costs[podr] || 0) + toNumber(item.total_cost)
    }
    return { counts, costs }
  })

  // от большего к меньшему — так сравнивать проще, чем секторы круговой
  const ranked = (map) => Object.entries(map).sort((a, b) => b[1] - a[1])

  const countRows = computed(() => ranked(byPodr.value.counts))
  const costRows = computed(() => ranked(byPodr.value.costs))

  const toChart = (rows, label) => ({
    labels: rows.map(([name]) => name),
    datasets: [
      {
        label,
        data: rows.map(([, v]) => v),
        backgroundColor: rows.map(([name]) => colorFor(name)),
        ...BAR_STYLE,
      },
    ],
  })

  const orderCountChartData = computed(() => toChart(countRows.value, 'Количество заказов'))
  const totalCostChartData = computed(() => toChart(costRows.value, 'Общая стоимость'))

  const countOptions = barOptions({ horizontal: true, legend: false, format: formatCount })
  const costOptions = barOptions({ horizontal: true, legend: false, format: formatMoney })

  const chartHeight = computed(() => `${Math.max(240, countRows.value.length * ROW + 40)}px`)

  const totalCount = computed(() => countRows.value.reduce((s, [, v]) => s + v, 0))
  const totalCost = computed(() => costRows.value.reduce((s, [, v]) => s + v, 0))

  const isEmpty = computed(() => countRows.value.length === 0)

  /* ---------- экспорт ---------- */

  function exportOrderCountToExcel() {
    exportSheet(
      `Количество заказов ${selectedYear.value}.xlsx`,
      'Количество заказов',
      ['Подразделение', 'Количество заказов'],
      countRows.value
    )
  }

  function exportTotalCostToExcel() {
    exportSheet(
      `Затраты ${selectedYear.value}.xlsx`,
      'Затраты',
      ['Подразделение', 'Затраты'],
      costRows.value
    )
  }

  return {
    types: ORDER_TYPES,
    selectedType,
    selectedMonth,
    selectedYear,
    monthOptions,
    years: yearOptions(),
    orderCountChartData,
    totalCostChartData,
    countOptions,
    costOptions,
    chartHeight,
    totalCount,
    totalCost,
    isEmpty,
    loaded,
    loading,
    exportOrderCountToExcel,
    exportTotalCostToExcel,
  }
}

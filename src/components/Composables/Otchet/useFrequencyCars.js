import { ref, computed } from 'vue'
import { useReport } from './useReport'
import { barOptions, BAR_STYLE } from './chartOptions'
import {
  ORDER_TYPES, monthOptions, yearOptions, orderDay, matchType, toNumber,
  COUNT_COLOR, COST_COLOR, exportSheet, formatCount, formatMoney, formatMoneyShort,
} from './otchet'

export const MODES = [
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
]

// ширина столбика на машину: подписан каждый столбик (наклонно), при сотне машин
// график прокручивается вбок
const COL = 22

/**
 * Логика графика «Использование машин»: сколько раз и на какую сумму
 * работала каждая машина за месяц или год. Машины без заказов тоже
 * в списке (с нулём), их можно скрыть.
 * Разметка — в FrequencyCars.vue.
 *
 * @param {import('vue').Ref<Array>} cars  CarsModule.cars
 */
export function useFrequencyCars(cars) {
  const now = new Date()
  const selectedType = ref('all')
  const selectedMode = ref('month')
  const selectedMonth = ref(now.getMonth() + 1)
  const selectedYear = ref(now.getFullYear())
  const hideUnused = ref(false)

  const { orders, loaded, loading } = useReport('FrequencyCars', () => {
    const month = selectedMode.value === 'month' ? selectedMonth.value : null
    return {
      // режим в ключе: «Год» и «Месяц» больше не делят один кеш
      key: `${selectedMode.value}_${month ?? 'all'}_${selectedYear.value}`,
      params: { year: selectedYear.value, month },
    }
  })

  /* ---------- подсчёт ---------- */

  const byCar = computed(() => {
    const counts = {}
    const costs = {}
    for (const car of cars.value ?? []) {
      counts[car.garaj_number] = 0
      costs[car.garaj_number] = 0
    }

    for (const item of orders.value) {
      const d = orderDay(item)
      if (!d || d.year != selectedYear.value) continue
      if (selectedMode.value === 'month' && d.month != selectedMonth.value) continue
      if (!matchType(item, selectedType.value)) continue
      const carId = item?.car?.garaj_number ? item.car.garaj_number : '-'
      counts[carId] = (counts[carId] || 0) + 1
      costs[carId] = (costs[carId] || 0) + toNumber(item.total_cost)
    }
    return { counts, costs }
  })

  const rows = (map) =>
    Object.entries(map)
      .filter(([, v]) => !hideUnused.value || v > 0)
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ru', { numeric: true }))

  const countRows = computed(() => rows(byCar.value.counts))
  const costRows = computed(() => rows(byCar.value.costs))

  const toChart = (list, label, color) => ({
    labels: list.map(([name]) => name),
    datasets: [{ label, data: list.map(([, v]) => v), backgroundColor: color, ...BAR_STYLE }],
  })

  const orderCountChartData = computed(() =>
    toChart(countRows.value, 'Сколько раз была использована машина', COUNT_COLOR)
  )
  const totalCostChartData = computed(() => toChart(costRows.value, 'Какие затраты по машине', COST_COLOR))

  // без allLabels Chart.js подписывал каждую шестую машину — непонятно, чей столбик
  const countOptions = barOptions({ legend: false, format: formatCount, allLabels: true })
  const costOptions = barOptions({
    legend: false,
    format: formatMoney,
    axisFormat: formatMoneyShort,
    allLabels: true,
  })

  const chartWidth = computed(() => `${Math.max(countRows.value.length * COL, 0)}px`)

  const used = computed(() => Object.values(byCar.value.counts).filter((v) => v > 0).length)
  const totalCount = computed(() => Object.values(byCar.value.counts).reduce((s, v) => s + v, 0))
  const totalCost = computed(() => Object.values(byCar.value.costs).reduce((s, v) => s + v, 0))

  const isEmpty = computed(() => totalCount.value === 0)

  /* ---------- экспорт ---------- */

  function exportOrderCountToExcel() {
    exportSheet(
      `Количество использований ${selectedYear.value}.xlsx`,
      'Количество использований',
      ['Машина', 'Количество использований'],
      countRows.value
    )
  }

  function exportTotalCostToExcel() {
    exportSheet(`Затраты ${selectedYear.value}.xlsx`, 'Затраты', ['Машина', 'Затраты'], costRows.value)
  }

  return {
    types: ORDER_TYPES,
    modes: MODES,
    selectedType,
    selectedMode,
    selectedMonth,
    selectedYear,
    hideUnused,
    monthOptions,
    years: yearOptions(),
    orderCountChartData,
    totalCostChartData,
    countOptions,
    costOptions,
    chartWidth,
    used,
    totalCount,
    totalCost,
    isEmpty,
    loaded,
    loading,
    exportOrderCountToExcel,
    exportTotalCostToExcel,
  }
}

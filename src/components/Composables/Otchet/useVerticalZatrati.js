import { ref, computed } from 'vue'
import { useReport } from './useReport'
import { barOptions, BAR_STYLE } from './chartOptions'
import { MONTHS, yearOptions, orderDay, toNumber, TYPE_COLORS, exportSheet, formatMoney } from './otchet'

/**
 * Логика графика «Затраты по типу транспорта» за год по месяцам.
 * Разметка — в VerticalZatrati.vue.
 */
export function useVerticalZatrati() {
  const selectedYear = ref(new Date().getFullYear())

  const { orders, loaded, loading } = useReport('VerticalZatrati', () => ({
    key: `${selectedYear.value}`,
    params: { year: selectedYear.value },
  }))

  const monthly = computed(() => {
    const electric = new Array(12).fill(0)
    const cargo = new Array(12).fill(0)
    for (const item of orders.value) {
      const d = orderDay(item)
      if (!d || d.year != selectedYear.value) continue
      if (item.order_type_id == 1) electric[d.month - 1] += toNumber(item.total_cost)
      else if (item.order_type_id == 2) cargo[d.month - 1] += toNumber(item.total_cost)
    }
    return { electric, cargo }
  })

  const chartData = computed(() => ({
    labels: MONTHS,
    datasets: [
      {
        label: 'Электротранспорт',
        backgroundColor: TYPE_COLORS['Электротранспорт'],
        data: monthly.value.electric,
        ...BAR_STYLE,
      },
      {
        label: 'Грузовой транспорт',
        backgroundColor: TYPE_COLORS['Грузовой транспорт'],
        data: monthly.value.cargo,
        ...BAR_STYLE,
      },
    ],
  }))

  const chartOptions = barOptions({ horizontal: true, format: formatMoney })

  const sum = (arr) => arr.reduce((s, v) => s + v, 0)
  const totals = computed(() => ({
    electric: sum(monthly.value.electric),
    cargo: sum(monthly.value.cargo),
  }))

  const isEmpty = computed(() => totals.value.electric + totals.value.cargo === 0)

  function exportToExcel() {
    exportSheet(
      `Затраты по типу транспорта ${selectedYear.value}.xlsx`,
      'Затраты по типу транспорта',
      ['Месяц', 'Электротранспорт', 'Грузовой транспорт'],
      MONTHS.map((m, i) => [m, monthly.value.electric[i], monthly.value.cargo[i]])
    )
  }

  return {
    selectedYear,
    years: yearOptions(),
    chartData,
    chartOptions,
    totals,
    isEmpty,
    loaded,
    loading,
    exportToExcel,
  }
}

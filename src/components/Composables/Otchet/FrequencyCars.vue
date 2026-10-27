<template>
  <ReportCard
    title="Использование машин"
    subtitle="Сколько раз и на какую сумму работала каждая машина"
    :height="isEmpty ? '16rem' : 'auto'"
    :loading="loading"
    :loaded="loaded"
    :empty="isEmpty"
  >
    <template #actions>
      <Button
        icon="pi pi-file-excel"
        label="Использования"
        :disabled="isEmpty"
        class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
        @click="exportOrderCountToExcel"
      />
      <Button
        icon="pi pi-file-excel"
        label="Затраты"
        :disabled="isEmpty"
        class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
        @click="exportTotalCostToExcel"
      />
    </template>

    <template #filters>
      <SegmentedButtons v-model="selectedType" :options="types" />
      <SegmentedButtons v-model="selectedMode" :options="modes" />
      <Dropdown
        v-if="selectedMode === 'month'"
        v-model="selectedMonth"
        :options="monthOptions"
        option-label="label"
        option-value="value"
        class="w-36"
      />
      <Dropdown v-model="selectedYear" :options="years" class="w-28" />
      <label class="flex items-center gap-2 h-10 px-1 text-sm text-slate-600 cursor-pointer select-none">
        <Checkbox v-model="hideUnused" binary input-id="hide-unused" />
        Только с заказами
      </label>
    </template>

    <div class="space-y-6">
      <div>
        <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h3 class="text-sm font-medium text-slate-700">Количество использований</h3>
          <span class="text-sm tabular-nums text-slate-500">
            заказов: {{ formatCount(totalCount) }} · машин с заказами: {{ used }}
          </span>
        </div>
        <div class="overflow-x-auto">
          <div class="h-80" :style="{ minWidth: chartWidth }">
            <Chart type="bar" :data="orderCountChartData" :options="countOptions" class="h-full" />
          </div>
        </div>
      </div>
      <div>
        <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h3 class="text-sm font-medium text-slate-700">Затраты</h3>
          <span class="text-sm tabular-nums text-slate-500">всего {{ formatMoney(totalCost) }}</span>
        </div>
        <div class="overflow-x-auto">
          <div class="h-80" :style="{ minWidth: chartWidth }">
            <Chart type="bar" :data="totalCostChartData" :options="costOptions" class="h-full" />
          </div>
        </div>
      </div>
    </div>
  </ReportCard>
</template>

<script setup>
import { toRef } from 'vue'
import Button from 'primevue/button'
import Chart from 'primevue/chart'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'

import ReportCard from './ReportCard.vue'
import SegmentedButtons from './SegmentedButtons.vue'
import { useFrequencyCars } from './useFrequencyCars'
import { formatCount, formatMoney } from './otchet'

const props = defineProps({
  // CarsModule.cars: машины без заказов тоже попадают в график с нулём
  cars: { type: Array, default: () => [] },
})

const {
  types,
  modes,
  selectedType,
  selectedMode,
  selectedMonth,
  selectedYear,
  hideUnused,
  monthOptions,
  years,
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
} = useFrequencyCars(toRef(props, 'cars'))
</script>

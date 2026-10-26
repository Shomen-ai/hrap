<template>
  <ReportCard
    title="Заказы и затраты по подразделениям"
    subtitle="За месяц, от большего к меньшему"
    :height="isEmpty ? '16rem' : 'auto'"
    :loading="loading"
    :loaded="loaded"
    :empty="isEmpty"
  >
    <template #actions>
      <Button
        icon="pi pi-file-excel"
        label="Количество"
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
      <Dropdown
        v-model="selectedMonth"
        :options="monthOptions"
        option-label="label"
        option-value="value"
        class="w-36"
      />
      <Dropdown v-model="selectedYear" :options="years" class="w-28" />
    </template>

    <div class="grid gap-6 lg:grid-cols-2">
      <div>
        <div class="flex items-baseline justify-between gap-2 mb-2">
          <h3 class="text-sm font-medium text-slate-700">Количество заказов</h3>
          <span class="text-sm tabular-nums text-slate-500">всего {{ formatCount(totalCount) }}</span>
        </div>
        <div :style="{ height: chartHeight }">
          <Chart type="bar" :data="orderCountChartData" :options="countOptions" class="h-full" />
        </div>
      </div>
      <div>
        <div class="flex items-baseline justify-between gap-2 mb-2">
          <h3 class="text-sm font-medium text-slate-700">Затраты</h3>
          <span class="text-sm tabular-nums text-slate-500">всего {{ formatMoney(totalCost) }}</span>
        </div>
        <div :style="{ height: chartHeight }">
          <Chart type="bar" :data="totalCostChartData" :options="costOptions" class="h-full" />
        </div>
      </div>
    </div>
  </ReportCard>
</template>

<script setup>
import Button from 'primevue/button'
import Chart from 'primevue/chart'
import Dropdown from 'primevue/dropdown'

import ReportCard from './ReportCard.vue'
import SegmentedButtons from './SegmentedButtons.vue'
import { useGraphicOtnosheni } from './useGraphicOtnosheni'
import { formatCount, formatMoney } from './otchet'

const {
  types,
  selectedType,
  selectedMonth,
  selectedYear,
  monthOptions,
  years,
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
} = useGraphicOtnosheni()
</script>

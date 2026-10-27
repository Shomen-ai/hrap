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

    <!-- flex, а не grid: класс .grid занят PrimeFlex (flex-сетка с отрицательными отступами),
         в рабочем проекте колонки сжимались до ширины содержимого -->
    <div class="flex flex-col gap-6 lg:flex-row">
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline justify-between gap-2 mb-2">
          <h3 class="text-sm font-medium text-slate-700">Количество заказов</h3>
          <span class="text-sm tabular-nums text-slate-500">всего {{ formatCount(totalCount) }}</span>
        </div>
        <div :style="{ height: chartHeight }">
          <Chart type="bar" :data="orderCountChartData" :options="countOptions" class="h-full" />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline justify-between gap-2 mb-2">
          <h3 class="text-sm font-medium text-slate-700">Затраты</h3>
          <span class="text-sm tabular-nums text-slate-500">всего {{ formatMoney(totalCost) }}</span>
        </div>
        <div :style="{ height: chartHeight }">
          <Chart type="bar" :data="totalCostChartData" :options="costOptions" class="h-full" />
        </div>
      </div>
    </div>

    <template v-if="hiddenCount" #footer>
      <button
        type="button"
        class="inline-flex items-center gap-2 h-8 px-3 rounded-lg text-sm text-blue-600 hover:bg-blue-50
               outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        @click="showAll = !showAll"
      >
        <i class="pi text-xs" :class="showAll ? 'pi-chevron-up' : 'pi-chevron-down'" />
        {{ showAll ? 'Только крупнейшие' : `Показать все подразделения (ещё ${hiddenCount})` }}
      </button>
    </template>
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
  showAll,
  hiddenCount,
  totalCount,
  totalCost,
  isEmpty,
  loaded,
  loading,
  exportOrderCountToExcel,
  exportTotalCostToExcel,
} = useGraphicOtnosheni()
</script>

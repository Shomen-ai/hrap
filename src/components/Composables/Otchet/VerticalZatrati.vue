<template>
  <ReportCard
    title="Затраты по типу транспорта"
    subtitle="По месяцам за год"
    height="30rem"
    :loading="loading"
    :loaded="loaded"
    :empty="isEmpty"
    empty-hint="Выберите другой год"
  >
    <template #actions>
      <Button
        icon="pi pi-file-excel"
        label="Отчёт"
        :disabled="isEmpty"
        class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
        @click="exportToExcel"
      />
    </template>

    <template #filters>
      <Dropdown v-model="selectedYear" :options="years" class="w-28" />
    </template>

    <Chart type="bar" :data="chartData" :options="chartOptions" class="h-full" />

    <template v-if="!isEmpty" #footer>
      <span
        v-for="row in [
          { label: 'Электротранспорт', value: totals.electric },
          { label: 'Грузовой транспорт', value: totals.cargo },
        ]"
        :key="row.label"
        class="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-slate-50 text-sm text-slate-600"
      >
        <span class="size-2.5 rounded-full" :style="{ background: TYPE_COLORS[row.label] }" />
        {{ row.label }}
        <b class="tabular-nums font-semibold text-slate-900">{{ formatMoney(row.value) }}</b>
      </span>
    </template>
  </ReportCard>
</template>

<script setup>
import Button from 'primevue/button'
import Chart from 'primevue/chart'
import Dropdown from 'primevue/dropdown'

import ReportCard from './ReportCard.vue'
import { useVerticalZatrati } from './useVerticalZatrati'
import { formatMoney, TYPE_COLORS } from './otchet'

const { selectedYear, years, chartData, chartOptions, totals, isEmpty, loaded, loading, exportToExcel } =
  useVerticalZatrati()
</script>

<template>
  <ReportCard
    title="Заказы за период"
    :subtitle="byMonth ? 'Количество заказов по месяцам' : 'Количество заказов по дням'"
    height="22rem"
    :loading="loading"
    :loaded="loaded"
    :empty="isEmpty || !customReady && timePeriod === 'Свой период'"
    :empty-title="emptyTitle"
    :empty-hint="emptyHint"
  >
    <template #actions>
      <Button
        icon="pi pi-file-excel"
        label="Отчёт"
        :disabled="!canExport"
        class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
        @click="exportToExcel"
      />
    </template>

    <template #filters>
      <SegmentedButtons v-model="timePeriod" :options="periods" />

      <!-- параметры периода -->
      <template v-if="timePeriod === 'Свой период'">
        <label class="flex items-center gap-2 text-sm text-slate-500">
          с
          <input v-model="customStartDate" type="date" class="otchet-date" :max="customEndDate || undefined" />
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-500">
          по
          <input v-model="customEndDate" type="date" class="otchet-date" :min="customStartDate || undefined" />
        </label>
      </template>

      <Dropdown
        v-if="timePeriod === 'Месяц'"
        v-model="selectedMonth"
        :options="monthOptions"
        option-label="label"
        option-value="value"
        class="w-36"
      />
      <Dropdown
        v-if="timePeriod === 'Квартал'"
        v-model="selectedQuarter"
        :options="quarterOptions"
        option-label="label"
        option-value="value"
        class="w-36"
      />
      <Dropdown
        v-if="timePeriod === 'Полугодие'"
        v-model="selectedHalfYear"
        :options="halfYearOptions"
        option-label="label"
        option-value="value"
        class="w-40"
      />
      <Dropdown
        v-if="['Месяц', 'Квартал', 'Полугодие', 'Год'].includes(timePeriod)"
        v-model="selectedYear"
        :options="years"
        class="w-28"
      />

      <!-- разрез и подразделения — отдельной строкой -->
      <div class="basis-full h-0" />

      <SegmentedButtons v-model="breakdown" :options="breakdowns" />

      <MultiSelect
        v-if="podrOptions.length"
        v-model="selectedPodr"
        :options="podrOptions"
        filter
        filter-placeholder="Найти подразделение"
        :max-selected-labels="2"
        :selected-items-label="`Подразделения: {0} из ${podrOptions.length}`"
        placeholder="Подразделения не выбраны"
        class="w-full sm:w-72"
      />
    </template>

    <Chart type="bar" :data="chartData" :options="chartOptions" class="h-full" />

    <template v-if="!isEmpty" #footer>
      <span class="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-slate-100 text-sm text-slate-700">
        Всего
        <b class="tabular-nums font-semibold text-slate-900">{{ formatCount(totals.all) }}</b>
      </span>
      <span
        v-for="type in ['Электротранспорт', 'Грузовой транспорт', 'Другое']"
        v-show="totals[type]"
        :key="type"
        class="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-slate-50 text-sm text-slate-600"
      >
        <span class="size-2.5 rounded-full" :style="{ background: TYPE_COLORS[type] }" />
        {{ type }}
        <b class="tabular-nums font-semibold text-slate-900">{{ formatCount(totals[type]) }}</b>
      </span>
    </template>
  </ReportCard>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import Chart from 'primevue/chart'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'

import ReportCard from './ReportCard.vue'
import SegmentedButtons from './SegmentedButtons.vue'
import { useGraphicOrder } from './useGraphicOrder'
import { formatCount, TYPE_COLORS } from './otchet'

const {
  periods,
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
  podrOptions,
  selectedPodr,
  breakdown,
  breakdowns,
  byMonth,
  chartData,
  chartOptions,
  totals,
  isEmpty,
  loaded,
  loading,
  canExport,
  exportToExcel,
} = useGraphicOrder()

const emptyTitle = computed(() => {
  if (timePeriod.value === 'Свой период' && customInvalid.value) return 'Начало периода позже конца'
  if (timePeriod.value === 'Свой период' && !customReady.value) return 'Выберите начало и конец периода'
  if (podrOptions.value.length && !selectedPodr.value.length) return 'Не выбрано ни одного подразделения'
  return 'Данные за выбранный период отсутствуют'
})

const emptyHint = computed(() => {
  if (timePeriod.value === 'Свой период' && !customReady.value) return ''
  if (podrOptions.value.length && !selectedPodr.value.length) return 'Отметьте подразделения в списке'
  return 'Выберите другой период'
})
</script>

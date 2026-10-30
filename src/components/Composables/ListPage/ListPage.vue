<template>
  <div ref="listRoot" class="list-page w-full space-y-3">
    <!-- ЗАГОЛОВОК -->
    <h1 class="text-xl font-semibold text-slate-900">{{ title }}</h1>

    <!-- ПАНЕЛЬ -->
    <div class="bg-white rounded-xl border border-slate-200 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[220px]">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <InputText
            v-model="h.search.value"
            :placeholder="searchPlaceholder"
            class="w-full h-10 pl-10 pr-11 rounded-lg"
          />
          <button
            v-if="h.search.value"
            type="button"
            class="absolute right-1 top-1/2 -translate-y-1/2 size-9 grid place-items-center rounded-lg
                   text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            @click="h.search.value = ''"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>

        <Button
          v-if="h.hasActiveFilters.value"
          icon="pi pi-filter-slash"
          label="Сбросить"
          class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
          @click="h.clearFilter()"
        />
        <Button
          v-if="exportFile"
          icon="pi pi-file-excel"
          label="Отчёт"
          :disabled="!h.canExport.value"
          class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
          @click="h.exportToExcel(exportFile)"
        />
        <!-- кнопки страницы («Добавить …») — справа от «Отчёт» -->
        <slot name="actions" />
      </div>
    </div>

    <!-- ПЛИТКИ + доп. фильтры страницы (слот #filters) в одной строке -->
    <div
      v-if="h.tiles.value.length > 1 || $slots.filters"
      class="flex flex-col gap-2 lg:flex-row lg:items-stretch"
    >
    <!-- !grid: класс .grid занят PrimeFlex и ломает колонки -->
    <div
      v-if="h.tiles.value.length > 1"
      class="flex-1 min-w-0 !grid gap-2 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]"
    >
      <button
        v-for="tile in h.tiles.value"
        :key="tile.id ?? 'all'"
        type="button"
        class="flex items-center gap-3 px-4 h-14 rounded-xl border text-left transition-colors outline-none
               focus-visible:ring-2 focus-visible:ring-blue-500/40"
        :class="h.activeTile.value === tile.id
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-slate-200 hover:border-slate-300'"
        @click="h.setTile(tile.id)"
      >
        <span class="shrink-0 size-8 rounded-lg grid place-items-center" :class="tile.iconBg">
          <i :class="['pi', tile.icon, 'text-sm', tile.iconColor]" />
        </span>
        <span class="min-w-0">
          <span class="block text-xs text-slate-500 truncate">{{ tile.label }}</span>
          <span class="block text-lg font-semibold leading-tight tabular-nums text-slate-900">
            {{ tile.count }}
          </span>
        </span>
      </button>
    </div>

    <div v-if="$slots.filters" class="flex flex-col gap-2 sm:flex-row lg:flex-col lg:w-60 lg:shrink-0">
      <slot name="filters" />
    </div>
    </div>

    <!-- ЗАГРУЗКА -->
    <div v-if="loading && !h.items.value.length" class="space-y-2">
      <div v-for="i in 5" :key="i" class="animate-pulse bg-white border border-slate-200 rounded-xl h-16" />
    </div>

    <!-- СПИСОК -->
    <div v-else-if="h.displayed.value.length" class="space-y-2">
      <slot :items="h.displayed.value" />

      <!-- ПАГИНАЦИЯ -->
      <Paginator
        v-if="h.total.value > h.rowsOptions[0]"
        :first="h.first.value"
        :rows="h.rows.value"
        :total-records="h.total.value"
        :rows-per-page-options="h.rowsOptions"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        current-page-report-template="{first}–{last} из {totalRecords}"
        class="list-paginator"
        @page="onPage"
      />
    </div>

    <!-- ПУСТО -->
    <div v-else class="bg-white rounded-xl border border-slate-200 py-12 px-4 text-center">
      <i class="pi pi-inbox text-3xl text-slate-300" />
      <p class="mt-3 text-slate-600">{{ emptyTitle }}</p>
      <p class="mt-1 text-sm text-slate-400">
        {{ h.hasActiveFilters.value ? 'Измените условия поиска или сбросьте фильтры' : emptyHint }}
      </p>
      <Button
        v-if="h.hasActiveFilters.value"
        label="Сбросить фильтры"
        class="mt-4 h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
        @click="h.clearFilter()"
      />
    </div>
  </div>
</template>

<script setup>
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import { nextTick, ref } from 'vue'
import './listPage.css'

/**
 * Каркас списочной страницы в стиле Orders: заголовок, поиск, плитки, список, пагинация.
 * Карточки рисует страница через слот по умолчанию: <template #default="{ items }">.
 */
const props = defineProps({
  // результат useListPage()
  h: { type: Object, required: true },
  title: { type: String, required: true },
  searchPlaceholder: { type: String, default: 'Поиск…' },
  // имя файла для выгрузки; пусто — кнопки Excel нет
  exportFile: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  emptyTitle: { type: String, default: 'Ничего нет' },
  emptyHint: { type: String, default: '' },
})

const listRoot = ref(null)

// после смены страницы поднимаемся к началу списка
function onPage(event) {
  props.h.onPage(event)
  nextTick(() => {
    listRoot.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  })
}
</script>

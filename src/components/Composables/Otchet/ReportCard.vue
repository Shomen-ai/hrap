<template>
  <section class="bg-white rounded-xl border border-slate-200">
    <!-- ШАПКА -->
    <header class="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 pt-4">
      <div class="min-w-0 flex-1">
        <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
        <p v-if="subtitle" class="mt-0.5 text-sm text-slate-500">{{ subtitle }}</p>
      </div>
      <!-- обновление поверх старых данных: в шапке, чтобы не закрывать подписи графика -->
      <span v-if="loading && loaded" class="flex items-center gap-2 h-10 text-xs text-slate-500">
        <i class="pi pi-spin pi-spinner text-xs" />
        Обновляем…
      </span>
      <!-- кнопки выгрузки -->
      <div v-if="$slots.actions" class="flex flex-wrap gap-2">
        <slot name="actions" />
      </div>
    </header>

    <!-- ФИЛЬТРЫ -->
    <div v-if="$slots.filters" class="flex flex-wrap items-center gap-2 px-4 pt-3">
      <slot name="filters" />
    </div>

    <!-- ГРАФИК -->
    <div class="px-4 pt-4 pb-4">
      <div class="relative" :style="{ height, minHeight: height === 'auto' ? '16rem' : undefined }">
        <!-- первая загрузка -->
        <div v-if="loading && !loaded" class="absolute inset-0 animate-pulse rounded-lg bg-slate-100" />

        <!-- пусто -->
        <div
          v-else-if="!loading && empty"
          class="absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-dashed
                 border-slate-200 text-center px-4"
        >
          <i class="pi pi-chart-bar text-3xl text-slate-300" />
          <p class="mt-3 text-slate-600">{{ emptyTitle }}</p>
          <p v-if="emptyHint" class="mt-1 text-sm text-slate-400">{{ emptyHint }}</p>
        </div>

        <slot v-else />
      </div>

      <!-- итоги под графиком -->
      <div v-if="$slots.footer" class="mt-3 flex flex-wrap gap-2">
        <slot name="footer" />
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * Карточка одного графика страницы «Аналитика»: заголовок, выгрузка,
 * фильтры, сам график и состояния «загрузка» / «нет данных».
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  // высота области графика; Chart.js растягивается под неё (maintainAspectRatio: false)
  height: { type: String, default: '20rem' },
  loading: { type: Boolean, default: false },
  // данные периода уже приходили — при обновлении показываем их, а не скелетон
  loaded: { type: Boolean, default: false },
  empty: { type: Boolean, default: false },
  emptyTitle: { type: String, default: 'Данные за выбранный период отсутствуют' },
  emptyHint: { type: String, default: 'Выберите другой период или тип транспорта' },
})
</script>

<template>
  <div class="container">
    <PasswordChangeModal
      :showModal="showPasswordChangeModal == 1"
      @password-changed="handlePasswordChanged"
    />
    <div class="main">
      <HeaderDispatcher></HeaderDispatcher>

      <div class="p-4">
        <div class="list-page w-full space-y-3">
          <!-- ЗАГОЛОВОК -->
          <h1 class="text-xl font-semibold text-slate-900">Аналитика</h1>

          <!-- СРЕДНЕЕ ВРЕМЯ -->
          <!-- flex, а не grid: класс .grid занят PrimeFlex -->
          <div class="flex flex-col gap-2 sm:flex-row">
            <div
              v-for="tile in tiles"
              :key="tile.label"
              class="flex-1 min-w-0 flex items-center gap-3 px-4 h-16 rounded-xl border border-slate-200 bg-white"
            >
              <span class="shrink-0 size-9 rounded-lg flex items-center justify-center" :class="tile.iconBg">
                <i :class="['pi', tile.icon, tile.iconColor]" />
              </span>
              <span class="min-w-0">
                <span class="block text-xs text-slate-500">{{ tile.label }}</span>
                <span
                  v-if="loading && !tile.value"
                  class="mt-1 block h-5 w-20 animate-pulse rounded bg-slate-100"
                />
                <span
                  v-else
                  class="block text-lg font-semibold leading-tight tabular-nums"
                  :class="tile.value ? 'text-slate-900' : 'text-slate-400'"
                >
                  {{ tile.value ?? '—' }}
                </span>
              </span>
            </div>
          </div>

          <!-- ГРАФИКИ -->
          <GraphicOrder />
          <GraphicOtnosheni />
          <VerticalZatrati />
          <FrequencyCars :cars="dataCars" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import HeaderDispatcher from '@/components/HeaderDispatcher.vue'
import PasswordChangeModal from '@/components/ShablRouter/PasswordChangeModal.vue'
import GraphicOrder from './GraphicOrder.vue'
import GraphicOtnosheni from './GraphicOtnosheni.vue'
import VerticalZatrati from './VerticalZatrati.vue'
import FrequencyCars from './FrequencyCars.vue'
import { useOtchet } from './useOtchet'
import '@/components/Composables/ListPage/listPage.css'
import './otchet.css'

const { showPasswordChangeModal, handlePasswordChanged, loading, avgYesterday, avgToday, dataCars } =
  useOtchet()

const tiles = computed(() => [
  {
    label: 'Среднее время выполнения заказа вчера',
    value: avgYesterday.value,
    icon: 'pi-history',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  {
    label: 'Среднее время выполнения заказа сегодня',
    value: avgToday.value,
    icon: 'pi-clock',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
])
</script>

<style scoped>
/* как было в pages/Otchet.vue */
.container {
  padding: 20px;
}
.main {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

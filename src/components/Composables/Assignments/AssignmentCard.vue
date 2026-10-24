<template>
  <article
    class="bg-white rounded-xl border border-l-4 overflow-hidden transition-colors"
    :class="[
      hasDriver ? 'border-l-emerald-500' : 'border-l-red-500',
      draft ? 'border-blue-300' : 'border-slate-200',
    ]"
  >
    <!-- СТРОКА -->
    <div class="px-4 py-3 flex items-center gap-4">
      <div class="w-36 shrink-0 min-w-0">
        <div class="font-semibold tabular-nums text-slate-900 truncate">
          {{ row.taxi_car?.garaj_number || '—' }}
        </div>
        <div class="text-xs text-slate-500 truncate">
          {{ row.taxi_car?.transport_type?.type ?? 'Тип не указан' }}
        </div>
      </div>

      <div class="w-48 shrink-0 min-w-0 hidden sm:block">
      <span
        class="inline-block max-w-full truncate align-middle px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
        :class="row.taxi_car?.work_mode ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'"
      >
        {{ row.taxi_car?.work_mode || 'Не указан' }}
      </span>
      </div>

      <div class="flex-1 min-w-0">
        <div
          class="text-sm truncate"
          :class="hasDriver ? 'text-slate-900' : 'text-red-600'"
        >
          <i class="pi pi-user text-xs mr-1.5" :class="hasDriver ? 'text-slate-400' : 'text-red-400'" />
          <span :title="row.taxi_driver?.fio">{{ shortFio(row.taxi_driver?.fio) || 'Нет водителя' }}</span>
        </div>
        <div class="text-xs text-slate-400 tabular-nums truncate">
          {{ row.assigned_at ? `назначен ${formatDate(row.assigned_at)}` : 'не назначен' }}
        </div>
      </div>

      <span
        class="w-24 shrink-0 text-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap tabular-nums"
        :class="row.shift ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'"
      >
        {{ row.shift ? `Смена ${row.shift}` : 'Нет смены' }}
      </span>

      <Button
        :class="{ invisible: draft }"
        icon="pi pi-pencil"
        aria-label="Изменить назначение"
        class="shrink-0 size-10 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg"
        @click="$emit('edit', row)"
      />
    </div>

    <!-- ПРАВКА -->
    <div v-if="draft" class="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
      <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <label class="min-w-0">
          <span class="block mb-1 text-xs font-medium text-slate-500">Выделена</span>
          <Dropdown v-model="draft.work_mode" :options="workModes" placeholder="Выберите" class="w-full" />
        </label>

        <label class="min-w-0">
          <span class="block mb-1 text-xs font-medium text-slate-500">Водитель</span>
          <Dropdown
            v-model="draft.taxi_driver_id"
            editable
            :options="drivers"
            option-label="fio"
            option-value="id"
            placeholder="Выберите водителя"
            class="w-full"
          />
        </label>

        <label class="min-w-0">
          <span class="block mb-1 text-xs font-medium text-slate-500">Смена</span>
          <Dropdown
            v-model="draft.shift"
            :options="SHIFTS"
            option-label="name"
            option-value="id"
            placeholder="Выберите смену"
            class="w-full"
          />
        </label>
      </div>

      <div class="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
        <Button
          icon="pi pi-check"
          label="Сохранить"
          :loading="saving"
          class="h-10 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg"
          @click="$emit('save', row)"
        />
        <Button
          icon="pi pi-times"
          label="Отмена"
          :disabled="saving"
          class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
          @click="$emit('cancel', row)"
        />
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import { shortFio } from '@/components/Composables/ListPage/shortFio'

const SHIFTS = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
  { id: 3, name: '3' },
]

const props = defineProps({
  row: { type: Object, required: true },
  // черновик правки { work_mode, taxi_driver_id, shift }; null — карточка не в правке
  draft: { type: Object, default: null },
  drivers: { type: Array, default: () => [] },
  workModes: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
  formatDate: { type: Function, required: true },
})

defineEmits(['edit', 'save', 'cancel'])

const hasDriver = computed(() => Boolean(props.row.taxi_driver?.id))
</script>

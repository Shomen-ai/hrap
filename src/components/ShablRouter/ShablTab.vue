<template>
  <article
    class="rounded-xl border bg-white px-4 py-3 transition-colors"
    :class="tone.border"
  >
    <div class="flex items-start gap-3">
      <!-- номер -->
      <span
        class="shrink-0 size-7 mt-0.5 rounded-full grid place-items-center
               text-[11px] font-semibold text-white"
        :class="tone.badge"
      >
        {{ index + 1 }}
      </span>

      <div class="flex-1 min-w-0">
        <!-- название точки + тип -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-medium text-slate-900 break-words">
            {{ route.route_name || 'Без названия' }}
          </span>

          <span
            class="px-2 py-0.5 rounded-md text-xs font-medium"
            :class="tone.chip"
          >
            {{ tone.label }}
          </span>
        </div>

        <!-- все данные точки под названием -->
        <dl
          v-if="meta.length"
          class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs"
        >
          <div v-for="item in meta" :key="item.label" class="flex gap-1">
            <dt class="text-slate-400">{{ item.label }}:</dt>
            <dd class="text-slate-600 tabular-nums">{{ item.value }}</dd>
          </div>
        </dl>

        <!-- дата, если у точки она есть -->
        <div v-if="dateText" class="mt-1 text-xs text-slate-500 tabular-nums">
          <i class="pi pi-calendar text-[10px] mr-1" />{{ dateText }}
        </div>
      </div>

      <!-- удаление -->
      <button
        v-if="canDelete"
        type="button"
        class="shrink-0 size-9 grid place-items-center rounded-lg text-slate-400
               hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Удалить точку"
        @click="$emit('delete', route.id)"
      >
        <i class="pi pi-trash text-sm" />
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  route: { type: Object, required: true },
  index: { type: Number, default: 0 },
  canDelete: { type: Boolean, default: true },
})

defineEmits(['delete'])

/* Цвета оставлены те же, что были завязаны на тип:
   loading — зелёный, my — жёлтый, unloading — серо-синий */
const TONES = {
  loading: {
    label: 'Погрузка / отправление',
    badge: 'bg-green-600',
    border: 'border-green-200',
    chip: 'bg-green-50 text-green-700',
  },
  unloading: {
    label: 'Выгрузка / назначение',
    badge: 'bg-slate-500',
    border: 'border-slate-200',
    chip: 'bg-slate-100 text-slate-600',
  },
  my: {
    label: 'Точка принятия груза',
    badge: 'bg-amber-500',
    border: 'border-amber-200',
    chip: 'bg-amber-50 text-amber-700',
  },
}

const tone = computed(() => TONES[props.route?.type] ?? TONES.unloading)

const meta = computed(() => {
  const { building, department, x_cord: x, y_cord: y } = props.route ?? {}
  const list = []
  if (building) list.push({ label: 'Корпус', value: building })
  if (department) list.push({ label: 'Цех', value: department })
  if (x !== null && x !== undefined && x !== '') list.push({ label: 'X', value: x })
  if (y !== null && y !== undefined && y !== '') list.push({ label: 'Y', value: y })
  return list
})

const pad = (n) => String(n).padStart(2, '0')

function fmt(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const dateText = computed(() => {
  const list = props.route?.date
  if (!Array.isArray(list) || !list.length) return ''
  const from = fmt(list[0])
  const to = list[1] ? fmt(list[1]) : ''
  if (!from) return ''
  return to && to !== from ? `${from} — ${to}` : from
})
</script>

<style scoped>
@media (pointer: coarse) {
  button {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>

<template>
  <article
    class="rounded-xl border bg-white px-4 py-3 transition-colors"
    :class="editing ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200'"
  >
    <div class="flex items-start gap-3">
      <!-- номер и тип -->
      <span
        class="shrink-0 size-7 mt-0.5 rounded-full grid place-items-center
               text-[11px] font-semibold text-white bg-blue-600"
      >
        {{ index + 1 }}
      </span>

      <div class="flex-1 min-w-0">
        <!-- заголовок -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-medium text-slate-900 break-words">{{ place }}</span>

          <span
            v-if="route.waybill"
            class="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 tabular-nums"
          >
            ПЛ {{ route.waybill }}
          </span>
        </div>

        <!-- даты -->
        <div v-if="dateText" class="mt-1 text-xs text-slate-500 tabular-nums">
          <i class="pi pi-calendar text-[10px] mr-1" />{{ dateText }}
        </div>

        <!-- подробности одной строкой -->
        <div v-if="meta.length" class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
          <span v-for="(item, i) in meta" :key="i" class="tabular-nums">{{ item }}</span>
        </div>

        <!-- комментарий диспетчеру -->
        <p v-if="route.dispatcher_comment" class="mt-1.5 text-xs text-slate-600 break-words">
          <i class="pi pi-comment text-[10px] mr-1 text-slate-400" />{{ route.dispatcher_comment }}
        </p>
      </div>

      <!-- действия -->
      <div v-if="!disabled" class="shrink-0 flex items-center gap-1">
        <button
          type="button"
          class="size-9 grid place-items-center rounded-lg text-slate-400
                 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Изменить точку"
          @click="$emit('edit', index)"
        >
          <i class="pi pi-pencil text-sm" />
        </button>

        <button
          type="button"
          class="size-9 grid place-items-center rounded-lg text-slate-400
                 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Удалить точку"
          @click="remove"
        >
          <i class="pi pi-trash text-sm" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  route: { type: Object, required: true },
  index: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  // точка сейчас редактируется в форме ниже
  editing: { type: Boolean, default: false },
  num_zayvki: { type: [String, Number], default: '' },
  all_data_order: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['delete', 'deletePoint', 'edit'])

const place = computed(() => {
  const parts = []
  if (props.route?.building) parts.push(`Корпус ${props.route.building}`)
  const name = String(props.route?.comments ?? '')
    .replace(/^Местоположение:\s*/i, '')
    .trim()
  if (name) parts.push(name)
  else if (props.route?.department) parts.push(`Цех ${props.route.department}`)
  return parts.join(' · ') || 'место не указано'
})

// корпус и цех уже попали в place, здесь только то, чего там нет
const meta = computed(() => {
  const { x_cord: x, y_cord: y, department } = props.route ?? {}
  const list = []
  if (department && !place.value.includes(String(department))) list.push(`Цех ${department}`)
  if (x || y) list.push(`X-${x ?? '—'} · Y-${y ?? '—'}`)
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

function remove() {
  emit('deletePoint', props.index)
  emit('delete', props.index)
}

</script>

<style scoped>
@media (pointer: coarse) {
  button {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>

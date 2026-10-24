<template>
  <article
    class="bg-white rounded-xl border overflow-hidden transition-colors"
    :class="open ? 'border-blue-300' : 'border-slate-200'"
  >
    <!-- СВЁРНУТАЯ СТРОКА -->
    <button
      type="button"
      class="w-full text-left px-4 py-3 flex items-center gap-4 outline-none transition-colors
             hover:bg-slate-50 focus-visible:bg-slate-50"
      :aria-expanded="open"
      @click="$emit('toggle', car.id)"
    >
      <img
        :src="car.car_image || fallbackImage"
        alt=""
        class="shrink-0 size-12 rounded-lg object-cover bg-slate-100"
        @error="onImageError"
      />

      <div class="w-36 shrink-0 min-w-0">
        <div class="font-semibold tabular-nums text-slate-900 truncate">{{ car.garaj_number || '—' }}</div>
        <div class="text-xs text-slate-500 truncate">{{ car.transport_type?.type ?? 'Тип не указан' }}</div>
      </div>

      <div class="w-36 shrink-0 min-w-0">
        <span
          class="inline-block max-w-full truncate align-middle px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
          :class="stateStyle(car.state?.state).chip"
        >
          {{ car.state?.state || 'Без статуса' }}
        </span>
      </div>

      <div class="flex-1 min-w-0 hidden sm:block">
        <div class="text-sm text-slate-700 truncate">{{ specs || '—' }}</div>
        <div class="text-xs text-slate-400 truncate">{{ maker || 'Марка не указана' }}</div>
      </div>

      <div class="w-32 shrink-0 hidden md:block min-w-0 text-right">
        <div class="text-sm text-slate-700 tabular-nums truncate">{{ car.rate_per_hour ?? '—' }}</div>
        <div class="text-xs text-slate-400">тариф в час</div>
      </div>

      <i
        class="pi pi-chevron-down shrink-0 text-slate-400 text-sm transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- РАСКРЫТИЕ -->
    <div v-if="open" class="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
      <div class="flex flex-col md:flex-row gap-5">
        <div class="shrink-0 w-full md:w-56 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
          <img
            :src="car.car_image || fallbackImage"
            :alt="car.garaj_number"
            class="w-full h-full object-cover"
            @error="onImageError"
          />
        </div>

        <div class="flex-1 min-w-0 grid gap-x-8 gap-y-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 items-start">
          <section v-for="group in groups" :key="group.title" class="min-w-0">
            <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400 pb-2 border-b border-slate-200">
              {{ group.title }}
            </h3>
            <!-- одна сетка на группу: подписи одной ширины, значения в одну линию -->
            <dl class="grid grid-cols-[9.5rem_minmax(0,1fr)] text-sm">
              <template v-for="row in group.rows" :key="row.label">
                <dt class="py-1.5 pr-3 border-b border-slate-100 text-slate-500">{{ row.label }}</dt>
                <dd
                  class="py-1.5 border-b border-slate-100 min-w-0 break-words tabular-nums"
                  :class="isEmpty(row.value) ? 'text-slate-400' : 'text-slate-900'"
                >
                  {{ isEmpty(row.value) ? '—' : row.value }}
                </dd>
              </template>
            </dl>
          </section>

          <section v-if="car.comments" class="min-w-0 col-span-full">
            <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400 pb-2 mb-2 border-b border-slate-200">Комментарии</h3>
            <p class="text-sm text-slate-900 whitespace-pre-line break-words">{{ car.comments }}</p>
          </section>
        </div>
      </div>

      <div class="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
        <Button
          icon="pi pi-pencil"
          label="Редактировать"
          class="h-10 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg"
          @click.stop="$emit('edit', car)"
        />

        <template v-if="!confirmDelete">
          <Button
            icon="pi pi-trash"
            label="Удалить"
            class="h-10 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg"
            @click.stop="confirmDelete = true"
          />
        </template>
        <template v-else>
          <span class="text-sm text-slate-600">Удалить {{ car.garaj_number }}?</span>
          <Button
            label="Да, удалить"
            class="h-10 bg-red-600 hover:bg-red-700 text-white border-none rounded-lg"
            @click.stop="onDelete"
          />
          <Button
            label="Нет"
            class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
            @click.stop="confirmDelete = false"
          />
        </template>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import fallbackImage from '@/assets/not_car.jpg'
import { stateStyle } from '@/components/Composables/ListPage/stateStyle'

const props = defineProps({
  car: { type: Object, required: true },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'edit', 'delete'])

const confirmDelete = ref(false)

// свернули карточку — подтверждение удаления сбрасываем
watch(
  () => props.open,
  (open) => {
    if (!open) confirmDelete.value = false
  }
)

function onDelete() {
  confirmDelete.value = false
  emit('delete', props.car)
}

const isEmpty = (v) => v === null || v === undefined || v === ''

const specs = computed(() => {
  const c = props.car
  const parts = []
  if (!isEmpty(c.cargo_capacity)) parts.push(`до ${Number(c.cargo_capacity)} т`)
  if (!isEmpty(c.length)) parts.push(`${c.length}×${c.width ?? '—'}×${c.height ?? '—'} м`)
  if (!isEmpty(c.capacity)) parts.push(`${c.capacity} чел.`)
  return parts.join(' · ')
})

const maker = computed(() =>
  [props.car.company, props.car.model, props.car.year].filter((v) => !isEmpty(v)).join(' ')
)

const groups = computed(() => {
  const c = props.car
  return [
    {
      title: 'Характеристики',
      rows: [
        { label: 'Грузоподъёмность', value: c.cargo_capacity },
        { label: 'Длина', value: c.length },
        { label: 'Ширина', value: c.width },
        { label: 'Высота', value: c.height },
        { label: 'Вместимость', value: isEmpty(c.capacity) ? '' : `${c.capacity} чел.` },
      ],
    },
    {
      title: 'Производитель',
      rows: [
        { label: 'Страна', value: c.country },
        { label: 'Марка', value: c.company },
        { label: 'Модель', value: c.model },
        { label: 'Год', value: c.year },
        { label: 'Цвет', value: c.color },
      ],
    },
    {
      title: 'Учёт',
      rows: [
        { label: 'ID', value: c.id },
        { label: 'Гаражный номер', value: c.garaj_number },
        { label: 'Тариф в час', value: c.rate_per_hour },
      ],
    },
  ]
})

function onImageError(event) {
  event.target.src = fallbackImage
}
</script>

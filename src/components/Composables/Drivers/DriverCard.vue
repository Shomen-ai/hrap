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
      @click="$emit('toggle', driver.id)"
    >
      <span
        class="shrink-0 size-10 rounded-full grid place-items-center text-sm font-semibold
               bg-blue-100 text-blue-700"
      >
        {{ initials }}
      </span>

      <div class="w-56 shrink-0 min-w-0 max-sm:flex-1">
        <div class="font-medium text-slate-900 truncate" :title="driver.fio">{{ shortFio(driver.fio) || '—' }}</div>
        <div class="text-xs text-slate-500 truncate">
          ID {{ driver.id }}<template v-if="driver.login"> · {{ driver.login }}</template>
        </div>
      </div>

      <div class="w-28 shrink-0 min-w-0">
        <span
          class="inline-block max-w-full truncate align-middle px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
          :class="stateStyle(driver.state?.state).chip"
        >
          {{ driver.state?.state || 'Без статуса' }}
        </span>
      </div>

      <div class="flex-1 min-w-0 hidden sm:block">
        <div class="text-sm text-slate-700 tabular-nums truncate">{{ driver.mob_number || '—' }}</div>
        <div class="text-xs text-slate-400 tabular-nums truncate">
          {{ driver.stat_number ? `стац. ${driver.stat_number}` : 'стац. номера нет' }}
        </div>
      </div>

      <div class="w-44 shrink-0 hidden md:block min-w-0">
        <div class="text-sm text-slate-700 truncate">
          {{ driver.driver_type?.type ? `Права ${driver.driver_type.type}` : 'Права не указаны' }}
        </div>
        <div class="text-xs text-slate-400 tabular-nums truncate">{{ driver.num_license || '—' }}</div>
      </div>

      <i
        class="pi pi-chevron-down shrink-0 text-slate-400 text-sm transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- РАСКРЫТИЕ -->
    <div v-if="open" class="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
      <div class="grid gap-x-8 gap-y-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start">
        <section v-for="group in groups" :key="group.title" class="min-w-0">
          <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400 pb-2 border-b border-slate-200">
            {{ group.title }}
          </h3>
          <!-- одна сетка на группу: подписи одной ширины, значения в одну линию -->
          <dl class="grid grid-cols-[8rem_minmax(0,1fr)] text-sm">
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

        <section v-if="driver.comments" class="min-w-0 col-span-full">
          <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400 pb-2 mb-2 border-b border-slate-200">Комментарий</h3>
          <p class="text-sm text-slate-900 whitespace-pre-line break-words">{{ driver.comments }}</p>
        </section>
      </div>

      <div class="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
        <Button
          icon="pi pi-pencil"
          label="Редактировать"
          class="h-10 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg"
          @click.stop="$emit('edit', driver)"
        />
        <Button
          icon="pi pi-qrcode"
          label="Скачать QR"
          class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
          @click.stop="$emit('qr', driver)"
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
          <span class="text-sm text-slate-600">Удалить водителя?</span>
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
import { stateStyle } from '@/components/Composables/ListPage/stateStyle'
import { shortFio } from '@/components/Composables/ListPage/shortFio'

const props = defineProps({
  driver: { type: Object, required: true },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'edit', 'delete', 'qr'])

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
  emit('delete', props.driver)
}

const isEmpty = (v) => v === null || v === undefined || v === ''

// «Иванов Пётр Сергеевич» -> «ИП»
const initials = computed(() => {
  const [f, i] = String(props.driver.fio ?? '').trim().split(/\s+/)
  return ((f?.[0] ?? '') + (i?.[0] ?? '')).toUpperCase() || '?'
})

const groups = computed(() => {
  const d = props.driver
  return [
    {
      title: 'Контакты',
      rows: [
        { label: 'Мобильный', value: d.mob_number },
        { label: 'Стационарный', value: d.stat_number },
      ],
    },
    {
      title: 'Удостоверение',
      rows: [
        { label: 'Тип прав', value: d.driver_type?.type },
        { label: 'Номер', value: d.num_license },
        { label: 'Дата выдачи', value: d.date_accept_license },
      ],
    },
    {
      title: 'Учётная запись',
      rows: [
        { label: 'ФИО', value: d.fio },
        { label: 'ID', value: d.id },
        { label: 'Логин', value: d.login },
      ],
    },
  ]
})
</script>

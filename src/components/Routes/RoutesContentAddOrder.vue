<template>
  <section class="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <!-- ЗАГОЛОВОК-ПЕРЕКЛЮЧАТЕЛЬ -->
    <button
      type="button"
      class="w-full px-4 h-12 flex items-center gap-2 text-left outline-none transition-colors
             hover:bg-slate-50 focus-visible:bg-slate-50"
      :aria-expanded="open"
      @click="open = !open"
    >
      <i
        class="pi text-blue-600 text-sm transition-transform duration-200"
        :class="open ? 'pi-minus-circle' : 'pi-plus-circle'"
      />
      <span class="font-medium text-blue-700">{{ title }}</span>
      <i
        class="pi pi-chevron-down ml-auto text-slate-400 text-xs transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- ФОРМА -->
    <div v-if="open" class="border-t border-slate-100 px-4 py-4 space-y-4">
      <!-- автозаполнение -->
      <div class="grid gap-x-4 gap-y-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <div class="min-w-0">
          <label class="block mb-1 text-xs font-medium text-slate-500">
            Выбрать из избранных маршрутов
          </label>
          <Dropdown
            v-model="favourite"
            :options="favouriteRoutes"
            option-label="name"
            placeholder="Автозаполнение полей"
            show-clear
            class="w-full"
            @update:modelValue="applyFavourite"
          />
        </div>

        <div class="min-w-0">
          <label class="block mb-1 text-xs font-medium text-slate-500">
            Выбрать из привязанных точек
          </label>
          <Dropdown
            v-model="bound"
            :options="boundPoints"
            option-label="name"
            placeholder="Автозаполнение полей"
            show-clear
            class="w-full"
            @update:modelValue="applyBound"
          />
        </div>
      </div>

      <!-- место -->
      <div class="grid gap-x-4 gap-y-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div class="min-w-0">
          <label class="block mb-1 text-xs font-medium text-slate-500">
            Корпус <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="form.building"
            :options="buildings"
            option-label="name"
            placeholder="Выберите корпус"
            filter
            class="w-full"
            :class="{ 'p-invalid': touched && !form.building }"
          />
        </div>

        <div class="min-w-0">
          <label class="block mb-1 text-xs font-medium text-slate-500">
            Цех / Отдел <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="form.department"
            :options="departments"
            option-label="name"
            placeholder="Выберите цех"
            filter
            class="w-full"
            :class="{ 'p-invalid': touched && !form.department }"
          />
        </div>

        <div class="min-w-0">
          <label class="block mb-1 text-xs font-medium text-slate-500">
            Координата X <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="form.x"
            :options="coordsX"
            option-label="value"
            placeholder="Выберите X"
            class="w-full"
            :class="{ 'p-invalid': touched && !form.x }"
          />
        </div>

        <div class="min-w-0">
          <label class="block mb-1 text-xs font-medium text-slate-500">
            Координата Y <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="form.y"
            :options="coordsY"
            option-label="value"
            placeholder="Выберите Y"
            class="w-full"
            :class="{ 'p-invalid': touched && !form.y }"
          />
        </div>
      </div>

      <!-- когда нужна машина -->
      <fieldset class="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <legend class="px-1 text-xs font-medium text-slate-600 flex items-center gap-1.5">
          <i class="pi pi-flag text-[11px] text-slate-400" />
          Когда нужна машина? ({{ pointLabel }}) <span class="text-red-500">*</span>
        </legend>

        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="preset in PRESETS"
            :key="preset.value"
            type="button"
            class="px-3 h-9 rounded-lg text-sm font-medium border transition-colors"
            :class="
              form.preset === preset.value
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
            "
            @click="applyPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>

        <Calendar
          v-model="form.date"
          selection-mode="range"
          show-time
          hour-format="24"
          date-format="dd.mm.yy"
          :min-date="minDate"
          :max-date="maxDate"
          :disabled="form.preset !== 'custom'"
          placeholder="дд.мм.гггг 00:00 - дд.мм.гггг 00:00"
          class="w-full"
          :class="{ 'p-invalid': touched && !hasDate }"
          @update:modelValue="form.preset = 'custom'"
        />

        <p class="mt-1.5 text-xs text-slate-400 flex items-center gap-1.5">
          <i class="pi pi-info-circle text-[11px]" />
          Доступен выбор от сегодня и на ближайшие 6 дней
        </p>
      </fieldset>

      <!-- комментарий -->
      <div>
        <label class="block mb-1 text-xs font-medium text-slate-500">
          Комментарий для диспетчера
        </label>
        <Textarea
          v-model="form.comment"
          placeholder="Необязательно"
          class="w-full min-h-[80px] rounded-lg"
        />
      </div>

      <!-- ошибки и действие -->
      <p v-if="touched && errors.length" class="text-xs text-red-600">
        Заполните: {{ errors.join(', ') }}
      </p>

      <div class="flex justify-end">
        <Button
          icon="pi pi-plus"
          :label="addLabel"
          class="h-11 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg"
          @click="submit"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useStore } from 'vuex'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const props = defineProps({
  state_order: { type: [Number, String], default: null },
  all_data_order: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['addPointInRoute'])

const store = useStore()

const buildings = computed(() => store.state.OrdersModule.buildings ?? [])
const departments = computed(() => store.state.OrdersModule.departments ?? [])
const coordsX = computed(() => store.state.OrdersModule.coordsX ?? [])
const coordsY = computed(() => store.state.OrdersModule.coordsY ?? [])
const favouriteRoutes = computed(() => store.state.OrdersModule.favouriteRoutes ?? [])
const boundPoints = computed(() => store.state.OrdersModule.boundPoints ?? [])

const open = ref(false)
const touched = ref(false)

const favourite = ref(null)
const bound = ref(null)

const form = reactive({
  building: null,
  department: null,
  x: null,
  y: null,
  preset: 'asap',
  date: null,
  comment: '',
})

/* ---------- первая точка маршрута — стартовая ---------- */

const existingPoints = computed(() =>
  Array.isArray(props.all_data_order?.loading_and_delivery_points)
    ? props.all_data_order.loading_and_delivery_points
    : []
)

const isFirst = computed(() => existingPoints.value.length === 0)
const pointLabel = computed(() => (isFirst.value ? 'Стартовая точка' : 'Точка маршрута'))
const title = computed(() =>
  isFirst.value ? 'Добавить стартовую точку маршрута' : 'Добавить точку маршрута'
)
const addLabel = computed(() =>
  isFirst.value ? 'Добавить стартовую точку' : 'Добавить точку маршрута'
)

/* ---------- когда нужна машина ---------- */

const PRESETS = [
  { value: 'asap', label: 'Как можно скорее' },
  { value: 'day', label: 'Подожду в течение дня' },
  { value: 'allday', label: 'Машина на весь день' },
  { value: 'custom', label: 'Своя дата и время' },
]

const minDate = new Date()
const maxDate = new Date(Date.now() + 6 * 24 * 3600e3)

const at = (h, m = 0) => {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function applyPreset(value) {
  form.preset = value
  if (value === 'asap') form.date = [new Date(), new Date(Date.now() + 2 * 3600e3)]
  else if (value === 'day') form.date = [new Date(), at(18)]
  else if (value === 'allday') form.date = [at(8), at(20)]
  else form.date = null
}

applyPreset('asap')

const hasDate = computed(() => Array.isArray(form.date) && Boolean(form.date[0]))

/* ---------- автозаполнение ---------- */

const byId = (list, id) => list.find((x) => x.id === id) ?? null

function fill(point) {
  form.building = buildings.value.find((b) => b.id === point.building_id) ?? null
  form.department = byId(departments.value, point.department_id)
  form.x = coordsX.value.find((c) => c.value === point.x_cord) ?? null
  form.y = coordsY.value.find((c) => c.value === point.y_cord) ?? null
}

function applyFavourite(route) {
  if (!route) return
  bound.value = null
  // из избранного берём точку по позиции: первая для стартовой, иначе последняя
  fill(isFirst.value ? route.points[0] : route.points.at(-1))
}

function applyBound(point) {
  if (!point) return
  favourite.value = null
  fill(point)
}

/* ---------- отправка ---------- */

const errors = computed(() => {
  const list = []
  if (!form.building) list.push('корпус')
  if (!form.department) list.push('цех')
  if (!form.x) list.push('координату X')
  if (!form.y) list.push('координату Y')
  if (!hasDate.value) list.push('дату')
  return list
})

function reset() {
  form.building = null
  form.department = null
  form.x = null
  form.y = null
  form.comment = ''
  favourite.value = null
  bound.value = null
  touched.value = false
  applyPreset('asap')
}

function submit() {
  touched.value = true
  if (errors.value.length) return

  const [from, to] = form.date

  emit('addPointInRoute', {
    // Поле нужно бэкенду, в интерфейсе больше нигде не показывается:
    // первая точка маршрута считается начальной, остальные — последующими.
    type: isFirst.value ? 'loading' : 'unloading',
    building: form.building.name.replace(/\D+/g, '') || form.building.name,
    department: form.department.name,
    // модалка вытаскивает место из comments по префиксу «Местоположение:»
    comments: `Местоположение:${form.department.name}`,
    // TODO: проверь имя поля на бэке — комментарий диспетчеру хранится отдельно от места
    dispatcher_comment: form.comment || null,
    date: [from, to ?? from],
    x_cord: form.x.value,
    y_cord: form.y.value,
    waybill: null,
  })

  reset()
  open.value = false
}
</script>

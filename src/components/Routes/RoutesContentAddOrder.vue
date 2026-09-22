<template>
  <section
    ref="root"
    class="rounded-xl border overflow-hidden transition-colors"
    :class="isEditing ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white'"
  >
    <!-- ЗАГОЛОВОК-ПЕРЕКЛЮЧАТЕЛЬ -->
    <button
      type="button"
      class="w-full px-4 h-12 flex items-center gap-2 text-left outline-none transition-colors
             hover:bg-slate-50 focus-visible:bg-slate-50 disabled:opacity-60"
      :disabled="disabled"
      :aria-expanded="open"
      @click="toggle"
    >
      <i
        class="pi text-sm transition-transform duration-200"
        :class="isEditing ? 'pi-pencil text-amber-600' : open ? 'pi-minus-circle text-blue-600' : 'pi-plus-circle text-blue-600'"
      />
      <span class="font-medium" :class="isEditing ? 'text-amber-700' : 'text-blue-700'">
        {{ title }}
      </span>
      <i
        class="pi pi-chevron-down ml-auto text-slate-400 text-xs transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- ФОРМА -->
    <div v-if="open" class="border-t border-slate-100 px-4 py-4 space-y-4">
      <!-- Автозаполнение -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="w-full min-w-0">
          <label class="block text-sm font-semibold text-slate-600 mb-1.5">
            Выбрать из избранных маршрутов
          </label>
          <Dropdown
            v-model="selectedFavoriteRoute"
            :options="favoriteRoutes"
            option-label="route_name"
            placeholder="Автозаполнение полей"
            class="w-full"
            show-clear
            filter
            :disabled="disabled"
            :pt="DROPDOWN_PT"
            @update:model-value="setRoute"
          />
        </div>

        <div class="w-full min-w-0">
          <label class="block text-sm font-semibold text-slate-600 mb-1.5">
            Выбрать из привязанных точек
          </label>
          <Dropdown
            v-model="selectedOtherRoute"
            :options="otherRoutes"
            option-label="route_name"
            placeholder="Автозаполнение полей"
            class="w-full"
            show-clear
            filter
            :disabled="disabled"
            :pt="DROPDOWN_PT"
            @update:model-value="setRoute"
          />
        </div>
      </div>

      <!-- Сетка полей: каскадные справочники из OrdersModule.logistics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="w-full min-w-0">
          <label class="block text-sm font-semibold text-slate-600 mb-1.5">
            Корпус <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="newPoint.building"
            :options="buildingOptions"
            placeholder="Корпус"
            class="w-full"
            show-clear
            filter
            :disabled="disabled"
            :class="{ 'p-invalid': touched && !newPoint.building }"
            :pt="DROPDOWN_PT"
          />
        </div>

        <div class="w-full min-w-0">
          <label class="block text-sm font-semibold text-slate-600 mb-1.5">
            Цех / Отдел <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="newPoint.department"
            :options="departmentOptions"
            placeholder="Цех"
            class="w-full"
            show-clear
            filter
            :disabled="disabled"
            :class="{ 'p-invalid': touched && !newPoint.department }"
            :pt="DROPDOWN_PT"
          />
        </div>

        <div class="w-full min-w-0">
          <label class="block text-sm font-semibold text-slate-600 mb-1.5">
            Координата X <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="newPoint.x_cord"
            :options="xOptions"
            placeholder="X"
            class="w-full"
            show-clear
            filter
            :disabled="disabled"
            :class="{ 'p-invalid': touched && !newPoint.x_cord }"
            :pt="DROPDOWN_PT"
          />
        </div>

        <div class="w-full min-w-0">
          <label class="block text-sm font-semibold text-slate-600 mb-1.5">
            Координата Y <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="newPoint.y_cord"
            :options="yOptions"
            placeholder="Y"
            class="w-full"
            show-clear
            filter
            :disabled="disabled"
            :class="{ 'p-invalid': touched && !newPoint.y_cord }"
            :pt="DROPDOWN_PT"
          />
        </div>
      </div>

      <p v-if="!logistics.length" class="text-xs text-amber-600 flex items-center gap-1.5">
        <i class="pi pi-exclamation-triangle text-[11px]" />
        Справочник точек (OrdersModule.logistics) пуст — проверь, что он загружается при открытии модалки.
      </p>

      <!-- Когда нужна машина -->
      <fieldset class="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <legend class="px-1 text-xs font-medium text-slate-600 flex items-center gap-1.5">
          <i class="pi pi-flag text-[11px] text-slate-400" />
          Когда нужна машина? <span class="text-red-500">*</span>
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
            :disabled="disabled"
            @click="applyPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>

        <Calendar
          v-model="newPoint.date"
          selection-mode="range"
          show-time
          hour-format="24"
          date-format="dd.mm.yy"
          :min-date="minDate"
          :max-date="maxDate"
          :disabled="disabled"
          placeholder="дд.мм.гггг 00:00 - дд.мм.гггг 00:00"
          class="w-full"
          :class="{ 'p-invalid': touched && !hasDate }"
          :pt="{ panel: { class: 'max-w-[calc(100vw-2rem)]' } }"
          @update:model-value="form.preset = 'custom'"
        />

        <p class="mt-1.5 text-xs text-slate-400 flex items-center gap-1.5">
          <i class="pi pi-info-circle text-[11px]" />
          Доступен выбор от сегодня и на ближайшие 6 дней
        </p>
      </fieldset>

      <!-- Комментарий -->
      <div>
        <label class="block text-sm font-semibold text-slate-600 mb-1.5">
          Комментарий для диспетчера
        </label>
        <Textarea
          v-model="newPoint.comments"
          :disabled="disabled"
          placeholder="Местоположение: ..."
          class="w-full min-h-[80px] rounded-lg"
        />
      </div>

      <!-- Ошибки и действия -->
      <p v-if="touched && errors.length" class="text-xs text-red-600">
        Заполните: {{ errors.join(', ') }}
      </p>

      <div class="flex flex-wrap justify-end gap-2">
        <Button
          v-if="isEditing"
          label="Отмена"
          text
          class="h-11 text-slate-500"
          @click="cancel"
        />
        <Button
          :icon="isEditing ? 'pi pi-check' : 'pi pi-plus'"
          :label="submitLabel"
          :disabled="disabled"
          class="h-11 text-white border-none rounded-lg"
          :class="isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'"
          @click="submit"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const props = defineProps({
  state_order: { type: [Number, String], default: null },
  all_data_order: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  // точка, которую редактируем (null — режим добавления)
  editPoint: { type: Object, default: null },
  editIndex: { type: Number, default: null },
})

const emit = defineEmits(['addPointInRoute', 'updatePointInRoute', 'cancelEdit'])

const store = useStore()
const root = ref(null)

/* ------------------------------------------------------------------ *
 * Глобальные :pt для Dropdown — те же, что в создании заявки.
 * panel c max-w не даёт выпадашке вылезти за узкий диалог.
 * ------------------------------------------------------------------ */
const DROPDOWN_PT = {
  root: { class: 'w-full min-w-0' },
  panel: { class: 'max-w-[calc(100vw-2rem)]' },
  item: { class: 'whitespace-normal break-words leading-snug py-2' },
  label: { class: 'truncate' },
}

/* ------------------------------------------------------------------ *
 * Состояние формы
 * ------------------------------------------------------------------ */

const open = ref(false)
const touched = ref(false)

const selectedFavoriteRoute = ref(null)
const selectedOtherRoute = ref(null)

const newPoint = reactive({
  building: null,
  department: null,
  x_cord: null,
  y_cord: null,
  date: null,
  comments: 'Местоположение: ',
})

const form = reactive({ preset: 'asap' })

const isEditing = computed(() => props.editIndex !== null && props.editIndex !== undefined)

/* ------------------------------------------------------------------ *
 * Автозаполнение: избранные маршруты и привязанные точки
 * ------------------------------------------------------------------ */

const favoriteRoutes = computed(() =>
  (store.state.AuthModule?.user?.favorite_routes ?? []).filter(
    (el) => el.type === 'loading' || el.type === 'unloading'
  )
)

const otherRoutes = computed(() =>
  (store.state.AuthModule?.routesPriemka ?? []).filter((el) => el.type === 'my')
)

function setRoute(route) {
  if (!route) return

  newPoint.building = route.building ?? null
  newPoint.department = route.department ?? null
  newPoint.x_cord =
    route.x_cord !== null && route.x_cord !== undefined ? String(route.x_cord) : null
  newPoint.y_cord =
    route.y_cord !== null && route.y_cord !== undefined ? String(route.y_cord) : null
  newPoint.comments = 'Местоположение: ' + (route.route_name || '')

  if (route.type === 'loading' || route.type === 'unloading') {
    selectedFavoriteRoute.value = route
    selectedOtherRoute.value = null
  } else if (route.type === 'my') {
    selectedOtherRoute.value = route
    selectedFavoriteRoute.value = null
  }
}

/* ------------------------------------------------------------------ *
 * Каскадные справочники из OrdersModule.logistics
 * Каждое поле считает варианты по записям, переживших выбор в остальных.
 * ------------------------------------------------------------------ */

const KEYS = {
  building: 'building_name',
  department: 'department',
  x_cord: 'point_x',
  y_cord: 'point_y',
}

const logistics = computed(() => {
  const raw = store.state.OrdersModule?.logistics
  return Array.isArray(raw) ? raw : Object.values(raw ?? {})
})

const cmp = (a, b) => {
  const na = Number(a)
  const nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  return String(a).localeCompare(String(b), 'ru')
}

function optionsFor(field) {
  const rows = logistics.value.filter((row) =>
    Object.keys(KEYS).every(
      (f) => f === field || !newPoint[f] || String(row[KEYS[f]]) === String(newPoint[f])
    )
  )
  const values = rows
    .map((row) => row[KEYS[field]])
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map(String)
  return [...new Set(values)].sort(cmp)
}

const buildingOptions = computed(() => optionsFor('building'))
const departmentOptions = computed(() => optionsFor('department'))
const xOptions = computed(() => optionsFor('x_cord'))
const yOptions = computed(() => optionsFor('y_cord'))

/* ------------------------------------------------------------------ *
 * Когда нужна машина
 * ------------------------------------------------------------------ */

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
  if (value === 'asap') newPoint.date = [new Date(), new Date(Date.now() + 2 * 3600e3)]
  else if (value === 'day') newPoint.date = [new Date(), at(18)]
  else if (value === 'allday') newPoint.date = [at(8), at(20)]
  else newPoint.date = null
}

applyPreset('asap')

const hasDate = computed(() => Array.isArray(newPoint.date) && Boolean(newPoint.date[0]))

/* ------------------------------------------------------------------ *
 * Заголовок и подписи
 * ------------------------------------------------------------------ */

const existingPoints = computed(() =>
  Array.isArray(props.all_data_order?.loading_and_delivery_points)
    ? props.all_data_order.loading_and_delivery_points
    : []
)

const isFirst = computed(() => existingPoints.value.length === 0)

const title = computed(() => {
  if (isEditing.value) return `Редактирование точки ${props.editIndex + 1}`
  return isFirst.value ? 'Добавить стартовую точку маршрута' : 'Добавить точку маршрута'
})

const submitLabel = computed(() => {
  if (isEditing.value) return 'Сохранить точку'
  return isFirst.value ? 'Добавить стартовую точку' : 'Добавить точку маршрута'
})

/* ------------------------------------------------------------------ *
 * Режим редактирования: форма заполняется данными точки
 * ------------------------------------------------------------------ */

const toDate = (v) => (v instanceof Date ? v : v ? new Date(v) : null)

function fillFrom(point) {
  newPoint.building = point?.building != null ? String(point.building) : null
  newPoint.department = point?.department != null ? String(point.department) : null
  newPoint.x_cord = point?.x_cord != null ? String(point.x_cord) : null
  newPoint.y_cord = point?.y_cord != null ? String(point.y_cord) : null
  newPoint.comments = point?.comments ?? 'Местоположение: '

  const range = Array.isArray(point?.date) ? point.date.map(toDate).filter(Boolean) : []
  newPoint.date = range.length ? [range[0], range[1] ?? range[0]] : null
  form.preset = 'custom'

  selectedFavoriteRoute.value = null
  selectedOtherRoute.value = null
  touched.value = false
}

watch(
  () => props.editIndex,
  async (index) => {
    if (index === null || index === undefined) return
    fillFrom(props.editPoint)
    open.value = true
    await nextTick()
    root.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  },
  { immediate: true }
)

/* ------------------------------------------------------------------ *
 * Отправка
 * ------------------------------------------------------------------ */

const errors = computed(() => {
  const list = []
  if (!newPoint.building) list.push('корпус')
  if (!newPoint.department) list.push('цех')
  if (!newPoint.x_cord) list.push('координату X')
  if (!newPoint.y_cord) list.push('координату Y')
  if (!hasDate.value) list.push('дату')
  return list
})

function reset() {
  newPoint.building = null
  newPoint.department = null
  newPoint.x_cord = null
  newPoint.y_cord = null
  newPoint.comments = 'Местоположение: '
  selectedFavoriteRoute.value = null
  selectedOtherRoute.value = null
  touched.value = false
  applyPreset('asap')
}

function buildPayload() {
  const [from, to] = newPoint.date
  return {
    // тип точки в UI не показывается, но остаётся в данных:
    // первая точка маршрута — стартовая, остальные — промежуточные
    type: isEditing.value
      ? props.editPoint?.type ?? 'unloading'
      : isFirst.value
        ? 'loading'
        : 'unloading',
    building: newPoint.building,
    department: newPoint.department,
    x_cord: String(newPoint.x_cord),
    y_cord: String(newPoint.y_cord),
    date: [from, to ?? from],
    comments: newPoint.comments,
    waybill: isEditing.value ? props.editPoint?.waybill ?? null : null,
    scan_flag: isEditing.value ? props.editPoint?.scan_flag ?? false : false,
  }
}

function submit() {
  touched.value = true
  if (errors.value.length) return

  if (isEditing.value) {
    emit('updatePointInRoute', { index: props.editIndex, point: buildPayload() })
  } else {
    emit('addPointInRoute', buildPayload())
  }

  reset()
  open.value = false
}

function cancel() {
  reset()
  open.value = false
  emit('cancelEdit')
}

function toggle() {
  if (open.value && isEditing.value) {
    cancel()
    return
  }
  open.value = !open.value
}
</script>

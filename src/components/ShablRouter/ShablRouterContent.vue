<template>
  <div class="w-full space-y-5">
    <!-- Пояснение для точек принятия груза -->
    <section
      v-if="routeType === 'my'"
      class="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-slate-700 space-y-1.5"
    >
      <p class="font-semibold text-amber-800">Мои точки принятия груза</p>
      <p>
        Прикрепление такой точки необходимо, чтобы от учётной записи данного пользователя,
        в указанном вами месте, можно было принимать груз, сканировав QR-код транспортной
        накладной. В QR-коде накладной также указаны координаты — они должны совпасть.
      </p>
      <p class="font-medium">
        Т.е. мы сверяем точку из накладной и точку, прикреплённую вами.
      </p>
      <p>
        Чтобы вам отправляли детали по картам обработки, оснастку, инструмент, следует завести
        данную точку и уведомить отправителя.
      </p>
    </section>

    <!-- СУЩЕСТВУЮЩИЕ ТОЧКИ -->
    <section class="space-y-2">
      <h3 class="text-sm font-semibold text-slate-600">
        Мои точки
        <span v-if="pathArray.length" class="text-slate-400 font-normal">
          · {{ pathArray.length }}
        </span>
      </h3>

      <p
        v-if="!pathArray.length"
        class="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400"
      >
        Пока ни одной точки не добавлено
      </p>

      <ShablTab
        v-for="(route, index) in pathArray"
        :key="route.id ?? index"
        :route="route"
        :index="index"
        @delete="deleteRoute"
      />
    </section>

    <!-- ДОБАВЛЕНИЕ НОВОЙ ТОЧКИ -->
    <section class="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <header class="px-4 h-12 flex items-center gap-2 border-b border-slate-100">
        <i class="pi pi-plus-circle text-sm" :class="accent.icon" />
        <span class="font-medium" :class="accent.title">Добавить новый путь / точку</span>
      </header>

      <div class="px-4 py-4 space-y-4">
        <!-- поля: те же, что были -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="w-full min-w-0">
            <label class="block text-sm font-semibold text-slate-600 mb-1.5">
              Корпус <span class="text-red-500">*</span>
            </label>
            <Dropdown
              v-model="building"
              :options="building_filter_data"
              :loading="store.state.OrdersModule.logisticsLoading"
              placeholder="Корпус"
              class="w-full"
              editable
              show-clear
              :class="{ 'p-invalid': touched && !building }"
              :pt="DROPDOWN_PT"
            />
          </div>

          <div class="w-full min-w-0">
            <label class="block text-sm font-semibold text-slate-600 mb-1.5">
              Цех <span class="text-red-500">*</span>
            </label>
            <Dropdown
              v-model="department"
              :options="department_filter_data"
              :loading="store.state.OrdersModule.logisticsLoading"
              placeholder="Цех"
              class="w-full"
              editable
              show-clear
              :class="{ 'p-invalid': touched && !department }"
              :pt="DROPDOWN_PT"
            />
          </div>

          <div class="w-full min-w-0">
            <label class="block text-sm font-semibold text-slate-600 mb-1.5">
              Координата X <span class="text-red-500">*</span>
            </label>
            <Dropdown
              v-model="x_cord"
              :options="x_filter_data"
              :loading="store.state.OrdersModule.logisticsLoading"
              placeholder="Координата X"
              class="w-full"
              editable
              show-clear
              :class="{ 'p-invalid': touched && !x_cord }"
              :pt="DROPDOWN_PT"
            />
          </div>

          <div class="w-full min-w-0">
            <label class="block text-sm font-semibold text-slate-600 mb-1.5">
              Координата Y <span class="text-red-500">*</span>
            </label>
            <Dropdown
              v-model="y_cord"
              :options="y_filter_data"
              :loading="store.state.OrdersModule.logisticsLoading"
              placeholder="Координата Y"
              class="w-full"
              editable
              show-clear
              :class="{ 'p-invalid': touched && !y_cord }"
              :pt="DROPDOWN_PT"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-600 mb-1.5">
            Название точки <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="route_name"
            placeholder="Как называть эту точку"
            class="w-full"
            :class="{ 'p-invalid': touched && !route_name }"
          />
        </div>

        <!-- сканер накладной: заполняет те же поля -->
        <LogisticScan @updateData="handleUpdateData" />

        <p v-if="touched && errors.length" class="text-xs text-red-600">
          Заполните: {{ errors.join(', ') }}
        </p>

        <div class="flex justify-end">
          <Button
            icon="pi pi-plus"
            label="Добавить"
            class="h-11 text-white border-none rounded-lg"
            :class="accent.button"
            @click="addRoute"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'

import ShablTab from './ShablTab.vue'
import LogisticScan from './LogisticScan.vue'
import { useFilterCoordsValues } from '@/components/Composables/filterCoordsValues'
import { useUniqueValues } from '@/components/Composables/uniqueValues'

const props = defineProps({
  routeType: String,
})

const store = useStore()
const user = ref(store.getters['AuthModule/getUser'])

/* те же :pt, что в создании заявки — выпадашка не вылезает за узкий экран */
const DROPDOWN_PT = {
  root: { class: 'w-full min-w-0' },
  panel: { class: 'max-w-[calc(100vw-2rem)]' },
  item: { class: 'whitespace-normal break-words leading-snug py-2' },
  label: { class: 'truncate' },
}

/* ------------------------------------------------------------------ *
 * Поля формы — без изменений
 * ------------------------------------------------------------------ */
const building = ref('')
const department = ref('')
const x_cord = ref('')
const y_cord = ref('')
const route_name = ref('')
const touched = ref(false)

const coords = computed(() => ({
  point_x: x_cord.value,
  point_y: y_cord.value,
  building_name: building.value,
  department: department.value,
}))

/* ------------------------------------------------------------------ *
 * Каскадные справочники — логика прежняя
 * ------------------------------------------------------------------ */
const filteredCoords = useFilterCoordsValues(
  ref(store.state.OrdersModule.logistics).value,
  coords
)

const building_filter_data = computed(() =>
  [...useUniqueValues(filteredCoords, 'building_name').value].sort((a, b) =>
    String(a).localeCompare(String(b))
  )
)
const department_filter_data = computed(() =>
  [...useUniqueValues(filteredCoords, 'department').value].sort((a, b) =>
    String(a).localeCompare(String(b))
  )
)
const x_filter_data = computed(() =>
  [...useUniqueValues(filteredCoords, 'point_x').value].sort((a, b) => a - b)
)
const y_filter_data = computed(() =>
  [...useUniqueValues(filteredCoords, 'point_y').value].sort((a, b) => a - b)
)

/* ------------------------------------------------------------------ *
 * Список точек — логика прежняя
 * ------------------------------------------------------------------ */
const pathArray = computed(() => {
  if (props.routeType === 'loading') {
    return store.getters['ShablModule/getfavoriteLoading']()
  } else if (props.routeType === 'my') {
    return store.getters['ShablModule/getfavoriteMy']()
  } else {
    return store.getters['ShablModule/getfavoriteUnloading']()
  }
})

/* ------------------------------------------------------------------ *
 * Добавление / удаление — логика прежняя
 * ------------------------------------------------------------------ */
const errors = computed(() => {
  const list = []
  if (!building.value) list.push('корпус')
  if (!department.value) list.push('цех')
  if (!x_cord.value) list.push('координату X')
  if (!y_cord.value) list.push('координату Y')
  if (!route_name.value) list.push('название точки')
  return list
})

const addRoute = async () => {
  touched.value = true
  if (errors.value.length) return

  const newRoute = {
    building: building.value,
    department: department.value,
    x_cord: x_cord.value,
    y_cord: y_cord.value,
    route_name: route_name.value,
    type: props.routeType,
    user_id: user.value.id,
  }

  const routeType = props.routeType

  try {
    await store.dispatch('ShablModule/addFavoriteRoute', { route: newRoute, type: routeType })
  } catch (error) {
    console.error('Error adding the route:', error)
  }

  building.value = null
  department.value = null
  x_cord.value = null
  y_cord.value = null
  route_name.value = null
  touched.value = false
}

const deleteRoute = async (routeId) => {
  const routeType = props.routeType
  try {
    await store.dispatch('ShablModule/deleteFavoriteRoute', { routeId, type: routeType })
  } catch (error) {
    console.error('Error deleting the route:', error)
  }
}

function handleUpdateData(data) {
  building.value = data.building
  department.value = data.cex
  x_cord.value = data.x
  y_cord.value = data.y
}

/* ------------------------------------------------------------------ *
 * Акцентный цвет — тот же, что был в dynamicClass
 * ------------------------------------------------------------------ */
const ACCENTS = {
  loading: {
    icon: 'text-green-600',
    title: 'text-green-700',
    button: 'bg-green-600 hover:bg-green-700',
  },
  my: {
    icon: 'text-amber-500',
    title: 'text-amber-700',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
  unloading: {
    icon: 'text-slate-500',
    title: 'text-slate-700',
    button: 'bg-slate-600 hover:bg-slate-700',
  },
}

const accent = computed(() => ACCENTS[props.routeType] ?? ACCENTS.unloading)
</script>

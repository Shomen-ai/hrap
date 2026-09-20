<template>
  <div ref="pickerRoot" class="w-full">
    <!-- скрытое поле валидации: заявка без машины не уйдёт диспетчеру -->
    <Field v-model="currentCar" name="transport" type="hidden" :rules="{ required: true }" />
    <ErrorMessage name="transport" class="block mb-3 text-xs text-red-600" />

    <!-- ================== РЕЖИМ ЧТЕНИЯ: сводка ================== -->
    <div v-if="disabled" class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div class="w-32 h-32 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
        <img
          :src="currentCar?.car_image || fallbackImage"
          alt="Транспорт"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
          {{ currentCar?.garaj_number || 'Не выбран' }}
          <span
            v-if="getCarStatus(currentCar)"
            class="px-2 py-0.5 rounded text-xs font-bold"
            :class="getStatusBadgeClass(getCarStatus(currentCar))"
          >
            {{ getCarStatus(currentCar) }}
          </span>
        </div>

        <div class="text-sm text-slate-600 mt-1 break-words">
          {{ currentCar?.transport_type?.type || 'Тип не указан' }}
        </div>

        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
          <span v-if="currentCar?.cargo_capacity">
            <i class="pi pi-box mr-1" />{{ Number(currentCar.cargo_capacity) }} т.
          </span>
          <span v-if="currentCar?.length">
            <i class="pi pi-arrows-alt mr-1" />{{ currentCar.length }}×{{ currentCar.width }}×{{ currentCar.height }} м
          </span>
          <span v-if="currentCar?.comments">{{ currentCar.comments }}</span>
        </div>
      </div>
    </div>

    <!-- ================== РЕЖИМ ВЫБОРА ================== -->
    <template v-else>
      <!-- ---------- панель управления ---------- -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-x-4 gap-y-3 mb-3">
        <!-- вкладки типа транспорта -->
        <div
          v-if="!h.lockedTab.value && h.tabs.value.length > 1"
          class="flex p-1 bg-slate-100 rounded-xl md:w-fit max-md:w-full"
        >
          <button
            v-for="tab in h.tabs.value"
            :key="tab.value"
            type="button"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                   max-md:w-full justify-center items-center"
            :class="
              h.activeTab.value === tab.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="h.activeTab.value = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- режим выбора для электротранспорта -->
        <div
          v-if="h.activeTab.value === 'electric'"
          class="flex p-1 bg-slate-100 justify-around rounded-xl md:w-fit max-md:w-full"
        >
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex
                   max-md:w-full justify-center items-center gap-2"
            :class="
              h.electricViewMode.value === 'type' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            "
            @click="h.electricViewMode.value = 'type'"
          >
            <i class="pi pi-th-large" /> По типу
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex
                   max-md:w-full justify-center items-center gap-2"
            :class="
              h.electricViewMode.value === 'number' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            "
            @click="h.electricViewMode.value = 'number'"
          >
            <i class="pi pi-hashtag" /> По номеру
          </button>
        </div>

        <!-- фильтр по типу -->
        <div v-if="showTypeFilter" class="flex items-center gap-2">
          <label class="text-sm font-medium text-slate-700 shrink-0">Фильтр:</label>
          <select
            v-model="h.selectedTypeFilter.value"
            class="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm min-w-0 flex-1"
          >
            <option value="">Все типы</option>
            <option v-for="type in h.availableTypes.value" :key="type.id" :value="type.id">
              {{ type.type }}
            </option>
          </select>
        </div>

        <!-- переключатель вида: Сетка / Карточки -->
        <div v-if="showNumberModes" class="flex p-1 bg-slate-100 rounded-xl md:w-fit max-md:w-full">
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex
                   max-md:w-full justify-center items-center gap-2"
            :class="h.viewMode.value === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'"
            @click="h.viewMode.value = 'grid'"
          >
            <i class="pi pi-th-large" /> Сетка
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex
                   max-md:w-full justify-center items-center gap-2"
            :class="h.viewMode.value === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'"
            @click="h.viewMode.value = 'cards'"
          >
            <i class="pi pi-list" /> Карточки
          </button>
        </div>
      </div>

      <!-- ---------- легенда для сетки ---------- -->
      <div
        v-if="h.viewMode.value === 'grid' && showNumberModes"
        class="mb-4 p-3 bg-slate-50 rounded-lg flex flex-wrap gap-2 text-xs font-bold"
      >
        <span v-for="item in STATUS_LEGEND" :key="item.label" class="px-2 py-1 rounded" :class="item.badge">
          {{ item.label }}
        </span>
      </div>

      <!-- ---------- скелетон ---------- -->
      <div v-if="h.isLoading.value" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="animate-pulse bg-slate-100 rounded-xl h-64" />
      </div>

      <!-- ---------- пусто ---------- -->
      <div
        v-else-if="!h.displayedCars.value.length && h.activeTab.value !== 'electric'"
        class="py-10 text-center"
      >
        <i class="pi pi-inbox text-3xl text-slate-300" />
        <p class="mt-3 text-slate-500">В данной категории нет транспорта</p>
      </div>

      <!-- ---------- ЭЛЕКТРОТРАНСПОРТ: ВЫБОР ПО ТИПУ ---------- -->
      <div
        v-else-if="h.activeTab.value === 'electric' && h.electricViewMode.value === 'type'"
        class="mb-2"
      >
        <p class="mb-3 text-sm text-slate-500">
          Выберите любую машину нужного вам типа — диспетчер сам утвердит ту, которая приедет.
        </p>

        <div class="flex flex-wrap -mx-2">
          <div
            v-for="t in h.uniqueElectricTypes.value"
            :key="t.id"
            class="w-1/2 md:w-1/3 lg:w-1/4 px-2 mb-4"
          >
            <div
              class="relative group h-full flex flex-col bg-white border-2 rounded-xl overflow-hidden
                     cursor-pointer transition-all"
              :class="
                h.isSelectedType(t.id)
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-blue-300'
              "
              @click="h.selectType(t)"
            >
              <div class="w-full aspect-[4/3] overflow-hidden flex items-center justify-center p-2 bg-sky-100">
                <img
                  :src="t.firstCar?.car_image || fallbackImage"
                  :alt="t.type"
                  class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  @error="handleImageError"
                />
              </div>

              <div class="p-4 flex-1 flex flex-col justify-between">
                <div class="font-bold text-slate-900 text-lg text-center mb-3 break-words">
                  {{ t.type }}
                  <span class="block text-xs font-normal text-slate-400 mt-1 tabular-nums">
                    {{ t.count }} маш.
                  </span>
                </div>

                <button
                  type="button"
                  class="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors
                         flex items-center justify-center gap-2"
                  :class="
                    h.isSelectedType(t.id)
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  "
                >
                  <i :class="h.isSelectedType(t.id) ? 'pi pi-check' : 'pi pi-car'" />
                  {{ h.isSelectedType(t.id) ? 'Выбрано' : 'Выбрать' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ---------- СЕТКА ГАРАЖНЫХ НОМЕРОВ ---------- -->
      <div v-else-if="h.viewMode.value === 'grid' && showNumberModes" class="mb-6">
        <div class="flex flex-wrap -mx-1">
          <div
            v-for="car in h.displayedCars.value"
            :key="car.id"
            class="w-1/2 sm:w-1/4 md:w-1/6 lg:w-[12.5%] px-1 mb-2"
          >
            <div
              class="relative h-16 flex items-center justify-center text-xs font-bold rounded-lg
                     border-2 transition-all px-1"
              :class="[
                isCarBlocked(car)
                  ? 'bg-gray-300 opacity-60 border-gray-400 cursor-not-allowed pointer-events-none'
                  : h.isSelected(car)
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                    : getCellClass(getCarStatus(car)) + ' cursor-pointer hover:shadow-md',
              ]"
              @click="h.handleCarSelect(car)"
              @mouseenter="(e) => h.showTooltip(car, e)"
              @mousemove="h.updateTooltipPosition"
              @mouseleave="h.hideTooltip"
            >
              <span class="truncate w-full text-center block">{{ car.garaj_number }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ---------- КАРТОЧКИ ---------- -->
      <div v-else-if="h.viewMode.value === 'cards' && showNumberModes" class="flex flex-wrap -mx-2 mb-2">
        <div
          v-for="car in h.displayedCars.value"
          :key="car.id"
          class="w-full sm:w-1/2 lg:w-1/3 px-2 mb-4"
        >
          <div
            class="relative group h-full flex flex-col bg-white border-2 rounded-xl overflow-hidden transition-all"
            :class="
              isCarBlocked(car)
                ? 'opacity-60 border-gray-300 pointer-events-none'
                : h.isSelected(car)
                  ? 'border-blue-500 ring-2 ring-blue-500/20 cursor-pointer'
                  : 'border-slate-200 hover:border-blue-300 cursor-pointer'
            "
            @click="h.handleCarSelect(car)"
          >
            <!-- блокировка для беспилотного -->
            <div
              v-if="isCarBlocked(car)"
              class="absolute inset-0 bg-slate-900/20 z-20 flex items-center justify-center"
            >
              <span class="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Недоступен
              </span>
            </div>

            <!-- бейдж выбора -->
            <div
              v-if="h.isSelected(car)"
              class="absolute top-3 right-3 z-10 bg-blue-500 text-white rounded-full p-1.5 shadow-md"
            >
              <i class="pi pi-check text-sm" />
            </div>

            <!-- бейджи статуса и режима работы -->
            <div class="absolute top-3 left-3 z-10 flex flex-col gap-1">
              <div
                v-if="getCarStatus(car) && !isCarBlocked(car)"
                class="px-2 py-1 rounded-md text-xs font-bold shadow-sm"
                :class="getStatusBadgeClass(getCarStatus(car))"
              >
                {{ getCarStatus(car) }}
              </div>
              <div
                v-if="getCarWorkMode(car)"
                class="px-2 py-1 rounded-md text-xs font-bold shadow-sm"
                :class="getWorkModeBadgeClass()"
              >
                {{ getCarWorkMode(car) }}
              </div>
            </div>

            <!-- изображение -->
            <div class="w-full aspect-[4/3] overflow-hidden flex items-center justify-center p-2 bg-slate-100">
              <img
                :src="car.car_image || fallbackImage"
                :alt="car.garaj_number"
                class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                @error="handleImageError"
              />
            </div>

            <!-- контент -->
            <div class="p-4 flex-1 flex flex-col min-w-0">
              <h4 class="font-bold text-slate-900 text-lg mb-1 break-words">
                {{ car.garaj_number }}
              </h4>
              <p class="text-sm text-slate-500 mb-3 break-words">
                {{ car.transport_type?.type || 'Тип не указан' }}
              </p>

              <div class="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3 px-2">
                <div v-if="car.cargo_capacity" class="flex items-center min-w-0 gap-1.5">
                  <i class="pi pi-box text-slate-400 flex-shrink-0" />
                  <span class="break-words">до {{ Number(car.cargo_capacity) }} т.</span>
                </div>
                <div v-if="car.length" class="flex items-center gap-1.5 min-w-0">
                  <i class="pi pi-arrows-alt text-slate-400 flex-shrink-0" />
                  <span class="break-words">{{ car.length }}×{{ car.width }}×{{ car.height }} м</span>
                </div>
              </div>

              <!-- доп. информация -->
              <div v-if="car.comments || car.model || car.year || car.color" class="mb-3">
                <button
                  type="button"
                  class="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mb-2"
                  @click.stop="h.toggleDetails(car.id)"
                >
                  <i :class="h.expandedCardId.value === car.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
                  Подробнее
                </button>

                <div
                  v-if="h.expandedCardId.value === car.id"
                  class="text-xs text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg"
                >
                  <div v-if="car.model" class="break-words">
                    <span class="font-semibold">Модель:</span> {{ car.model }}
                  </div>
                  <div v-if="car.year" class="break-words">
                    <span class="font-semibold">Год:</span> {{ car.year }}
                  </div>
                  <div v-if="car.color" class="break-words">
                    <span class="font-semibold">Цвет:</span> {{ car.color }}
                  </div>
                  <div v-if="car.capacity" class="break-words">
                    <span class="font-semibold">Вместимость:</span> {{ car.capacity }} чел.
                  </div>
                  <div
                    v-if="car.comments"
                    class="pt-1 border-t border-slate-200 mt-1 break-all text-sm"
                  >
                    <span class="font-semibold">Комментарий:</span> {{ car.comments }}
                  </div>
                </div>
              </div>

              <!-- кнопка действия -->
              <button
                type="button"
                class="mt-auto w-full py-2.5 rounded-lg font-semibold text-sm transition-colors
                       flex items-center justify-center gap-2"
                :disabled="isCarBlocked(car)"
                :class="
                  isCarBlocked(car)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : h.isSelected(car)
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                "
              >
                <i :class="h.isSelected(car) ? 'pi pi-check' : 'pi pi-car'" />
                {{ isCarBlocked(car) ? 'Недоступен' : h.isSelected(car) ? 'Выбрано' : 'Выбрать' }}
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- ---------- пагинация ---------- -->
      <Paginator
        v-if="showNumberModes && h.totalCars.value > 0"
        :first="h.first.value"
        :rows="h.rows.value"
        :total-records="h.totalCars.value"
        :rows-per-page-options="h.rowsOptions.value"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        current-page-report-template="{first}–{last} из {totalRecords}"
        class="car-paginator"
        @page="onPage"
      />
    </template>

    <!-- ================== ГЛОБАЛЬНЫЙ ТУЛТИП СЕТКИ ================== -->
    <Teleport to="body">
      <div
        v-if="h.isTooltipVisible.value && h.tooltipData.value"
        class="fixed z-[9999] w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-2xl pointer-events-none"
        :style="{ left: `${h.tooltipX.value}px`, top: `${h.tooltipY.value}px` }"
      >
        <div class="font-bold text-sm mb-1 border-b border-slate-600 pb-1">
          {{ h.tooltipData.value.garaj_number }}
        </div>
        <div class="mb-1 break-words">
          {{ h.tooltipData.value.transport_type?.type || 'Тип не указан' }}
        </div>
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="getStatusDotClass(getCarStatus(h.tooltipData.value))"
          />
          {{ getCarStatus(h.tooltipData.value) || 'Неизвестно' }}
        </div>
        <div v-if="h.tooltipData.value.cargo_capacity" class="mt-1 text-slate-400">
          <i class="pi pi-box mr-1" />{{ Number(h.tooltipData.value.cargo_capacity) }} т.
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import Paginator from 'primevue/paginator'
import { Field, ErrorMessage } from 'vee-validate'

import fallbackImage from '@/assets/not_car.jpg'
import {
  useCarPicker,
  STATUS_LEGEND,
  getCarStatus,
  getStatusBadgeClass,
  getStatusDotClass,
  getCellClass,
  getCarWorkMode,
  getWorkModeBadgeClass,
  isCarBlocked,
} from './useCarPicker'

const props = defineProps({
  items: { type: Array, default: null },
  selectedCarId: { type: [Number, String], default: null },
  disabled: { type: Boolean, default: false },
  // 'electric' — запереть выбор на электротранспорте (как было в CarT)
  vid_transporta: { type: String, default: '' },
  modalka: { type: Boolean, default: false },
})

// v-model="rowData.car" со стороны модалки
const currentCar = defineModel({ type: Object, default: null })

const h = useCarPicker(props, currentCar)

// «по номеру» — это сетка и карточки; для грузовых режим всегда такой
const showNumberModes = computed(
  () => h.activeTab.value === 'cargo' || h.electricViewMode.value === 'number'
)

const showTypeFilter = computed(
  () => showNumberModes.value && h.availableTypes.value.length > 1
)

const pickerRoot = ref(null)

// после смены страницы возвращаем пользователя к началу списка,
// иначе он остаётся внизу, где нажал пагинатор
function onPage(event) {
  h.onPage(event)
  nextTick(() => {
    pickerRoot.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  })
}

function handleImageError(event) {
  event.target.src = fallbackImage
}

defineExpose({ repeatCar: h.repeatCar })
</script>

<style scoped>
/* пагинатор внутри карточки секции: без своей рамки и фона */
:deep(.car-paginator.p-paginator) {
  background: transparent;
  border: 0;
  padding: 0.5rem 0 0;
  flex-wrap: wrap;
}
</style>

import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

/* ================================================================== *
 * СТАТУСЫ И ТИПЫ МАШИН
 * Цвета взяты из легенды SectionTransport.
 * ================================================================== */

const PALETTE = {
  'Свободен': {
    cell: 'bg-green-500 text-black border-green-600',
    badge: 'bg-green-500 text-black',
    dot: 'bg-green-500',
  },
  'Занят': {
    cell: 'bg-red-500 text-white border-red-600',
    badge: 'bg-red-500 text-white',
    dot: 'bg-red-500',
  },
  'Закреплена': {
    cell: 'bg-yellow-500 text-black border-yellow-600',
    badge: 'bg-yellow-500 text-black',
    dot: 'bg-yellow-500',
  },
  'Кольцевание': {
    cell: 'bg-teal-500 text-black border-teal-600',
    badge: 'bg-teal-500 text-black',
    dot: 'bg-teal-500',
  },
  'На обслуживании': {
    cell: 'bg-orange-500 text-black border-orange-600',
    badge: 'bg-orange-500 text-black',
    dot: 'bg-orange-500',
  },
}

const UNKNOWN = {
  cell: 'bg-slate-400 text-white border-slate-500',
  badge: 'bg-slate-400 text-white',
  dot: 'bg-slate-400',
}

/** Порядок и подписи для легенды под панелью фильтров. */
export const STATUS_LEGEND = [
  { label: 'Свободен', badge: PALETTE['Свободен'].badge },
  { label: 'Занят', badge: PALETTE['Занят'].badge },
  { label: 'Закреплена', badge: PALETTE['Закреплена'].badge },
  { label: 'Кольцевание', badge: PALETTE['Кольцевание'].badge },
  { label: 'На обслуживании', badge: PALETTE['На обслуживании'].badge },
  { label: 'Неизвестно', badge: UNKNOWN.badge },
  { label: 'Выбрано', badge: 'bg-blue-600 text-white ring-2 ring-blue-300' },
  { label: 'Недоступен', badge: 'bg-gray-400 text-white opacity-70' },
]

export const getCarStatus = (car) => car?.state?.state ?? ''

export const getStatusBadgeClass = (status) => (PALETTE[status] ?? UNKNOWN).badge
export const getCellClass = (status) => (PALETTE[status] ?? UNKNOWN).cell
export const getStatusDotClass = (status) => (PALETTE[status] ?? UNKNOWN).dot

// TODO: проверь поле — в CarT режима работы не было, беру вероятные варианты
export const getCarWorkMode = (car) =>
  car?.work_mode?.mode ?? car?.work_mode?.name ?? car?.work_mode ?? ''

export const getWorkModeBadgeClass = () => 'bg-slate-700 text-white'

// в CarT кнопка гасилась через `item?.car_type_id == 21` — беспилотный транспорт
export const BLOCKED_CAR_TYPE_ID = 21

export const isCarBlocked = (car) => Number(car?.car_type_id) === BLOCKED_CAR_TYPE_ID

// в CarT: car_type_id == 4 → грузовой, из него же считался order_type_id
export const CARGO_TYPE_ID = 4
export const CARGO_TYPE_LABEL = 'Грузовой транспорт'

export const isCargoType = (type) =>
  Number(type?.id) === CARGO_TYPE_ID || type?.type === CARGO_TYPE_LABEL

export const isCargoCar = (car) => Number(car?.car_type_id) === CARGO_TYPE_ID

/* ================================================================== *
 * КОМПОЗАБЛ
 * ================================================================== */

const asArray = (v) => (Array.isArray(v) ? v : Object.values(v ?? {}))

/**
 * Логика выбора машины. Забрана из CarT.vue, разметка — в ModalCarSection.vue.
 *
 * @param {object} props  items, selectedCarId, disabled, vid_transporta, modalka
 * @param {import('vue').Ref} currentCar  модель выбранной машины (defineModel)
 */
export function useCarPicker(props, currentCar) {
  const store = useStore()

  /* ---------- вкладки и режимы ---------- */

  const activeTab = ref('cargo')          // 'cargo' | 'electric'
  const electricViewMode = ref('type')    // 'type'  | 'number'
  const viewMode = ref('cards')           // 'cards' | 'grid' — по умолчанию карточки

  // ЛОКАЛЬНЫЙ фильтр по типу. В CarT он жил в store.OrdersModule.selectFilter,
  // который модалка параллельно переписывала своим watch — они дрались.
  const selectedTypeFilter = ref('')

  const expandedCardId = ref(null)

  const allTypes = computed(() => asArray(store.state.CarsModule?.carsSelect?.types))

  const tabs = computed(() => {
    const list = []
    if (asArray(props.items).some(isCargoCar)) {
      list.push({ value: 'cargo', label: 'Грузовой' })
    }
    if (asArray(props.items).some((c) => !isCargoCar(c))) {
      list.push({ value: 'electric', label: 'Электротранспорт' })
    }
    return list
  })

  // vid_transporta === 'electric' в CarT убирал грузовые из списка типов
  const lockedTab = computed(() => (props.vid_transporta === 'electric' ? 'electric' : null))

  /* ---------- списки ---------- */

  const isLoading = computed(() => !props.items)

  // машины текущей вкладки
  const tabCars = computed(() => {
    const list = asArray(props.items)
    return activeTab.value === 'cargo'
      ? list.filter(isCargoCar)
      : list.filter((c) => !isCargoCar(c))
  })

  // id типа: car_type_id — основное поле, остальные на случай другой формы ответа
  const carTypeId = (car) =>
    Number(car?.car_type_id ?? car?.transport_type_id ?? car?.transport_type?.id)

  // Типы строим ПО САМИМ МАШИНАМ, а не по справочнику CarsModule: в модалке он
  // может быть ещё не загружен (её onMounted грузит только OrdersModule/fetchCars),
  // и пересечение с ним давало пустой фильтр. Справочник нужен лишь ради названия.
  const availableTypes = computed(() => {
    const dict = new Map(allTypes.value.map((t) => [Number(t.id), t.type]))
    const found = new Map()

    for (const car of tabCars.value) {
      const id = carTypeId(car)
      if (!Number.isFinite(id) || found.has(id)) continue
      found.set(id, dict.get(id) ?? car?.transport_type?.type ?? `Тип ${id}`)
    }

    return [...found.entries()]
      .map(([id, type]) => ({ id, type }))
      .sort((a, b) => String(a.type).localeCompare(String(b.type), 'ru'))
  })

  const filteredCars = computed(() => {
    if (!selectedTypeFilter.value) return tabCars.value
    return tabCars.value.filter((c) => carTypeId(c) === Number(selectedTypeFilter.value))
  })

  /* ---------- пагинация ---------- *
   * В CarT это был paginator у DataView с rows: 16. Здесь — PrimeVue Paginator.
   * Ячейки сетки мелкие, их на страницу влезает много; карточки тяжёлые, им меньше.
   */

  const PAGE = { grid: 64, cards: 12 }
  const PAGE_OPTIONS = { grid: [32, 64, 128], cards: [6, 12, 24] }

  const first = ref(0)
  const rows = ref(PAGE.cards)

  const rowsOptions = computed(() => PAGE_OPTIONS[viewMode.value] ?? PAGE_OPTIONS.cards)

  const totalCars = computed(() => filteredCars.value.length)

  const displayedCars = computed(() =>
    filteredCars.value.slice(first.value, first.value + rows.value)
  )

  function onPage(event) {
    first.value = event.first
    rows.value = event.rows
  }

  // смена вида меняет размер страницы и возвращает на первую
  watch(viewMode, (mode) => {
    rows.value = PAGE[mode] ?? PAGE.cards
    first.value = 0
  })

  // смена вкладки или фильтра — тоже на первую страницу
  watch([activeTab, selectedTypeFilter], () => {
    first.value = 0
  })

  // для режима «электротранспорт → по типу»: карточка на тип с картинкой первой машины
  const uniqueElectricTypes = computed(() =>
    availableTypes.value
      .filter((t) => !isCargoType(t))
      .map((t) => {
        const cars = tabCars.value.filter((c) => carTypeId(c) === Number(t.id))
        return {
          ...t,
          firstCar: cars.find((c) => c.car_image) ?? cars[0] ?? {},
          count: cars.length,
          // беспилотный тип целиком либо все машины типа заблокированы
          blocked: Number(t.id) === BLOCKED_CAR_TYPE_ID || cars.every(isCarBlocked),
        }
      })
  )

  /* ---------- выбор машины ---------- */

  const isSelected = (car) => Number(currentCar.value?.id) === Number(car?.id)

  const isSelectedType = (typeId) =>
    Number(currentCar.value?.car_type_id) === Number(typeId)

  // Запись напрямую в state — так было в CarT. Держим в одном месте, чтобы
  // при переходе на мутации менять только здесь.
  function syncStore(car) {
    store.state.OrdersModule.transport = car ?? null
    if (car) {
      store.state.OrdersModule.order_type_id = isCargoCar(car) ? 2 : 1
    }
  }

  function handleCarSelect(car) {
    if (props.disabled || isCarBlocked(car)) return

    if (isSelected(car)) {
      currentCar.value = null
      syncStore(null)
    } else {
      currentCar.value = car
      syncStore(car)
    }
  }

  // «Выберите любую машину нужного вам типа, диспетчер сам утвердит машину» —
  // выбор типа берёт первую свободную машину этого типа.
  function selectType(type) {
    if (props.disabled || type?.blocked) return

    const pool = tabCars.value.filter(
      (c) => carTypeId(c) === Number(type.id) && !isCarBlocked(c)
    )
    if (!pool.length) return

    const free = pool.find((c) => getCarStatus(c) === 'Свободен') ?? pool[0]
    currentCar.value = free
    syncStore(free)
  }

  // модалка зовёт этот метод через ref, когда возвращает сброшенную машину
  function repeatCar(car) {
    if (!car) return
    currentCar.value = car
    syncStore(car)
    focusOnCar(car)
  }

  /* ---------- детали карточки ---------- */

  function toggleDetails(id) {
    expandedCardId.value = expandedCardId.value === id ? null : id
  }

  /* ---------- тултип сетки (мышь; на тач-терминалах — карточки) ---------- */

  const isTooltipVisible = ref(false)
  const tooltipData = ref(null)
  const tooltipX = ref(0)
  const tooltipY = ref(0)

  function positionTooltip(event) {
    const pad = 16
    const w = 256 // w-64
    const h = 150
    tooltipX.value = Math.min(event.clientX + pad, window.innerWidth - w - pad)
    tooltipY.value = Math.min(event.clientY + pad, window.innerHeight - h - pad)
  }

  function showTooltip(car, event) {
    tooltipData.value = car
    isTooltipVisible.value = true
    positionTooltip(event)
  }

  const updateTooltipPosition = (event) => {
    if (isTooltipVisible.value) positionTooltip(event)
  }

  function hideTooltip() {
    isTooltipVisible.value = false
    tooltipData.value = null
  }

  /* ---------- подстройка под уже выбранную машину ---------- */

  // Фильтр по типу при открытии не подставляется — модалка встаёт на «Все типы».
  // Машина заявки и так первая в items (см. useOrderModal), то есть на первой странице.
  function focusOnCar(car, { filterByType = false } = {}) {
    if (!car) return
    activeTab.value = lockedTab.value ?? (isCargoCar(car) ? 'cargo' : 'electric')
    if (activeTab.value === 'electric') electricViewMode.value = 'number'
    selectedTypeFilter.value = filterByType ? car.car_type_id ?? '' : ''
  }

  // при открытии модалки встаём на вкладку и тип машины из заявки
  watch(
    () => props.selectedCarId,
    (id) => {
      if (!id) return
      const car =
        asArray(props.items).find((c) => Number(c.id) === Number(id)) ?? currentCar.value
      focusOnCar(car)
    },
    { immediate: true }
  )

  watch(
    lockedTab,
    (tab) => {
      if (tab) activeTab.value = tab
    },
    { immediate: true }
  )

  // вкладка сменилась — сбрасываем фильтр типа, он относился к прошлой вкладке
  watch(activeTab, () => {
    selectedTypeFilter.value = ''
    expandedCardId.value = null
  })

  return {
    // вкладки и режимы
    activeTab,
    electricViewMode,
    viewMode,
    selectedTypeFilter,
    tabs,
    lockedTab,
    // данные
    isLoading,
    availableTypes,
    filteredCars,
    displayedCars,
    uniqueElectricTypes,
    // пагинация
    first,
    rows,
    rowsOptions,
    totalCars,
    onPage,
    // выбор
    isSelected,
    isSelectedType,
    handleCarSelect,
    selectType,
    repeatCar,
    // детали
    expandedCardId,
    toggleDetails,
    // тултип
    isTooltipVisible,
    tooltipData,
    tooltipX,
    tooltipY,
    showTooltip,
    updateTooltipPosition,
    hideTooltip,
  }
}

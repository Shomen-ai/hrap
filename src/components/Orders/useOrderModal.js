import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { defineRule, useForm } from 'vee-validate'
import {
  required,
  between,
  confirmed,
  digits,
  min_value,
  max_value,
  min,
  max,
  length,
} from '@vee-validate/rules'
import { useUniqueValues } from '@/components/Composables/uniqueValues'
import { formatDate, formatDateDetailed } from '@/components/Composables/formatDate'
import { getStatusLabel, statusClass } from './orderStatus'

const pointsWord = (n) => {
  const d10 = n % 10
  const d100 = n % 100
  if (d10 === 1 && d100 !== 11) return 'точка'
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return 'точки'
  return 'точек'
}

/* ------------------------------------------------------------------ *
 * Правила валидации регистрируются один раз на модуль.
 * Раньше defineRule() вызывался в setup() — то есть на каждое
 * создание модалки заново.
 * ------------------------------------------------------------------ */
defineRule('required', required)
defineRule('between', between)
defineRule('confirmed', confirmed)
defineRule('digits', digits)
defineRule('min', min)
defineRule('max', max)
defineRule('min_value', min_value)
defineRule('max_value', max_value)
defineRule('length', length)

defineRule('date_format', (value) => {
  if (!value || String(value).trim().length === 0) return true
  const regex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[012])\.(19|20)\d\d$/
  return regex.test(value) ? true : 'Формат даты должен быть DD.MM.YYYY'
})

const SECRET_DRIVER = 'ДАННАЯ ИНФОРМАЦИЯ БЫЛА СКРЫТА ДЛЯ ЗАКАЗЧИКА'

/**
 * Логика модалки заявки. Разметка живёт в OrderModal.vue,
 * здесь — только данные, справочники и обработчики.
 *
 * @param {object} props — visible, rowData, columns, disabled, state_order
 * @param {function} emit
 */
export function useOrderModal(props, emit) {
  const store = useStore()

  /* ------------------------------------------------------------------ *
   * useForm() отдаёт FormContext всему дереву компонента, не рисуя
   * при этом <form>. В исходнике <Field>/<ErrorMessage> висели без
   * формы вообще — то есть ошибки валидации не показывались никогда.
   * Теперь validate() можно дёрнуть из кнопок родителя (см. defineExpose).
   * ------------------------------------------------------------------ */
  const { validate, errors, resetForm } = useForm()

  /* ---------- состояние ---------- */

  const position = ref('center')
  const secretDriver = ref(SECRET_DRIVER)
  const driverRestriction = ref({ required: true })

  const driverSelected = ref(props.rowData?.driver ?? null)
  const state = ref(null)

  const letCar = ref(null)
  const letCarId = ref(null)
  const carTComponent = ref(null)

  /* ---------- роли ---------- */

  const isDispatcherOrAdmin = computed(() => {
    const roles = store.state.AuthModule.user?.roles
    if (!Array.isArray(roles)) return false
    return roles.some((role) => role.name === 'Админ' || role.name === 'Диспетчер')
  })

  /* ---------- справочники ---------- */

  const all_podr = computed(() => store.state.OrdersModule.podrsSelect)
  const all_drivers = ref(store.state.OrdersModule.driversSelect)
  const states = useUniqueValues(all_drivers, 'state.state')

  const podrLoading = computed(() => store.state.OrdersModule.podrLoading)
  const driversLoading = computed(() => store.state.OrdersModule.driversLoading)
  const driverStates = computed(() => store.state.OrdersModule.driver_states)

  const sortedDrivers = computed(() => {
    const all = store.state.OrdersModule.driversSelect ?? []
    if (!state.value) return all
    return all.filter((value) => value.state?.state === state.value)
  })

  // Машина заявки — первой в списке. В исходнике это делал sort() с компаратором
  // от одного аргумента: он возвращал 1 почти для всех пар и заодно перемешивал
  // остальные машины при каждом пересчёте. Здесь просто переставляем нужную в начало.
  const items = computed(() => {
    const list = [...(store.getters['OrdersModule/getCars'] ?? [])]
    const id = props.rowData?.car?.id
    if (!id) return list

    const index = list.findIndex((c) => Number(c.id) === Number(id))
    if (index > 0) list.unshift(...list.splice(index, 1))
    return list
  })

  const orders = computed(() => store.getters['AlbertOrdersStore/getOrders'])

  /* ---------- разбор данных заявки ---------- */

  const points = computed(() =>
    Array.isArray(props.rowData?.loading_and_delivery_points)
      ? props.rowData.loading_and_delivery_points
      : []
  )

  const hasPoints = computed(() => points.value.length > 0)

  const waybill = computed(
    () => points.value.find((e) => e.waybill)?.waybill ?? null
  )

  // краткая сводка справа в шапке карточки
  const routeHint = computed(() => {
    if (!hasPoints.value) return 'не указан'
    const n = points.value.length
    return `${n} ${pointsWord(n)}`
  })

  const transportHint = computed(() => {
    const type = props.rowData?.car?.transport_type?.type
    const garaj = props.rowData?.car?.garaj_number
    return [type, garaj].filter(Boolean).join(' · ') || 'не назначен'
  })

  const executionHint = computed(() => props.rowData?.driver?.fio ?? 'водитель не назначен')

  const customerHint = computed(() =>
    [props.rowData?.fio, props.rowData?.podr].filter(Boolean).join(' · ')
  )

  const hasDispatcherComments = computed(() =>
    Boolean(String(props.rowData?.dispatcher_comments ?? '').trim())
  )

  /* ---------- форматирование для режима чтения ---------- */

  function safeFormatDate(value) {
    try {
      return value ? formatDate(value) : ''
    } catch {
      return ''
    }
  }

  function safeFormatDateDetailed(value) {
    try {
      return value ? formatDateDetailed(value) : ''
    } catch {
      return ''
    }
  }

  // "Местоположение:141 ПРОСК" -> "141 ПРОСК"
  const placeName = (p) => String(p?.comments ?? '').replace(/^Местоположение:\s*/i, '').trim()

  function pointPlace(p) {
    const parts = []
    if (p?.building) parts.push(`Корпус ${p.building}`)
    const place = placeName(p)
    if (place) parts.push(place)
    else if (p?.department) parts.push(`Цех ${p.department}`)
    return parts.join(' · ') || 'место не указано'
  }

  function pointCoords(p) {
    if (!p?.x_cord && !p?.y_cord) return ''
    return `X-${p.x_cord ?? '—'} · Y-${p.y_cord ?? '—'}`
  }

  function pointDate(p) {
    if (!Array.isArray(p?.date) || !p.date.length) return ''
    const from = safeFormatDate(p.date[0])
    const to = p.date[1] ? safeFormatDate(p.date[1]) : ''
    if (!from) return ''
    return to && to !== from ? `${from} — ${to}` : from
  }

  // "Когда нужна машина" — берём дату первой погрузки
  const orderDateText = computed(() => {
    const first = points.value[0]
    if (!Array.isArray(first?.date) || !first.date.length) return ''

    const dates = first.date.map(safeFormatDateDetailed).filter(Boolean)
    if (!dates.length) return ''

    const single =
      !dates[1] || dates[0] === dates[1] || dates.some((d) => d.includes('01.01.1970'))

    return single ? `На ${dates[0]}` : `С ${dates[0]} по ${dates[1]}`
  })

  // comments заявки приходит как "Ключ: значение\nКлюч: значение"
  const cargo = computed(() => {
    const raw = props.rowData?.comments
    if (!raw) return []
    return String(raw)
      .split('\n')
      .map((line) => {
        const idx = line.indexOf(':')
        if (idx === -1) return { label: '', value: line.trim() }
        return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
      })
      .filter((r) => r.value)
  })

  const phonesText = computed(() =>
    [props.rowData?.stat_number, props.rowData?.mob_number].filter(Boolean).join(' · ')
  )

  /* ---------- обработчики ---------- */

  function closeModal(t) {
    if (t === false) emit('closeModal')
  }

  function onStateSelect() {
    driverSelected.value = null
    props.rowData.driver = null
  }

  function onDriverSelect(val) {
    // Dropdown с editable отдаёт строку, пока пользователь набирает вручную —
    // до выбора из списка ничего не записываем.
    if (!val || typeof val !== 'object') return
    props.rowData.driver_id = val.id
    props.rowData.driver = val
    state.value = val.state?.state
  }

  function podsvetkaCar(car) {
    carTComponent.value?.repeatCar(car)
  }

  function handleAddPointInRoute(routeData) {
    if (!Array.isArray(props.rowData?.loading_and_delivery_points)) {
      props.rowData.loading_and_delivery_points = []
    }
    props.rowData.loading_and_delivery_points.push(routeData)
  }

  function handleDeletePoint(index) {
    props.rowData.loading_and_delivery_points.splice(index, 1)

    // редактировали удалённую точку — выходим из режима правки;
    // удалили точку выше — индекс редактируемой сдвинулся
    if (editingIndex.value === index) editingIndex.value = null
    else if (editingIndex.value !== null && index < editingIndex.value) editingIndex.value -= 1
  }

  /* ---------- редактирование точки ---------- */

  const editingIndex = ref(null)

  const editingPoint = computed(() =>
    editingIndex.value === null ? null : points.value[editingIndex.value] ?? null
  )

  function startEditPoint(index) {
    editingIndex.value = index
  }

  function cancelEditPoint() {
    editingIndex.value = null
  }

  function handleUpdatePointInRoute({ index, point }) {
    if (!Array.isArray(props.rowData?.loading_and_delivery_points)) return
    props.rowData.loading_and_delivery_points.splice(index, 1, point)
    editingIndex.value = null
  }

  // ВНИМАНИЕ: в исходнике RouteTab имел @delete="deleteRoute",
  // но самой функции deleteRoute в компоненте не было (IDE подчёркивала это).
  // Здесь она удаляет точку по индексу — проверь, что RouteTab шлёт именно индекс.
  function deleteRoute(index) {
    if (typeof index !== 'number') return
    handleDeletePoint(index)
  }

  // TODO: тела onSubmit на скринах не было — перенеси сюда своё.
  function onSubmit(values) {
    emit('submit', values)
  }

  /* ---------- синхронизация ---------- */

  // при открытии модалки восстанавливаем выбранного водителя и его статус
  watch(
    () => props.visible,
    () => {
      const dr = Object.values(store.state.OrdersModule.driversSelect ?? {}).find(
        (v) => v.id == props.rowData?.driver?.id
      )
      driverSelected.value = dr ?? null
      state.value = dr?.state?.state ?? null
    }
  )

  // если машину сбросили — возвращаем предыдущую и просим пикер её подсветить
  watch(
    () => props.rowData?.car,
    (n) => {
      if (!n?.id) {
        props.rowData.car = letCar.value
        props.rowData.car_id = letCarId.value
        carTComponent.value?.repeatCar(props.rowData.car)
      } else {
        props.rowData.car_id = n.id
        letCar.value = n
        letCarId.value = n.id
      }
    }
  )

  // Раньше здесь был watch, переписывавший store.OrdersModule.selectFilter под тип
  // машины заявки (в оригинале — onUpdated на каждый рендер). ModalCarSection
  // держит фильтр типа у себя и сам встаёт на тип текущей машины, так что
  // этот watch убран: два места писали в один selectFilter и перебивали друг друга.

  /* ---------- загрузка ---------- */

  const loadPodrs = () => store.dispatch('OrdersModule/loadPodrs')
  const loadDrivers = () => store.dispatch('OrdersModule/loadDrivers')

  onMounted(async () => {
    loadPodrs()
    loadDrivers()
    await store.dispatch('OrdersModule/fetchCars')
    store.commit('OrdersModule/setCars', store.getters['OrdersModule/getCars'])
  })

  return {
    // валидация
    validate,
    errors,
    resetForm,
    // состояние
    position,
    secretDriver,
    driverRestriction,
    driverSelected,
    state,
    carTComponent,
    // роли и справочники
    isDispatcherOrAdmin,
    all_podr,
    all_drivers,
    states,
    driverStates,
    sortedDrivers,
    items,
    orders,
    podrLoading,
    driversLoading,
    // данные заявки
    points,
    hasPoints,
    waybill,
    routeHint,
    transportHint,
    executionHint,
    customerHint,
    hasDispatcherComments,
    // форматирование
    safeFormatDate,
    pointPlace,
    pointCoords,
    pointDate,
    orderDateText,
    cargo,
    phonesText,
    // действия
    closeModal,
    onStateSelect,
    onDriverSelect,
    podsvetkaCar,
    handleAddPointInRoute,
    handleDeletePoint,
    deleteRoute,
    // редактирование точки
    editingIndex,
    editingPoint,
    startEditPoint,
    cancelEditPoint,
    handleUpdatePointInRoute,
    onSubmit,
    // хелперы
    getStatusLabel,
    statusClass,
  }
}

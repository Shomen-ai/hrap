import { ref, computed, watch } from 'vue'
import * as XLSX from 'xlsx-js-style'
import { formatDate, formatDateDetailed } from '@/components/Composables/formatDate'
import { getStatusLabel, statusClass } from './orderStatus'

const pointsWord = (n) => {
  const d10 = n % 10
  const d100 = n % 100
  if (d10 === 1 && d100 !== 11) return 'точка'
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return 'точки'
  return 'точек'
}

/**
 * Логика списка заявок: поиск, фильтр по статусу, пагинация, раскрытие, экспорт.
 * Разметка живёт в компонентах, здесь только данные.
 */
export function useOrdersList(props) {
  /* ---------- состояние ---------- */

  const search = ref('')
  const activeStatus = ref(null)
  const openIds = ref(new Set())

  /* ---------- плитки-счётчики ---------- */

  const statusTiles = computed(() => {
    const all = props.customers ?? []
    const countBy = (id) => all.filter((o) => o.state?.id === id).length

    return [
      { id: null, label: 'Все заявки', count: all.length, icon: 'pi-list', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
      { id: 1, label: 'Необработанные', count: countBy(1), icon: 'pi-clock', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
      { id: 2, label: 'На доработке', count: countBy(2), icon: 'pi-pencil', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
      { id: 3, label: 'Переданные', count: countBy(3), icon: 'pi-send', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
      { id: 4, label: 'В процессе', count: countBy(4), icon: 'pi-truck', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
      { id: 5, label: 'Завершённые', count: countBy(5), icon: 'pi-check-circle', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    ]
  })

  function setStatus(id) {
    activeStatus.value = activeStatus.value === id ? null : id
  }

  /* ---------- фильтрация ---------- */

  const hasActiveFilters = computed(
    () => Boolean(search.value.trim()) || activeStatus.value !== null
  )

  const filteredCustomers = computed(() => {
    let result = props.customers ?? []

    if (activeStatus.value !== null) {
      result = result.filter((o) => o.state?.id === activeStatus.value)
    }

    const q = search.value.trim().toLowerCase()
    if (q) {
      result = result.filter((o) =>
        [
          o.id, o.fio, o.podr,
          o.car?.garaj_number, o.car?.transport_type?.type,
          o.driver?.fio, o.stat_number, o.mob_number, o.comments, o.state?.state,
          ...points(o).map((p) => p.comments),
        ]
          .map((v) => String(v ?? '').toLowerCase())
          .some((v) => v.includes(q))
      )
    }

    return result
  })

  /* ---------- пагинация ---------- *
   * Раньше было «Показать ещё» с visibleLimit. Теперь PrimeVue Paginator:
   * first — индекс первой записи страницы, rows — размер страницы.
   */

  const ROWS_OPTIONS = [10, 15, 30, 50]

  const first = ref(0)
  const rows = ref(15)

  const totalCustomers = computed(() => filteredCustomers.value.length)

  const displayedCustomers = computed(() =>
    filteredCustomers.value.slice(first.value, first.value + rows.value)
  )

  function onPage(event) {
    first.value = event.first
    rows.value = event.rows
  }

  // На первую страницу возвращаемся, когда пользователь МЕНЯЕТ ФИЛЬТР,
  // а не когда обновились данные: раньше watch висел на filteredCustomers и
  // схлопывал подгруженное при каждом обновлении props.customers.
  watch([search, activeStatus], () => {
    first.value = 0
  })

  function clearFilter() {
    search.value = ''
    activeStatus.value = null
  }

  /* ---------- раскрытие ---------- */

  const isOpen = (id) => openIds.value.has(id)

  function toggle(id) {
    const next = new Set(openIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    openIds.value = next
  }

  function collapseAll() {
    openIds.value = new Set()
  }

  /* ---------- разбор данных заявки ---------- */

  function shortFio(fio) {
    if (!fio) return '—'
    const [f, i, o] = String(fio).trim().split(/\s+/)
    return [f, i && `${i[0]}.`, o && `${o[0]}.`].filter(Boolean).join(' ')
  }

  function points(order) {
    return Array.isArray(order?.loading_and_delivery_points)
      ? order.loading_and_delivery_points
      : []
  }

  // "Местоположение:141 ПРОСК" -> "141 ПРОСК"
  function placeName(p) {
    return String(p?.comments ?? '').replace(/^Местоположение:\s*/i, '').trim()
  }

  function pointPlace(p) {
    const parts = []
    if (p.building) parts.push(`Корпус ${p.building}`)
    const place = placeName(p)
    if (place) parts.push(place)
    else if (p.department) parts.push(`Цех ${p.department}`)
    return parts.join(' · ') || 'место не указано'
  }

  function pointCoords(p) {
    if (!p.x_cord && !p.y_cord) return ''
    return `X-${p.x_cord ?? '—'} · Y-${p.y_cord ?? '—'}`
  }

  function pointDate(p) {
    if (!Array.isArray(p.date) || !p.date.length) return ''
    const from = safeFormatDate(p.date[0])
    const to = p.date[1] ? safeFormatDate(p.date[1]) : null
    if (from === '—') return ''
    return to && to !== '—' && to !== from ? `${from} — ${to}` : from
  }

  function routeSummary(order) {
    const list = points(order)
    if (!list.length) return 'Маршрут не указан'
    const name = (p) => placeName(p) || (p.building ? `Корпус ${p.building}` : '?')
    if (list.length <= 2) return list.map(name).join(' → ')
    return `${name(list[0])} → +${list.length - 2} → ${name(list.at(-1))}`
  }

  const pointsCount = (order) => points(order).length

  const pointsCountText = (order) => {
    const n = pointsCount(order)
    return `${n} ${pointsWord(n)}`
  }

  function getOrderDates(order) {
    const firstPoint = points(order)[0]
    if (!Array.isArray(firstPoint?.date) || !firstPoint.date.length) return '—'

    const dates = firstPoint.date
      .map((d) => {
        try {
          return d ? formatDateDetailed(d) : null
        } catch {
          return null
        }
      })
      .filter(Boolean)

    if (!dates.length) return '—'

    const single =
      !dates[1] || dates[0] === dates[1] || dates.some((d) => d.includes('01.01.1970'))

    return single ? `На ${dates[0]}` : `С ${dates[0]} по ${dates[1]}`
  }

  // comments заявки приходит как "Ключ: значение\nКлюч: значение"
  function cargo(order) {
    if (!order?.comments) return []
    return String(order.comments)
      .split('\n')
      .map((line) => {
        const idx = line.indexOf(':')
        if (idx === -1) return { label: '', value: line.trim() }
        return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
      })
      .filter((r) => r.value)
  }

  function safeFormatDate(value) {
    try {
      return value ? formatDate(value) : '—'
    } catch {
      return '—'
    }
  }

  /* ---------- экспорт ---------- */

  const canExport = computed(() => Boolean((props.columns ?? []).length))

  function exportToExcel(fileName = 'Заявки.xlsx') {
    const cols = props.columns ?? []
    if (!cols.length) return

    const headers = cols.map((c) => c.header)
    const fields = cols.map((c) => c.field)

    const rowsData = filteredCustomers.value.map((row) =>
      fields.map((field) => field.split('.').reduce((acc, k) => acc?.[k], row) ?? '')
    )

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rowsData])

    worksheet['!cols'] = headers.map((h, i) => ({
      wch: Math.max(10, String(h).length, ...rowsData.map((r) => String(r[i] ?? '').length)) + 2,
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Заявки')
    XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'buffer' })
  }

  return {
    // состояние
    search,
    activeStatus,
    // списки
    statusTiles,
    filteredCustomers,
    displayedCustomers,
    hasActiveFilters,
    // пагинация
    first,
    rows,
    rowsOptions: ROWS_OPTIONS,
    totalCustomers,
    onPage,
    // действия
    setStatus,
    clearFilter,
    isOpen,
    toggle,
    collapseAll,
    exportToExcel,
    canExport,
    // хелперы для шаблона
    getStatusLabel,
    statusClass,
    shortFio,
    points,
    pointPlace,
    pointCoords,
    pointDate,
    routeSummary,
    pointsCount,
    pointsCountText,
    getOrderDates,
    cargo,
    safeFormatDate,
  }
}

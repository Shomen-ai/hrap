import { ref, computed, watch } from 'vue'
import * as XLSX from 'xlsx-js-style'

export const getByPath = (obj, path) => path.split('.').reduce((acc, k) => acc?.[k], obj)

export const asArray = (v) => (Array.isArray(v) ? v : Object.values(v ?? {}))

/**
 * Общая логика списочных страниц в стиле Orders:
 * поиск, плитки-фильтры, пагинация, раскрытие карточек, экспорт.
 * Разметка живёт в страницах, здесь только данные.
 *
 * @param {import('vue').Ref<Array>} source  список записей
 * @param {object} opts
 *   searchFields  пути полей, по которым ищет строка поиска ('state.state')
 *   searchExtra   (item) => [] — доп. значения для поиска (например, отформатированные даты)
 *   tiles         (items) => [{ id, label, count, icon, iconBg, iconColor }]; id: null — «все»
 *   matchTile     (item, tileId) => boolean
 *   columns       [{ field, header }] — колонки для экспорта в Excel
 *   rows          размер страницы по умолчанию
 */
export function useListPage(source, opts = {}) {
  const {
    searchFields = [],
    searchExtra = () => [],
    tiles = () => [],
    matchTile = () => true,
    columns = [],
    rows: defaultRows = 15,
  } = opts

  /* ---------- состояние ---------- */

  const search = ref('')
  const activeTile = ref(null)
  const openIds = ref(new Set())

  const items = computed(() => asArray(source.value))

  /* ---------- плитки-счётчики ---------- */

  const tileList = computed(() => tiles(items.value))

  function setTile(id) {
    activeTile.value = activeTile.value === id ? null : id
  }

  /* ---------- фильтрация ---------- */

  // пробелы по краям и двойные пробелы не мешают поиску
  const query = computed(() => search.value.trim().replace(/\s+/g, ' ').toLowerCase())

  const hasActiveFilters = computed(() => Boolean(query.value) || activeTile.value !== null)

  const filtered = computed(() => {
    let result = items.value

    if (activeTile.value !== null) {
      result = result.filter((item) => matchTile(item, activeTile.value))
    }

    const q = query.value
    if (q) {
      result = result.filter((item) =>
        [...searchFields.map((f) => getByPath(item, f)), ...searchExtra(item)]
          .map((v) => String(v ?? '').toLowerCase())
          .some((v) => v.includes(q))
      )
    }

    return result
  })

  /* ---------- пагинация ---------- */

  const ROWS_OPTIONS = [10, 15, 30, 50, 100]

  const first = ref(0)
  const rows = ref(defaultRows)

  const total = computed(() => filtered.value.length)

  const displayed = computed(() => filtered.value.slice(first.value, first.value + rows.value))

  function onPage(event) {
    first.value = event.first
    rows.value = event.rows
  }

  // на первую страницу — только когда меняется фильтр, а не данные
  watch([search, activeTile], () => {
    first.value = 0
  })

  function clearFilter() {
    search.value = ''
    activeTile.value = null
  }

  /* ---------- раскрытие ---------- */

  const isOpen = (id) => openIds.value.has(id)

  function toggle(id) {
    const next = new Set(openIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    openIds.value = next
  }

  /* ---------- экспорт ---------- */

  const canExport = computed(() => columns.length > 0 && filtered.value.length > 0)

  // выгружается то, что сейчас видно по фильтрам (без фильтров — весь список)
  function exportToExcel(fileName = 'Отчет.xlsx', sheetName = 'Sheet1') {
    if (!columns.length) return

    const headers = columns.map((c) => c.header)
    const rowsData = filtered.value.map((row) =>
      columns.map((c) => getByPath(row, c.field) ?? '')
    )

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rowsData])

    worksheet['!cols'] = headers.map((h, i) => ({
      wch: Math.max(10, String(h).length, ...rowsData.map((r) => String(r[i] ?? '').length)) + 2,
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'buffer' })
  }

  return {
    // состояние
    search,
    activeTile,
    // списки
    items,
    tiles: tileList,
    filtered,
    displayed,
    hasActiveFilters,
    // пагинация
    first,
    rows,
    rowsOptions: ROWS_OPTIONS,
    total,
    onPage,
    // действия
    setTile,
    clearFilter,
    isOpen,
    toggle,
    exportToExcel,
    canExport,
  }
}

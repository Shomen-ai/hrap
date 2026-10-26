import * as XLSX from 'xlsx-js-style'

/**
 * Общее для графиков страницы «Аналитика»: даты заказов, типы транспорта,
 * цвета серий и выгрузка в Excel. Раньше каждый график держал свою копию
 * formatDate / getRandomColor / экспорта.
 */

export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

// текущий и прошлый год — как было во всех графиках
export const yearOptions = () => {
  const y = new Date().getFullYear()
  return [y, y - 1]
}

export const monthOptions = MONTHS.map((label, i) => ({ value: i + 1, label }))

/* ---------- типы транспорта в заказе ---------- */

export const ORDER_TYPES = [
  { value: 'all', label: 'Все заказы' },
  { value: 'electric', label: 'Электротранспорт', id: 1 },
  { value: 'cargo', label: 'Грузовой транспорт', id: 2 },
]

export const orderTypeLabel = (item) =>
  item?.order_type_id == 1 ? 'Электротранспорт' : item?.order_type_id == 2 ? 'Грузовой транспорт' : 'Другое'

export function matchType(item, type) {
  if (type === 'all') return true
  const id = ORDER_TYPES.find((t) => t.value === type)?.id
  return item?.order_type_id == id
}

/* ---------- даты ---------- */

const MONTH_ABBR = {
  ЯНВ: 1, ФЕВ: 2, МАР: 3, АПР: 4, МАЙ: 5, ИЮН: 6,
  ИЮЛ: 7, АВГ: 8, СЕН: 9, ОКТ: 10, НОЯ: 11, ДЕК: 12,
}

/**
 * День из любого формата, который встречается в заказах:
 * «дд.мм.гггг», «гггг-мм-дд», «дд-мм-гггг», «дд-МЕС-гггг», ISO и Date.
 * Время после пробела или «T» отбрасывается. Возвращает { day, month, year } или null.
 */
export function parseDay(value) {
  if (!value) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return { day: value.getDate(), month: value.getMonth() + 1, year: value.getFullYear() }
  }

  const s = String(value).trim().split(/[\sT]/)[0]
  let m

  if ((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) {
    return { day: +m[1], month: +m[2], year: +m[3] }
  }
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    return { day: +m[3], month: +m[2], year: +m[1] }
  }
  if ((m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/))) {
    return { day: +m[1], month: +m[2], year: +m[3] }
  }
  if ((m = s.match(/^(\d{1,2})-([А-ЯЁа-яё]{3})-(\d{4})$/)) && MONTH_ABBR[m[2].toUpperCase()]) {
    return { day: +m[1], month: MONTH_ABBR[m[2].toUpperCase()], year: +m[3] }
  }

  const t = Date.parse(value)
  if (!Number.isNaN(t)) return parseDay(new Date(t))

  return null
}

// дата заказа: подача машины, а если её нет — создание
export const orderDay = (item) => parseDay(item?.provide_car_time || item?.created_at)

const pad = (n) => String(n).padStart(2, '0')

export const dayLabel = ({ day, month, year }) => `${pad(day)}.${pad(month)}.${year}`

// ключ для сортировки дат: 20260912
export const dayKey = ({ day, month, year }) => year * 10000 + month * 100 + day

/* ---------- числа ---------- */

export const toNumber = (v) => {
  const n = parseFloat(v)
  return Number.isNaN(n) ? 0 : n
}

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const count = new Intl.NumberFormat('ru-RU')

export const formatMoney = (v) => `${money.format(v)} ₽`
export const formatCount = (v) => count.format(v)

/* ---------- цвета ---------- */

/**
 * Палитра серий. Цвет закреплён за подписью (подразделение, машина),
 * поэтому при смене фильтра столбики не перекрашиваются, как было
 * со случайными цветами.
 */
export const PALETTE = [
  '#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
  '#ec4899', '#84cc16', '#f97316', '#14b8a6', '#6366f1', '#eab308',
  '#64748b', '#a855f7', '#0ea5e9', '#22c55e',
]

export function colorFor(label) {
  let hash = 0
  for (const ch of String(label)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

// цвета типов транспорта одинаковые во всех графиках
export const TYPE_COLORS = {
  Электротранспорт: '#06b6d4',
  'Грузовой транспорт': '#64748b',
  Другое: '#cbd5e1',
}

/* ---------- Excel ---------- */

/**
 * Лист с шапкой и шириной колонок по содержимому — так же,
 * как выгрузка на страницах Транспорт и Водители.
 */
export function exportSheet(fileName, sheetName, headers, rows) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  worksheet['!cols'] = headers.map((h, i) => ({
    wch: Math.max(10, String(h).length, ...rows.map((r) => String(r[i] ?? '').length)) + 2,
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'buffer' })
}

/**
 * ⚠ ЗАГЛУШКА ПЕСОЧНИЦЫ — В ПРОЕКТ НЕ КОПИРОВАТЬ.
 *
 * В avia-taxi-frontend этот файл уже есть и работает. Здесь он лежит только
 * чтобы стенд собирался и чтобы был виден контракт, который ждут компоненты
 * модалки: formatDate(value) и formatDateDetailed(value) -> строка.
 */

const pad = (n) => String(n).padStart(2, '0')

export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDateDetailed(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * ⚠ ЗАГЛУШКА ПЕСОЧНИЦЫ — В ПРОЕКТ НЕ КОПИРОВАТЬ.
 *
 * В avia-taxi-frontend этот файл уже есть и работает. Здесь он лежит только
 * чтобы стенд собирался и чтобы был виден контракт, который ждут компоненты
 * модалки: useUniqueValues(source, path) -> computed со списком уникальных значений.
 */

import { computed, isRef } from 'vue'

const get = (obj, path) => path.split('.').reduce((acc, k) => acc?.[k], obj)

export function useUniqueValues(source, path) {
  return computed(() => {
    const list = isRef(source) ? source.value : source
    const arr = Array.isArray(list) ? list : Object.values(list ?? {})
    return [...new Set(arr.map((item) => get(item, path)).filter(Boolean))]
  })
}

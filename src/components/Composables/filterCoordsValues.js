/**
 * ⚠ ЗАГЛУШКА ПЕСОЧНИЦЫ — В ПРОЕКТ НЕ КОПИРОВАТЬ.
 *
 * В avia-taxi-frontend этот файл уже есть. Здесь он лежит только чтобы стенд
 * собирался и был виден контракт: useFilterCoordsValues(list, coords) ->
 * computed со строками справочника, подходящими под уже выбранные значения.
 */

import { computed, isRef } from 'vue'

export function useFilterCoordsValues(source, coords) {
  return computed(() => {
    const list = isRef(source) ? source.value : source
    const rows = Array.isArray(list) ? list : Object.values(list ?? {})
    const picked = isRef(coords) ? coords.value : coords

    return rows.filter((row) =>
      Object.entries(picked ?? {}).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true
        return String(row[key]) === String(value)
      })
    )
  })
}

/**
 * Фильтр по типу транспорта для списочных страниц — те же варианты, что в списке заявок
 * (useOrdersList): «Электротранспорт» — всё, кроме грузового, плюс каждый тип отдельно.
 */

export const ELECTRIC = '__electric__'
const CARGO = 'грузовой транспорт'

export const isElectricType = (type) => Boolean(type) && String(type).toLowerCase() !== CARGO

/**
 * @param {Array} items
 * @param {(item) => string|undefined} getType  где у записи лежит название типа
 */
export function transportOptions(items, getType) {
  const types = [...new Set(items.map(getType).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'ru'))
    .map((t) => ({ label: t, value: t }))

  // группа «Электротранспорт» — только если такие машины есть
  if (!types.some((t) => isElectricType(t.value))) return types
  return [{ label: 'Электротранспорт', value: ELECTRIC }, ...types]
}

export const matchTransport = (type, value) =>
  value === ELECTRIC ? isElectricType(type) : type === value

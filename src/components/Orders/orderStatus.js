/**
 * Справочник статусов ЗАЯВКИ — один на весь модуль.
 * Раньше эта таблица жила внутри useOrdersList.js; вынесена, чтобы
 * список и модалка красили статус одинаково.
 */
export const ORDER_STATUS = {
  1: { label: 'Необработана', chip: 'bg-blue-100 text-blue-700' },
  2: { label: 'Доработка', chip: 'bg-amber-100 text-amber-700' },
  3: { label: 'Передана', chip: 'bg-violet-100 text-violet-700' },
  4: { label: 'В процессе', chip: 'bg-cyan-100 text-cyan-700' },
  5: { label: 'Завершена', chip: 'bg-emerald-100 text-emerald-700' },
}

export const getStatusLabel = (state) =>
  ORDER_STATUS[state?.id]?.label ?? state?.state ?? 'Неизвестно'

export const statusClass = (id) =>
  ORDER_STATUS[id]?.chip ?? 'bg-slate-100 text-slate-600'

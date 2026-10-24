/** «Иванов Пётр Сергеевич» -> «Иванов П. С.»; полное ФИО показываем в title. */
export function shortFio(fio) {
  if (!fio) return ''
  const [f, i, o] = String(fio).trim().split(/\s+/)
  return [f, i && `${i[0]}.`, o && `${o[0]}.`].filter(Boolean).join(' ')
}

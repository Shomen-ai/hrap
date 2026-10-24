/**
 * Цвета статусов машин и водителей для чипов и плиток.
 * Статусы приходят с бэка строкой (state.state), поэтому известные красим
 * по имени (цвета те же, что в легенде useCarPicker, только мягкие, как в orderStatus),
 * остальные — стабильно по хешу имени.
 */

const tone = (c, icon) => ({
  chip: `bg-${c}-100 text-${c}-700`,
  icon,
  iconBg: `bg-${c}-100`,
  iconColor: `text-${c}-600`,
})

// классы выписаны целиком, чтобы Tailwind их увидел при сборке:
// bg-emerald-100 text-emerald-700 text-emerald-600 bg-red-100 text-red-700 text-red-600
// bg-amber-100 text-amber-700 text-amber-600 bg-teal-100 text-teal-700 text-teal-600
// bg-orange-100 text-orange-700 text-orange-600 bg-blue-100 text-blue-700 text-blue-600
// bg-violet-100 text-violet-700 text-violet-600 bg-cyan-100 text-cyan-700 text-cyan-600
// bg-pink-100 text-pink-700 text-pink-600 bg-lime-100 text-lime-700 text-lime-600
const KNOWN = {
  'Свободен': tone('emerald', 'pi-check-circle'),
  'Занят': tone('red', 'pi-clock'),
  'Закреплена': tone('amber', 'pi-lock'),
  'Кольцевание': tone('teal', 'pi-sync'),
  'На обслуживании': tone('orange', 'pi-wrench'),
}

const FALLBACK = [
  tone('blue', 'pi-circle'),
  tone('violet', 'pi-circle'),
  tone('cyan', 'pi-circle'),
  tone('pink', 'pi-circle'),
  tone('lime', 'pi-circle'),
]

const UNKNOWN = {
  chip: 'bg-slate-100 text-slate-600',
  icon: 'pi-question-circle',
  iconBg: 'bg-slate-100',
  iconColor: 'text-slate-600',
}

export function stateStyle(name) {
  if (!name) return UNKNOWN
  if (KNOWN[name]) return KNOWN[name]
  let hash = 0
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return FALLBACK[hash % FALLBACK.length]
}

/**
 * Плитки «Все + по статусам» для useListPage.
 * id плитки — имя статуса; записи без статуса попадают в «Без статуса».
 */
export function stateTiles(items, allLabel, getState = (item) => item?.state?.state) {
  const counts = new Map()
  for (const item of items) {
    const name = getState(item) || ''
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  const byState = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const s = stateStyle(name)
      return {
        id: name,
        label: name || 'Без статуса',
        count,
        icon: s.icon,
        iconBg: s.iconBg,
        iconColor: s.iconColor,
      }
    })

  return [
    {
      id: null,
      label: allLabel,
      count: items.length,
      icon: 'pi-list',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    ...byState,
  ]
}

export const matchState = (item, id, getState = (i) => i?.state?.state) =>
  (getState(item) || '') === id

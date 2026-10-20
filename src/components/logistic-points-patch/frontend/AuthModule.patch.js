/*
 * AuthModule.js
 *
 * state.routesPriemka — массив (видно во Vue DevTools: Array[27]).
 * id из Oracle часто приходит строкой, поэтому везде сравнение через Number().
 */

/* ===================== mutations: ДОБАВИТЬ ===================== */

const byName = (a, b) => String(a.route_name).localeCompare(String(b.route_name), 'ru')

// в mutations: { ... }
addRoutePriemka(state, route) {
  state.routesPriemka = [...(state.routesPriemka ?? []), route].sort(byName)
},

updateRoutePriemka(state, route) {
  state.routesPriemka = (state.routesPriemka ?? [])
    .map((r) => (Number(r.id) === Number(route.id) ? { ...r, ...route } : r))
    .sort(byName)
},

removeRoutePriemka(state, id) {
  state.routesPriemka = (state.routesPriemka ?? []).filter((r) => Number(r.id) !== Number(id))
},

/* ============ actions: ЗАМЕНИТЬ newWayPoint, ДОБАВИТЬ остальные ============ */
/*
 * Заголовки с токеном передавайте так же, как в вашем GET для routesPriemka.
 * Если там их нет — они уже в axios.defaults, здесь тоже ничего не нужно.
 * Ошибки не ловим — их показывает компонент.
 */

// в actions: { ... }
async newWayPoint({ commit }, wayPoint) {
  const { data } = await axios.post(apiKey + '/api/createWayPoint', wayPoint)
  commit('addRoutePriemka', data.route)
  return data.route
},

async updateWayPoint({ commit }, wayPoint) {
  const { data } = await axios.post(apiKey + '/api/updateWayPoint', wayPoint)
  commit('updateRoutePriemka', data.route)
  return data.route
},

async deleteWayPoint({ commit }, id) {
  await axios.post(apiKey + '/api/deleteWayPoint', { id })
  commit('removeRoutePriemka', id)
},

/* ===================== getters: ДОБАВИТЬ ===================== */

// в getters: { ... }
getUserRoles(state) {
  return (state.user?.roles ?? []).map((r) => r.name)
},

// hasRole('Админ') или hasRole(['Админ', 'Диспетчер'])
hasRole: (state, getters) => (role) => {
  const roles = Array.isArray(role) ? role : [role]
  return roles.some((r) => getters.getUserRoles.includes(r))
},

isAdmin: (state, getters) => getters.hasRole('Админ'),
isDispatcher: (state, getters) => getters.hasRole('Диспетчер'), // ← точное имя роли из таблицы roles

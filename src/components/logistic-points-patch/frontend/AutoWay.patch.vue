<!--
  AutoWay.vue — поиск, создание, редактирование, удаление.
-->

<!-- ===================== template ===================== -->

<!-- ЗАМЕНИТЬ <AutoWayAddRoute ...> (верхняя форма — только создание) -->
<AutoWayAddRoute class="mt-2" @addPointInRoute="createRoute" />

<!-- ЗАМЕНИТЬ <AutoWayTab ...>.
     Было @eidt — опечатка, событие никто не слушал -->
<AutoWayTab
  v-for="(route, index) in filteredWays"
  :key="route.id ?? index"
  :route="route"
  :index="index"
  :editing="Number(editingId) === Number(route.id)"
  :deleting="Number(deletingId) === Number(route.id)"
  @edit="editingId = $event"
  @cancelEdit="editingId = null"
  @update="updateRoute"
  @delete="deleteRoute"
  @toggle="toggle"
/>

<!-- ===================== script ===================== -->
<script setup>
// ДОБАВИТЬ к импортам
import { useToast } from 'primevue/usetoast'

const toast = useToast()

/* ---------- поиск: ЗАМЕНИТЬ filteredWays, если он уже есть ---------- */

const allWays = computed(() => (Array.isArray(ways.value) ? ways.value : []))

// слова ищутся независимо и в любом порядке: «1б 250» → корпус 1Б, цех 250
const filteredWays = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allWays.value

  const words = q.split(/\s+/)
  return allWays.value.filter((w) => {
    const haystack = [w.route_name, w.building, w.department, w.x_cord, w.y_cord]
      .map((v) => String(v ?? '').toLowerCase())
      .join(' ')
    return words.every((word) => haystack.includes(word))
  })
})

/* ---------- общее ---------- */

function showError(e, fallback) {
  const errors = e.response?.data?.errors
  const detail = errors
    ? Object.values(errors).flat().join('\n')
    : e.response?.data?.message ?? fallback
  toast.add({ severity: 'error', summary: 'Ошибка', detail, life: 5000 })
}

/* ---------- создание: ЗАМЕНИТЬ createRoute ---------- */

const creating = ref(false)

async function createRoute(routeData) {
  if (creating.value) return // защита от двойного вызова
  creating.value = true
  try {
    await store.dispatch('AuthModule/newWayPoint', routeData)
    toast.add({ severity: 'success', summary: 'Точка создана', life: 3000 })
  } catch (e) {
    showError(e, 'Не удалось создать точку')
  } finally {
    creating.value = false
  }
}

/* ---------- редактирование: ЗАМЕНИТЬ editRoute ---------- */

const editingId = ref(null) // одна открытая форма на весь список

async function updateRoute(data) {
  try {
    await store.dispatch('AuthModule/updateWayPoint', data)
    editingId.value = null
    toast.add({ severity: 'success', summary: 'Точка обновлена', life: 3000 })
  } catch (e) {
    showError(e, 'Не удалось сохранить точку')
  }
}

/* ---------- удаление: ЗАМЕНИТЬ deleteRoute ---------- */

const deletingId = ref(null)

async function deleteRoute(id) {
  if (deletingId.value) return
  deletingId.value = id
  try {
    await store.dispatch('AuthModule/deleteWayPoint', id)
    if (Number(editingId.value) === Number(id)) editingId.value = null
    toast.add({ severity: 'success', summary: 'Точка удалена', life: 3000 })
  } catch (e) {
    showError(e, 'Не удалось удалить точку')
  } finally {
    deletingId.value = null
  }
}
</script>

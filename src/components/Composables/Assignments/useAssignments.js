import { ref, reactive, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'
import { useListPage } from '@/components/Composables/ListPage/useListPage'
import { transportOptions, matchTransport } from '@/components/Composables/ListPage/transportFilter'

/**
 * Логика страницы «Разнарядка»: загрузка назначений и водителей,
 * список с поиском и плитками, правка назначения через черновик.
 * Разметка — в Assignments.vue и AssignmentCard.vue.
 */
export function useAssignments() {
  const apiKey = import.meta.env.VITE_VUE_APP_API_URL

  const toast = useToast()
  const assignments = ref([])
  const drivers = ref([])
  const work_modes = ref(['Заявки АвиастарТакси', 'Закреплена', 'Кольцевание'])
  const loading = ref(false)

  onMounted(async () => {
    loading.value = true
    try {
      await fetchAssignments()
      await fetchDrivers()
    } finally {
      loading.value = false
    }
  })

  /* ---------- загрузка ---------- */

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(apiKey + '/api/assignments')
      if (response.data && Array.isArray(response.data)) {
        assignments.value = response.data.map((assignment) => ({
          ...assignment,
          taxi_car: assignment.taxi_car || {},
          taxi_driver: assignment.taxi_driver || {},
        }))
      } else {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Неверный формат данных для назначений',
          life: 3000,
        })
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось получить назначения',
        life: 3000,
      })
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(apiKey + '/api/drivers')
      if (response.data && Array.isArray(response.data)) {
        drivers.value = response.data.map((driver) => ({
          id: driver.id,
          fio: driver.fio,
        }))
      } else {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Неверный формат данных для водителей',
          life: 3000,
        })
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось получить водителей',
        life: 3000,
      })
    }
  }

  /* ---------- список ---------- */

  // формат даты: дд.мм.гггг чч:мм
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${minutes}`
  }

  const hasDriver = (a) => Boolean(a.taxi_driver?.id)

  const h = useListPage(assignments, {
    searchFields: [
      'taxi_car.garaj_number',
      'taxi_car.transport_type.type',
      'taxi_car.work_mode',
      'taxi_driver.fio',
      'shift',
    ],
    searchExtra: (a) => [formatDate(a.assigned_at), formatDate(a.unassigned_at)],
    tiles: (items) => [
      { id: null, label: 'Все машины', count: items.length, icon: 'pi-list', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
      { id: 'with', label: 'С водителем', count: items.filter(hasDriver).length, icon: 'pi-user', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
      { id: 'without', label: 'Без водителя', count: items.filter((a) => !hasDriver(a)).length, icon: 'pi-exclamation-circle', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    ],
    matchTile: (a, id) => (id === 'with' ? hasDriver(a) : !hasDriver(a)),
    filters: {
      type: (a, value) => matchTransport(a.taxi_car?.transport_type?.type, value),
    },
    rows: 30,
  })

  const transportTypes = computed(() =>
    transportOptions(h.items.value, (a) => a.taxi_car?.transport_type?.type)
  )

  /* ---------- правка назначения ----------
   * Раньше это был row-edit DataTable. Теперь у каждой карточки свой черновик:
   * отмена просто выбрасывает его, исходная запись не трогается.
   */

  const drafts = reactive({})
  const savingId = ref(null)

  function startEdit(row) {
    drafts[row.id] = {
      work_mode: row.taxi_car?.work_mode ?? null,
      taxi_driver_id: row.taxi_driver_id ?? row.taxi_driver?.id ?? null,
      shift: row.shift ?? null,
    }
  }

  function cancelEdit(row) {
    delete drafts[row.id]
  }

  const saveEdit = async (row) => {
    const draft = drafts[row.id]
    if (!draft) return

    savingId.value = row.id
    try {
      const response = await axios.post(apiKey + '/api/assignments', {
        taxi_car_id: row.taxi_car.id,
        taxi_driver_id: draft.taxi_driver_id,
        shift: draft.shift,
        work_mode: draft.work_mode,
      })

      const updatedAssignment = {
        ...response.data.new_assignment,
        taxi_car: response.data.new_assignment.taxi_car || {},
        taxi_driver: response.data.new_assignment.taxi_driver || {},
      }

      const assignmentIndex = assignments.value.findIndex(
        (assignment) => Number(assignment.id) === Number(updatedAssignment.id)
      )

      // машина, с которой водителя открепили: снимаем с неё водителя
      if (response.data.unassigned_car) {
        const unassignedCarId = response.data.unassigned_car.taxi_car_id

        const unassignedIndex = assignments.value.findIndex(
          (assignment) => Number(assignment.taxi_car_id) === Number(unassignedCarId)
        )

        if (unassignedIndex !== -1) {
          assignments.value[unassignedIndex] = {
            ...assignments.value[unassignedIndex],
            taxi_driver_id: null,
            taxi_driver: null,
            assigned_at: null,
          }
        }
      }

      if (assignmentIndex !== -1) {
        assignments.value[assignmentIndex] = updatedAssignment
      }

      toast.add({ severity: 'success', summary: 'Успех', detail: 'Назначение сохранено', life: 3000 })
      delete drafts[row.id]
    } catch (error) {
      console.error('Ошибка при сохранении назначения:', error)
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось сохранить назначение',
        life: 3000,
      })
    } finally {
      savingId.value = null
    }
  }

  return {
    h,
    loading,
    drivers,
    transportTypes,
    work_modes,
    drafts,
    savingId,
    formatDate,
    startEdit,
    cancelEdit,
    saveEdit,
  }
}

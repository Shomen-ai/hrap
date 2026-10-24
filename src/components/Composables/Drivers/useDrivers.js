import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import { useListPage } from '@/components/Composables/ListPage/useListPage'
import { stateTiles, matchState } from '@/components/Composables/ListPage/stateStyle'

/**
 * Логика страницы «Водители»: загрузка, список с поиском и плитками, удаление.
 * Разметка — в Drivers.vue и DriverCard.vue.
 */
export function useDrivers() {
  const store = useStore()
  const toast = useToast()

  const loading = ref(false)

  onMounted(async () => {
    loading.value = true
    try {
      await Promise.all([
        store.dispatch('DriversModule/loadDrivers'),
        store.dispatch('DriversModule/loadSelect'),
      ])
    } finally {
      loading.value = false
    }
  })

  const drivers = computed(() => store.state.DriversModule.drivers)

  const columns = [
    { field: 'id', header: 'ID' },
    { field: 'login', header: 'Логин' },
    { field: 'state.state', header: 'Статус' },
    { field: 'driver_type.type', header: 'Тип прав' },
    { field: 'mob_number', header: 'Мобильный номер' },
    { field: 'stat_number', header: 'Станционарный номер' },
    { field: 'fio', header: 'ФИО' },
    { field: 'num_license', header: 'Номер водительского удостоверения' },
    { field: 'date_accept_license', header: 'Дата получения водительского удостоверения' },
    { field: 'comments', header: 'Комментарий' },
  ]

  const h = useListPage(drivers, {
    searchFields: columns.map((c) => c.field),
    tiles: (items) => stateTiles(items, 'Все водители'),
    matchTile: matchState,
    columns,
  })

  const deleteDriver = (id, login) => {
    store
      .dispatch('DriversModule/deleteDriver', { driverId: id, login })
      .then((result) => {
        if (result.success) {
          toast.add({
            severity: 'success',
            summary: 'Удалено',
            detail: 'Водитель успешно удален.',
            life: 3000,
          })
        } else {
          toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось удалить водителя. Пожалуйста, попробуйте снова.',
            life: 3000,
          })
        }
      })
      .catch((error) => {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Произошла ошибка при удалении водителя: ' + error.message,
          life: 3000,
        })
      })
  }

  return { h, loading, deleteDriver }
}

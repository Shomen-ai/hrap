import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import { useListPage } from '@/components/Composables/ListPage/useListPage'
import { stateTiles, matchState } from '@/components/Composables/ListPage/stateStyle'

/**
 * Логика страницы «Транспорт»: загрузка, список с поиском и плитками, удаление.
 * Разметка — в Cars.vue и CarCard.vue.
 */
export function useCars() {
  const store = useStore()
  const toast = useToast()

  const loading = ref(false)

  onMounted(async () => {
    loading.value = true
    try {
      await Promise.all([store.dispatch('loadCars'), store.dispatch('loadSelect')])
    } finally {
      loading.value = false
    }
  })

  const cars = computed(() => store.state.CarsModule.cars)

  const columns = [
    { field: 'id', header: 'ID' },
    { field: 'state.state', header: 'Статус' },
    { field: 'transport_type.type', header: 'Тип транспорта' },
    { field: 'garaj_number', header: 'Гаражный номер' },
    { field: 'rate_per_hour', header: 'Тариф в час' },
    { field: 'comments', header: 'Комментарии' },
    { field: 'cargo_capacity', header: 'Грузоподьемность' },
    { field: 'length', header: 'Длина' },
    { field: 'width', header: 'Ширина' },
    { field: 'height', header: 'Высота' },
    { field: 'capacity', header: 'Вместимость(кол-во людей)' },
    { field: 'country', header: 'Страна производитель' },
    { field: 'company', header: 'Марка' },
    { field: 'model', header: 'Модель' },
    { field: 'year', header: 'Год' },
    { field: 'color', header: 'Цвет' },
  ]

  const h = useListPage(cars, {
    searchFields: columns.map((c) => c.field),
    tiles: (items) => stateTiles(items, 'Весь транспорт'),
    matchTile: matchState,
    columns,
  })

  const deleteCar = (id) => {
    store
      .dispatch('deleteCar', id)
      .then((result) => {
        if (result.success) {
          toast.add({
            severity: 'success',
            summary: 'Удалено',
            detail: 'Автомобиль успешно удален.',
            life: 5000,
          })
        } else {
          toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось удалить автомобиль. Пожалуйста, попробуйте снова.',
            life: 5000,
          })
        }
      })
      .catch((error) => {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Произошла ошибка при удалении автомобиля: ' + error.message,
          life: 5000,
        })
      })
  }

  return { h, loading, deleteCar }
}

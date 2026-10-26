import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

// '::00' и пустое значение бэк отдаёт, когда за день не было выполненных заказов
const formatAverage = (v) => (!v || /^[:0\s]*$/.test(String(v)) ? null : String(v))

/**
 * Логика страницы «Аналитика»: среднее время выполнения, машины для
 * графика использования, принудительная смена пароля.
 * Разметка — в Otchet.vue, сами графики — в своих компонентах.
 */
export function useOtchet() {
  const store = useStore()

  /* ---------- смена пароля ---------- */

  const showPasswordChangeModal = ref(store.state.AuthModule.user.flag_password)

  const handlePasswordChanged = () => {
    showPasswordChangeModal.value = false
    store.state.AuthModule.user.flag_password = 0
  }

  /* ---------- загрузка ---------- */

  const loading = ref(false)

  onMounted(async () => {
    loading.value = true
    try {
      await Promise.all([
        store.dispatch('AlbertOrdersStore/fetchAverageZatrati2'),
        store.dispatch('loadCars'),
      ])
    } finally {
      loading.value = false
    }
  })

  // раньше averages?.average[0] падал, если average приходил пустым
  const average = computed(() => store.state.AlbertOrdersStore.averages?.average?.[0] ?? {})
  const avgYesterday = computed(() => formatAverage(average.value.avg_yesterday))
  const avgToday = computed(() => formatAverage(average.value.avg_today))

  const dataCars = computed(() => store.state.CarsModule.cars ?? [])

  return {
    showPasswordChangeModal,
    handlePasswordChanged,
    loading,
    avgYesterday,
    avgToday,
    dataCars,
  }
}

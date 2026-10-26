import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

/**
 * Загрузка отчёта через OtchetModule: fetchReport кладёт данные в кеш
 * по reportKey, getReport(reportKey) их отдаёт.
 *
 * Ключ всегда начинается с типа отчёта. Раньше «Количество заказов по подразделениям»
 * и «Использование машин» оба писали в кеш под `${месяц}_${год}` и затирали
 * друг друга, а режим «Год» у машин читал данные режима «Месяц».
 *
 * @param {string} reportType  'GraphicOrder' | 'GraphicOtnosheni' | 'FrequencyCars' | 'VerticalZatrati'
 * @param {() => { key: string, params: object, ready?: boolean }} source
 *   ключ периода и параметры запроса; ready: false — период ещё не задан, не запрашиваем
 */
export function useReport(reportType, source) {
  const store = useStore()

  const request = computed(source)
  const reportKey = computed(() => `${reportType}_${request.value.key}`)

  const raw = computed(() => store.getters['OtchetModule/getReport'](reportKey.value))
  const orders = computed(() => (Array.isArray(raw.value) ? raw.value : []))
  // данные этого периода уже были загружены хоть раз (из кеша они видны сразу)
  const loaded = computed(() => raw.value !== undefined && raw.value !== null)

  const pending = ref(0)
  const loading = computed(() => pending.value > 0)
  const error = ref(null)

  async function refresh() {
    const { params, ready = true } = request.value
    if (!ready) return
    pending.value += 1
    error.value = null
    try {
      await store.dispatch('OtchetModule/fetchReport', {
        reportKey: reportKey.value,
        reportType,
        params,
      })
    } catch (e) {
      error.value = e
      console.error(`Ошибка загрузки ${reportType}:`, e)
    } finally {
      pending.value -= 1
    }
  }

  // один запрос на смену периода: раньше @change и watch дёргали его дважды
  watch(reportKey, refresh, { immediate: true })

  return { orders, loaded, loading, error, refresh, reportKey }
}

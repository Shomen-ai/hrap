import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import { useToast } from 'primevue/usetoast'
import { defineRule } from 'vee-validate'
import { required, digits, min_value, max_value, min, max } from '@vee-validate/rules'
import { asArray } from '@/components/Composables/ListPage/useListPage'

/**
 * Логика модалки машины: открытие, справочники, загрузка фото, сохранение.
 * Разметка — в CarModal.vue.
 */

defineRule('required', required)
defineRule('digits', digits)
defineRule('min', min)
defineRule('max', max)
defineRule('min_value', min_value)
defineRule('max_value', max_value)

const NUM = { min_value: 0.1, max_value: 9999 }
const TEXT = { min: 2, max: 255 }

export const MAIN_FIELDS = [
  { name: 'garaj_number', label: 'Гаражный номер', rules: { required: true, min: 2, max: 255 } },
  { name: 'rate_per_hour', label: 'Тариф в час', rules: NUM },
]

export const SPEC_FIELDS = [
  { name: 'cargo_capacity', label: 'Грузоподъёмность', rules: NUM },
  { name: 'length', label: 'Длина', rules: NUM },
  { name: 'width', label: 'Ширина', rules: NUM },
  { name: 'height', label: 'Высота', rules: NUM },
  { name: 'capacity', label: 'Вместимость, чел.', rules: NUM },
]

export const MAKER_FIELDS = [
  { name: 'country', label: 'Страна', rules: TEXT },
  { name: 'company', label: 'Марка', rules: TEXT },
  { name: 'model', label: 'Модель', rules: TEXT },
  { name: 'year', label: 'Год', rules: { min_value: 1900, max_value: new Date().getFullYear(), digits: 4 } },
  { name: 'color', label: 'Цвет', rules: TEXT },
]

export function useCarModal() {
  const store = useStore()
  const toast = useToast()
  const apiKey = import.meta.env.VITE_VUE_APP_API_URL

  const displayDialog = ref(false)
  const car_image = ref('')

  const car = computed(() => store.state.CarsModule.car)
  const carState = computed(() => store.state.CarsModule.carsSelect.states)
  const carType = computed(() => store.state.CarsModule.carsSelect.types)

  const selectedState = ref()
  const selectedType = ref()

  // ищем объект справочника, чтобы при сохранении ушёл id;
  // раньше в Dropdown клалась строка и state_id без перевыбора уходил пустым
  const findOption = (list, id, fallback) =>
    asArray(list).find((o) => Number(o.id) === Number(id)) ?? fallback

  function openNew() {
    store.commit('SET_CAR', {})
    displayDialog.value = true
  }

  function openEdit(selectedCar) {
    selectedState.value = findOption(carState.value, selectedCar.state?.id ?? selectedCar.state_id, selectedCar.state?.state)
    selectedType.value = findOption(
      carType.value,
      selectedCar.transport_type?.id ?? selectedCar.car_type_id,
      selectedCar.transport_type?.type
    )
    store.commit('SET_CAR', { ...selectedCar })
    displayDialog.value = true
  }

  function hideDialog() {
    selectedState.value = ''
    selectedType.value = ''
    store.commit('SET_CAR', {})
    car_image.value = ''
    displayDialog.value = false
  }

  const onImageUpload = async (event) => {
    const file = event.files[0]
    const formData = new FormData()
    formData.append('car_image', file)
    formData.append('car_id', car.value.id)

    try {
      const response = await axios.post(apiKey + '/api/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // сервер возвращает путь к изображению
      if (response && response.data && response.data.path) {
        car_image.value = response.data.path
      } else {
        throw new Error('Ошибка при получении пути к изображению')
      }
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Ошибка загрузки', detail: error.message, life: 5000 })
    }
  }

  const saveCar = () => {
    const data = {
      ...car.value,
      state_id: selectedState.value ? selectedState.value.id : null,
      car_type_id: selectedType.value ? selectedType.value.id : null,
      car_image: car_image.value ? car_image.value : car.value?.car_image,
    }

    store
      .dispatch('saveCar', { data })
      .then(() => {
        toast.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Информация об автомобиле сохранена.',
          life: 5000,
        })
        hideDialog()
      })
      .catch(() => {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось сохранить информацию об автомобиле.',
          life: 5000,
        })
      })
  }

  return {
    displayDialog,
    car_image,
    car,
    carState,
    carType,
    selectedState,
    selectedType,
    openNew,
    openEdit,
    hideDialog,
    onImageUpload,
    saveCar,
  }
}

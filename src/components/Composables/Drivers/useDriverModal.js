import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import { defineRule } from 'vee-validate'
import { required, min, max } from '@vee-validate/rules'
import { asArray } from '@/components/Composables/ListPage/useListPage'

/**
 * Логика модалки водителя: логин при создании/правке, справочники, сохранение.
 * Разметка — в DriverModal.vue.
 */

defineRule('required', required)
defineRule('min', min)
defineRule('max', max)
defineRule('date_format', (value) => {
  // поле не обязательное: пустое пропускаем
  if (!value || value.trim().length === 0) return true

  // дд.мм.гггг
  const regex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[012])\.(19|20)\d\d$/
  return regex.test(value) ? true : 'Формат даты должен быть DD.MM.YYYY'
})

export function useDriverModal() {
  const store = useStore()
  const toast = useToast()

  const displayDialog = ref(false)
  const isEditingDriver = ref(false)
  const login = ref('')

  const driver = computed(() => store.state.DriversModule.driver)
  const driverState = computed(() => store.state.DriversModule.driversSelect.states)
  const driverType = computed(() => store.state.DriversModule.driversSelect.types)

  const selectedState = ref()
  const selectedType = ref()

  // при правке логин показывается из записи и заблокирован, при создании — свой ref
  const dynamicLoginModel = computed({
    get: () => (isEditingDriver.value ? driver.value.login : login.value),
    set: (val) => {
      if (isEditingDriver.value) {
        driver.value.login = val
      } else {
        login.value = val
      }
    },
  })

  // ищем объект справочника, чтобы при сохранении ушёл id;
  // раньше в Dropdown клалась строка и state_id без перевыбора уходил пустым
  const findOption = (list, id, fallback) =>
    asArray(list).find((o) => Number(o.id) === Number(id)) ?? fallback

  function openNew() {
    isEditingDriver.value = false
    displayDialog.value = true
  }

  function openEdit(selectedDriver) {
    isEditingDriver.value = true
    selectedState.value = findOption(
      driverState.value,
      selectedDriver.state?.id ?? selectedDriver.state_id,
      selectedDriver.state?.state
    )
    selectedType.value = selectedDriver.driver_type?.type
      ? findOption(
          driverType.value,
          selectedDriver.driver_type.id ?? selectedDriver.driver_type_id,
          selectedDriver.driver_type.type
        )
      : null
    store.commit('DriversModule/SET_DRIVER', { ...selectedDriver })
    displayDialog.value = true
  }

  function hideDialog() {
    selectedState.value = ''
    selectedType.value = ''
    store.commit('DriversModule/SET_DRIVER', {})
    login.value = ''
    displayDialog.value = false
  }

  const saveDriver = () => {
    const data = {
      ...driver.value,
      login: login.value,
      state_id: selectedState.value ? selectedState.value.id : null,
      driver_type_id: selectedType.value ? selectedType.value.id : null,
    }

    store
      .dispatch('DriversModule/saveDriver', { data })
      .then((result) => {
        if (result.success) {
          toast.add({
            severity: 'success',
            summary: 'Успех',
            detail: 'Данные водителя успешно сохранены.',
            life: 3000,
          })
        } else {
          toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось сохранить данные водителя. Пожалуйста, попробуйте снова.',
            life: 3000,
          })
        }
        hideDialog()
      })
      .catch((error) => {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Произошла ошибка при сохранении данных водителя: ' + error.message,
          life: 3000,
        })
      })
  }

  return {
    displayDialog,
    isEditingDriver,
    driver,
    driverState,
    driverType,
    selectedState,
    selectedType,
    dynamicLoginModel,
    openNew,
    openEdit,
    hideDialog,
    saveDriver,
  }
}

<template>
  <Dialog
    :visible="displayDialog"
    :modal="true"
    :style="{ width: '48rem' }"
    :breakpoints="{ '960px': '92vw', '640px': '100vw' }"
    class="list-modal"
    @update:visible="(v) => !v && hideDialog()"
  >
    <!-- ================== ШАПКА ================== -->
    <template #header>
      <div class="flex items-center gap-3 min-w-0 pr-2">
        <span class="font-semibold text-slate-900 truncate">
          {{ isEditingDriver ? shortFio(driver.fio) || 'Водитель' : 'Новый водитель' }}
        </span>
        <span
          v-if="isEditingDriver && driver.state?.state"
          class="shrink-0 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
          :class="stateStyle(driver.state.state).chip"
        >
          {{ driver.state.state }}
        </span>
      </div>
    </template>

    <!-- ================== СОДЕРЖИМОЕ ================== -->
    <Form id="driver-form" class="space-y-3" @submit="saveDriver">
      <!-- ---------- УЧЁТНАЯ ЗАПИСЬ ---------- -->
      <ModalSection
        title="Учётная запись"
        icon="pi-user"
        icon-bg="bg-blue-100"
        icon-color="text-blue-600"
        :hint="isEditingDriver ? 'Логин после создания не меняется' : ''"
      >
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <ModalField label="Логин" name="login" :required="!isEditingDriver">
            <Field
              v-model="dynamicLoginModel"
              name="login"
              label="Логин"
              :rules="isEditingDriver ? {} : { required: true, min: 6, max: 255 }"
            >
              <InputText
                id="login"
                v-model="dynamicLoginModel"
                :disabled="isEditingDriver"
                class="w-full h-10 rounded-lg"
                placeholder="Не короче 6 символов"
              />
            </Field>
          </ModalField>

          <ModalField label="Статус" name="status" required>
            <Field v-model="selectedState" name="status" label="Статус" :rules="{ required: true }">
              <Dropdown
                id="status"
                v-model="selectedState"
                editable
                :options="driverState"
                option-label="state"
                placeholder="Выберите статус"
                class="w-full"
              />
            </Field>
          </ModalField>
        </div>
      </ModalSection>

      <!-- ---------- КОНТАКТЫ ---------- -->
      <ModalSection title="Контакты" icon="pi-phone" icon-bg="bg-emerald-100" icon-color="text-emerald-600">
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <ModalField label="Номер телефона" name="mob_number" required>
            <Field
              v-model="driver.mob_number"
              name="mob_number"
              label="Номер телефона"
              :rules="{ required: true, min: 7, max: 18 }"
            >
              <InputMask
                id="mob_number"
                v-model="driver.mob_number"
                mask="+9 (999) 999-99-99"
                placeholder="+7 (___) ___-__-__"
                class="w-full h-10 rounded-lg tabular-nums"
              />
            </Field>
          </ModalField>

          <ModalField label="Стационарный телефон" name="stat_number">
            <Field
              v-model="driver.stat_number"
              name="stat_number"
              label="Стационарный телефон"
              :rules="{ min: 5, max: 8 }"
            >
              <InputMask
                id="stat_number"
                v-model="driver.stat_number"
                mask="9-99-99"
                placeholder="_-__-__"
                class="w-full h-10 rounded-lg tabular-nums"
              />
            </Field>
          </ModalField>
        </div>
      </ModalSection>

      <!-- ---------- ВОДИТЕЛЬ ---------- -->
      <ModalSection title="Водитель" icon="pi-id-card" icon-bg="bg-violet-100" icon-color="text-violet-600">
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <ModalField label="ФИО" name="fio" required wide>
            <Field v-model="driver.fio" name="fio" label="ФИО" :rules="{ required: true, min: 2, max: 255 }">
              <InputText
                id="fio"
                v-model.trim="driver.fio"
                class="w-full h-10 rounded-lg"
                placeholder="Фамилия Имя Отчество"
              />
            </Field>
          </ModalField>

          <ModalField label="Тип прав">
            <Dropdown
              id="type"
              v-model="selectedType"
              editable
              :options="driverType"
              option-label="type"
              placeholder="Тип прав"
              class="w-full"
            />
          </ModalField>

          <ModalField label="Номер удостоверения" name="num_license">
            <Field
              v-model="driver.num_license"
              name="num_license"
              label="Номер водительского удостоверения"
              :rules="{ min: 2, max: 255 }"
            >
              <InputText id="num_license" v-model.trim="driver.num_license" class="w-full h-10 rounded-lg" />
            </Field>
          </ModalField>

          <ModalField label="Дата выдачи" name="date_accept_license">
            <Field
              v-model="driver.date_accept_license"
              name="date_accept_license"
              label="Дата выдачи водительского удостоверения"
              rules="date_format"
            >
              <InputText
                id="date_accept_license"
                v-model.trim="driver.date_accept_license"
                class="w-full h-10 rounded-lg tabular-nums"
                placeholder="ДД.ММ.ГГГГ"
              />
            </Field>
          </ModalField>
        </div>
      </ModalSection>

      <!-- ---------- КОММЕНТАРИЙ ---------- -->
      <ModalSection title="Комментарий" icon="pi-comment" icon-bg="bg-slate-100" icon-color="text-slate-600">
        <ModalField label="Комментарий" name="comments">
          <Field v-model="driver.comments" name="comments" label="Комментарии" :rules="{ min: 2, max: 1000 }">
            <Textarea id="comments" v-model.trim="driver.comments" class="w-full min-h-[80px] rounded-lg" />
          </Field>
        </ModalField>
      </ModalSection>
    </Form>

    <!-- ================== ПОДВАЛ ================== -->
    <template #footer>
      <div class="w-full flex flex-wrap justify-end gap-2">
        <Button
          label="Отмена"
          icon="pi pi-times"
          class="h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
          @click="hideDialog"
        />
        <Button
          type="submit"
          form="driver-form"
          label="Сохранить"
          icon="pi pi-check"
          class="h-10 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import { Form, Field } from 'vee-validate'

import ModalSection from '@/components/Orders/ModalSection.vue'
import ModalField from '@/components/Orders/ModalField.vue'
import { stateStyle } from '@/components/Composables/ListPage/stateStyle'
import { shortFio } from '@/components/Composables/ListPage/shortFio'
import '@/components/Composables/ListPage/listPage.css'
import { useDriverModal } from './useDriverModal'

const {
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
} = useDriverModal()

defineExpose({ openNew, openEdit })
</script>

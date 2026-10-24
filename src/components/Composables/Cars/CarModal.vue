<template>
  <Dialog
    :visible="displayDialog"
    :modal="true"
    :style="{ width: '52rem' }"
    :breakpoints="{ '960px': '92vw', '640px': '100vw' }"
    class="list-modal"
    @update:visible="(v) => !v && hideDialog()"
  >
    <!-- ================== ШАПКА ================== -->
    <template #header>
      <div class="flex items-center gap-3 min-w-0 pr-2">
        <span class="font-semibold text-slate-900 truncate">
          {{ car.id ? `Транспорт ${car.garaj_number ?? ''}` : 'Новый транспорт' }}
        </span>
        <span
          v-if="car.id && car.state?.state"
          class="shrink-0 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
          :class="stateStyle(car.state.state).chip"
        >
          {{ car.state.state }}
        </span>
      </div>
    </template>

    <!-- ================== СОДЕРЖИМОЕ ================== -->
    <Form id="car-form" class="space-y-3" @submit="saveCar">
      <!-- ---------- ФОТО ---------- -->
      <ModalSection title="Фото" icon="pi-image" icon-bg="bg-slate-100" icon-color="text-slate-600">
        <div v-if="car.id" class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="w-40 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 shrink-0">
            <img
              :src="car_image || car.car_image || fallbackImage"
              alt="Car Image"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="min-w-0">
            <Toast />
            <FileUpload
              choose-label="Выберите фото транспорта"
              mode="basic"
              name="car_image"
              accept="image/*"
              :max-file-size="4000000"
              @select="onImageUpload"
            />
            <p class="mt-2 text-xs text-slate-400">JPG или PNG, до 4 МБ</p>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500">
          Для добавления фото после создания нажмите на редактирование
        </p>
      </ModalSection>

      <!-- ---------- ОСНОВНОЕ ---------- -->
      <ModalSection title="Основное" icon="pi-truck" icon-bg="bg-blue-100" icon-color="text-blue-600">
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <ModalField label="Статус" name="status" required>
            <Field v-model="selectedState" name="status" label="Статус" :rules="{ required: true }">
              <Dropdown
                id="status"
                v-model="selectedState"
                editable
                :options="carState"
                option-label="state"
                placeholder="Выберите статус"
                class="w-full"
              />
            </Field>
          </ModalField>

          <ModalField label="Тип транспорта" name="type" required>
            <Field v-model="selectedType" name="type" label="Тип транспорта" :rules="{ required: true }">
              <Dropdown
                id="type"
                v-model="selectedType"
                editable
                :options="carType"
                option-label="type"
                placeholder="Выберите тип транспорта"
                class="w-full"
              />
            </Field>
          </ModalField>

          <ModalField
            v-for="f in MAIN_FIELDS"
            :key="f.name"
            :label="f.label"
            :name="f.name"
            :required="Boolean(f.rules.required)"
          >
            <Field v-model="car[f.name]" :name="f.name" :label="f.label" :rules="f.rules">
              <InputText :id="f.name" v-model.trim="car[f.name]" class="w-full h-10 rounded-lg" />
            </Field>
          </ModalField>
        </div>
      </ModalSection>

      <!-- ---------- ХАРАКТЕРИСТИКИ ---------- -->
      <ModalSection
        title="Характеристики"
        icon="pi-box"
        icon-bg="bg-cyan-100"
        icon-color="text-cyan-600"
        hint="Груз — в тоннах, габариты — в метрах"
      >
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <ModalField v-for="f in SPEC_FIELDS" :key="f.name" :label="f.label" :name="f.name">
            <Field v-model="car[f.name]" :name="f.name" :label="f.label" :rules="f.rules">
              <InputText :id="f.name" v-model.trim="car[f.name]" class="w-full h-10 rounded-lg" />
            </Field>
          </ModalField>
        </div>
      </ModalSection>

      <!-- ---------- ПРОИЗВОДИТЕЛЬ ---------- -->
      <ModalSection title="Производитель" icon="pi-tag" icon-bg="bg-violet-100" icon-color="text-violet-600">
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <ModalField v-for="f in MAKER_FIELDS" :key="f.name" :label="f.label" :name="f.name">
            <Field v-model="car[f.name]" :name="f.name" :label="f.label" :rules="f.rules">
              <InputText
                v-if="f.name === 'year'"
                id="year"
                v-model="car.year"
                class="w-full h-10 rounded-lg"
              />
              <InputText v-else :id="f.name" v-model.trim="car[f.name]" class="w-full h-10 rounded-lg" />
            </Field>
          </ModalField>
        </div>
      </ModalSection>

      <!-- ---------- КОММЕНТАРИИ ---------- -->
      <ModalSection title="Комментарии" icon="pi-comment" icon-bg="bg-emerald-100" icon-color="text-emerald-600">
        <ModalField label="Комментарии" name="comments">
          <Field v-model="car.comments" name="comments" label="Комментарии" :rules="{ min: 2, max: 1000 }">
            <Textarea
              id="comments"
              v-model.trim="car.comments"
              class="w-full min-h-[80px] rounded-lg"
              placeholder="Особенности, ограничения, закрепление"
            />
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
          form="car-form"
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
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import FileUpload from 'primevue/fileupload'
import Toast from 'primevue/toast'
import { Form, Field } from 'vee-validate'

import ModalSection from '@/components/Orders/ModalSection.vue'
import ModalField from '@/components/Orders/ModalField.vue'
import fallbackImage from '@/assets/not_car.jpg'
import { stateStyle } from '@/components/Composables/ListPage/stateStyle'
import '@/components/Composables/ListPage/listPage.css'
import { useCarModal, MAIN_FIELDS, SPEC_FIELDS, MAKER_FIELDS } from './useCarModal'

const {
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
} = useCarModal()

defineExpose({ openNew, openEdit })
</script>

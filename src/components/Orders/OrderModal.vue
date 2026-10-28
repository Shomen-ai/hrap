<template>
  <Dialog
    :visible="visible"
    :position="h.position.value"
    :modal="true"
    :draggable="true"
    :style="{ width: '72rem' }"
    :breakpoints="{ '1400px': '92vw', '640px': '100vw' }"
    class="order-modal"
    @update:visible="h.closeModal"
  >
    <!-- ================== ШАПКА ================== -->
    <template #header>
      <div class="flex items-center gap-3 min-w-0 pr-2">
        <span class="font-semibold tabular-nums text-slate-900 whitespace-nowrap">
          Заявка № {{ rowData?.id ?? '…' }}
        </span>

        <span
          class="shrink-0 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
          :class="h.statusClass(rowData?.state?.id)"
        >
          {{ h.getStatusLabel(rowData?.state) }}
        </span>
      </div>
    </template>

    <!-- ================== СОДЕРЖИМОЕ ================== -->
    <div class="space-y-3">
      <!-- ---------- ЗАЯВКА И ГРУЗ ---------- -->
      <ModalSection
        title="Заявка"
        icon="pi-file"
        icon-bg="bg-slate-100"
        icon-color="text-slate-600"
        :hint="h.orderDateText.value"
      >
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <ModalField
            label="Дата подачи заявки"
            readonly
            numeric
            :value="h.safeFormatDate(rowData?.created_at)"
          />
          <ModalField label="Номер заявки" readonly numeric :value="rowData?.id ?? ''" />
          <ModalField label="Когда нужна машина" readonly numeric :value="h.orderDateText.value" />
          <ModalField label="Путевой лист" readonly numeric :value="h.waybill.value ?? ''" />
        </div>

        <!-- груз: comments приходит как "Ключ: значение" построчно -->
        <div class="mt-5 pt-4 border-t border-slate-100">
          <h4 class="text-xs font-medium text-slate-500 mb-2">Груз</h4>

          <dl v-if="h.cargo.value.length" class="text-sm space-y-1">
            <div v-for="(row, i) in h.cargo.value" :key="i" class="flex gap-3">
              <dt v-if="row.label" class="text-slate-500 w-40 shrink-0 truncate">{{ row.label }}</dt>
              <dd class="text-slate-900 min-w-0 break-words">{{ row.value }}</dd>
            </div>
          </dl>
          <p v-else class="text-sm text-slate-400">Не заполнено</p>
        </div>
      </ModalSection>

      <!-- ---------- ЗАКАЗЧИК ---------- -->
      <ModalSection
        title="Заказчик"
        icon="pi-user"
        icon-bg="bg-blue-100"
        icon-color="text-blue-600"
        :hint="h.customerHint.value"
      >
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <!-- ФИО: в оригинале поле всегда disabled, значение показывалось сокращённым -->
          <ModalField label="ФИО ответственного" readonly>
            <template #text>
              <span :title="rowData?.fio">{{ shortFio(rowData?.fio) }}</span>
            </template>
          </ModalField>

          <ModalField label="Подразделение" readonly :value="podrLabel(rowData?.podr)" />

          <!-- стационарный и мобильный редактируемы: в оригинале не было disabled -->
          <ModalField
            label="Стационарный номер"
            name="stat_number"
            required
            :readonly="disabled"
            :value="rowData?.stat_number ?? ''"
            numeric
          >
            <Field
              v-model="rowData.stat_number"
              name="stat_number"
              :rules="{ required: true, min: 5, max: 8 }"
            >
              <InputText
                id="stat_number"
                v-model="rowData.stat_number"
                class="w-full h-10 rounded-lg"
                placeholder="Стац. номер"
              />
            </Field>
          </ModalField>

          <ModalField
            label="Мобильный номер"
            name="mob_number_field"
            required
            :readonly="disabled"
            :value="rowData?.mob_number ?? ''"
            numeric
          >
            <Field
              v-model="rowData.mob_number"
              name="mob_number_field"
              :rules="{ required: true, min: 7, max: 18 }"
            >
              <InputText
                id="mob_number_field"
                v-model="rowData.mob_number"
                class="w-full h-10 rounded-lg"
                placeholder="Мобильный номер"
              />
            </Field>
          </ModalField>
        </div>
      </ModalSection>

      <!-- ---------- ТРАНСПОРТ ---------- -->
      <ModalSection
        title="Транспорт"
        icon="pi-truck"
        icon-bg="bg-cyan-100"
        icon-color="text-cyan-600"
        :hint="h.transportHint.value"
      >
        <div class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <ModalField label="Тип транспорта" readonly :value="rowData?.car?.transport_type?.type ?? ''" />
          <ModalField label="Гаражный номер" readonly numeric :value="rowData?.car?.garaj_number ?? ''" />

          <!-- дата заказа: правится только когда модалка не в режиме чтения -->
          <ModalField
            label="Дата заказа"
            name="order_date"
            :readonly="disabled || !h.hasPoints.value"
            :value="h.orderDateText.value"
            numeric
            wide
          >
            <RangeCalendar
              id="order_date"
              v-model="rowData.loading_and_delivery_points[0].date"
              :disabled="disabled"
              class="w-full"
              placeholder="дд.мм.гггг 00:00"
            />
          </ModalField>
        </div>

        <!-- выбор машины -->
        <div class="mt-5 pt-4 border-t border-slate-100">
          <ModalCarSection
            ref="carTComponent"
            v-model="rowData.car"
            :modalka="true"
            :disabled="disabled"
            :items="h.items.value"
            :selected-car-id="rowData?.car?.id"
          />
        </div>
      </ModalSection>

      <!-- ---------- МАРШРУТ ---------- -->
      <ModalSection
        title="Маршрут"
        icon="pi-map-marker"
        icon-bg="bg-emerald-100"
        icon-color="text-emerald-600"
        :hint="h.routeHint.value"
      >
        <slot name="routes" :routes="rowData.loading_and_delivery_points" :disabled="disabled">
          <div v-if="h.hasPoints.value" class="space-y-3">
            <RouteTab
              v-for="(route, index) in h.points.value"
              :key="index"
              :route="route"
              :index="index"
              :disabled="disabled"
              :num_zayvki="rowData && rowData.id ? rowData.id : '...'"
              :all_data_order="rowData"
              :editing="h.editingIndex.value === index"
              @delete="h.deleteRoute"
              @deletePoint="h.handleDeletePoint"
              @edit="h.startEditPoint"
            />
          </div>

          <p v-else class="text-sm text-slate-400">Точки не указаны</p>

          <p
            v-if="h.showRouteError.value"
            class="mt-3 flex items-center gap-2 text-sm text-red-600"
            role="alert"
          >
            <i class="pi pi-exclamation-triangle text-xs" />
            {{ h.routeError.value }}
          </p>

          <div v-if="state_order == 1 || state_order == 2" class="mt-4">
            <RoutesContentAddOrder
              :state_order="state_order"
              :all_data_order="rowData"
              :disabled="disabled"
              :edit-point="h.editingPoint.value"
              :edit-index="h.editingIndex.value"
              @addPointInRoute="h.handleAddPointInRoute"
              @updatePointInRoute="h.handleUpdatePointInRoute"
              @cancelEdit="h.cancelEditPoint"
            />
          </div>
        </slot>
      </ModalSection>

      <!-- ---------- НАЗНАЧЕНИЕ ВОДИТЕЛЯ ---------- -->
      <ModalSection
        title="Назначение водителя"
        icon="pi-id-card"
        icon-bg="bg-violet-100"
        icon-color="text-violet-600"
        :hint="h.executionHint.value"
      >
        <!-- диспетчер и админ: выбирают статус, затем водителя -->
        <div
          v-if="h.isDispatcherOrAdmin.value"
          class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]"
        >
          <ModalField label="Статус водителя" name="state" required :readonly="disabled" :value="h.state.value ?? ''">
            <Field v-model="h.state.value" name="state" :rules="{ required: true }">
              <Dropdown
                id="state"
                v-model="h.state.value"
                name="state"
                option-label="state"
                option-value="state"
                :options="h.driverStates.value"
                :loading="h.driversLoading.value"
                :disabled="disabled"
                placeholder="Выберите статус"
                class="w-full"
                @update:modelValue="h.onStateSelect"
              />
            </Field>
          </ModalField>

          <ModalField
            label="Водитель"
            name="driverSelected"
            required
            :readonly="disabled"
            :value="rowData?.driver?.fio ?? ''"
          >
            <Field v-model="h.driverSelected.value" name="driverSelected" :rules="{ required: true }">
              <Dropdown
                id="driverSelected"
                v-model="h.driverSelected.value"
                name="driverSelected"
                editable
                option-label="fio"
                :options="h.sortedDrivers.value"
                :loading="h.driversLoading.value"
                :disabled="!h.state.value || disabled"
                placeholder="Начните набирать ФИО"
                class="w-full"
                @update:modelValue="h.onDriverSelect"
              />
            </Field>
            <p class="mt-1 text-xs text-slate-400">Можете начать набор вручную — подскажет</p>
          </ModalField>

          <ModalField
            label="Номер водителя"
            name="mob_number"
            required
            :readonly="disabled"
            numeric
            :value="rowData?.driver?.mob_number ?? ''"
          >
            <Field v-model="h.driverSelected.value" name="mob_number" :rules="{ required: true }">
              <Dropdown
                id="mob_number"
                v-model="h.driverSelected.value"
                name="mob_number"
                option-label="mob_number"
                :options="h.sortedDrivers.value"
                :loading="h.driversLoading.value"
                :disabled="!h.state.value || disabled"
                placeholder="Выберите номер"
                class="w-full"
                @update:modelValue="h.onDriverSelect"
              />
            </Field>
          </ModalField>
        </div>

        <!-- заказчик: контакты водителя скрыты -->
        <div v-else class="grid gap-x-6 gap-y-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          <ModalField label="Водитель" readonly :value="rowData?.driver?.fio ?? ''" />
          <ModalField label="Номер водителя" readonly>
            <template #text>
              <span class="text-xs text-slate-400">{{ h.secretDriver.value }}</span>
            </template>
          </ModalField>
        </div>
      </ModalSection>

      <!-- ---------- ЗАМЕЧАНИЯ ОТ ДИСПЕТЧЕРА ---------- -->
      <section
        v-if="h.isDispatcherOrAdmin.value || h.hasDispatcherComments.value"
        class="bg-amber-50 rounded-xl border border-amber-200 px-4 py-4"
      >
        <h3 class="flex items-center gap-2 text-sm font-medium text-amber-900 mb-2">
          <i class="pi pi-exclamation-circle text-sm text-amber-600" />
          Замечания от диспетчера
        </h3>

        <Textarea
          v-if="h.isDispatcherOrAdmin.value"
          v-model="rowData.dispatcher_comments"
          class="w-full min-h-[100px] rounded-lg bg-white"
          placeholder="Что нужно поправить в заявке"
        />
        <p v-else class="text-sm text-amber-900 whitespace-pre-line break-words">
          {{ rowData?.dispatcher_comments }}
        </p>
      </section>
    </div>

    <!-- ================== ПОДВАЛ ================== -->
    <template #footer>
      <div class="w-full">
        <slot
          name="buttons"
          :data="rowData"
          :restriction="h.driverRestriction.value"
          :status="rowData?.status"
          :validate="h.validate"
          :run="runValidated"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import { Field } from 'vee-validate'

import RouteTab from '@/components/RouteTab/RouteTab.vue'
import RoutesContentAddOrder from '@/components/Routes/RoutesContentAddOrder.vue'
import RangeCalendar from '@/components/Calendar/RangeCalendar.vue'

import ModalCarSection from './ModalCarSection.vue'
import ModalSection from './ModalSection.vue'
import ModalField from './ModalField.vue'
import { useOrderModal } from './useOrderModal'

const props = defineProps({
  visible: { type: Boolean, default: false },
  rowData: { type: Object, default: () => ({}) },
  columns: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  state_order: { type: [Number, String], default: null },
})

const emit = defineEmits(['closeModal', 'deleteRoute', 'submit'])

const h = useOrderModal(props, emit)

// строковый ref для пикера машин — композабл держит его в h.carTComponent
const carTComponent = h.carTComponent

/**
 * Обёртка для кнопок из слота #buttons: сначала прогоняет валидацию,
 * и только если всё чисто — выполняет действие страницы.
 * Использование: <Button @click="run(() => transfer(data, 1))">
 */
async function runValidated(action) {
  const { valid } = await h.validate()
  if (!valid) return false
  await action?.()
  return true
}

function shortFio(fio) {
  if (!fio) return '—'
  const [f, i, o] = String(fio).trim().split(/\s+/)
  return [f, i && `${i[0]}.`, o && `${o[0]}.`].filter(Boolean).join(' ')
}

// podr приходит то строкой, то объектом справочника { otd: '...' }
const podrLabel = (podr) => (podr && typeof podr === 'object' ? podr.otd : podr) || '—'

defineExpose({
  podsvetkaCar: h.podsvetkaCar,
  validate: h.validate,
  resetForm: h.resetForm,
})
</script>

<style>
/* Dialog телепортируется в body, поэтому стили не scoped — namespace даёт .order-modal */

.order-modal .p-dialog-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgb(226, 232, 240);
}

.order-modal .p-dialog-content {
  padding: 0.75rem 1rem 1rem;
  background: rgb(248, 250, 252);
}

.order-modal .p-dialog-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid rgb(226, 232, 240);
  background: #fff;
}

.order-modal .p-dialog-footer button {
  margin: 0;
}

.order-modal .p-inputtext,
.order-modal .p-dropdown {
  border: 1px solid rgb(226, 232, 240);
  color: rgb(15, 23, 42);
}

.order-modal .p-inputtext::placeholder {
  color: rgb(148, 163, 184);
}

.order-modal .p-inputtext:focus,
.order-modal .p-dropdown:not(.p-disabled).p-focus {
  border-color: rgb(37, 99, 235);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  outline: none;
}

/* терминалы в цехах: палец, а не мышь */
@media (pointer: coarse) {
  .order-modal .p-button,
  .order-modal .p-inputtext,
  .order-modal .p-dropdown {
    min-height: 2.75rem;
  }
}
</style>

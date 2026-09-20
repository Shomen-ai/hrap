<!--
  ⚠ ЗАГЛУШКА ПЕСОЧНИЦЫ — В ПРОЕКТ НЕ КОПИРОВАТЬ.

  В avia-taxi-frontend этот файл уже есть и работает. Здесь он лежит только
  чтобы стенд собирался и чтобы был виден контракт, который ждут компоненты
  модалки: v-model = [Date, Date], пропсы disabled и placeholder.
-->
<template>
  <Calendar
    :model-value="range"
    selection-mode="range"
    show-time
    hour-format="24"
    date-format="dd.mm.yy"
    :disabled="disabled"
    :placeholder="placeholder"
    class="w-full"
    @update:model-value="onChange"
  />
</template>

<script setup>
import { computed } from 'vue'
import Calendar from 'primevue/calendar'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const range = computed(() =>
  (props.modelValue ?? []).filter(Boolean).map((d) => (d instanceof Date ? d : new Date(d)))
)

const onChange = (val) => emit('update:modelValue', val)
</script>

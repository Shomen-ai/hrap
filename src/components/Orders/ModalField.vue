<template>
  <div class="min-w-0" :class="wide ? 'col-span-full' : ''">
    <!-- лейбл -->
    <component
      :is="readonly ? 'span' : 'label'"
      :for="readonly ? null : name"
      class="flex items-center gap-1.5 mb-1 text-xs font-medium text-slate-500"
    >
      <span class="truncate">{{ label }}</span>
      <span v-if="!readonly && required" class="shrink-0 text-red-500">*</span>
    </component>

    <!-- режим чтения: значение текстом -->
    <div
      v-if="readonly"
      class="text-sm text-slate-900 break-words"
      :class="numeric ? 'tabular-nums' : ''"
    >
      <slot name="text">
        <span :class="{ 'text-slate-400': isEmpty }">{{ isEmpty ? '—' : value }}</span>
      </slot>
    </div>

    <!-- режим правки: контрол из слота -->
    <template v-else>
      <slot />
      <ErrorMessage v-if="name" :name="name" class="block mt-1 text-xs text-red-600" />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ErrorMessage } from 'vee-validate'

const props = defineProps({
  label: { type: String, required: true },
  // имя поля для vee-validate; по нему же выводится ErrorMessage
  name: { type: String, default: '' },
  // true — поле показывается текстом, а не контролом
  readonly: { type: Boolean, default: false },
  // значение для режима чтения (можно вместо него передать слот #text)
  value: { type: [String, Number], default: '' },
  // моноширинные цифры: номера, даты, телефоны
  numeric: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  // растянуть на всю ширину сетки
  wide: { type: Boolean, default: false },
})

const isEmpty = computed(
  () => props.value === '' || props.value === null || props.value === undefined
)
</script>

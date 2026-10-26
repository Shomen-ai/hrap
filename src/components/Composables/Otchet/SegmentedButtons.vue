<template>
  <div class="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === opt.value"
      class="h-8 px-3 rounded-md text-sm whitespace-nowrap transition-colors outline-none
             focus-visible:ring-2 focus-visible:ring-blue-500/40"
      :class="modelValue === opt.value
        ? 'bg-white text-slate-900 font-medium shadow-sm'
        : 'text-slate-600 hover:text-slate-900'"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
/**
 * Переключатель из нескольких вариантов: тип транспорта, период, режим.
 * Вместо ряда кнопок с синей заливкой из старых графиков.
 */
defineProps({
  modelValue: { type: [String, Number], default: null },
  // [{ value, label }]
  options: { type: Array, required: true },
})

defineEmits(['update:modelValue'])
</script>

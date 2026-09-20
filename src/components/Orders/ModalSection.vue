<template>
  <section class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <header class="px-4 h-12 flex items-center gap-3 border-b border-slate-100">
      <span class="shrink-0 size-7 rounded-lg grid place-items-center" :class="iconBg">
        <i :class="['pi', icon, 'text-xs', iconColor]" />
      </span>

      <h3 class="flex-1 min-w-0 font-medium text-slate-900 truncate">{{ title }}</h3>

      <span
        v-if="hint"
        class="shrink-0 hidden sm:block max-w-[45%] text-xs text-slate-400 truncate"
      >
        {{ hint }}
      </span>

      <slot name="header-right" />
    </header>

    <div class="px-4 py-4">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: 'pi-circle' },
  iconBg: { type: String, default: 'bg-slate-100' },
  iconColor: { type: String, default: 'text-slate-600' },
  // краткая сводка справа в шапке карточки
  hint: { type: String, default: '' },
})
</script>

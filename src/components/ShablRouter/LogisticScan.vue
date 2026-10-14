<template>
  <!-- ⚠ ЗАГЛУШКА ПЕСОЧНИЦЫ: в проекте это реальный сканер QR накладной. -->
  <div class="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5
              flex items-center gap-3 text-sm">
    <i class="pi pi-qrcode text-slate-400" />
    <span class="text-slate-500">Сканер накладной (заглушка)</span>
    <button
      type="button"
      class="ml-auto h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs
             text-slate-600 hover:border-blue-300"
      @click="emitFake"
    >
      Подставить точку
    </button>
  </div>
</template>

<script setup>
const emit = defineEmits(['updateData'])

function emitFake() {
  emit('updateData', { building: '12', cex: '102', x: '1006', y: '2010' })
}
</script>

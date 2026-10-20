<!--
  AutoWayAddRoute.vue — режим редактирования.

  Каскадные watcher'ы в этом файле не нужны: варианты считает optionsFor
  по уже выбранным полям, поэтому значения точки подставляются напрямую.
-->

<!-- ===================== template ===================== -->

<!-- ЗАМЕНИТЬ блок кнопок внизу формы (<div class="flex flex-wrap justify-end gap-2">) -->
<div class="flex flex-wrap justify-end gap-2">
  <Button
    v-if="isEditing"
    label="Отмена"
    severity="secondary"
    outlined
    class="h-11 rounded-lg"
    @click="cancel"
  />
  <Button
    :icon="isEditing ? 'pi pi-check' : 'pi pi-plus'"
    :label="submitLabel"
    :disabled="disabled"
    class="h-11 text-white border-none rounded-lg"
    :class="isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'"
    @click="submit"
  />
</div>

<!-- ===================== script ===================== -->
<script setup>
// ЗАМЕНИТЬ defineProps и defineEmits
const props = defineProps({
  disabled: { type: Boolean, default: false },
  // точка, которую редактируем (null — режим добавления)
  editPoint: { type: Object, default: null },
  inline: { type: Boolean, default: false },
})
const emit = defineEmits(['addPointInRoute', 'updatePointInRoute', 'cancelEdit'])

// ЗАМЕНИТЬ isEditing — сейчас он смотрит на props.editIndex, которого нет в пропсах
const isEditing = computed(() => !!props.editPoint)

// ЗАМЕНИТЬ title (submitLabel оставить как есть)
const title = computed(() => {
  if (isEditing.value) return `Редактирование: ${props.editPoint.route_name || 'точка'}`
  return 'Добавить точку'
})

// ДОБАВИТЬ после reset()
// optionsFor отдаёт варианты строками (.map(String)) — значения тоже приводим к строке,
// иначе Dropdown не найдёт совпадение и покажет пустое поле
const toOption = (v) => (v === null || v === undefined || v === '' ? null : String(v))

watch(
  () => props.editPoint,
  (p) => {
    if (!p) return
    newPoint.building = toOption(p.building)
    newPoint.department = toOption(p.department)
    newPoint.x_cord = toOption(p.x_cord)
    newPoint.y_cord = toOption(p.y_cord)
    newPoint.route_name = p.route_name ?? ''
    touched.value = false
    open.value = true
  },
  { immediate: true } // компонент монтируется уже с точкой — без immediate поля не заполнятся
)

// ЗАМЕНИТЬ submit и ДОБАВИТЬ cancel
function submit() {
  touched.value = true
  if (errors.value.length) return

  if (isEditing.value) emit('updatePointInRoute', { id: props.editPoint.id, ...buildPayload() })
  else emit('addPointInRoute', buildPayload())

  reset()
}

function cancel() {
  reset()
  emit('cancelEdit')
}
</script>

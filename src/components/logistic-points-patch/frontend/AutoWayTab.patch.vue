<!--
  AutoWayTab.vue — кнопки по ролям и форма редактирования, раскрывающаяся в карточке.
-->

<!-- ===================== template ===================== -->

<!-- ЗАМЕНИТЬ в верхней кнопке карточки: $emit('toggle', order.id) → route.id
     (order в этом компоненте нет — кусок из OrderCard) -->
@click="$emit('toggle', route.id)"

<!-- ЗАМЕНИТЬ кнопку редактирования (сейчас там $emit('toggle', order.id) и title «Удалить точку»).
     .stop — чтобы клик не долетал до кнопки карточки и не сворачивал её -->
<button
  v-if="canManage"
  type="button"
  class="shrink-0 flex justify-center items-center w-[20px] h-[20px] rounded-lg"
  :class="editing ? 'text-amber-600' : 'text-slate-500 hover:text-amber-600'"
  :title="editing ? 'Закрыть редактирование' : 'Редактировать точку'"
  @click.stop="$emit(editing ? 'cancelEdit' : 'edit', route.id)"
>
  <i class="pi text-sm" :class="editing ? 'pi-times' : 'pi-pencil'" />
</button>

<!-- ЗАМЕНИТЬ кнопку удаления -->
<button
  v-if="canManage"
  type="button"
  class="shrink-0 flex justify-center items-center w-[20px] h-[20px] rounded-lg text-red-500 hover:text-red-700 disabled:opacity-50"
  title="Удалить точку"
  :disabled="deleting"
  @click.stop="$emit('delete', route.id)"
>
  <i class="pi text-sm" :class="deleting ? 'pi-spin pi-spinner' : 'pi-trash'" />
</button>

<!-- ДОБАВИТЬ в конец <article>, перед </article>.
     Раскрытие через grid-rows 0fr → 1fr: height:auto CSS анимировать не умеет -->
<div
  class="grid transition-[grid-template-rows] duration-200 ease-out"
  :class="editing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
>
  <div class="overflow-hidden">
    <div v-if="editing" class="mt-3 pt-3 border-t border-slate-100">
      <AutoWayAddRoute
        inline
        :edit-point="route"
        @updatePointInRoute="$emit('update', $event)"
        @cancelEdit="$emit('cancelEdit')"
      />
    </div>
  </div>
</div>

<!-- По желанию: подсветить карточку в режиме редактирования — на <article> -->
:class="editing ? 'border-amber-300' : 'border-blue-200'"

<!-- ===================== script ===================== -->
<script setup>
// ДОБАВИТЬ импорты (computed, если его ещё нет)
import { computed } from 'vue'
import { useStore } from 'vuex'
import AutoWayAddRoute from '@/components/LogisticPoints/AutoWayAddRoute.vue'

// ЗАМЕНИТЬ defineProps / defineEmits
const props = defineProps({
  route: { type: Object, required: true },
  index: { type: Number, default: 0 },
  editing: { type: Boolean, default: false },
  deleting: { type: Boolean, default: false },
})
defineEmits(['toggle', 'edit', 'delete', 'update', 'cancelEdit'])

// ДОБАВИТЬ (если user / isAdmin / isDispatcher уже объявлены — оставить свои)
const store = useStore()
const user = computed(() => store.getters['AuthModule/getUser'])
const isAdmin = computed(() => store.getters['AuthModule/isAdmin'])
const isDispatcher = computed(() => store.getters['AuthModule/isDispatcher'])

// Number() с обеих сторон: из Oracle user_id приходит строкой, а user.id — числом,
// строгое === даёт false, и кнопки не показываются
const canManage = computed(
  () =>
    isAdmin.value ||
    (isDispatcher.value && Number(props.route.user_id) === Number(user.value?.id))
)
</script>

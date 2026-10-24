<template>
  <div class="container">
    <div class="main">
      <HeaderDispatcher></HeaderDispatcher>

      <div class="p-4">
        <ListPage
          :h="h"
          title="Разнарядка"
          search-placeholder="Гаражный номер, тип, водитель, смена, дата…"
          :loading="loading"
          empty-title="Назначений нет"
          empty-hint="Здесь появятся машины для разнарядки"
        >
          <template #default="{ items }">
            <AssignmentCard
              v-for="row in items"
              :key="row.id"
              :row="row"
              :draft="drafts[row.id] ?? null"
              :saving="savingId === row.id"
              :drivers="drivers"
              :work-modes="work_modes"
              :format-date="formatDate"
              @edit="startEdit"
              @cancel="cancelEdit"
              @save="saveEdit"
            />
          </template>
        </ListPage>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderDispatcher from '@/components/HeaderDispatcher.vue'
import ListPage from '@/components/Composables/ListPage/ListPage.vue'
import AssignmentCard from './AssignmentCard.vue'
import { useAssignments } from './useAssignments'

const {
  h,
  loading,
  drivers,
  work_modes,
  drafts,
  savingId,
  formatDate,
  startEdit,
  cancelEdit,
  saveEdit,
} = useAssignments()
</script>

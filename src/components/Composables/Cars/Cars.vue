<template>
  <div class="container">
    <div class="main">
      <HeaderDispatcher></HeaderDispatcher>

      <div class="p-4">
        <ListPage
          :h="h"
          title="Транспорт"
          search-placeholder="Гаражный номер, тип, марка, модель, статус…"
          export-file="Отчет.xlsx"
          :loading="loading"
          empty-title="Транспорта нет"
          empty-hint="Добавьте первую машину кнопкой «Добавить транспорт»"
        >
          <template #actions>
            <Button
              icon="pi pi-plus"
              label="Добавить транспорт"
              class="h-10 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg"
              @click="carModal.openNew()"
            />
          </template>

          <template #default="{ items }">
            <CarCard
              v-for="car in items"
              :key="car.id"
              :car="car"
              :open="h.isOpen(car.id)"
              @toggle="h.toggle"
              @edit="carModal.openEdit($event)"
              @delete="deleteCar($event.id)"
            />
          </template>
        </ListPage>
      </div>

      <CarModal ref="carModal" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'

import HeaderDispatcher from '@/components/HeaderDispatcher.vue'
import ListPage from '@/components/Composables/ListPage/ListPage.vue'
import CarCard from './CarCard.vue'
import CarModal from './CarModal.vue'
import { useCars } from './useCars'

const carModal = ref(null)

const { h, loading, deleteCar } = useCars()
</script>

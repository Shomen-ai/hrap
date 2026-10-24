<template>
  <div class="container">
    <div class="main">
      <HeaderDispatcher></HeaderDispatcher>

      <div class="p-4">
        <ListPage
          :h="h"
          title="Водители"
          search-placeholder="ФИО, логин, телефон, номер удостоверения, статус…"
          export-file="Отчет.xlsx"
          :loading="loading"
          empty-title="Водителей нет"
          empty-hint="Добавьте первого водителя кнопкой «Добавить водителя»"
        >
          <template #actions>
            <Button
              icon="pi pi-plus"
              label="Добавить водителя"
              class="h-10 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg"
              @click="driverModal.openNew()"
            />
          </template>

          <template #default="{ items }">
            <DriverCard
              v-for="driver in items"
              :key="driver.id"
              :driver="driver"
              :open="h.isOpen(driver.id)"
              @toggle="h.toggle"
              @edit="driverModal.openEdit($event)"
              @qr="downloadQRCodeImage($event)"
              @delete="deleteDriver($event.id, $event.login)"
            />
          </template>
        </ListPage>
      </div>

      <DriverModal ref="driverModal" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'

import HeaderDispatcher from '@/components/HeaderDispatcher.vue'
import ListPage from '@/components/Composables/ListPage/ListPage.vue'
import DriverCard from './DriverCard.vue'
import DriverModal from './DriverModal.vue'
import { downloadQRCodeImage } from './driverQr'
import { useDrivers } from './useDrivers'

const driverModal = ref(null)

const { h, loading, deleteDriver } = useDrivers()
</script>

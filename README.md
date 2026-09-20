# Модалка заявки и список заявок — АвиастарТакси

Переработанные компоненты для `avia-taxi-frontend`: модалка заявки (замена
`ModalComponent2.vue`), выбор машины (замена `CarT.vue`) и список заявок.
Копируются в проект как есть.

## Состав и что с чем делать на работе

### 🟢 НОВОЕ — просто скопировать

```
src/components/Orders/
  orderStatus.js         справочник статусов заявки, общий для списка и модалки
  useOrderModal.js       логика модалки
  useCarPicker.js        логика выбора машины + справочник статусов машин
  ModalSection.vue       карточка-секция
  ModalField.vue         поле: лейбл + значение текстом либо контрол
  ModalCarSection.vue    выбор машины
  OrderModal.vue         модалка заявки

src/components/RouteTab/
  RouteTab.vue           вид точки маршрута — переписан
```

`RouteTab.vue` заменяет текущий: карточка не раскрывается, всё видно сразу —
номер, место, путевой лист, диапазон дат, цех и координаты строкой,
комментарий диспетчеру. Справа две кнопки — карандаш и корзина.
События прежние: корзина шлёт `deletePoint` и `delete` с индексом,
карандаш — новое `edit` с индексом.

Деления точек на погрузку и выгрузку в интерфейсе больше нет нигде: ни подписей,
ни разных цветов, ни счётчика «N погр. · M выгр.» — вместо него число точек.
Поле `type` у точки осталось в данных, его по-прежнему заполняет
`RoutesContentAddOrder` (первая точка `loading`, остальные `unloading`), но
на экране оно никак не отражается. Если бэкенду оно не нужно — можно убрать
и оттуда.

### 🟡 ЗАМЕНА — кладётся поверх существующего

```
src/components/Orders/useOrdersList.js    было src/.../useOrdersList.js
src/components/Orders/MyOrdersList.vue    было src/.../MyOrdersList.vue
src/components/Orders/OrderCard.vue       без изменений, для полноты комплекта
```

`ModalCarSection.vue` заменяет `CarT.vue`, `OrderModal.vue` заменяет
`ModalComponent2.vue`. Старые файлы после переноса можно удалять вместе
с `StatusGrid.vue`, если он больше нигде не подключён.

### 🟠 СВЕРИТЬ — восстановлено по скриншоту

```
src/components/Routes/RoutesContentAddOrder.vue
```

Раскрывающаяся форма добавления точки маршрута. Собрана по скриншоту шага
«Выбор маршрута» из мастера создания заявки, твоего исходника мы не видели.
Скорее всего надо оставить свой файл и перенести отсюда только раскрывашку.

### 🔴 ЗАГЛУШКИ — НЕ КОПИРОВАТЬ, в проекте уже есть свои

```
src/assets/not_car.jpg
src/components/Calendar/RangeCalendar.vue
src/components/Composables/formatDate.js
src/components/Composables/uniqueValues.js
```

Написаны для стенда. В каждом файле шапка с предупреждением и описанием
контракта, который ждут компоненты модалки. Лежат в репозитории, чтобы
граф импортов был полным и было видно, на что именно завязана модалка.

Если скопировать их поверх рабочих — сломается то, что сейчас работает:
`formatDateDetailed` у тебя отдаёт другой формат (в `getLoadingDates` есть
проверка на `01.01.1970`, здесь её нет), `not_car.jpg` — настоящая
фотография, а не нарисованная заглушка.

## Что должно быть в проекте-хосте

Алиас `@` должен указывать на `src` — у тебя уже так.
Файлы-спутники (`not_car.jpg`, `formatDate`, `uniqueValues`, `RangeCalendar`,
`RouteTab`) в проекте есть, поэтому импорты разрешатся сами.

Зависимости: Vue 3, Vuex 4, PrimeVue 3, vee-validate 4 + @vee-validate/rules,
Tailwind 3.2+ (нужны `max-md:`, `size-*`, произвольные значения в `grid-cols-[…]`),
`xlsx-js-style` для экспорта списка.

Из стора читаются:

```
AuthModule.user.roles
OrdersModule: podrsSelect, driversSelect, driver_states, podrLoading,
              driversLoading, transport, order_type_id
OrdersModule: buildings, departments, coordsX, coordsY,
              favouriteRoutes, boundPoints      ← для RoutesContentAddOrder
CarsModule.carsSelect.types
OrdersModule/getCars, OrdersModule/setCars, OrdersModule/fetchCars,
OrdersModule/loadPodrs, OrdersModule/loadDrivers
AlbertOrdersStore/getOrders
```

## Подключение

`MyOrdersNew2.vue` (или та страница, что рендерит модалку):

```js
import OrderModal from '@/components/Orders/OrderModal.vue'
```

Пропсы и эмит прежние: `visible`, `rowData`, `columns`, `disabled`,
`state_order`, `@closeModal`. Слот `#buttons` теперь отдаёт `run` —
обёртку, которая валидирует форму перед действием:

```vue
<template #buttons="{ data, run }">
  <Button @click="run(() => transfer(data, 1))">Отправить диспетчеру</Button>
</template>
```

В `useOrdersList.js` таблица `STATUS` больше не живёт — она в `orderStatus.js`.

## Что сверить перед использованием

1. **`RoutesContentAddOrder.vue` восстановлен по скриншоту** шага «Выбор
   маршрута» из мастера создания заявки, оригинал мы не видели. Скорее всего
   надо оставить свой файл и перенести отсюда только раскрывашку.
2. **`getCarWorkMode` в `useCarPicker.js`** — имя поля с режимом работы машины
   угадано (`work_mode.mode` / `.name` / строка). Подставить настоящее.
3. **`onSubmit` и `deleteRoute` в `useOrderModal.js`** — заглушки. В оригинале
   `onSubmit` был, но его тела мы не видели; `deleteRoute` `RouteTab` слушал,
   а самой функции в компоненте не было.
4. **Комментарий диспетчеру в новой точке маршрута** эмитится полем
   `dispatcher_comment` — имя поля на бэке проверить, `comments` у точки занят
   строкой «Местоположение:…».
5. **Валидация телефонов заработала.** Правила `{ required, min, max }` у
   стационарного и мобильного номеров раньше стояли на `InputText`, у которого
   нет пропа `rules`, — то есть не работали. Теперь они на `<Field>`. Если в
   базе есть номера короче 5 и 7 символов, их владельцы упрутся в ошибку.
6. **Формула `disabled`.** Текущая `state_id > 2` для диспетчера работает
   наоборот: заявка в статусах 3 «Передана» и 4 «В процессе» становится
   read-only, а это ровно те статусы, в которых он и работает.

## Что осталось несделанным

- `MyOrdersList.vue` и `MyOrdersListDesktop.vue` не сведены в один файл, дубль
  надо удалить — адаптив держится на CSS-брейкпоинтах `OrderCard`.
- `w-36 shrink-0` у блока «номер + ФИО» в `OrderCard` на 360px схлопывает ФИО
  в многоточие почти всегда.
- Поиск в списке без debounce: фильтрация гоняет весь массив на каждый символ.

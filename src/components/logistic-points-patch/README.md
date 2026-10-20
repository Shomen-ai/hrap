# Логистические точки: создание, редактирование, удаление, поиск

Это не готовые файлы, а куски кода для вставки в существующие.
Каждый блок помечен:

- `ДОБАВИТЬ` — вставить, ничего не удаляя;
- `ЗАМЕНИТЬ` — найти указанный кусок в своём файле и заменить целиком.

## Что куда

| Файл здесь | Куда в проекте |
|---|---|
| `frontend/AuthModule.patch.js` | `avia-taxi-frontend/src/.../AuthModule.js` |
| `frontend/AutoWay.patch.vue` | `avia-taxi-frontend/src/components/LogisticPoints/AutoWay.vue` |
| `frontend/AutoWayTab.patch.vue` | `avia-taxi-frontend/src/components/LogisticPoints/AutoWayTab.vue` |
| `frontend/AutoWayAddRoute.patch.vue` | `avia-taxi-frontend/src/components/LogisticPoints/AutoWayAddRoute.vue` |
| `backend/Controller.patch.php` | контроллер, где лежит `createAutoWayPoint` |
| `backend/api.patch.php` | `avia-taxi-backend/routes/api.php` |

## Порядок

1. Бэкенд: маршруты и методы контроллера.
2. `AuthModule.js`: мутации, экшены, геттеры ролей.
3. `AutoWayAddRoute.vue`: режим редактирования.
4. `AutoWayTab.vue`: кнопки и раскрывающаяся форма.
5. `AutoWay.vue`: поиск и обработчики.

## Что подставить своё

- `ВашController` в `api.patch.php` — имя вашего контроллера.
- `routes_priemka` в `Cache::forget` — ключ из `Cache::remember` в GET-методе
  со списком точек. Если кэша нет, строку `Cache::forget` можно удалить.
- `'Диспетчер'` в геттере `isDispatcher` — точное имя роли из таблицы `roles`.

## Проверка после вставки

- Создать точку: появляется в списке без перезагрузки, после F5 тоже на месте.
- Карандаш: форма раскрывается в карточке, поля заполнены, «Сохранить» меняет
  точку, «Отмена» закрывает без изменений.
- Корзина: точка пропадает из списка, после F5 не возвращается.
- Поиск: «1б 250» находит точки корпуса 1Б, цеха 250.

Если после F5 удалённая точка вернулась или созданная пропала — не сброшен
кэш (см. ключ выше). Если удалённая сменилась другой с тем же корпусом/цехом/
координатами — это дедупликация `ROW_NUMBER ... rn = 1` в GET-запросе.

<?php

/*
 * ДОБАВИТЬ в routes/api.php — в ту же группу с auth-middleware,
 * где лежит GET-маршрут для routesPriemka (иначе $request->user() вернёт null).
 *
 * Все три — POST: DELETE на сервере не проходит.
 * Без слэша в конце: адрес со слэшем Laravel редиректит, и браузер
 * блокирует такой запрос (ошибка CORS "Redirect is not allowed for a preflight request").
 *
 * Если маршрут не находится (404 "route could not be found"):
 *   php artisan route:clear
 *   php artisan route:list --path=WayPoint
 */

Route::post('/createWayPoint', [ВашController::class, 'createAutoWayPoint']);
Route::post('/updateWayPoint', [ВашController::class, 'updateAutoWayPoint']);
Route::post('/deleteWayPoint', [ВашController::class, 'deleteAutoWayPoint']);

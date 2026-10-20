<?php

/*
 * ДОБАВИТЬ в начало контроллера (к остальным use), если их там нет:
 */
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\FavoriteUserRoute;

/*
 * ЗАМЕНИТЬ метод createAutoWayPoint и ДОБАВИТЬ рядом updateAutoWayPoint,
 * deleteAutoWayPoint и canManage.
 *
 * user_id — это ID пользователя (users.id), не логин:
 * внешний ключ TA_FAVORI_US_ROUT_US_ID_FK смотрит на id, с логином будет ORA-02291.
 */

// ключ из Cache::remember в GET-методе со списком точек; без кэша — убрать вызовы forgetRoutesCache()
private const ROUTES_CACHE_KEY = 'routes_priemka';

public function createAutoWayPoint(Request $request)
{
    $data = $request->validate($this->wayPointRules());

    $data['user_id'] = $request->user()->id;
    $data['type']    = 'my';

    $route = FavoriteUserRoute::create($data);

    $this->forgetRoutesCache();

    return response()->json(['route' => $route], 201);
}

public function updateAutoWayPoint(Request $request)
{
    $data = $request->validate(['id' => 'required|integer'] + $this->wayPointRules());

    $route = FavoriteUserRoute::findOrFail($data['id']);

    if (!$this->canManage($request, $route)) {
        return response()->json(['message' => 'Нельзя редактировать чужую точку'], 403);
    }

    unset($data['id']);              // user_id и type при редактировании не трогаем
    $route->update($data);

    $this->forgetRoutesCache();

    return response()->json(['route' => $route->fresh()]);
}

public function deleteAutoWayPoint(Request $request)
{
    $id = $request->validate(['id' => 'required|integer'])['id'];

    $route = FavoriteUserRoute::find($id);

    // уже удалена (второй клик, другая вкладка) — для пользователя это успех
    if (!$route) {
        return response()->json(['id' => (int) $id]);
    }

    if (!$this->canManage($request, $route)) {
        return response()->json(['message' => 'Нельзя удалить чужую точку'], 403);
    }

    $route->delete();

    $this->forgetRoutesCache();

    return response()->json(['id' => (int) $id]);
}

/* ---------- вспомогательные ---------- */

private function wayPointRules(): array
{
    return [
        'route_name' => 'required|string|max:255',
        'building'   => 'required|string|max:255',
        'department' => 'required|string|max:255',
        'x_cord'     => 'required|string|max:255',
        'y_cord'     => 'required|string|max:255',
    ];
}

// админ может всё, остальные — только свои точки
private function canManage(Request $request, FavoriteUserRoute $route): bool
{
    $user = $request->user();

    return $user->hasRole('Админ') || (int) $route->user_id === (int) $user->id;
}

private function forgetRoutesCache(): void
{
    Cache::forget(self::ROUTES_CACHE_KEY);
}

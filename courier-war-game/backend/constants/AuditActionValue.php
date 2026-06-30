<?php
declare(strict_types=1);

class AuditActionValue
{
    public const AUTH_REGISTER = 'auth_register';
    public const AUTH_LOGIN = 'auth_login';
    public const AUTH_GUEST = 'auth_guest';
    public const AUTH_REFRESH = 'auth_refresh';
    public const AUTH_LOGOUT = 'auth_logout';
    public const AUTH_GUEST_FORGET = 'auth_guest_forget';
    public const PROFILE_GET = 'profile_get';
    public const MAP_METADATA_GET = 'map_metadata_get';
    public const MAP_PREVIEW_GET = 'map_preview_get';
    public const MATCH_CREATE = 'match_create';
    public const MATCH_MAP_GET = 'match_map_get';
    public const MATCH_STATE_GET = 'match_state_get';
    public const MATCH_FORFEIT = 'match_forfeit';
    public const COURIER_MOVE = 'courier_move';
    public const COURIER_ABILITY = 'courier_ability';
    public const SABOTEUR_HURDLE = 'saboteur_hurdle';
    public const DRAW_OFFER = 'draw_offer';
    public const DRAW_RESPOND = 'draw_respond';
    public const RESULT_GET = 'result_get';

    public static function all(): array
    {
        return [
            self::AUTH_REGISTER,
            self::AUTH_LOGIN,
            self::AUTH_GUEST,
            self::AUTH_REFRESH,
            self::AUTH_LOGOUT,
            self::AUTH_GUEST_FORGET,
            self::PROFILE_GET,
            self::MAP_METADATA_GET,
            self::MAP_PREVIEW_GET,
            self::MATCH_CREATE,
            self::MATCH_MAP_GET,
            self::MATCH_STATE_GET,
            self::MATCH_FORFEIT,
            self::COURIER_MOVE,
            self::COURIER_ABILITY,
            self::SABOTEUR_HURDLE,
            self::DRAW_OFFER,
            self::DRAW_RESPOND,
            self::RESULT_GET,
        ];
    }
}

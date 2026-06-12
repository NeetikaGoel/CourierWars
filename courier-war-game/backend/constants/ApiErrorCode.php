<?php 
declare(strict_types=1);

//for storing the API error codes which will not be changed frequently
class ApiErrorCode 
{
    public const BAD_REQUEST = 'BAD_REQUEST'; // request JSON/field shape is invalid
    public const UNAUTHORIZED = 'UNAUTHORIZED'; // auth token is missing expired/invalid
    public const FORBIDDEN = 'FORBIDDEN'; // user is authenticated but not allowed
    public const NOT_FOUND = 'NOT_FOUND'; // requested resource does not exist
    public const STATE_CONFLICT = 'STATE_CONFLICT'; // state version/idempotency conflict
    public const UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE'; // Content-Type is wrong
    public const GAME_RULE_REJECTED = 'GAME_RULE_REJECTED'; // request is valid but game rule rejects it
    public const RATE_LIMITED = 'RATE_LIMITED'; // too many requests were sent
    public const INTERNAL_ERROR = 'INTERNAL_ERROR'; // unexpected backend error
    public const INVALID_CSRF_TOKEN = 'INVALID_CSRF_TOKEN'; // CSRF token validation failed
    public const TOKEN_EXPIRED = 'TOKEN_EXPIRED'; // JWT token expiry time has passed
    public const MATCH_STATE_MISSING = 'MATCH_STATE_MISSING'; // required cache match state is missing
    public const MAP_STATE_MISSING = 'MAP_STATE_MISSING'; // required cache map data is missing
    public const INVALID_TILE = 'INVALID_TILE'; // tile target is invalid
    public const INVALID_ROLE = 'INVALID_ROLE'; // user role is not valid for action
    public const HURDLE_COOLDOWN_ACTIVE = 'HURDLE_COOLDOWN_ACTIVE'; // selected hurdle is still on cooldown
    public const ENERGY_INSUFFICIENT = 'ENERGY_INSUFFICIENT'; // Saboteur energy is not enough
    public const ACTIVE_HURDLE_LIMIT_REACHED = 'ACTIVE_HURDLE_LIMIT_REACHED'; // max active hurdle count is reached
}

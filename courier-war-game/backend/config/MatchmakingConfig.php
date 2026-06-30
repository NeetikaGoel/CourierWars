<?php

declare(strict_types=1);

require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/../constants/DifficultyValue.php';

class MatchmakingConfig
{
    public const WAITING_QUEUE_TTL_SECONDS = 900; // waiting players expire after fifteen minutes

    public const REGISTERED_TIE_PRIORITY = 0; // registered users win exact timestamp ties

    public const GUEST_TIE_PRIORITY = 1; // guests lose exact timestamp ties

    public static function rolePreferenceIsValid(string $rolePreference): bool
    {
        return in_array($rolePreference, RoleValue::all(), true); // allows courier saboteur or any
    }

    public static function playableRoleIsValid(string $role): bool
    {
        return in_array($role, RoleValue::playable(), true); // allows only concrete playable roles
    }

    public static function difficultyIsValid(string $difficulty): bool
    {
        return in_array($difficulty, DifficultyValue::all(), true); // allows easy medium or hard
    }

    public static function oppositeRoleFor(string $role): ?string
    {
        if ($role === RoleValue::COURIER) {
            return RoleValue::SABOTEUR; // courier needs saboteur opponent
        }

        if ($role === RoleValue::SABOTEUR) {
            return RoleValue::COURIER; // saboteur needs courier opponent
        }

        return null; // any is not a final assigned role
    }

    public static function queueRoleListForPreference(string $rolePreference): array
    {
        if ($rolePreference === RoleValue::COURIER) {
            return [RoleValue::COURIER]; // player only wants courier
        }

        if ($rolePreference === RoleValue::SABOTEUR) {
            return [RoleValue::SABOTEUR]; // player only wants saboteur
        }

        if ($rolePreference === RoleValue::ANY) {
            return RoleValue::playable(); // backend may choose either role
        }

        return []; // invalid preference has no queue target
    }

    public static function tiePriorityForGuestFlag(bool $isGuest): int
    {
        return $isGuest ? self::GUEST_TIE_PRIORITY : self::REGISTERED_TIE_PRIORITY; // turns guest flag into sortable priority
    }
}

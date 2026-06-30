<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../cache/CacheServerClient.php';
require_once __DIR__ . '/../cache/CacheServerKeyFactory.php';
require_once __DIR__ . '/../cache/CacheServerTtlConfig.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/RoleValue.php';

class MatchStateService
{
    private CacheServerClient $_cacheServerClient; // reads and writes active match state

    public function __construct(?CacheServerClient $cacheServerClient = null)
    {
        $this->_cacheServerClient = $cacheServerClient ?? new CacheServerClient(); // uses shared cache client
    }

    public function matchStateGet(int $matchId): ?array
    {
        $value = $this->_cacheServerClient->cacheGet(CacheServerKeyFactory::matchStateKey($matchId)); // reads cached state

        return is_array($value) ? $value : null; // returns null when match state is missing
    }

    public function matchStateRequire(int $matchId): array
    {
        $state = $this->matchStateGet($matchId); // loads state from cache

        if ($state === null) {
            throw new RuntimeException('match state was not found'); // active match cannot continue without state
        }

        return $state; // returns valid match state
    }

    public function matchStateStore(array $matchState): void
    {
        $matchId = (int)($matchState[MatchStateFieldName::MATCH_ID] ?? 0); // reads match id from state
        $timerTotalMs = (int)($matchState[MatchStateFieldName::TIMER_TOTAL_MS] ?? 0); // reads ttl base from timer

        if ($matchId <= 0) {
            throw new RuntimeException('match state is missing match id'); // prevents broken cache keys
        }

        $stored = $this->_cacheServerClient->cacheSet(
            CacheServerKeyFactory::matchStateKey($matchId),
            $matchState,
            CacheServerTtlConfig::activeMatchTtlSeconds($timerTotalMs)
        );

        if (!$stored) {
            throw new RuntimeException('match state could not be stored'); // exposes cache write failure
        }
    }

    public function participantRoleRequire(AuthContext $authContext, array $matchState): string
    {
        $userId = $authContext->getUserId(); // authenticated identity is authoritative
        $courierUserId = $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::USER_ID] ?? null; // reads courier user
        $saboteurUserId = $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::USER_ID] ?? null; // reads saboteur user

        if ($courierUserId === $userId) {
            return RoleValue::COURIER; // caller is courier participant
        }

        if ($saboteurUserId === $userId) {
            return RoleValue::SABOTEUR; // caller is saboteur participant
        }

        throw new DomainException('user is not a participant in this match'); // prevents cross-match access
    }

    public function stateVersionFreshRequire(array $matchState, int $knownStateVersion): void
    {
        $serverStateVersion = (int)($matchState[MatchStateFieldName::STATE_VERSION] ?? 0); // reads server version

        if ($knownStateVersion !== $serverStateVersion) {
            throw new RuntimeException('known state version is stale'); // rejects stale mutating actions
        }
    }

    public function stateVersionIncrement(array $matchState): array
    {
        $currentVersion = (int)($matchState[MatchStateFieldName::STATE_VERSION] ?? 0); // reads current version
        $matchState[MatchStateFieldName::STATE_VERSION] = MatchConfig::nextStateVersion($currentVersion); // bumps version

        return $matchState; // returns updated state
    }
}

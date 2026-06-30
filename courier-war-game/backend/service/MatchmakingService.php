<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../cache/CacheServerClient.php';
require_once __DIR__ . '/../cache/CacheServerKeyFactory.php';
require_once __DIR__ . '/../cache/CacheServerTtlConfig.php';
require_once __DIR__ . '/../config/MatchmakingConfig.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/../utility/HashFactory.php';

class MatchmakingService
{
    private CacheServerClient $_cacheServerClient; // owns queue cache access

    public function __construct(?CacheServerClient $cacheServerClient = null)
    {
        $this->_cacheServerClient = $cacheServerClient ?? new CacheServerClient(); // creates cache client
    }

    public function opponentFind(AuthContext $authContext, string $rolePreference, string $difficulty): ?array
    {
        foreach (MatchmakingConfig::queueRoleListForPreference($rolePreference) as $currentRole) {
            $opponentRole = MatchmakingConfig::oppositeRoleFor($currentRole); // finds role needed for current player

            if ($opponentRole === null) {
                continue; // skips invalid role
            }

            $queue = $this->queueGet($opponentRole, $difficulty); // reads opposite-role queue
            $opponent = $this->firstDifferentPlayerGet($queue, $authContext); // avoids matching same user/session

            if ($opponent === null) {
                continue; // tries next possible role for any preference
            }

            $this->queueStore($opponentRole, $difficulty, $this->queueWithoutMatch($queue, (int)$opponent['matchId'])); // removes matched player

            return [
                'currentRole' => $currentRole, // role assigned to caller
                'opponentRole' => $opponentRole, // role assigned to waiting player
                'opponent' => $opponent, // waiting player queue item
            ];
        }

        return null; // no compatible waiting player found
    }

    public function waitingPlayerStore(AuthContext $authContext, int $matchId, string $assignedRole, string $rolePreference, string $difficulty): void
    {
        $queue = $this->queueGet($assignedRole, $difficulty); // reads current queue

        $queue = $this->queueWithoutUser($queue, $authContext->getUserId()); // prevents duplicate queue entries for same user

        $queue[] = [
            'matchId' => $matchId, // waiting match id first player already owns
            'userId' => $authContext->getUserId(), // authenticated user id
            'sidHash' => HashFactory::sha256($authContext->getSessionId()), // hashed session id
            'username' => $authContext->getUsername(), // display/debug identity
            'name' => $authContext->getName(), // optional display name
            'assignedRole' => $assignedRole, // concrete role this user is waiting as
            'requestedRole' => $rolePreference, // original preference from request
            'difficulty' => $difficulty, // queue group difficulty
            'isGuest' => $authContext->isGuest(), // tie priority input
            'requestedAtMs' => Clock::unixMilliseconds(), // first come first serve timestamp
            'tiePriority' => MatchmakingConfig::tiePriorityForGuestFlag($authContext->isGuest()), // registered users win ties
        ];

        usort($queue, function (array $left, array $right): int {
            $timeCompare = ((int)$left['requestedAtMs']) <=> ((int)$right['requestedAtMs']); // earlier request first

            if ($timeCompare !== 0) {
                return $timeCompare; // preserves first come first serve
            }

            return ((int)$left['tiePriority']) <=> ((int)$right['tiePriority']); // registered before guest on exact tie
        });

        $this->queueStore($assignedRole, $difficulty, $queue); // writes updated queue
    }

    private function queueGet(string $role, string $difficulty): array
    {
        $value = $this->_cacheServerClient->cacheGet(CacheServerKeyFactory::matchmakingWaitingKey($role, $difficulty)); // reads queue

        return is_array($value) ? $value : []; // missing queue means empty queue
    }

    private function queueStore(string $role, string $difficulty, array $queue): void
    {
        $stored = $this->_cacheServerClient->cacheSet(
            CacheServerKeyFactory::matchmakingWaitingKey($role, $difficulty),
            array_values($queue),
            CacheServerTtlConfig::waitingMatchTtlSeconds()
        );

        if (!$stored) {
            throw new RuntimeException('matchmaking queue could not be stored'); // exposes cache write failure
        }
    }

    private function firstDifferentPlayerGet(array $queue, AuthContext $authContext): ?array
    {
        foreach ($queue as $item) {
            if (!is_array($item)) {
                continue; // skips malformed entries
            }

            if ((int)($item['userId'] ?? 0) === $authContext->getUserId()) {
                continue; // prevents self-match
            }

            return $item; // returns first compatible waiting item
        }

        return null; // no compatible item
    }

    private function queueWithoutMatch(array $queue, int $matchId): array
    {
        return array_values(array_filter($queue, function ($item) use ($matchId): bool {
            return (int)($item['matchId'] ?? 0) !== $matchId; // removes exact waiting match
        }));
    }

    private function queueWithoutUser(array $queue, int $userId): array
    {
        return array_values(array_filter($queue, function ($item) use ($userId): bool {
            return (int)($item['userId'] ?? 0) !== $userId; // removes old queue entries for same user
        }));
    }
}

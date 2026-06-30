<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchRouteParamName.php';

// shared validator for route params like {matchId}

class MatchPathValidator
{
    public function matchIdFromPathParamsGet(array $pathParams): int
    {
        $rawMatchId = $pathParams[MatchRouteParamName::MATCH_ID] ?? null; // reads match id from route params

        return $this->matchIdRequire($rawMatchId); // validates and returns match id
    }

    public function matchIdRequire(mixed $rawMatchId): int
    {
        if (!is_string($rawMatchId) && !is_int($rawMatchId)) {
            throw new InvalidArgumentException('match id is required'); // rejects missing or wrong type
        }

        $matchIdText = trim((string)$rawMatchId); // normalizes value to string

        if ($matchIdText === '') {
            throw new InvalidArgumentException('match id is required'); // rejects empty value
        }

        if (!ctype_digit($matchIdText)) {
            throw new InvalidArgumentException('match id must be numeric'); // rejects non numeric value
        }

        $matchId = (int)$matchIdText; // converts numeric string to integer

        if ($matchId < MatchConfig::MATCH_ID_MIN || $matchId > MatchConfig::MATCH_ID_MAX) {
            throw new InvalidArgumentException('match id is out of range'); // rejects unsafe range
        }

        return $matchId; // returns validated match id
    }
}

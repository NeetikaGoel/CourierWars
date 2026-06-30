<?php
declare(strict_types=1);


//validates match creation body and polling query params

require_once __DIR__ . '/../config/MapGenerationConfig.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../config/MatchmakingConfig.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/CommonFieldValidator.php';

class MatchRequestValidator
{
    private CommonFieldValidator $_commonFieldValidator; // shared string validator

    public function __construct(?CommonFieldValidator $commonFieldValidator = null)
    {
        $this->_commonFieldValidator = $commonFieldValidator ?? new CommonFieldValidator(); // creates default common validator
    }

    public function matchCreateValidate(array $body): array
    {
        $difficulty = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::DIFFICULTY); // reads difficulty

        $rolePreference = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::ROLE_PREFERENCE); // reads role preference

        $mapVersion = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::MAP_VERSION); // reads map version

        $mapGenerationVersion = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::MAP_GENERATION_VERSION); // reads generator version

        if (!MatchmakingConfig::difficultyIsValid($difficulty)) {
            throw new InvalidArgumentException('difficulty is invalid'); // rejects invalid difficulty
        }

        if (!MatchmakingConfig::rolePreferenceIsValid($rolePreference)) {
            throw new InvalidArgumentException('role preference is invalid'); // rejects invalid role preference
        }

        if ($mapVersion !== MapGenerationConfig::MAP_VERSION) {
            throw new InvalidArgumentException('map version is invalid'); // rejects unsupported map version
        }

        if ($mapGenerationVersion !== MapGenerationConfig::MAP_GENERATION_VERSION) {
            throw new InvalidArgumentException('map generation version is invalid'); // rejects unsupported generator version
        }

        return [
            MatchRequestFieldName::DIFFICULTY => $difficulty, // returns validated difficulty
            MatchRequestFieldName::ROLE_PREFERENCE => $rolePreference, // returns validated role preference
            MatchRequestFieldName::MAP_VERSION => $mapVersion, // returns validated map version
            MatchRequestFieldName::MAP_GENERATION_VERSION => $mapGenerationVersion, // returns validated generator version
        ];
    }

    public function statePollValidate(array $queryParams): array
    {
        $knownVersionRaw = $queryParams[MatchRequestFieldName::KNOWN_VERSION] ?? null; // reads optional known version

        $knownVersion = $this->optionalUnsignedIntGet(
            $knownVersionRaw,
            MatchRequestFieldName::KNOWN_VERSION,
            MatchConfig::STATE_VERSION_MIN,
            MatchConfig::STATE_VERSION_MAX,
            MatchConfig::STATE_VERSION_MIN
        ); // validates known version with zero default

        return [
            MatchRequestFieldName::KNOWN_VERSION => $knownVersion, // returns validated known version
        ];
    }

    private function optionalUnsignedIntGet(mixed $value, string $fieldName, int $min, int $max, int $default): int
    {
        if ($value === null || $value === '') {
            return $default; // returns default when optional value is missing
        }

        if (is_int($value)) {
            $intValue = $value; // accepts integer value
        } elseif (is_string($value) && ctype_digit(trim($value))) {
            $intValue = (int)trim($value); // accepts numeric query string
        } else {
            throw new InvalidArgumentException($fieldName . ' must be an unsigned integer'); // rejects unsafe value
        }

        if ($intValue < $min || $intValue > $max) {
            throw new InvalidArgumentException($fieldName . ' is out of range'); // rejects unsafe range
        }

        return $intValue; // returns validated integer
    }
}

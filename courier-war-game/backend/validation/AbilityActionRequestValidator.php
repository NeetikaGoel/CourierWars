<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/AbilityConfig.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/CommonFieldValidator.php';

// validates courier ability body before ability service checks cooldown and role rules

class AbilityActionRequestValidator
{
    private CommonFieldValidator $_commonFieldValidator; // shared string validator

    public function __construct(?CommonFieldValidator $commonFieldValidator = null)
    {
        $this->_commonFieldValidator = $commonFieldValidator ?? new CommonFieldValidator(); // creates default common validator
    }

    public function abilityValidate(array $body): array
    {
        $clientActionId = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::CLIENT_ACTION_ID); // reads action id

        $this->clientActionIdRequire($clientActionId); // validates action id

        $knownStateVersion = $this->requiredUnsignedIntGet($body, MatchRequestFieldName::KNOWN_STATE_VERSION, MatchConfig::STATE_VERSION_MIN, MatchConfig::STATE_VERSION_MAX); // reads known state version

        $abilityType = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::ABILITY_TYPE); // reads ability type

        if (!AbilityConfig::abilityExists($abilityType)) {
            throw new InvalidArgumentException('ability type is invalid'); // rejects unsupported ability
        }

        return [
            MatchRequestFieldName::CLIENT_ACTION_ID => $clientActionId, // returns validated action id
            MatchRequestFieldName::KNOWN_STATE_VERSION => $knownStateVersion, // returns validated known state version
            MatchRequestFieldName::ABILITY_TYPE => $abilityType, // returns validated ability type
        ];
    }

    private function clientActionIdRequire(string $clientActionId): void
    {
        if (!MatchConfig::clientActionIdLooksValid($clientActionId)) {
            throw new InvalidArgumentException('client action id is invalid'); // rejects unsafe action id
        }
    }

    private function requiredUnsignedIntGet(array $body, string $fieldName, int $min, int $max): int
    {
        if (!array_key_exists($fieldName, $body)) {
            throw new InvalidArgumentException($fieldName . ' is required'); // rejects missing field
        }

        $value = $body[$fieldName]; // reads raw value

        if (!is_int($value)) {
            throw new InvalidArgumentException($fieldName . ' must be an integer'); // rejects non integer json value
        }

        if ($value < $min || $value > $max) {
            throw new InvalidArgumentException($fieldName . ' is out of range'); // rejects unsafe range
        }

        return $value; // returns validated integer
    }
}

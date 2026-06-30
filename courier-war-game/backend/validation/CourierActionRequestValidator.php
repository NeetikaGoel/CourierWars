<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/MapGenerationConfig.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/DirectionValue.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/CommonFieldValidator.php';

// validates courier move body shape before movement service checks game rules

class CourierActionRequestValidator
{
    private CommonFieldValidator $_commonFieldValidator; // shared string validator

    public function __construct(?CommonFieldValidator $commonFieldValidator = null)
    {
        $this->_commonFieldValidator = $commonFieldValidator ?? new CommonFieldValidator(); // creates default common validator
    }

    public function moveValidate(array $body): array
    {
        $clientActionId = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::CLIENT_ACTION_ID); // reads action id

        $this->clientActionIdRequire($clientActionId); // validates action id

        $knownStateVersion = $this->requiredUnsignedIntGet($body, MatchRequestFieldName::KNOWN_STATE_VERSION, MatchConfig::STATE_VERSION_MIN, MatchConfig::STATE_VERSION_MAX); // reads known state version

        $from = $this->tilePointRequire($body, MatchRequestFieldName::FROM); // reads from tile

        $to = $this->tilePointRequire($body, MatchRequestFieldName::TO); // reads target tile

        $direction = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::DIRECTION); // reads movement direction

        if (!in_array($direction, DirectionValue::movementOnly(), true)) {
            throw new InvalidArgumentException('direction is invalid'); // rejects invalid movement direction
        }

        return [
            MatchRequestFieldName::CLIENT_ACTION_ID => $clientActionId, // returns validated action id
            MatchRequestFieldName::KNOWN_STATE_VERSION => $knownStateVersion, // returns validated known state version
            MatchRequestFieldName::FROM => $from, // returns validated from tile
            MatchRequestFieldName::TO => $to, // returns validated target tile
            MatchRequestFieldName::DIRECTION => $direction, // returns validated direction
        ];
    }

    private function clientActionIdRequire(string $clientActionId): void
    {
        if (!MatchConfig::clientActionIdLooksValid($clientActionId)) {
            throw new InvalidArgumentException('client action id is invalid'); // rejects unsafe action id
        }
    }

    private function tilePointRequire(array $body, string $fieldName): array
    {
        if (!isset($body[$fieldName]) || !is_array($body[$fieldName])) {
            throw new InvalidArgumentException($fieldName . ' tile point is required'); // rejects missing tile object
        }

        $tilePoint = $body[$fieldName]; // stores tile object

        $x = $this->requiredUnsignedIntGet($tilePoint, MatchRequestFieldName::X, 0, MapGenerationConfig::MAP_WIDTH_TILES - 1); // validates x coordinate

        $y = $this->requiredUnsignedIntGet($tilePoint, MatchRequestFieldName::Y, 0, MapGenerationConfig::MAP_HEIGHT_TILES - 1); // validates y coordinate

        return [
            MatchRequestFieldName::X => $x, // returns validated x
            MatchRequestFieldName::Y => $y, // returns validated y
        ];
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

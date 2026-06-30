<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/CommonFieldValidator.php';

class DrawActionRequestValidator
{
    private CommonFieldValidator $_commonFieldValidator;

    public function __construct(?CommonFieldValidator $commonFieldValidator = null)
    {
        $this->_commonFieldValidator = $commonFieldValidator ?? new CommonFieldValidator();
    }

    public function offerValidate(array $body): array
    {
        $clientActionId = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::CLIENT_ACTION_ID);
        $this->clientActionIdRequire($clientActionId);

        $knownStateVersion = $this->requiredUnsignedIntGet($body, MatchRequestFieldName::KNOWN_STATE_VERSION, MatchConfig::STATE_VERSION_MIN, MatchConfig::STATE_VERSION_MAX);

        return [
            MatchRequestFieldName::CLIENT_ACTION_ID => $clientActionId,
            MatchRequestFieldName::KNOWN_STATE_VERSION => $knownStateVersion,
        ];
    }

    public function respondValidate(array $body): array
    {
        $validatedBody = $this->offerValidate($body);
        $validatedBody[MatchRequestFieldName::ACCEPTED] = $this->requiredBoolGet($body, MatchRequestFieldName::ACCEPTED);

        return $validatedBody;
    }

    private function clientActionIdRequire(string $clientActionId): void
    {
        if (!MatchConfig::clientActionIdLooksValid($clientActionId)) {
            throw new InvalidArgumentException('client action id is invalid');
        }
    }

    private function requiredBoolGet(array $body, string $fieldName): bool
    {
        if (!array_key_exists($fieldName, $body) || !is_bool($body[$fieldName])) {
            throw new InvalidArgumentException($fieldName . ' must be a boolean');
        }

        return $body[$fieldName];
    }

    private function requiredUnsignedIntGet(array $body, string $fieldName, int $min, int $max): int
    {
        if (!array_key_exists($fieldName, $body) || !is_int($body[$fieldName])) {
            throw new InvalidArgumentException($fieldName . ' must be an integer');
        }

        if ($body[$fieldName] < $min || $body[$fieldName] > $max) {
            throw new InvalidArgumentException($fieldName . ' is out of range');
        }

        return $body[$fieldName];
    }
}

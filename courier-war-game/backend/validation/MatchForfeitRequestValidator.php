<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/CommonFieldValidator.php';

class MatchForfeitRequestValidator
{
    private CommonFieldValidator $_commonFieldValidator;

    public function __construct(?CommonFieldValidator $commonFieldValidator = null)
    {
        $this->_commonFieldValidator = $commonFieldValidator ?? new CommonFieldValidator();
    }

    public function forfeitValidate(array $body): array
    {
        $clientActionId = $this->_commonFieldValidator->requiredStringGet($body, MatchRequestFieldName::CLIENT_ACTION_ID);
        $this->clientActionIdRequire($clientActionId);

        return [
            MatchRequestFieldName::CLIENT_ACTION_ID => $clientActionId,
        ];
    }

    private function clientActionIdRequire(string $clientActionId): void
    {
        if (!MatchConfig::clientActionIdLooksValid($clientActionId)) {
            throw new InvalidArgumentException('client action id is invalid');
        }
    }
}

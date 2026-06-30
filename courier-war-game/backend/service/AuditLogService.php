<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/AppConfig.php';
require_once __DIR__ . '/../constants/AuditActionValue.php';
require_once __DIR__ . '/../constants/AuditOutcomeValue.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/../utility/JsonSafeEncoder.php';

class AuditLogService
{
    public function success(?AuthContext $authContext, string $action, string $requestId, array $context = []): void
    {
        $this->writeSafe('INFO', $authContext, $action, AuditOutcomeValue::SUCCESS, $requestId, null, $context); // logs successful audited action
    }

    public function failure(?AuthContext $authContext, string $action, string $requestId, string $errorCode, array $context = []): void
    {
        $this->writeSafe('WARN', $authContext, $action, AuditOutcomeValue::FAILURE, $requestId, $errorCode, $context); // logs rejected or failed audited action
    }

    private function writeSafe(string $level, ?AuthContext $authContext, string $action, string $outcome, string $requestId, ?string $errorCode, array $context): void
    {
        try {
            $this->actionRequire($action); // rejects unknown audit action names

            error_log(JsonSafeEncoder::encode([
                'timestamp' => Clock::isoUtcNow(), // utc audit timestamp
                'level' => $level, // audit severity
                'service' => AppConfig::APP_NAME, // service name
                'component' => 'audit', // searchable audit component marker
                'requestId' => $requestId, // request correlation id
                'playerId' => $authContext?->getUserId(), // authenticated player id when available
                'sessionIdHash' => $authContext === null ? null : hash('sha256', $authContext->getSessionId()), // hashed session id only
                'action' => $action, // stable audited action
                'outcome' => $outcome, // success or failure
                'errorCode' => $errorCode, // stable error code on failure
                'context' => $this->contextSanitize($context), // safe extra fields
            ]));
        } catch (Throwable) {
            error_log('audit log write failed'); // audit failure must not break gameplay request
        }
    }

    private function actionRequire(string $action): void
    {
        if (!in_array($action, AuditActionValue::all(), true)) {
            throw new InvalidArgumentException('audit action is invalid'); // protects audit vocabulary
        }
    }

    private function contextSanitize(array $context): array
    {
        $safe = []; // stores safe context values

        foreach ($context as $key => $value) {
            $safe[$this->stringSanitize((string)$key)] = $this->valueSanitize($value); // sanitizes keys and values
        }

        return $safe;
    }

    private function valueSanitize(mixed $value): mixed
    {
        if (is_array($value)) {
            return $this->contextSanitize($value); // sanitizes nested arrays
        }

        if (is_string($value)) {
            return $this->stringSanitize($value); // removes log-breaking characters
        }

        if (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
            return $value; // keeps scalar json-safe values
        }

        return '[redacted]'; // rejects objects and resources
    }

    private function stringSanitize(string $value): string
    {
        return substr(str_replace(["\r", "\n", "\t"], ' ', $value), 0, 256); // prevents log injection and long fields
    }
}

<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../cache/CacheServerClient.php';
require_once __DIR__ . '/../cache/CacheServerKeyFactory.php';
require_once __DIR__ . '/../cache/CacheServerTtlConfig.php';
require_once __DIR__ . '/../utility/HashFactory.php';
require_once __DIR__ . '/../utility/JsonSafeEncoder.php';

class IdempotencyService
{
    private CacheServerClient $_cacheServerClient; // talks to the custom cache server

    public function __construct(?CacheServerClient $cacheServerClient = null)
    {
        $this->_cacheServerClient = $cacheServerClient ?? new CacheServerClient(); // uses real cache client by default
    }

    public function cachedResponseGet(AuthContext $authContext, string $idempotencyKey, array $payload): ?array
    {
        $cacheKey = $this->cacheKeyCreate($authContext, $idempotencyKey); // builds user-session scoped idempotency key
        $cachedValue = $this->_cacheServerClient->cacheGet($cacheKey); // reads existing idempotency record

        if (!is_array($cachedValue)) {
            return null; // no previous request exists
        }

        $payloadHash = $this->payloadHashCreate($payload); // hashes current request body

        if (($cachedValue['payloadHash'] ?? '') !== $payloadHash) {
            throw new RuntimeException('idempotency key was already used for a different request'); // prevents key reuse abuse
        }

        $response = $cachedValue['response'] ?? null; // reads saved response

        return is_array($response) ? $response : null; // returns only valid cached response arrays
    }

    public function responseStore(AuthContext $authContext, string $idempotencyKey, array $payload, array $response): void
    {
        $cacheKey = $this->cacheKeyCreate($authContext, $idempotencyKey); // builds cache key for this session and action
        $payloadHash = $this->payloadHashCreate($payload); // stores hash so retries must match original payload

        $stored = $this->_cacheServerClient->cacheSet(
            $cacheKey,
            [
                'payloadHash' => $payloadHash, // allows duplicate same request
                'response' => $response, // returns exact first response on retry
            ],
            CacheServerTtlConfig::idempotencyTtlSeconds()
        );

        if (!$stored) {
            throw new RuntimeException('idempotency response could not be stored'); // makes cache failure visible
        }
    }

    private function cacheKeyCreate(AuthContext $authContext, string $idempotencyKey): string
    {
        $sidHash = HashFactory::sha256($authContext->getSessionId()); // avoids storing raw session id in cache key

        return CacheServerKeyFactory::idempotencyKey($sidHash, $idempotencyKey); // uses existing key factory
    }

    private function payloadHashCreate(array $payload): string
    {
        return HashFactory::sha256(JsonSafeEncoder::encodeMixed($payload)); // hashes normalized json payload
    }
}

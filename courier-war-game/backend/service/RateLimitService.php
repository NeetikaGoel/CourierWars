<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../cache/CacheServerClient.php';
require_once __DIR__ . '/../cache/CacheServerKeyFactory.php';
require_once __DIR__ . '/../cache/CacheServerTtlConfig.php';
require_once __DIR__ . '/../constants/RateLimitBucketValue.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/../utility/HashFactory.php';

class RateLimitExceededException extends RuntimeException
{
    private int $_retryAfterSeconds; // tells client how long to wait before retry

    public function __construct(int $retryAfterSeconds, string $message = 'too many requests')
    {
        parent::__construct($message); // stores safe public error message

        $this->_retryAfterSeconds = $retryAfterSeconds; // stores retry hint for response header
    }

    public function getRetryAfterSeconds(): int
    {
        return $this->_retryAfterSeconds; // returns retry-after seconds
    }
}

class RateLimitUnavailableException extends RuntimeException {}

class RateLimitService
{
    private const WINDOW_SECONDS = 1; // fixed window size used for prototype rate checks

    private const RETRY_AFTER_SECONDS = 1; // small retry delay because window is one second

    private const LIMIT_PER_WINDOW_DEFAULT = 10; // conservative fallback for unknown safe buckets

    private const LIMITS_PER_WINDOW = [
        RateLimitBucketValue::MATCHMAKING => 5,
        RateLimitBucketValue::POLL => 4,
        RateLimitBucketValue::MATCH_FORFEIT => 2,
        RateLimitBucketValue::COURIER_MOVE => 8,
        RateLimitBucketValue::COURIER_ABILITY => 4,
        RateLimitBucketValue::SABOTEUR_HURDLE => 4,
        RateLimitBucketValue::DRAW => 3,
        RateLimitBucketValue::RESULT => 4,
    ];

    private CacheServerClient $_cacheServerClient; // stores rate counters in shared cache

    public function __construct(?CacheServerClient $cacheServerClient = null)
    {
        $this->_cacheServerClient = $cacheServerClient ?? new CacheServerClient(); // uses existing cache client
    }

    public function rateLimitRequire(AuthContext $authContext, string $bucket): void
    {
        try {
            $this->bucketRequire($bucket); // rejects invalid bucket names before cache use

            $windowId = $this->windowIdGet(); // gets current fixed rate-limit window
            $cacheKey = $this->cacheKeyGet($authContext, $bucket, $windowId); // creates per-session per-bucket key
            $payload = $this->counterPayloadGet($cacheKey); // reads existing counter payload
            $count = (int)($payload['count'] ?? 0); // defaults missing counter to zero
            $limit = $this->limitForBucket($bucket); // gets configured bucket limit

            if ($count >= $limit) {
                throw new RateLimitExceededException(self::RETRY_AFTER_SECONDS); // stops request before service logic
            }

            $stored = $this->_cacheServerClient->cacheSet(
                $cacheKey,
                [
                    'count' => $count + 1, // stores incremented request count
                    'windowId' => $windowId, // stores window for debugging
                    'updatedAtSec' => Clock::unixSeconds(), // stores server update time
                ],
                CacheServerTtlConfig::rateLimitTtlSeconds()
            );

            if (!$stored) {
                throw new RateLimitUnavailableException('rate limiter could not store counter'); // prevents silent limiter failure
            }
        } catch (RateLimitExceededException $exception) {
            throw $exception; // keeps expected 429 path intact
        } catch (RateLimitUnavailableException $exception) {
            throw $exception; // keeps cache failure path intact
        } catch (RuntimeException $exception) {
            throw new RateLimitUnavailableException('rate limiter is unavailable', 0, $exception); // hides cache internals from controllers
        }
    }

    private function bucketRequire(string $bucket): void
    {
        if (!in_array($bucket, RateLimitBucketValue::all(), true)) {
            throw new InvalidArgumentException('rate limit bucket is invalid'); // protects cache key namespace
        }
    }

    private function counterPayloadGet(string $cacheKey): array
    {
        $payload = $this->_cacheServerClient->cacheGet($cacheKey); // reads cached counter

        return is_array($payload) ? $payload : []; // treats missing or malformed value as empty counter
    }

    private function cacheKeyGet(AuthContext $authContext, string $bucket, int $windowId): string
    {
        $sidHash = HashFactory::sha256($authContext->getSessionId()); // avoids storing raw session id in cache key

        return CacheServerKeyFactory::rateLimitKey($sidHash, $bucket . ':' . $windowId); // scopes counter to bucket and window
    }

    private function windowIdGet(): int
    {
        return intdiv(Clock::unixSeconds(), self::WINDOW_SECONDS); // groups requests into fixed windows
    }

    private function limitForBucket(string $bucket): int
    {
        return self::LIMITS_PER_WINDOW[$bucket] ?? self::LIMIT_PER_WINDOW_DEFAULT; // returns known limit or safe default
    }
}

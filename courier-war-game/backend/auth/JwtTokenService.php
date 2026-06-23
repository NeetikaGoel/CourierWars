<?php
declare(strict_types=1);

//so how do we start writing this
//ofc import first
require_once __DIR__ . '/JwtSigner.php';
require_once __DIR__ . '/JwtVerifier.php';
require_once __DIR__ . '/../config/JwtConfig.php';
require_once __DIR__ . '/../constants/AuthTokenTypeValue.php';
require_once __DIR__ . '/../constants/JwtClaimName.php';
require_once __DIR__ . '/../utility/Clock.php';

//so what will this file do
//its service file so???
//so this service will create and validate access and refresh jwt tokens
class JwtTokenService
{
    //firstly creating obj 
    private JwtSigner $_jwtSigner; // signs jwt tokens
    private JwtVerifier $_jwtVerifier; // verifies jwt tokens

    //now ofc constructor creating jwt helpers
    public function __construct(?JwtSigner $jwtSigner = null, ?JwtVerifier $jwtVerifier = null)
    {
        $this->_jwtSigner = $jwtSigner ?? new JwtSigner();
        $this->_jwtVerifier = $jwtVerifier ?? new JwtVerifier();
    }

    //now finally creating the access token here
    public function accessTokenCreate(int $userId, string $sessionId, string $tokenId, string $userType, ?string $displayName): string
    {
        return $this->tokenCreate($userId, $sessionId, $tokenId, AuthTokenTypeValue::ACCESS, $userType, $displayName, JwtConfig::accessTokenExpirySeconds());
    }

    //now finally creating the refresh token here
    public function refreshTokenCreate(int $userId, string $sessionId, string $tokenId, string $userType, ?string $displayName): string
    {
        return $this->tokenCreate($userId, $sessionId, $tokenId, AuthTokenTypeValue::REFRESH, $userType, $displayName, JwtConfig::refreshTokenExpirySeconds());
    }

    //this verifies access token and returns claims
    public function accessTokenClaimsVerify(string $token): ?array
    {
        return $this->tokenClaimsVerify($token, AuthTokenTypeValue::ACCESS);
    }

    //this verifies refresh token and returns claims
    public function refreshTokenClaimsVerify(string $token): ?array
    {
        return $this->tokenClaimsVerify($token, AuthTokenTypeValue::REFRESH);
    }

    //this creates token by common claim rules
    private function tokenCreate(int $userId, string $sessionId, string $tokenId, string $tokenType, string $userType, ?string $displayName, int $expirySeconds): string
    {
        $issuedAt = Clock::unixSeconds();
        $expiresAt = $issuedAt + $expirySeconds;
        $claims = [
            JwtClaimName::ISSUER => JwtConfig::issuer(),
            JwtClaimName::AUDIENCE => JwtConfig::audience(),
            JwtClaimName::SUBJECT => (string)$userId,
            JwtClaimName::SESSION_ID => $sessionId,
            JwtClaimName::TOKEN_ID => $tokenId,
            JwtClaimName::TOKEN_TYPE => $tokenType,
            JwtClaimName::USER_TYPE => $userType,
            JwtClaimName::ISSUED_AT => $issuedAt,
            JwtClaimName::EXPIRES_AT => $expiresAt,
            JwtClaimName::DISPLAY_NAME => $displayName,
        ];
        return $this->_jwtSigner->tokenSign($claims);
    }

    //this will verigfy token claims by expected type
    private function tokenClaimsVerify(string $token, string $expectedTokenType): ?array
    {
        $claims = $this->_jwtVerifier->tokenVerify($token);
        if ($claims === null) {
            return null;
        }
        if (($claims[JwtClaimName::ISSUER] ?? null) !== JwtConfig::issuer()) {
            return null;
        }
        if (($claims[JwtClaimName::AUDIENCE] ?? null) !== JwtConfig::audience()) {
            return null;
        }
        if (($claims[JwtClaimName::TOKEN_TYPE] ?? null) !== $expectedTokenType) {
            return null;
        }
        if (!$this->requiredStringClaimsExist($claims)) {
            return null;
        }

        $expiresAt = (int)($claims[JwtClaimName::EXPIRES_AT] ?? 0);
        if ($expiresAt + JwtConfig::JWT_LEEWAY_SECONDS < Clock::unixSeconds()) {
            return null;
        }
        return $claims;
    }

    //akso we need to check after that that required string claims exist or not
    private function requiredStringClaimsExist(array $claims): bool
    {
        $requiredClaimNames = [
            JwtClaimName::SUBJECT,
            JwtClaimName::SESSION_ID,
            JwtClaimName::TOKEN_ID,
            JwtClaimName::USER_TYPE,
        ];

        //now fro loop for all claims
        foreach ($requiredClaimNames as $claimName) 
        {
            if (!isset($claims[$claimName]) || !is_string($claims[$claimName]) || trim($claims[$claimName]) === '') {
                return false;
            }
        }
        return true;
    }
}

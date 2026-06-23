<?php
declare(strict_types=1);

//firstly imports
require_once __DIR__ . '/../config/JwtConfig.php';
require_once __DIR__ . '/../constants/JwtFormatValue.php';
require_once __DIR__ . '/../constants/JwtHeaders.php';
require_once __DIR__ . '/../utility/JsonSafeEncoder.php';

//this service verifies jwt signature and returns claims
class JwtVerifier
{
    //this will be verifying token format sign adn algo
    public function tokenVerify(string $jwt): ?array
    {
        $parts = explode(JwtFormatValue::TOKEN_PART_SEPARATOR, $jwt);
        if (count($parts) !== JwtFormatValue::TOKEN_PART_COUNT) {
            return null;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        //decoding all , we need to put that function later just use anythign rn
        $headerJson = $this->base64UrlDecode($headerEncoded);
        $payloadJson = $this->base64UrlDecode($payloadEncoded);
        $signature = $this->base64UrlDecode($signatureEncoded);

        if ($headerJson === null || $payloadJson === null || $signature === null) {
            return null;
        }

        $header = JsonSafeEncoder::decodeToArray($headerJson);
        $claims = JsonSafeEncoder::decodeToArray($payloadJson);

        if ($header === null || $claims === null) {
            return null;
        }

        if (($header[JwtHeaders::SIGNING_ALGORITHM] ?? null) !== JwtConfig::JWT_ALGORITHM) {
            return null;
        }

        if (($header[JwtHeaders::TOKEN_TYPE] ?? null) !== JwtHeaders::TOKEN_TYPE_JWT) {
            return null;
        }

        $signingInput = $headerEncoded . JwtFormatValue::TOKEN_PART_SEPARATOR . $payloadEncoded;
        $expectedSignature = hash_hmac(JwtConfig::JWT_HMAC_HASH_ALGORITHM, $signingInput, $this->jwtSecretGet(), true);

        //jsut check if it is equal , it hsould be ofc
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        return $claims;
    }

    //now ofc the cute function we left
    //not cute but okay
    //so decoding of jwt base64url value
    private function base64UrlDecode(string $value): ?string
    {
        $base64 = strtr(
            $value,
            JwtFormatValue::BASE64_URL_SAFE_CHAR_LIST,
            JwtFormatValue::BASE64_STANDARD_CHAR_LIST
        );

        $paddingLength = JwtFormatValue::BASE64_BLOCK_SIZE - (strlen($base64) % JwtFormatValue::BASE64_BLOCK_SIZE);

        if ($paddingLength < JwtFormatValue::BASE64_BLOCK_SIZE) {
            $base64 .= str_repeat(JwtFormatValue::BASE64_PADDING_CHAR, $paddingLength);
        }

        $decoded = base64_decode($base64, true);

        return $decoded === false ? null : $decoded;
    }

    //now same as signeer getting jwt secret and rejecting unsafe missing secret
    private function jwtSecretGet(): string
    {
        $secret = JwtConfig::secret();

        if (strlen($secret) < JwtConfig::JWT_SECRET_LENGTH_MIN) {
            throw new RuntimeException('JWT secret is not configured!!');
        }

        return $secret;
    }
}

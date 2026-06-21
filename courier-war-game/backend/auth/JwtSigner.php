<?php
declare(strict_types=1);

//firstly imports
require_once __DIR__ . '/../config/JwtConfig.php';
require_once __DIR__ . '/../constants/JwtFormatValue.php';
require_once __DIR__ . '/../constants/JwtHeaders.php';
require_once __DIR__ . '/../utility/JsonSafeEncoder.php';

//now what this file will be for
//correct for signing jwt tokens using hs256 algo
class JwtSigner
{
    //creating signed jwt string from claims
    public function tokenSign(array $claims): string
    {
        //first making header
        $header = [
            JwtHeaders::SIGNING_ALGORITHM => JwtConfig::JWT_ALGORITHM,
            JwtHeaders::TOKEN_TYPE => JwtHeaders::TOKEN_TYPE_JWT,
        ];

        //now encoding
        $headerEncoded = $this->base64UrlEncode(JsonSafeEncoder::encode($header));
        $payloadEncoded = $this->base64UrlEncode(JsonSafeEncoder::encode($claims));

        $signingInput = $headerEncoded . JwtFormatValue::TOKEN_PART_SEPARATOR . $payloadEncoded;
        $signature = hash_hmac(JwtConfig::JWT_HMAC_HASH_ALGORITHM, $signingInput, $this->jwtSecretGet(), true);
        $signatureEncoded = $this->base64UrlEncode($signature);

        return $signingInput . JwtFormatValue::TOKEN_PART_SEPARATOR . $signatureEncoded;
    }

    //now to make function that was used in this class
    //first creating base64url value used by jwt
    private function base64UrlEncode(string $value): string
    {
        return rtrim(
            strtr(
                base64_encode($value),
                JwtFormatValue::BASE64_STANDARD_CHAR_LIST,
                JwtFormatValue::BASE64_URL_SAFE_CHAR_LIST
            ),
            JwtFormatValue::BASE64_PADDING_CHAR
        );
    }

    //now getting jwt secret and rejecting any unsafe missing secret
    private function jwtSecretGet(): string
    {
        $secret = JwtConfig::secret();
        if (strlen($secret) < JwtConfig::JWT_SECRET_LENGTH_MIN) {
            throw new RuntimeException('JWT secret is not configured!!');
        }
        return $secret;
    }
}

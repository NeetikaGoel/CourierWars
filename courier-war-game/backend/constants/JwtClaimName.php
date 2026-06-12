<?php
declare(strict_types=1);

//jwt=signed json object

// iss = issuer, who created token
// aud = audience, who token is for
// sub = subject, usually user id
// jti = token id
// iat = issued at
// exp = expires at


//this class is for storing JWT claim names that will be used in access and refresh tokens
final class JwtClaimName
{
    public const ISSUER = 'iss'; // token issuer
    public const AUDIENCE = 'aud'; // token audience
    public const SUBJECT = 'sub'; // user id as token subject
    public const SESSION_ID = 'sid'; // session id
    public const TOKEN_ID = 'jti'; // unique token id
    public const TOKEN_TYPE = 'typ'; // access or refresh type
    public const USER_TYPE = 'userType'; // registered or guest
    public const ISSUED_AT = 'iat'; // issued-at timestamp
    public const EXPIRES_AT = 'exp'; // expiry timestamp
    public const DISPLAY_NAME = 'name'; // display name if needed
}

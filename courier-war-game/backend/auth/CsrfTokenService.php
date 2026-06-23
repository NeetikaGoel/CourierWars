<?php
declare(strict_types=1);

//imports first as always
require_once __DIR__ . '/../config/CsrfConfig.php';
require_once __DIR__ . '/../utility/HashFactory.php';

//since we r doing csrf thing
//this will create and verify those tokens
//we need some functions now damnnnnn
//another file hashfactory we need ohhhh
class CsrfTokenService
{
    //first of all crating a browser readable csrf token
    public function csrfTokenCreate(): string
    {
        return HashFactory::randomHex(CsrfConfig::CSRF_TOKEN_LENGTH_BYTES);
    }

    //we also need to hash csrf token before storing it in session metadata coz why
    //coz yes 
    public function csrfTokenHashCreate(string $csrfToken): string
    {
        return HashFactory::sha256($csrfToken);
    }

    //now who will verify csrf token with stored hash
    //ofc meeeeeeee
    public function csrfTokenVerify(string $csrfToken, string $expectedHash): bool
    {
        if (strlen($csrfToken) < CsrfConfig::CSRF_TOKEN_MIN_LENGTH || strlen($csrfToken) > CsrfConfig::CSRF_TOKEN_MAX_LENGTH) {
            return false;
        }
        return HashFactory::hashEquals($expectedHash, HashFactory::sha256($csrfToken));
    }
}

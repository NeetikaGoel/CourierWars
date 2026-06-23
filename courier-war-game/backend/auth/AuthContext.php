<?php
declare(strict_types=1);

//this file will have the object that will represent authenticated user for any request!
class AuthContext
{
    //first always variables
    //so what variables do we need here
    //yeah we need help ofc
    private int $_userId; // authenticated user id from validated token
    private string $_username; // username loaded from session metadata
    private ?string $_name; // display name loaded from session metadata
    private bool $_isGuest; // tells if user is guest or not hehe
    private string $_sessionId; // current session id from jwt
    private string $_accessTokenId; // current access token id from jwt
    private string $_csrfTokenHash; // csrf token hash from session metadata

    //now constructor time finalllyyy the cutest job of all time!!!
    public function __construct(int $userId, string $username, ?string $name, bool $isGuest, string $sessionId, string $accessTokenId, string $csrfTokenHash)
    {
        $this->_userId = $userId;
        $this->_username = $username;
        $this->_name = $name;
        $this->_isGuest = $isGuest;
        $this->_sessionId = $sessionId;
        $this->_accessTokenId = $accessTokenId;
        $this->_csrfTokenHash = $csrfTokenHash;
    }

    //now guess what
    //correct- some of the getters hehe
    //not some dear, all!!!!!!!
    
    public function getUserId(): int
    {
        return $this->_userId;
    }

    public function getUsername(): string
    {
        return $this->_username;
    }

    public function getName(): ?string
    {
        return $this->_name;
    }

    //now checks for user type
    public function isGuest(): bool
    {
        return $this->_isGuest;
    }

    public function isRegistered(): bool
    {
        return !$this->_isGuest;
    }

    //rest of getters
    public function getSessionId(): string
    {
        return $this->_sessionId;
    }

    public function getAccessTokenId(): string
    {
        return $this->_accessTokenId;
    }

    public function getCsrfTokenHash(): string
    {
        return $this->_csrfTokenHash;
    }
}

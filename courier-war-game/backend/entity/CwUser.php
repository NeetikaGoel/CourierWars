<?php
declare(strict_types=1);

//this entity represents 1 row from cw_users table
class CwUser
{
    private int $_userId; // primary user id from table
    private string $_username; // unique username for registered user/generated guest username
    private ?string $_name; // display name shown in game UI, could be null also ofcccc
    private ?string $_email; // registered user email, null for guests hehe
    private ?string $_passwordHash; // registered user password hash, null for guests hehe
    private string $_createdAt; // row creation timestamp from db
    private string $_updatedAt; // row last update timestamp from db

    //now it will be constructor to create user entity from db row values!!
    public function __construct(int $userId, string $username, ?string $name, ?string $email, ?string $passwordHash, string $createdAt, string $updatedAt)
    {
        $this->_userId = $userId;
        $this->_username = $username;
        $this->_name = $name;
        $this->_email = $email;
        $this->_passwordHash = $passwordHash;
        $this->_createdAt = $createdAt;
        $this->_updatedAt = $updatedAt;
    }

    //now its time for getters and setters for each coz variabels are pvt ofc!!!

    //user id
    public function getUserId(): int
    {
        return $this->_userId;
    }

    public function setUserId(int $userId): void
    {
        $this->_userId = $userId;
    }

    //user name now hehe
    public function getUsername(): string
    {
        return $this->_username;
    }

    public function setUsername(string $username): void
    {
        $this->_username = $username;
    }

    //name time!!
    public function getName(): ?string
    {
        return $this->_name;
    }

    public function setName(?string $name): void
    {
        $this->_name = $name;
    }

    //email 
    public function getEmail(): ?string
    {
        return $this->_email;
    }

    public function setEmail(?string $email): void
    {
        $this->_email = $email;
    }

    //the pw hash now
    public function getPasswordHash(): ?string
    {
        return $this->_passwordHash;
    }

    public function setPasswordHash(?string $passwordHash): void
    {
        $this->_passwordHash = $passwordHash;
    }

    //for times now

    public function getCreatedAt(): string
    {
        return $this->_createdAt;
    }

    public function setCreatedAt(string $createdAt): void
    {
        $this->_createdAt = $createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->_updatedAt;
    }

    public function setUpdatedAt(string $updatedAt): void
    {
        $this->_updatedAt = $updatedAt;
    }

    //other helper functions now like for guest and reg one hehe
    //guest user means email and password hash are both null so put a check for taht
    public function isGuest(): bool
    {
        return $this->_email === null && $this->_passwordHash === null;
    }

    //registered user means email and password hash are both present so check for that toooooo
    public function isRegistered(): bool
    {
        return $this->_email !== null && $this->_passwordHash !== null;
    }
}

<?php
declare(strict_types=1);

require_once __DIR__ . '/../OrmManager.php'; 
require_once __DIR__ . '/../query/CwUserQuery.php'; 
require_once __DIR__ . '/../mapper/CwUserMapper.php'; 

//this repository handles database actions for cw_users table
class CwUserRepository
{
    private OrmManager $ormManager; // orm manager object for db operations
    private CwUserMapper $cwUserMapper; // mapper object for converting rows to entities

    //constructor creates required helper objects
    public function __construct()
    {
        $this->ormManager = new OrmManager(); 
        $this->cwUserMapper = new CwUserMapper(); 
    }

    //creates registered user and returns created user id
    public function createRegisteredUser(string $username, ?string $name, string $email, string $passwordHash): int
    {
        return $this->ormManager->insertQuery(
            CwUserQuery::insertRegisteredUser(), // sql for registered user insert
            'ssss', // username name email passwordHash
            [$username, $name, $email, $passwordHash] // values to insert
        );
    }

    //creates guest user and returns created user id
    public function createGuestUser(string $username, ?string $name): int
    {
        return $this->ormManager->insertQuery(
            CwUserQuery::insertGuestUser(), // sql for guest user insert
            'ss', // username name
            [$username, $name] // values to insert
        );
    }

    //finds user by user id
    public function findByUserId(int $userId): ?CwUser
    {
        return $this->ormManager->ormManageForOneRow(
            CwUserQuery::selectByUserId(), // sql for selecting by user id
            'i', // user id type
            [$userId], // user id value
            $this->cwUserMapper // mapper for user row
        );
    }

    //finds user by username
    public function findByUsername(string $username): ?CwUser
    {
        return $this->ormManager->ormManageForOneRow(
            CwUserQuery::selectByUsername(), // sql for selecting by username
            's', // username type
            [$username], // username value
            $this->cwUserMapper // mapper for user row
        );
    }

    //finds user by email
    public function findByEmail(string $email): ?CwUser
    {
        return $this->ormManager->ormManageForOneRow(
            CwUserQuery::selectByEmail(), // sql for selecting by email
            's', // email type
            [$email], // email value
            $this->cwUserMapper // mapper for user row
        );
    }

    //finds registered user by username or email for login
    public function findRegisteredByIdentifier(string $identifier): ?CwUser
    {
        return $this->ormManager->ormManageForOneRow(
            CwUserQuery::selectRegisteredByIdentifier(), // sql for login lookup
            'ss', // identifier used twice
            [$identifier, $identifier], // username or email values
            $this->cwUserMapper // mapper for user row
        );
    }

    //updates user display name
    public function updateName(int $userId, ?string $name): void
    {
        $this->ormManager->runQuery(
            CwUserQuery::updateNameByUserId(), // sql for updating name
            'si', // name userId
            [$name, $userId] // values to bind
        );
    }

    //deletes user by user id, mainly for guest cleanup
    public function deleteByUserId(int $userId): void
    {
        $this->ormManager->runQuery(
            CwUserQuery::deleteByUserId(), // sql for deleting user
            'i', // user id type
            [$userId] // user id value
        );
    }
}

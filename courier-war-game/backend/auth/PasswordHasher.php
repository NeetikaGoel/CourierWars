<?php
declare(strict_types=1);

//for pw hashing and verification
class PasswordHasher
{
    //this hashes plain pw before storing it in database
    public function passwordHashCreate(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    //this will verify login password against stored hash
    public function passwordVerify(string $password, string $passwordHash): bool
    {
        return password_verify($password, $passwordHash);
    }

    //hehe this oto done!!
}

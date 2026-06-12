<?php
declare(strict_types=1);

//this file stores SQL queries for cw_users table
class CwUserQuery
{
    //query to create a new registered user
    public static function insertRegisteredUser(): string
    {
        return 'INSERT INTO cw_users (username, name, email, password_hash) VALUES (?,?,?,?)';
    }

    //query to create guest user
    public static function insertGuestUser(): string
    {
        return 'INSERT INTO cw_users (username, name) VALUES (?,?)';
    }

    //query to get user by user id
    public static function selectByUserId(): string
    {
        return 'SELECT user_id, username, name, email, password_hash, created_at, updated_at FROM cw_users WHERE user_id=? LIMIT 1';
    }

    //query to get user by username
    public static function selectByUsername(): string
    {
        return 'SELECT user_id, username, name, email, password_hash, created_at, updated_at FROM cw_users WHERE username=? LIMIT 1';
    }

    //query to get user by email
    public static function selectByEmail(): string
    {
        return 'SELECT user_id, username, name, email, password_hash, created_at, updated_at FROM cw_users WHERE email=? LIMIT 1';
    }

    //query to get registered user by username or email for login
    public static function selectRegisteredByIdentifier(): string
    {
        return 'SELECT user_id, username, name, email, password_hash, created_at, updated_at FROM cw_users WHERE (username=? OR email=?) AND email IS NOT NULL AND password_hash IS NOT NULL LIMIT 1';
    }

    //query to update user display name
    public static function updateNameByUserId(): string
    {
        return 'UPDATE cw_users SET name=? WHERE user_id=?';
    }

    //query to delete user by user id, mainly for guest cleanup if no completed match exists
    public static function deleteByUserId(): string
    {
        return 'DELETE FROM cw_users WHERE user_id=?';
    }
}

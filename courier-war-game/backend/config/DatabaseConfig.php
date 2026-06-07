<?php
declare(strict_types=1);

class DatabaseConfig
{
    public const DATABASE_CHARSET = 'utf8mb4';
    public const DATABASE_COLLATION = 'utf8mb4_0900_ai_ci';
    public const DATABASE_NAME_DEFAULT = 'courier_war';
    public const DATABASE_PORT_DEFAULT = 3306; // default MySQL port
    public const DATABASE_TIMEOUT_SECONDS_DEFAULT = 5; // default DB connection timeout
    public const HOST_DEFAULT = '127.0.0.1';
    public const USERNAME_DEFAULT = 'root';
    public const PASSWORD_DEFAULT = 'work';

    //for returning mysql host
    public static function host(): string 
    {
        return getenv('DB_HOST') ?: self::HOST_DEFAULT; 
    }

    //for getting mysql port
    public static function port(): int 
    {
        return (int) (getenv('DB_PORT') ?: self::DATABASE_PORT_DEFAULT);
    }

    //to get db name
    public static function databaseName(): string
    {
        return getenv('DB_NAME') ?: self::DATABASE_NAME_DEFAULT;
    }

    //for mysql username 
    public static function username(): string 
    {
        return getenv('DB_USERNAME') ?: self::USERNAME_DEFAULT;
    }

    //for the pw
    public static function password(): string 
    {
        return getenv('DB_PASSWORD') ?: self::PASSWORD_DEFAULT; 
    }

    //for charset
    public static function charset(): string 
    {
        return self::DATABASE_CHARSET;
    }

    //to get collation of db
    public static function collation(): string
    {
        return self::DATABASE_COLLATION;
    }

    //timeout of db = 5 sec
    public static function timeoutSeconds(): int 
    {
        return (int) (getenv('DB_TIMEOUT_SECONDS') ?: self::DATABASE_TIMEOUT_SECONDS_DEFAULT); 
    }
}

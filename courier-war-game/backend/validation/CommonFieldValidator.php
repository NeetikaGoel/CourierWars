<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/UserFieldLimit.php';

//this validator has common field checks that will be used by req validators
class CommonFieldValidator
{
    //so first to read required string field
    public function requiredStringGet(array $body, string $fieldName): string
    {
        if (!isset($body[$fieldName]) || !is_string($body[$fieldName])) {
            throw new InvalidArgumentException($fieldName . ' is required');
        }

        $value = trim($body[$fieldName]);

        if ($value === '') {
            throw new InvalidArgumentException($fieldName . ' is required');
        }

        return $value;
    }

    //to read optional string field
    public function optionalStringGet(array $body, string $fieldName): ?string
    {
        if (!array_key_exists($fieldName, $body) || $body[$fieldName] === null) {
            return null;
        }

        if (!is_string($body[$fieldName])) {
            throw new InvalidArgumentException($fieldName . ' must be a string');
        }

        $value = trim($body[$fieldName]);

        return $value === '' ? null : $value;
    }

    //to checks string length
    public function stringLengthRequire(string $value, string $fieldName, int $minLength, int $maxLength): void
    {
        $length = strlen($value);

        if ($length < $minLength || $length > $maxLength) {
            throw new InvalidArgumentException($fieldName . ' length is invalid');
        }
    }

    //to check the username format
    public function usernameRequire(string $username): void
    {
        $this->stringLengthRequire($username, 'username', UserFieldLimit::USERNAME_LENGTH_MIN, UserFieldLimit::USERNAME_LENGTH_MAX);

        if (preg_match(UserFieldLimit::USERNAME_REGEX, $username) !== 1) {
            throw new InvalidArgumentException('username format is invalid');
        }
    }

    //to check the email format
    public function emailRequire(string $email): string
    {
        $email = strtolower(trim($email));

        $this->stringLengthRequire($email, 'email', UserFieldLimit::EMAIL_LENGTH_MIN, UserFieldLimit::EMAIL_LENGTH_MAX);

        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            throw new InvalidArgumentException('email format is invalid');
        }

        return $email;
    }

    //to check pw length
    public function passwordRequire(string $password): void
    {
        $this->stringLengthRequire($password, 'password', UserFieldLimit::PASSWORD_LENGTH_MIN, UserFieldLimit::PASSWORD_LENGTH_MAX);
    }

    //now to check optional display name length
    public function nameRequire(?string $name): ?string
    {
        if ($name === null) {
            return null;
        }

        $this->stringLengthRequire($name, 'name', UserFieldLimit::NAME_LENGTH_MIN, UserFieldLimit::NAME_LENGTH_MAX);

        return $name;
    }
}

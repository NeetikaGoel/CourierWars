<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/AuthRequestFieldName.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/CommonFieldValidator.php';

//this validator is needed to validate auth request bodies
class AuthRequestValidator
{
    private CommonFieldValidator $_commonFieldValidator;

    //now a constructor to create the common validator
    public function __construct(?CommonFieldValidator $commonFieldValidator = null)
    {
        $this->_commonFieldValidator = $commonFieldValidator ?? new CommonFieldValidator();
    }

    //validation of regsiter request
    public function registerValidate(array $body): array
    {
        $username = $this->_commonFieldValidator->requiredStringGet($body, AuthRequestFieldName::USERNAME);
        $email = $this->_commonFieldValidator->requiredStringGet($body, AuthRequestFieldName::EMAIL);
        $password = $this->_commonFieldValidator->requiredStringGet($body, AuthRequestFieldName::PASSWORD);
        $name = $this->_commonFieldValidator->optionalStringGet($body, AuthRequestFieldName::NAME);
        $preferredRole = $this->_commonFieldValidator->optionalStringGet($body, AuthRequestFieldName::PREFERRED_ROLE) ?? RoleValue::ANY;

        $this->_commonFieldValidator->usernameRequire($username);
        $email = $this->_commonFieldValidator->emailRequire($email);
        $this->_commonFieldValidator->passwordRequire($password);
        $name = $this->_commonFieldValidator->nameRequire($name);
        $this->rolePreferenceRequire($preferredRole);

        return [
            AuthRequestFieldName::USERNAME => $username,
            AuthRequestFieldName::EMAIL => $email,
            AuthRequestFieldName::PASSWORD => $password,
            AuthRequestFieldName::NAME => $name,
            AuthRequestFieldName::PREFERRED_ROLE => $preferredRole,
        ];
    }

    //validation of login request
    public function loginValidate(array $body): array
    {
        $identifier = $this->_commonFieldValidator->requiredStringGet($body, AuthRequestFieldName::IDENTIFIER);
        $password = $this->_commonFieldValidator->requiredStringGet($body, AuthRequestFieldName::PASSWORD);

        $this->_commonFieldValidator->stringLengthRequire($identifier, 'identifier', UserFieldLimit::USERNAME_LENGTH_MIN, UserFieldLimit::EMAIL_LENGTH_MAX);
        $this->_commonFieldValidator->passwordRequire($password);

        return [
            AuthRequestFieldName::IDENTIFIER => $identifier,
            AuthRequestFieldName::PASSWORD => $password,
        ];
    }

    //vaidation of guest part request
    public function guestValidate(array $body): array
    {
        $name = $this->_commonFieldValidator->optionalStringGet($body, AuthRequestFieldName::NAME);
        $name = $this->_commonFieldValidator->nameRequire($name);

        return [
            AuthRequestFieldName::NAME => $name,
        ];
    }

    //role preference is left now so that part now checking
    private function rolePreferenceRequire(string $preferredRole): void
    {
        if (!in_array($preferredRole, RoleValue::all(), true)) {
            throw new InvalidArgumentException('preferred role is invalid');
        }
    }
}

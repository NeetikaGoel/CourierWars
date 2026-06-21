<?php

declare(strict_types=1);

//add required files
require_once __DIR__ . '/Role.php';
//this will need to read headers from the request to know who is who
require_once __DIR__ . '/../Http/Request.php';
require_once __DIR__ . '/../Logging/Logger.php';

class AuthService
{
    //now we need to store auth keys 
    private array $_authConfig;

    public function __construct(array $_authConfig)
    {
        //to get the auth config array now
        $this->_authConfig = $_authConfig;
    }

    //authenticate function
    public function authenticate(Request $request): ?string
    {
        //now to authenticate first we need to read the api key from the header of the request
        $apiKey = $request->getHeader('X-API-Key');

        //check if even there is api key or not
        if ($apiKey === null || $apiKey === '') 
            {
                //log it 
                Logger::logWarn('AuthService', 'Missing API key!!', 'AUTH_API_KEY_MISSING');
                return null;
            }

        //lets see now if api key is of normal user
        //we need to compare 2 api keys - this will be done by hash_equals function here
        if (isset($this->_authConfig['normalApiKey']) && hash_equals($this->_authConfig['normalApiKey'], $apiKey)) 
            {
                return Role::NORMAL;
            }

        //now if we have admin key
        if (isset($this->_authConfig['adminApiKey']) && hash_equals($this->_authConfig['adminApiKey'], $apiKey)) 
            {
                return Role::ADMIN;
            }

        //now if both cases failed then ofc error in api key so log it
        Logger::logWarn('AuthService', 'Invalid API key', 'AUTH_API_KEY_INVALID');
        return null;
    }

    //authorize function for who can access or not
    public function authorize(string $userRole, string $requiredRole): bool
    {
        if ($userRole === Role::ADMIN) 
            {
                return true;
            }

        if ($userRole === Role::NORMAL && $requiredRole === Role::NORMAL) 
            {
                return true;
            }

        return false;
    }
}

<?php

declare(strict_types=1);

//this hte the php unit test case we r including from base package
use PHPUnit\Framework\TestCase;

//so now creating 1st php unit test class
//this will be for auth service thing
final class AuthServiceTest extends TestCase
{
    //so first defining the api keys that are there
    private const NORMAL_API_KEY = 'NORMALAPIKEY12345678901234567890';
    private const ADMIN_API_KEY = 'ADMINAPIKEY123456789012345678901';

    //now what to do
    //creating auth service instance ofcourse it will need to remain pvt
    private AuthService $_authService;

    //now creating its setup to give these api keys to the variables 
    //it will run every time and create a new auth service instance with the value of api keys i gave above ofc
    protected function setUp(): void
    {
        $this->_authService = new AuthService
        ([
            'normalApiKey' => self::NORMAL_API_KEY,
            'adminApiKey' => self::ADMIN_API_KEY
        ]);
    }


    //now we need  to create fake requests to check authenticate and authorize functions present in auth service
    //it can be pvt since only used in this class
    //wont call any curl or anything 
    private function requestCreate(array $headers): Request
    {
        return new Request('GET','/v1/admin/cache/health',$headers,[],[],'',false);
    }


    //NOW EACH TEST CASE WE NEED FOR EACH EXECUTION PATH
    //1) SO FIRST WHAT IF API KEY IS MISSING FROM THE REQUEST
    public function testAuthenticateWhenApiKeyMissingReturnsNull(): void
    {
        //CREATING FAKE REQUEST FIRST HEHE NO HEADERS ALSO COZ NO API KEY
        $request = $this->requestCreate([]);
        //RUNNNING OFC THE FUNCTION WE ALREADY HAVE IN TEH FILE HEHE
        $role = $this->_authService->authenticate($request);
        //NOW SINCE API KEY IS MISSING, IT SHOULD RETURN NULL SO THAT WILL BE ASSERTED HERE!!!!!!
        $this->assertNull($role); //ASSERT NULL MEANS EXPECTED VALUE OF ROLE WAS NULL AND ACTUAL VALUE OF ROLE ALSO NULL THEN TEST CASE WILL PASS OTHERWISE FAILURE
    }


    //2) NOW WAHT IF API KEY IS EMPTY STRING SO ALSO IT WILL BE ASSERTED NULL AGAIN
    public function testAuthenticateWhenApiKeyEmptyReturnsNull(): void
    {
        //AGAIN CREATING FAKE REQUEST BUT GIVING EMPTY STRING AS API KEY IN HEADER THIS TIME
        $request = $this->requestCreate([
            'X-API-Key' => ''
        ]);
        //again same function atuhenticate calling
        $role = $this->_authService->authenticate($request);
        //since if role is also null adn expected is also null then pass otherwise failure
        $this->assertNull($role);
    }

    //3) NOW WAHT IF API KEY IS VALID AND IS THE NORMAL KEY ONLY
    public function testAuthenticateWhenNormalApiKeyValidReturnsNormalRole(): void
    {
        //CREATING FAKE REQUEST WITH THE NORMAL API KEY
        $request = $this->requestCreate([
            'X-API-Key' => self::NORMAL_API_KEY
        ]);
        //CALLING SAME FUCNTION AGAIN
        $role = $this->_authService->authenticate($request);
        //ASSERTING SAME COZ IF NORMAL AND ROLE IS SAME HEHE PASS
        $this->assertSame(Role::NORMAL, $role);
    }

    //4) NOW WAHT IF API KEY IS VALID AND IS THE ADMIN KEY ONLY
    public function testAuthenticateWhenAdminApiKeyValidReturnsAdminRole(): void
    {
        //SAME AS ABOVE HEHE JUST COPY AND CHANGE!! HURRAYYYYY
        $request = $this->requestCreate([
            'X-API-Key' => self::ADMIN_API_KEY
        ]);

        $role = $this->_authService->authenticate($request);

        $this->assertSame(Role::ADMIN, $role);
    }

    //5) NOW WAHT IF API KEY IS INVALID ALTOGETHER //SAME AS EMPTY STRING ONE JUST CHANGE KEY VALUE
    public function testAuthenticateWhenApiKeyInvalidReturnsNull(): void
    {
        $request = $this->requestCreate([
            'X-API-Key' => 'WRONG_API_KEY'
        ]);

        $role = $this->_authService->authenticate($request);

        $this->assertNull($role);
    }

    //NOW CHECKING AUTHORIZE FUNCTIONSSSSS!!!!!

    //1) NOW WHAT IF AMDIN REQUIRED ADMIN ACCESSS ONLY EHHE PASSSSS
    public function testAuthorizeWhenAdminRequiresAdminReturnsTrue(): void
    {
        $result = $this->_authService->authorize(Role::ADMIN, Role::ADMIN);
        //IF RETURN TRUE-> ASSERT TRUE
        $this->assertTrue($result);
    }

    //2) NOW WHAT IF AMDIN REQUIRED NORMAL ACCESSS ONLY EHHE PASSSSS
    public function testAuthorizeWhenAdminRequiresNormalReturnsTrue(): void
    {
        $result = $this->_authService->authorize(Role::ADMIN, Role::NORMAL);
        //IF RETURN TRUE-> ASSERT TRUE
        $this->assertTrue($result);
    }

    //3) NOW WHAT IF NORMAL REQUIRED NORMAL ACCESSS ONLY EHHE PASSSSS
    public function testAuthorizeWhenNormalRequiresNormalReturnsTrue(): void
    {
        $result = $this->_authService->authorize(Role::NORMAL, Role::NORMAL);
        //IF RETURN TRUE-> ASSERT TRUE
        $this->assertTrue($result);
    }


    //4) NOW WHAT IF NORMAL REQUIRED ADMIN ACCESSS THEN IT WILLLL FAIL
    public function testAuthorizeWhenNormalRequiresAdminReturnsFalse(): void
    {
        $result = $this->_authService->authorize(Role::NORMAL, Role::ADMIN);
        //IF RETURN FALSE-> ASSERT FALSE
        $this->assertFalse($result);
    }

    //5) NOW WAHT IF UNKNOWN ROLE REQUEIRED NOMRLA ACCESS THEN ALSO FAIL COZ ITS UNKNOWN OFCCCC
    public function testAuthorizeWhenUnknownRoleRequiresNormalReturnsFalse(): void
    {
        $result = $this->_authService->authorize('unknown', Role::NORMAL);
        //IF RETURN FALSE-> ASSERT FALSE
        $this->assertFalse($result);
    }

    
}

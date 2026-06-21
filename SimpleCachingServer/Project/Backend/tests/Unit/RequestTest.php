<?php

declare(strict_types=1);

//this hte the php unit test case we r including from base package
use PHPUnit\Framework\TestCase;

//so now creating 2ND php unit test class
//this will be for request class that is there
final class RequestTest extends TestCase
{
    //SO WHAT DO WE NEED HERE
    //FIRST OF ALL A FUNCTION TO TEST IF CONSTRUCTOR IS STORING ALL VALUES AS EXPECTED
    public function testConstructorStoresAllRequestValues(): void
    {
        $request = new Request(
            'POST',
            '/v1/cache/set',
            ['X-API-Key' => 'abc'],
            ['key' => 'testName'],
            ['value' => 'Neetika'],
            '{"value":"Neetika"}',
            false
        );
        //ASSERTING SAME NOW
        $this->assertSame('POST', $request->getMethod());
        $this->assertSame('/v1/cache/set', $request->getPath());
        $this->assertSame(['X-API-Key' => 'abc'], $request->getHeaders());
        $this->assertSame(['key' => 'testName'], $request->getQueryParams());
        $this->assertSame(['value' => 'Neetika'], $request->getBody());
        $this->assertSame('{"value":"Neetika"}', $request->getRawBody());
        $this->assertFalse($request->getHasInvalidJson());
    }

    //now to check whether get method actually returns the method in uppercase fomrat if yes then good pass
    public function testGetMethodReturnsUppercaseMethod(): void
    {
        $request = new Request('post', '/v1/cache/set', [], [], [], '', false);

        $this->assertSame('POST', $request->getMethod());
    }

    //now next is to check whether header is being returned correctly or not if yes then good pass
    public function testGetHeaderWhenHeaderExistsReturnsValue(): void
    {
        $request = new Request('GET', '/', ['X-API-Key' => 'abc'], [], [], '', false);
        //ASSERTING SAME NOW
        $this->assertSame('abc', $request->getHeader('X-API-Key'));
    }
    //now to check whether getHeader finds header case-insensitively
    public function testGetHeaderWhenHeaderCaseDiffersReturnsValue(): void
    {
        $request = new Request('GET', '/', ['x-api-key' => 'abc'], [], [], '', false);
        //ASSERTING SAME NOW
        $this->assertSame('abc', $request->getHeader('X-API-Key'));
    }

    //now checking whether header is missing so returning null or not
    public function testGetHeaderWhenHeaderMissingReturnsNull(): void
    {
        $request = new Request('GET', '/', [], [], [], '', false);
        //Have to assert null now
        $this->assertNull($request->getHeader('X-API-Key'));
    }

    //now checking whether query params returned nicely or not
    public function testGetQueryParamWhenPresentReturnsValue(): void
    {
        $request = new Request('GET', '/', [], ['key' => 'testName'], [], '', false);
        //asserting same now
        $this->assertSame('testName', $request->getQueryParam('key'));
    }

    //now checking whether query params returned null when missing or not
    public function testGetQueryParamWhenMissingReturnsNull(): void
    {
        $request = new Request('GET', '/', [], [], [], '', false);
        //asserting null here
        $this->assertNull($request->getQueryParam('key'));
    }

    //now chekcing whether body field is returning correctly or not
    public function testGetBodyFieldWhenPresentReturnsValue(): void
    {
        $request = new Request('POST', '/', [], [], ['key' => 'testName'], '', false);
        //asserting same now
        $this->assertSame('testName', $request->getBodyField('key'));
    }

    //now checking if body field is missing so is it returning null or not
    public function testGetBodyFieldWhenMissingReturnsNull(): void
    {
        $request = new Request('POST', '/', [], [], [], '', false);
        //asserting nnull here too
        $this->assertNull($request->getBodyField('key'));
    }

    //now checking if createrequestfromrawhttp function is parsing correctly or not if not fail
    public function testCreateRequestFromRawHttpParsesGetPathAndQueryParams(): void
    {
        //this will need some raw request first but
        $rawHttpRequest = "GET /v1/cache/get?key=testName HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n";
        //then calling the fucntion
        $request = Request::createRequestFromRawHttp($rawHttpRequest);
        //now chekc using getters if it was correct or not???
        $this->assertSame('GET', $request->getMethod());
        $this->assertSame('/v1/cache/get', $request->getPath());
        $this->assertSame('testName', $request->getQueryParam('key'));
    }

    //now what is left lets see
    //function done
    //but what if headers parsed correctly or not
    public function testCreateRequestFromRawHttpParsesHeaders(): void
    {
        //again need rawhttprequest
        $rawHttpRequest = "GET /v1/admin/cache/health HTTP/1.1\r\nHost: 127.0.0.1\r\nX-API-Key: abc123\r\n\r\n";
        ///call teh function already
        $request = Request::createRequestFromRawHttp($rawHttpRequest);
        //asserting same to check now direclty
        $this->assertSame('127.0.0.1', $request->getHeader('Host'));
        $this->assertSame('abc123', $request->getHeader('X-API-Key'));
    }

    //now again a fucniton for same method but to check body parsing thing
    public function testCreateRequestFromRawHttpParsesValidJsonBody(): void
    {
        //another request raw
        $rawHttpRequest = "POST /v1/cache/set HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{\"key\":\"testName\",\"value\":\"Neetika\",\"ttl\":60}";
        //call function here tooo now dear
        $request = Request::createRequestFromRawHttp($rawHttpRequest);
        //hehe now finally assert all now with getters use assert same
        $this->assertSame('POST', $request->getMethod());
        $this->assertSame('/v1/cache/set', $request->getPath());
        $this->assertSame('testName', $request->getBodyField('key'));
        $this->assertSame('Neetika', $request->getBodyField('value'));
        $this->assertSame(60, $request->getBodyField('ttl'));
        $this->assertFalse($request->getHasInvalidJson());
    }

    //now again testing same function coz apparently json validity is alos crucial damn
    public function testCreateRequestFromRawHttpWhenJsonInvalidMarksInvalidJson(): void
    {
        //so raw http req again girl
        $rawHttpRequest = "POST /v1/cache/set HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{\"key\":\"testName\",";
        //then call function here tooo now dear
        $request = Request::createRequestFromRawHttp($rawHttpRequest);
        //finally asserting now 
        $this->assertTrue($request->getHasInvalidJson());
        $this->assertSame([], $request->getBody());
    }

    //so is it done now???
    //lets see though i really hope so

    //damn
    //if no body in json, then return null or empty array??
    //so empty array ofc
    public function testCreateRequestFromRawHttpWhenNoBodyKeepsBodyEmpty(): void
    {
        //write raw request again
        $rawHttpRequest = "GET /v1/admin/cache/health HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n";
        //call the damn function again
        $request = Request::createRequestFromRawHttp($rawHttpRequest);
        //assert dear
        $this->assertSame([], $request->getBody());
        $this->assertSame('', $request->getRawBody());
        //now invalidjson must be false since empty doesnt mean invalid 
        $this->assertFalse($request->getHasInvalidJson());
    }



    //now checking if request uri is bad then path should fallback to /
    public function testCreateRequestFromRawHttpWhenPathCannotBeParsedUsesRootPath(): void
    {
        //using bad uri so parse_url path can fail
        $rawHttpRequest = "GET http://[bad-url HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n";
        //calling the function now
        $request = Request::createRequestFromRawHttp($rawHttpRequest);
        //path should fallback to root so assering that
        $this->assertSame('/', $request->getPath());
    }


    //additon of invalid json in create request method test
    public function testCreateRequestFromRawHttpWhenJsonIsNotArrayMarksInvalidJson(): void
    {
        //request creation first
        $rawHttpRequest = "POST /v1/cache/set HTTP/1.1\r\nContent-Type: application/json\r\n\r\n\"plain string\"";
        //calling method then
        $request = Request::createRequestFromRawHttp($rawHttpRequest);
        //assertions!!
        $this->assertTrue($request->getHasInvalidJson());
        $this->assertSame([], $request->getBody());
    }

    //header issue
    public function testCreateRequestFromRawHttpIgnoresMalformedHeaderLines(): void
    {
        //creating request
        $rawHttpRequest = "GET /v1/cache/get?key=testKey HTTP/1.1\r\nBadHeaderWithoutColon\r\nX-API-Key: abc123\r\n\r\n";
        //calling of the function
        $request = Request::createRequestFromRawHttp($rawHttpRequest);
        //asssetions!!
        $this->assertSame('abc123', $request->getHeader('X-API-Key'));
        $this->assertNull($request->getHeader('BadHeaderWithoutColon'));
    }
}

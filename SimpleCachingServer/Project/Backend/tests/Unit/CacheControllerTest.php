<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class CacheControllerTest extends TestCase
{
    //so creating the new controller for each test
    private function createController(?CacheService $cacheService = null): CacheController
    {
        //use given cache service or create a new one
        $cacheService = $cacheService ?? new CacheService();
        //now creating the response factory
        $responseFactory = new ResponseFactory();
        //have to return the controller with dependencies
        return new CacheController($cacheService, $responseFactory);
    }

    //now we need a new function for the creation of new req obj for each test
    private function createRequest(string $method, array $queryParams = [], array $body = [], bool $hasInvalidJson = false): Request
    {
        return new Request($method, '/', [], $queryParams, $body, json_encode($body) ?: '', $hasInvalidJson);
    }

    //checking set success case
    public function testSetStoresCacheItemSuccessfully(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //now also creating valid post request
        $request = $this->createRequest('POST', [], [
            'key' => 'testKey',
            'value' => 'testValue',
            'ttl' => 60
        ]);
        //calling set function
        $response = $controller->set($request);
        //getting response body
        $body = $response->getBody();
        //asserting  success responses
        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($body['success']);
        $this->assertSame('testKey', $body['data']['key']);
        $this->assertSame('testValue', $body['data']['value']);
    }

    //checking set wrong method gives 405 error
    public function testSetWithWrongMethodReturns405(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //create wrong method request
        $request = $this->createRequest('GET');
        //calling set function
        $response = $controller->set($request);
        //asserting  405
        $this->assertSame(405, $response->getStatusCode());
        $this->assertFalse($response->getBody()['success']);
    }

    //checking set malformed json gives 400
    public function testSetWithInvalidJsonReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //create invalid json request
        $request = $this->createRequest('POST', [], [], true);
        //calling set function
        $response = $controller->set($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
        $this->assertSame('CACHE-4001', $response->getBody()['error']['id']);
    }

    //checking set missing key gives 400
    public function testSetWithMissingKeyReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //create request without key
        $request = $this->createRequest('POST', [], [
            'value' => 'testValue',
            'ttl' => 60
        ]);
        //calling set function
        $response = $controller->set($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
    }

    //checking set invalid key format gives 400
    public function testSetWithInvalidKeyFormatReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //create request with bad key
        $request = $this->createRequest('POST', [], [
            'key' => 'bad key',
            'value' => 'testValue',
            'ttl' => 60
        ]);
        //calling set function
        $response = $controller->set($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
    }

    //checking set missing value gives 400
    public function testSetWithMissingValueReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //create request without value
        $request = $this->createRequest('POST', [], [
            'key' => 'testKey',
            'ttl' => 60
        ]);
        //calling set function
        $response = $controller->set($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
    }

    //now checking set invalid ttl gives 400
    public function testSetWithInvalidTtlReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //create request with ttl as string
        $request = $this->createRequest('POST', [], [
            'key' => 'testKey',
            'value' => 'testValue',
            'ttl' => '60'
        ]);
        //calling set function
        $response = $controller->set($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
    }

    //lets see what else now
    //yeah so checking get success case
    public function testGetExistingCacheItemReturnsItem(): void
    {
        //create shared cache service
        $cacheService = new CacheService();
        //adding item first
        $cacheService->set('testKey', 'testValue', 60);
        //so ofc creating controller first with same service
        $controller = $this->createController($cacheService);
        //creating get request now of set key
        $request = $this->createRequest('GET', ['key' => 'testKey']);
        //calling get function
        $response = $controller->get($request);
        //asserting that yes hehe item found
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('testValue', $response->getBody()['data']['value']);
    }

    //checking get missing key returns 404
    public function testGetMissingCacheItemReturns404(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //no set here so it will be missing already
        //create get request
        $request = $this->createRequest('GET', ['key' => 'missingKey']);
        //calling get function
        $response = $controller->get($request);
        //asserting 404
        $this->assertSame(404, $response->getStatusCode());
    }

    //here addition like getting invalid key
    public function testGetWithInvalidKeyFormatReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //create get request
        $request = $this->createRequest('GET', [
            'key' => 'bad key'
        ]);
        //calling get function
        $response = $controller->get($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
    }

    //now also checking that getting missing query key gives 400
    public function testGetWithoutKeyQueryParamReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //create request without query key
        $request = $this->createRequest('GET');
        //calling get function
        $response = $controller->get($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
    }

    //checking the delete existing key function now
    public function testDeleteExistingCacheItemReturnsDeletedTrue(): void
    {
        //creating shared cache service first of all
        $cacheService = new CacheService();
        //adding item first
        $cacheService->set('testKey', 'testValue', 60);
        //so ofc creating controller first with same service
        $controller = $this->createController($cacheService);
        //creating the delete request
        $request = $this->createRequest('DELETE', [], ['key' => 'testKey']);
        //calling delete function
        $response = $controller->delete($request);
        //asserting deleted true
        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($response->getBody()['data']['deleted']);
        $this->assertSame('testValue', $response->getBody()['data']['value']);
    }

    //checking delete missing key still returns success but deleted false
    public function testDeleteMissingCacheItemReturnsDeletedFalse(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //creating delete request
        $request = $this->createRequest('DELETE', [], ['key' => 'missingKey']);
        //calling delete function
        $response = $controller->delete($request);
        //asserting deleted false
        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($response->getBody()['data']['deleted']);
    }

    //also checking delete missing key in body gives 400
    public function testDeleteWithoutKeyReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //creating delete request without key
        $request = $this->createRequest('DELETE', [], []);
        //calling delete function
        $response = $controller->delete($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
    }

    //deleting wrong method check
    public function testDeleteWithWrongMethodReturns405(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //creating delete request with wrong method now lets say get
        $request = $this->createRequest('GET', [], ['key' => 'testKey']);
        //calling function
        $response = $controller->delete($request);
        //assserting 405
        $this->assertSame(405, $response->getStatusCode());
    }

    //delete function can have invalid json too so lets say that case
    public function testDeleteWithInvalidJsonReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //creating delete request
        $request = $this->createRequest('DELETE', [], [], true);
        //calling function again
        $response = $controller->delete($request);
        //assserting 400 coz json error
        $this->assertSame(400, $response->getStatusCode());
        $this->assertSame('CACHE-4008', $response->getBody()['error']['id']);
    }

    //deleting key but its invalid
    public function testDeleteWithInvalidKeyFormatReturns400(): void
    {
        //so ofc creating controller first
        $controller = $this->createController();
        //creating delete request
        $request = $this->createRequest('DELETE', [], [
            'key' => 'bad key'
        ]);
        //calling function again
        $response = $controller->delete($request);
        //assserting 400 coz key error
        $this->assertSame(400, $response->getStatusCode());
        $this->assertSame('CACHE-4010', $response->getBody()['error']['id']);
    }


}

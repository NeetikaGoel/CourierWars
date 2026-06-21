<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class AdminCacheControllerTest extends TestCase
{
    //now what we do first
    //creating new admin controller for every test
    private function createController(?CacheService $cacheService = null): AdminCacheController
    {
        //using given cache service or create new one
        $cacheService = $cacheService ?? new CacheService();
        //creating response factory
        $responseFactory = new ResponseFactory();
        //returning admin controller with dependencies
        return new AdminCacheController($cacheService, $responseFactory);
    }

    //same request obj too like cachecontroller hehe
    private function createRequest(string $method, array $queryParams = [], array $body = [], bool $hasInvalidJson = false): Request
    {
        return new Request($method, '/', [], $queryParams, $body, json_encode($body) ?: '', $hasInvalidJson);
    }

    //firstly checking that bulk set actually stores valid items
    public function testBulkSetStoresValidItems(): void
    {
        //always creating controller first
        $controller = $this->createController();
        //creating valid bulk set request
        $request = $this->createRequest('POST', [], [
            'items' => [
                [
                    'key' => 'key1',
                    'value' => 'one',
                    'ttl' => 60
                ],
                [
                    'key' => 'key2',
                    'value' => 'two',
                    'ttl' => 60
                ]
            ]
        ]);
        //now ofc calling bulk set function
        $response = $controller->bulkSet($request);
        //asserting responses
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(2, $response->getBody()['data']['requested']);
        $this->assertSame(2, $response->getBody()['data']['stored']);
        $this->assertSame(0, $response->getBody()['data']['skipped']);
    }

    //now also checking bulk set wrong method returns 405
    public function testBulkSetWithWrongMethodReturns405(): void
    {
        //always creating controller first
        $controller = $this->createController();
        //craeting get request
        $request = $this->createRequest('GET');
        //calling bulk set function
        $response = $controller->bulkSet($request);
        //asserting 405 method since not allowed
        $this->assertSame(405, $response->getStatusCode());
    }

    //now checking bulk set malformed json gives 400
    public function testBulkSetWithInvalidJsonReturns400(): void
    {
        //always creating controller first
        $controller = $this->createController();
        //create invalid json request
        $request = $this->createRequest('POST', [], [], true);
        //calling bulk set function
        $response = $controller->bulkSet($request);
        //asserting 400 since bad json
        $this->assertSame(400, $response->getStatusCode());
    }

    //checking whether bulk set if missing items gives 400
    public function testBulkSetWithoutItemsReturns400(): void
    {
        //always creating controller first
        $controller = $this->createController();
        //create request without items
        $request = $this->createRequest('POST', [], []);
        //calling bulk set function
        $response = $controller->bulkSet($request);
        //asserting 400
        $this->assertSame(400, $response->getStatusCode());
    }

    //also checking that bulk set skips invalid items and stores valid ones
    public function testBulkSetSkipsInvalidItems(): void
    {
        //always creating controller first
        $controller = $this->createController();
        //create mixed request now , some valid and some invalid
        $request = $this->createRequest('POST', [], [
            'items' => [
                [
                    'key' => 'validKey',
                    'value' => 'valid',
                    'ttl' => 60
                ],
                [
                    'key' => '',
                    'value' => 'bad',
                    'ttl' => 60
                ],
                [
                    'key' => 'missingValue',
                    'ttl' => 60
                ],
                [
                    'key' => 'badTtl',
                    'value' => 'bad',
                    'ttl' => '60'
                ]
            ]
        ]);
        //calling bulk set function
        $response = $controller->bulkSet($request);
        //asserting that 1 is stored and 3 are skipped
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(4, $response->getBody()['data']['requested']);
        $this->assertSame(1, $response->getBody()['data']['stored']);
        $this->assertSame(3, $response->getBody()['data']['skipped']);
    }

    //now checking that purge selected actually removes existing keys
    public function testPurgeSelectedRemovesExistingKeys(): void
    {
        //create shared cache service
        $cacheService = new CacheService();
        //adding some values first
        $cacheService->set('key1', 'one', 60);
        $cacheService->set('key2', 'two', 60);
        //create controller now girllll
        $controller = $this->createController($cacheService);
        //creating request
        $request = $this->createRequest('POST', [], [
            'keys' => ['key1', 'key2']
        ]);
        //calling purge selected function
        $response = $controller->purgeSelected($request);
        //asserting now the removed count
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(2, $response->getBody()['data']['removed']);
        $this->assertSame(0, $response->getBody()['data']['notFound']);
    }

    //now ofc checking purge selected counts missing keys as not found
    public function testPurgeSelectedCountsMissingKeysAsNotFound(): void
    {
        //always creating controller first
        $controller = $this->createController();
        //creating request with missing key
        $request = $this->createRequest('POST', [], [
            'keys' => ['missingKey']
        ]);
        //calling purge selected
        $response = $controller->purgeSelected($request);
        //asserting not found count
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(0, $response->getBody()['data']['removed']);
        $this->assertSame(1, $response->getBody()['data']['notFound']);
    }

    //purgeselected wrong method check
    public function testPurgeSelectedWithWrongMethodReturns405(): void
    {
        //creating controller ofc
        $controller = $this->createController();
        //creating request
        $request = $this->createRequest('GET', [], ['keys' => ['key1']]);
        //calling func
        $response = $controller->purgeSelected($request);
        //assertions!!!
        $this->assertSame(405, $response->getStatusCode());
    }

    //purge selected with invalid json
    public function testPurgeSelectedWithInvalidJsonReturns400(): void
    {
        //creating controller firsst
        $controller = $this->createController();
        //creating reqeust tehn
        $request = $this->createRequest('POST', [], [], true);
        //calling the func then
        $response = $controller->purgeSelected($request);
        //ofc assertions
        $this->assertSame(400, $response->getStatusCode());
    }

    //another test of key invalid now in purge selected
    public function testPurgeSelectedSkipsInvalidKeyFormat(): void
    {
        //creating controller first
        $controller = $this->createController();
        //creating request
        $request = $this->createRequest('POST', [], [
            'keys' => ['validKey', 'bad key']
        ]);
        //calling the func
        $response = $controller->purgeSelected($request);
        //assertions time
        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(1, $response->getBody()['data']['errors']);
    }


    // purge all wrong method
    public function testPurgeAllWithWrongMethodReturns405(): void
    {
        //creating controller first
        $controller = $this->createController();
        //creating request
        $request = $this->createRequest('GET');
        //calling the func
        $response = $controller->purgeAll($request);
        //assertions time
        $this->assertSame(405, $response->getStatusCode());
    }


    //list with wrong method case
    public function testListWithWrongMethodReturns405(): void
    {
        //creating controller first
        $controller = $this->createController();
        //creating request
        $request = $this->createRequest('POST');
        //calling the func
        $response = $controller->list($request);
        //assertions time
        $this->assertSame(405, $response->getStatusCode());
    }

    //test limit out of bound
    public function testListWithLimitOutOfBoundReturns400(): void
    {
        //creating controller first
        $controller = $this->createController();
        //creating request
        $request = $this->createRequest('GET', [
            'limit' => '1001'
        ]);
        //calling the function
        $response = $controller->list($request);
        //assertions now!!
        $this->assertSame(400, $response->getStatusCode());
    }

    //checking that purge selected without keys gives 400 actually or not!!
    public function testPurgeSelectedWithoutKeysReturns400(): void
    {
        //always creating controller first
        $controller = $this->createController();
        //creating request without keys
        $request = $this->createRequest('POST', [], []);
        //calling purge selected func
        $response = $controller->purgeSelected($request);
        //asserting 400 again
        $this->assertSame(400, $response->getStatusCode());
    }

    //what do we do now
    //yes checking purge all should actually remove all values
    public function testPurgeAllRemovesAllItems(): void
    {
        //creating shared cache service
        $cacheService = new CacheService();
        //adding some new values
        $cacheService->set('key1', 'one', 60);
        $cacheService->set('key2', 'two', 60);
        //creating controller now
        $controller = $this->createController($cacheService);
        //creating request
        $request = $this->createRequest('POST');
        //calling purge all func
        $response = $controller->purgeAll($request);
        //assert that yes removed
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(2, $response->getBody()['data']['removed']);
    }

    //now checking list returns items hehe
    public function testListReturnsCacheItems(): void
    {
        //creating shared cache service
        $cacheService = new CacheService();
        //adding values which will be returned
        $cacheService->set('key1', 'one', 60);
        $cacheService->set('key2', 'two', 60);
        //now creating controller
        $controller = $this->createController($cacheService);
        //creating request
        $request = $this->createRequest('GET');
        //calling list function
        $response = $controller->list($request);
        //asserting list result
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(2, $response->getBody()['data']['count']);
    }

    //checking whether list respects limit or not - if not- misbehaving !!!!
    public function testListRespectsLimitQueryParam(): void
    {
        //creating shared cache service
        $cacheService = new CacheService();
        //adding some values
        $cacheService->set('key1', 'one', 60);
        $cacheService->set('key2', 'two', 60);
        //hehe what now
        //ofc creating controller
        $controller = $this->createController($cacheService);
        //creating request with limit this time
        $request = $this->createRequest('GET', ['limit' => '1']);
        //calling list func
        $response = $controller->list($request);
        //asserting limit hehe now
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(1, $response->getBody()['data']['limit']);
        $this->assertSame(1, $response->getBody()['data']['count']);
    }

    //checking list with invalid limit gives 400 actually or not
    public function testListWithInvalidLimitReturns400(): void
    {
        //always creating controller first
        $controller = $this->createController();
        //creating request with invalid limit - like abc- what is it???
        $request = $this->createRequest('GET', ['limit' => 'abc']);
        //calling list func
        $response = $controller->list($request);
        //asserting 400 now
        $this->assertSame(400, $response->getStatusCode());
    }
}


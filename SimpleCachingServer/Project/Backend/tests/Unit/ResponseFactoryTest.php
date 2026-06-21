<?php

declare(strict_types=1);

//this is the php unit base test class
use PHPUnit\Framework\TestCase;

//this test class is for ResponseFactory now
final class ResponseFactoryTest extends TestCase
{
    //now checking whether success response is built correctly or not if yes pass
    public function testSuccessCreatesCorrectJsonResponse(): void
    {
        //creating response factory object first now
        $responseFactory = new ResponseFactory();
        //creating success response
        $response = $responseFactory->success(
            'Cache item stored',
            ['key' => 'testName'],
            200
        );
        //response object should be JsonResponse
        $this->assertInstanceOf(JsonResponse::class, $response);
        //status code should be matching matching
        $this->assertSame(200, $response->getStatusCode());
        //getting body now
        $body = $response->getBody();
        //checking success structure by assertions now hehe
        $this->assertTrue($body['success']);
        $this->assertSame('Cache item stored', $body['message']);
        $this->assertSame(['key' => 'testName'], $body['data']);
    }

    //now checking whether success response uses default values correctly
    public function testSuccessUsesDefaultValues(): void
    {
        //creating response factory object again for this
        $responseFactory = new ResponseFactory();
        //creating success response without optional params
        $response = $responseFactory->success('Done');
        //checking default status code
        $this->assertSame(200, $response->getStatusCode());
        //getting body
        $body = $response->getBody();
        //checking body values by assertions again
        $this->assertTrue($body['success']);
        $this->assertSame('Done', $body['message']);
        $this->assertSame([], $body['data']);
    }

    //now checking whether error response is built correctly or not
    public function testErrorCreatesCorrectJsonResponse(): void
    {
        //creating response factory object
        $responseFactory = new ResponseFactory();
        //creating error response
        $response = $responseFactory->error(
            'Validation failed',
            'CACHE-4001',
            'Invalid key',
            ['key' => 'required'],
            400
        );
        //response object should be JsonResponse
        $this->assertInstanceOf(JsonResponse::class, $response);
        //status code should match again
        $this->assertSame(400, $response->getStatusCode());
        //getting body now
        $body = $response->getBody();
        //checking error structure
        $this->assertFalse($body['success']);
        $this->assertSame('Validation failed', $body['message']);
        //checking nested error fields by assertions heheehheheheh
        $this->assertSame('CACHE-4001', $body['error']['id']);
        $this->assertSame('Invalid key', $body['error']['message']);
        $this->assertSame(['key' => 'required'], $body['error']['errors']);
    }

    //now checking whether error response uses default values correctly or not, if yes pass
    public function testErrorUsesDefaultValues(): void
    {
        //creating response factory object
        $responseFactory = new ResponseFactory();
        //creating error response with only required params okayyyyy
        $response = $responseFactory->error(
            'Something failed',
            'ERR-001',
            'Unexpected error'
        );
        //default status code should be 400 ofc
        $this->assertSame(400, $response->getStatusCode());
        //getting body now
        $body = $response->getBody();
        //checking values by again assertions ofccccccc
        $this->assertFalse($body['success']);
        $this->assertSame('Something failed', $body['message']);
        $this->assertSame('ERR-001', $body['error']['id']);
        $this->assertSame('Unexpected error', $body['error']['message']);
        //default errors array should be empty so for this empty assertion
        $this->assertSame([], $body['error']['errors']);
    }
}

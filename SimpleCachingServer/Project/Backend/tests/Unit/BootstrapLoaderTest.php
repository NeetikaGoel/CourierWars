<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

//only this left now hehe
//finalllyyyyyyyy!!!!!!!!!!!!!!!!!!
final class BootstrapLoaderTest extends TestCase
{
    //so first we need a function to get a temporary bootstrap file path for each test okayyy
    private function getTempBootstrapFilePath(): string
    {
        //so we will be using system temp folder so we do not touch real file
        //it should be a unique id in file name so no clash btw tests hehe
        return sys_get_temp_dir() . '/bootstrap-test-' . uniqid() . '.json'; 
    }

    //now we will also need to delete temp file after test coz yes
    private function removeTempFile(string $filePath): void
    {
        //no garbage good habit
        if (file_exists($filePath)) 
        {
            //unlink will delete - php function!!!!!!
            unlink($filePath);
        }
    }

    //now checking when bootstrap file is missing then loader creates default file or not
    public function testLoadWhenFileMissingCreatesDefaultBootstrapFile(): void
    {
        //getting a fake file path which does not exist yet
        $filePath = $this->getTempBootstrapFilePath();
        //creating loader with missing file
        $bootstrapLoader = new BootstrapLoader($filePath);
        //now ofc running load function
        $result = $bootstrapLoader->load();
        //but now checking loaded false because original file was missing hehe assert 
        $this->assertFalse($result['loaded']);
        //also checking whether warning is added or not so again assert not empty hehe
        $this->assertNotEmpty($result['warnings']);
        //what to do now
        //so also checking default file is created now or not
        $this->assertFileExists($filePath);
        //most imp step now
        //yes, it's cleanup of the cute temp file
        $this->removeTempFile($filePath);
    }

    //now also checking valid bootstrap json loads config and items correctly
    public function testLoadValidBootstrapFileReturnsLoadedTrueConfigAndItems(): void
    {
        //first of all get a temp file path
        $filePath = $this->getTempBootstrapFilePath();
        //now ofc writing valid bootstrap json in the file
        file_put_contents($filePath, json_encode([
            'config' => [
                'ttlDefault' => 100,
                'ttlMax' => 1000,
                'host' => '127.0.0.1',
                'port' => 8080,
                'logFile' => 'logs/test.log'
            ],
            'items' => [
                [
                    'key' => 'testKey',
                    'value' => 'testValue',
                    'ttl' => 60
                ]
            ]
        ]));
        //now again create loader
        $bootstrapLoader = new BootstrapLoader($filePath);
        //now ofc run load
        $result = $bootstrapLoader->load();
        //checking file loaded successfully or not hehe
        $this->assertTrue($result['loaded']);
        //also checking whether config is loaded - it will use assert same okayyyy!!!!
        $this->assertSame(100, $result['config']['ttlDefault']);
        $this->assertSame(1000, $result['config']['ttlMax']);
        $this->assertSame('127.0.0.1', $result['config']['host']);
        $this->assertSame(8080, $result['config']['port']);
        $this->assertSame('logs/test.log', $result['config']['logFile']);
        //also checking one item loaded correctly!!!
        $this->assertCount(1, $result['items']);
        $this->assertSame('testKey', $result['items'][0]['key']);
        $this->assertSame('testValue', $result['items'][0]['value']);
        $this->assertSame(60, $result['items'][0]['ttl']);
        //most imp step now
        //bye bye cute temp file!!!
        $this->removeTempFile($filePath);
    }

    //now we need to check malformed json should absolutely give error
    public function testLoadMalformedJsonReturnsError(): void
    {
        //getting temp file path again
        $filePath = $this->getTempBootstrapFilePath();
        //lets write broken wrong json now otherwise how will we test hahahahha
        file_put_contents($filePath, '{"config":');
        //again create loader yes
        $bootstrapLoader = new BootstrapLoader($filePath);
        //again run load
        $result = $bootstrapLoader->load();
        //asserting checking loaded is false because json is bad
        $this->assertFalse($result['loaded']);
        //now also checking errors are present
        $this->assertNotEmpty($result['errors']);
        //hehe cute step!!
        //cleanup of temp file
        $this->removeTempFile($filePath);
    }

    //also we need to be checking invalid config values fall back to defaults!!! very imp
    public function testLoadInvalidConfigValuesUsesDefaults(): void
    {
        //getting a temp file path again
        $filePath = $this->getTempBootstrapFilePath();
        //writing config with invalid values
        file_put_contents($filePath, json_encode([
            'config' => [
                'ttlDefault' => -1,
                'ttlMax' => 1,
                'host' => '',
                'port' => 999999,
                'logFile' => ''
            ],
            'items' => []
        ]));
        //again ofc create loader
        $bootstrapLoader = new BootstrapLoader($filePath);
        //yes again run load
        $result = $bootstrapLoader->load();
        //checking whether loaded true because json itself is valid!!
        $this->assertTrue($result['loaded']);
        //asserts whether defaults were used or not
        $this->assertSame(7200, $result['config']['ttlDefault']);
        $this->assertSame(604800, $result['config']['ttlMax']);
        $this->assertSame('127.0.0.1', $result['config']['host']);
        $this->assertSame(8080, $result['config']['port']);
        $this->assertSame('logs/cache-server.log', $result['config']['logFile']);
        //cutie step
        //cleanup temp file
        $this->removeTempFile($filePath);
    }

    //now what else???
    //lets see
    //okay yes
    //checking invalid preload items are skipped or not
    public function testLoadSkipsInvalidItems(): void
    {
        //getting the temp file path
        $filePath = $this->getTempBootstrapFilePath();
        //writing mixed valid and invalid items
        file_put_contents($filePath, json_encode([
            'config' => [],
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
                    'key' => 'missing.value',
                    'ttl' => 60
                ],
                [
                    'key' => 'bad.ttl',
                    'value' => 'bad',
                    'ttl' => -5
                ]
            ]
        ]));
        //create loader again yes
        $bootstrapLoader = new BootstrapLoader($filePath);
        //run load now
        $result = $bootstrapLoader->load();
        //checking if only valid item remains
        $this->assertCount(1, $result['items']);
        $this->assertSame('validKey', $result['items'][0]['key']);
        //hehe cutie step!!!
        //cleanup temp file
        $this->removeTempFile($filePath);
    }
}

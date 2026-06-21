<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class CacheItemTest extends TestCase 
{
    //so first checking the creation of cache item and getters hehe
    public function testCacheItemCreation():void
    {
        //creating new item ofc
        $cacheItem=new CacheItem('testKey', 'testValue', 3600);
        //now asserting key, value and ttl values by getters
        $this->assertSame('testKey',$cacheItem->getKey());
        $this->assertSame('testValue',$cacheItem->getValue());
        $this->assertSame(3600,$cacheItem->getTtl());
        //now asserting the times
        $this->assertIsInt($cacheItem->getCreatedAt());
        $this->assertIsInt($cacheItem->getExpiresAt());
        $this->assertIsInt($cacheItem->getUpdatedAt());
    }

    //now testing the setter of expiry time
    public function testConstructorSetsExpiresAtUsingTtl(): void
    {
        //creating new cache item
        $item = new CacheItem('testKey', 'testValue', 60);
        //now asserting
        $this->assertSame($item->getCreatedAt() + 60, $item->getExpiresAt());
    }

    //now testing setter of value for the key
    public function testSetValueUpdatesValue(): void
    {
        //creating new cache item
        $item = new CacheItem('testKey', 'oldTestValue', 60);
        //now setting new value
        $item->setValue('newTestValue');
        //now asserting
        $this->assertSame('newTestValue', $item->getValue());
    }

    //now checking updated time
    public function testSetUpdatedAtUpdatesTimestamp(): void
    {
        //new cache item again
        $item = new CacheItem('testKey', 'testValue', 60);
        //setting updated time
        $item->setUpdatedAt(123456);
        //now asserting
        $this->assertSame(123456, $item->getUpdatedAt());
    }

    //now checking updated ttl
    public function testSetTtlUpdatesTtl(): void
    {
        //again new cache item
        $item = new CacheItem('testKey', 'value', 60);
        //setting new ttl ofc
        $item->setTtl(120);
        //again asserting ofccccc
        $this->assertSame(120, $item->getTtl());
    }

    //checking expires at time
    public function testSetExpiresAtUpdatesExpiresAt(): void
    {
        //new cache item again
        $item = new CacheItem('testKey', 'value', 60);
        //setting new expiry time
        $item->setExpiresAt(999999);
        //now asserting again
        $this->assertSame(999999, $item->getExpiresAt());
    }

    //now next function???
    //its refresh
    //so checking refresh function is whether updating values or not
    public function testRefreshUpdatesValueTtlUpdatedAtAndExpiresAt(): void
    {
        //new cache item again
        $item = new CacheItem('testKey', 'old', 60);
        //now new created at value for it
        $createdAt = $item->getCreatedAt();
        //wait to sleep so we have updated time hehe
        sleep(1);
        //callllll the functionnnnnn
        $item->refresh('new', 120);
        //now assertions lets seeeee
        $this->assertSame('new', $item->getValue());
        $this->assertSame(120, $item->getTtl());
        $this->assertSame($createdAt, $item->getCreatedAt());
        $this->assertGreaterThanOrEqual($createdAt, $item->getUpdatedAt());
        $this->assertSame($item->getUpdatedAt() + 120, $item->getExpiresAt());
    }

    //now checking for the expired is or not function 
    public function testIsExpiredReturnsFalseBeforeExpiry(): void
    {
        //so again creating new cache item
        $item = new CacheItem('testKey', 'testValue', 60);
        //now asserting ofc but false heere since false before expiry
        $this->assertFalse($item->isExpired());
    }

    //now checking if true after expiry hehe
    public function testIsExpiredReturnsTrueAfterExpiry(): void
    {
        //so again new cache item
        $item = new CacheItem('testKey', 'testValue', 1);
        //now let it expire for 1 sec so check after sleep
        sleep(2);
        //now assert finally but true this time
        $this->assertTrue($item->isExpired());
    }

    //now checking whether finalll absolutely final function works or not
    //so its to array funcion hehe
    public function testToArrayReturnsFormattedCacheItem(): void
    {
        //now again new cache item
        $item = new CacheItem('testKey', 'testValue', 60);
        //so calling array function ofc
        $result = $item->toArray();
        //again so many assertions!!!!
        $this->assertSame('testKey', $result['key']);
        $this->assertSame('testValue', $result['value']);
        $this->assertSame(60, $result['ttl']);
        $this->assertArrayHasKey('createdAt', $result);
        $this->assertArrayHasKey('updatedAt', $result);
        $this->assertArrayHasKey('expiresAt', $result);
    }

}

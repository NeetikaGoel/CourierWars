<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class CacheServiceTest extends TestCase
{
    //so first checking the set new cache item function first
    public function testSetCreatesNewCacheItem(): void
    {
        //new cache service ofc
        $cacheService = new CacheService();
        //now item which sets new cache item
        $item = $cacheService->set('testKey', 'testValue', 60);
        //now assertions
        $this->assertInstanceOf(CacheItem::class, $item);
        $this->assertSame('testKey', $item->getKey());
        $this->assertSame('testValue', $item->getValue());
        $this->assertSame(60, $item->getTtl());
    }

    //now set if called with same key overwrites value of exisitng hehe
    public function testSetSameKeyOverwritesValue(): void
    {
        //new cache service agina
        $cacheService = new CacheService();
        //set with same value
        $cacheService->set('testKey', 'old', 60);
        $item = $cacheService->set('testKey', 'new', 120);
        //now assertions
        $this->assertSame('new', $item->getValue());
        $this->assertSame(120, $item->getTtl());
    }

    //now checking get function hehe
    public function testGetExistingKeyReturnsCacheItem(): void
    {
        //new cache service we need again
        $cacheService = new CacheService();
        //set some value to get it hehe
        $cacheService->set('testKey', 'value', 60);
        //now get the value 
        $item = $cacheService->get('testKey');
        //now assertions
        $this->assertInstanceOf(CacheItem::class, $item);
        $this->assertSame('value', $item->getValue());
    }

    //if key missing-get fails
    public function testGetMissingKeyReturnsNull(): void
    {
        //new cache service again
        $cacheService = new CacheService();
        //get function ofc
        $item = $cacheService->get('missingKey');
        //assert null coz missing so null
        $this->assertNull($item);
    }

    //now testing if expired key is also returning null or not
    public function testGetExpiredKeyReturnsNull(): void
    {
        //new cache service again hehe
        $cacheService = new CacheService();
        //lets check with setting some shortkey
        $cacheService->set('shortKey', 'value', 1);
        //wait for 2 sec to sleep
        sleep(2);
        //now getting after it expired
        $item = $cacheService->get('shortKey');
        //assert hehe
        $this->assertNull($item);
    }

    //deleting exissitn key now and to check if it actually deletes
    public function testDeleteExistingKeyReturnsDeletedTrueAndValue(): void
    {
        //new cache service again
        $cacheService = new CacheService();
        //setting new key-value pair
        $cacheService->set('testKey', 'value', 60);
        //execute the fucntion
        $result = $cacheService->delete('testKey');
        //assert its value 
        $this->assertTrue($result['deleted']);
        $this->assertSame('value', $result['value']);
    }

    //now if missing key tehn ofc not deleted so false
    public function testDeleteMissingKeyReturnsDeletedFalse(): void
    {
        //new cache swervice again
        $cacheService = new CacheService();
        //run delete function again like before
        $result = $cacheService->delete('missingKey');
        //assert the value which will be nulll and ofc false
        $this->assertFalse($result['deleted']);
        $this->assertNull($result['value']);
    }

    //now purge all fucntion is there
    //waht will it do
    //removal of all items ofc
    public function testPurgeAllRemovesAllItemsAndReturnsCount(): void
    {
        //again new service
        $cacheService = new CacheService();
        //set 2 values to check if all r removed hehe
        $cacheService->set('key1', 'one', 60);
        $cacheService->set('key2', 'two', 60);
        //now run function
        $removed = $cacheService->purgeAll();
        //finally assertion again
        $this->assertSame(2, $removed);
        $this->assertNull($cacheService->get('key1'));
        $this->assertNull($cacheService->get('key2'));
    }

    //then to list all values
    //it should be live too
    public function testListReturnsLiveItems(): void
    {
        //again new cache service
        $cacheService = new CacheService();
        //setting 2 values to see if list all works or not
        $cacheService->set('key1', 'one', 60);
        $cacheService->set('key2', 'two', 60);
        //run fucntion
        $items = $cacheService->list();
        //assert ofc
        $this->assertCount(2, $items);
    }

    //now list with limit function is there
    //so does it work , lets test hehe
    public function testListRespectsLimit(): void
    {
        //again new cache service damnnnnnnnnnn
        $cacheService = new CacheService();
        //setting again 2 values
        $cacheService->set('key1', 'one', 60);
        $cacheService->set('key2', 'two', 60);
        //check with limit 1 lets say
        $items = $cacheService->list(1);
        //asset hehe
        $this->assertCount(1, $items);
    }

    //now also another path where if expired should not show in live hehe
    public function testListRemovesExpiredItems(): void
    {
        //new service again
        $cacheService = new CacheService();
        //so a key which will expire hahahahahah
        $cacheService->set('shortKey', 'value', 1);
        //let it expire
        sleep(2);
        //now run func
        $items = $cacheService->list();
        //assert hehe
        $this->assertCount(0, $items);
    }

    //now chekcing size fucntion 
    public function testSizeReturnsItemCountAndMemoryBytes(): void
    {
        //new cache service
        $cacheService = new CacheService();
        //setting value again new
        $cacheService->set('testKey', 'value', 60);
        //size function running
        $size = $cacheService->size();
        //asssertions hehe
        $this->assertSame(1, $size['itemCount']);
        $this->assertArrayHasKey('processMemoryBytes', $size);
        $this->assertIsInt($size['processMemoryBytes']);
    }

    //uptime function checking
    //after that only health is left HAHAHAHAAHAHHAAHH
    public function testUptimeReturnsStartedAtAndUptimeSeconds(): void
    {
        //new service
        $cacheService = new CacheService();
        //run function ig nothing else needed heheheheh
        $uptime = $cacheService->uptime();
        //guess what nowwwww???
        //yesss assertionssss!!!!!!!!!
        $this->assertArrayHasKey('startedAt', $uptime);
        $this->assertArrayHasKey('uptimeSeconds', $uptime);
        $this->assertIsInt($uptime['uptimeSeconds']);
    }

    ///heheheheeh last ABSOLUTELY LAST CHECK FUNCTION!!!!!!!!!!!
    public function testHealthReturnsStatusItemCountAndUptimeSeconds(): void
    {
        //new service
        $cacheService = new CacheService();
        //setting some value otherwise on what health will work stupid
        $cacheService->set('testKey', 'value', 60);
        //health health r u active
        $health = $cacheService->health();
        //yes ofc hence assertions!!!
        $this->assertSame('ok', $health['status']);
        $this->assertSame(1, $health['itemCount']);
        $this->assertArrayHasKey('uptimeSeconds', $health);
    }
}

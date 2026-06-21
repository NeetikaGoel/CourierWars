<?php

declare(strict_types=1);

class CacheItem
{

    private string $_key;
    private mixed $_value;
    private int $_createdAt; //first time inserted
    private int $_updatedAt; //updated on overwrite
    private int $_ttl;
    private int $_expiresAt; //now time+ttl

    //ADD GETTERS AND SETTERS TOO!!

    public function __construct(string $_key,mixed $_value,int $_ttl)
    {
        $this->_key=$_key;
        $this->_value=$_value;
        $this->_ttl=$_ttl;

        $now=time();

        $this->_createdAt=$now;
        $this->_updatedAt=$now;
        $this->_expiresAt=$now+$_ttl;
    }


    //ALL GETTERS ---->
    public function getKey():string
    {
        return $this->_key;
    }

    public function getValue():mixed
    {
        return $this->_value;
    }

    public function getCreatedAt():int
    {
        return $this->_createdAt;
    }

    public function getUpdatedAt():int
    {
        return $this->_updatedAt;
    }

    public function getTtl():int
    {
        return $this->_ttl;
    }

    public function getExpiresAt():int
    {
        return $this->_expiresAt;
    }

    public function setValue(mixed $_value):void
    {
        $this->_value=$_value;
    }

    //ALL SETTERS ---->
    public function setUpdatedAt(int $_updatedAt):void
    {
        $this->_updatedAt=$_updatedAt;
    }

    public function setTtl(int $_ttl):void
    {
        $this->_ttl=$_ttl;
    }

    public function setExpiresAt(int $_expiresAt):void
    {
        $this->_expiresAt=$_expiresAt;
    }

    // putting refresh if we need what if _value and _ttl changes in case
    public function refresh(mixed $_value,int $_ttl):void
    {
        $now=time();

        $this->_value=$_value;
        $this->_ttl=$_ttl;
        $this->_updatedAt=$now;
        $this->_expiresAt=$now+$_ttl;
    }

    public function isExpired():bool
    {
        return time()>=$this->_expiresAt;
    }

    public function toArray():array //formats for API response
    {
        return [
            'key'=>$this->_key,
            'value'=>$this->_value,
            'ttl'=>$this->_ttl,
            'createdAt'=>gmdate('c',$this->_createdAt),
            'updatedAt'=>gmdate('c',$this->_updatedAt),
            'expiresAt'=>gmdate('c',$this->_expiresAt)
        ];
    }
}

<?php
declare(strict_types=1);

//this file will store all the fixed cache server endpoint paths
class CacheServerEndpointValue
{
    public const CACHE_SET = '/v1/cache/set'; 
    public const CACHE_GET = '/v1/cache/get'; 
    public const CACHE_DELETE = '/v1/cache/delete'; 

    public const ADMIN_BULK_SET = '/v1/admin/cache/bulk-set';
    public const ADMIN_PURGE_SELECTED = '/v1/admin/cache/purge-selected'; 
    public const ADMIN_PURGE_ALL = '/v1/admin/cache/purge-all'; 
    public const ADMIN_LIST = '/v1/admin/cache/list'; 
    public const ADMIN_UPTIME = '/v1/admin/cache/uptime'; 
    public const ADMIN_SIZE = '/v1/admin/cache/size'; 
    public const ADMIN_HEALTH = '/v1/admin/cache/health'; 
}

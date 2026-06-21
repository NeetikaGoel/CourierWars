<?php

declare(strict_types=1);

const CACHE_KEY_LENGTH_MAX = 255;
const CACHE_VALUE_STRING_LENGTH_MAX = 1024;
const CACHE_TTL_SECONDS_DEFAULT = 7200;
const CACHE_TTL_SECONDS_MAX = 604800;

const CACHE_LIST_LIMIT_DEFAULT = 50;
const CACHE_LIST_LIMIT_MAX = 1000;

const CACHE_ITEM_KEY_REGEX= '/^[A-Za-z0-9._:-]+$/';


const CACHE_ITEM_VALUE_LENGTH_MAX = 1024;
const CACHE_ITEM_KEY_LENGTH_MAX = 255;
const HOST_DEFAULT = '127.0.0.1';
const PORT_DEFAULT = 8080;
const LOG_FILE_DEFAULT = 'logs/cache-server.log';

const ENDPOINT_NORMAL_SET = "/v1/cache/set";
const ENDPOINT_NORMAL_GET = "/v1/cache/get";
const ENDPOINT_NORMAL_DELETE = "/v1/cache/delete";
const ENDPOINT_ADMIN_BULKSET = '/v1/admin/cache/bulk-set';
const ENDPOINT_ADMIN_PURGESELECTED = '/v1/admin/cache/purge-selected';
const ENDPOINT_ADMIN_PURGEALL = '/v1/admin/cache/purge-all';
const ENDPOINT_ADMIN_LIST = '/v1/admin/cache/list';
const ENDPOINT_ADMIN_UPTIME = '/v1/admin/cache/uptime';
const ENDPOINT_ADMIN_SIZE = '/v1/admin/cache/size';
const ENDPOINT_ADMIN_HEALTH = '/v1/admin/cache/health';




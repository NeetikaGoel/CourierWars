<?php
declare(strict_types=1);

class AppConfig 
{
    public const APP_NAME = 'Courier War'; // to be shown in logs/metadata
    public const API_VERSION = '1'; 
    public const API_BASE_PATH = '/api/v1'; //common API route prefix
    public const DEFAULT_TIMEZONE = 'UTC'; 
    public const DEFAULT_TIME_FORMAT = 'Y-m-d\TH:i:s.v\Z';

    //to return api base path
    public static function apiBasePath(): string
    {
        return self::API_BASE_PATH;
    }

}

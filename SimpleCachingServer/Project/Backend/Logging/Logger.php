<?php

declare(strict_types=1);

class Logger
{
    public static function logInfo(string $component,string $message,array $context = []):void
    {
        self::writeLog('INFO',$component,$message,null,null,$context);
    }

    public static function logWarn(string $component,string $message,string $errorCode,array $context = []):void
    {
        self::writeLog('WARN',$component,$message,$errorCode,null,$context);
    }

    public static function logError(string $component,string $message,string $errorCode,?Throwable $exception = null,array $context = []):void
    {
        self::writeLog('ERROR',$component,$message,$errorCode,$exception,$context);
    }

    private static function writeLog(string $level,string $component,string $message,?string $errorCode,?Throwable $exception,array $context):void
    {
        $logMessage = [
            'timestamp' => gmdate('c'),
            'level' => $level,
            'service' => 'simple-cache-server',
            'component' => $component,
            'correlationId' => '00000',
            'message' => $message,
            'errorCode' => $errorCode,
            'durationMs' => 0,
            'stackTrace' => $exception ? $exception->getTraceAsString() : null,
            'context' => $context
        ];

        $filePath = __DIR__ . '/../logs/cache-server.log';

        $logDir = dirname($filePath);

        if (!is_dir($logDir)) 
            {
                mkdir($logDir,0777,true);
            }

        if (!file_exists($filePath)) 
            {
                touch($filePath);
                chmod($filePath,0666);
            }

        file_put_contents($filePath,json_encode($logMessage) . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}

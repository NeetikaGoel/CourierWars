<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../Logging/Logger.php';

class BootstrapLoader
{
    private string $bootstrapFilePath; //path where bootstrap file will be there if config file is missing

    //now we need a constructor ofc
    public function __construct(string $bootstrapFilePath)
    {
        $this->bootstrapFilePath = $bootstrapFilePath;
    }

    //now we will load the file hehe
    public function load(): array
    {
        //first we gotta start it with default values that r safe
        $result = [
            'config' => $this->getDefaultConfig(), //a function of taking defaults even if file fails hehe
            'items' => [],
            'loaded' => false,
            'warnings' => [],
            'errors' => []
        ];

        //now checking whether our file exists which it should but if not then
        if (!file_exists($this->bootstrapFilePath)) {
            //ofc create the file and give the msg file missing
            $this->createDefaultBootstrapFile();
            $result['warnings'][] = 'Bootstrap file was missing... Default file created!';

            //this thing should be logged too as warning ig
            Logger::logWarn('BootstrapLoader', 'Bootstrap file missing... Default file created!', 'BOOTSTRAP_MISSING');
            return $result;
        }

        //now if file would have existed so just take contents
        $rawJson = file_get_contents($this->bootstrapFilePath);

        //file existed, took content but shit no content
        if ($rawJson === false) {
            $result['errors'][] = 'Bootstrap file could not be read!!';
            Logger::logError('BootstrapLoader', 'Bootstrap file could not be read!!', 'BOOTSTRAP_READ_FAILED');
            return $result;
        }

        //if there is content now thank god!!! now convert json to php array
        $decodedJson = json_decode($rawJson, true);

        //now content not in array form, shit maliciousness at its peak!!!!
        if (!is_array($decodedJson)) {
            $result['errors'][] = 'Bootstrap JSON is malformed.';
            Logger::logError('BootstrapLoader', 'Bootstrap JSON is malformed.', 'BOOTSTRAP_JSON_INVALID');
            return $result;
        }

        //now fill in the values coz everything right till here
        $result['loaded'] = true; //file correctly laoded and json also right
        $result['config'] = $this->configSalvage($decodedJson['config'] ?? []); //a new func we will add 
        $result['items'] = $this->itemsSalvage($decodedJson['items'] ?? []); //a new func we will add

        return $result;
    }

    //the default value taking function
    private function getDefaultConfig(): array
    {
        //just fill in the default values and we r done!!!
        return [
            'ttlDefault' => CACHE_TTL_SECONDS_DEFAULT,
            'ttlMax' => CACHE_TTL_SECONDS_MAX,
            'host' => HOST_DEFAULT,
            'port' => PORT_DEFAULT,
            'logFile' => LOG_FILE_DEFAULT
        ];
    }

    //what if file isnt there so we need to create it now
    private function createDefaultBootstrapFile(): void
    {
        $defaultContent = [
            'config' => $this->getDefaultConfig(),
            'items' => []
        ];

        $directoryPath = dirname($this->bootstrapFilePath);

        if (!is_dir($directoryPath)) {
            mkdir($directoryPath, 0777, true);
        }

        file_put_contents($this->bootstrapFilePath, json_encode($defaultContent, JSON_PRETTY_PRINT));
    }

    //configsalvage function here which will correct if any wrong values are there and use the right values as it is
    private function configSalvage(array $config): array
    {
        //first of all get the default configs
        $defaultConfig = $this->getDefaultConfig();

        //setting ttl first
        if (isset($config['ttlDefault']) && is_int($config['ttlDefault']) && $config['ttlDefault'] >= 1) {
            $defaultConfig['ttlDefault'] = $config['ttlDefault'];
        }

        //now we cna set maxttl here
        if (isset($config['ttlMax']) && is_int($config['ttlMax']) && $config['ttlMax'] >= $defaultConfig['ttlDefault']) {
            $defaultConfig['ttlMax'] = $config['ttlMax'];
        }

        //host
        if (isset($config['host']) && is_string($config['host']) && $config['host'] !== '') {
            $defaultConfig['host'] = $config['host'];
        }

        //port
        if (isset($config['port']) && is_int($config['port']) && $config['port'] > 0 && $config['port'] <= 65535) {
            $defaultConfig['port'] = $config['port'];
        }

        //logfile path
        if (isset($config['logFile']) && is_string($config['logFile']) && $config['logFile'] !== '') {
            $defaultConfig['logFile'] = $config['logFile'];
        }

        return $defaultConfig;
    }


    //itemsalvage function here to check all preloaded items, if correct good otherwise will skip them
    private function itemsSalvage(array $items): array
    {
        $validItems = [];

        foreach ($items as $item) {
            //it should be in array format
            if (!is_array($item)) {
                //log the error
                Logger::logWarn('BootstrapLoader', 'Invalid preload item skipped!', 'BOOTSTRAP_ITEM_INVALID');
                continue;
            }

            //other fields should be valid
            //first key must exist
            if (!isset($item['key']) || !is_string($item['key']) || !$this->isValidKey($item['key'])) {
                Logger::logWarn('BootstrapLoader', 'Invalid preload item key skipped!', 'BOOTSTRAP_ITEM_KEY_INVALID');
                continue;
            }

            //value should also be there
            if (!array_key_exists('value', $item)) {
                Logger::logWarn('BootstrapLoader', 'Invalid preload item value skipped!', 'BOOTSTRAP_ITEM_VALUE_MISSING');
                continue;
            }

            //ttl optional but still atleast valid
            if (isset($item['ttl']) && (!is_int($item['ttl']) || $item['ttl'] < 1 || $item['ttl'] > CACHE_TTL_SECONDS_MAX)) {
                Logger::logWarn('BootstrapLoader', 'Invalid preload item TTL skipped.', 'BOOTSTRAP_ITEM_TTL_INVALID');
                continue;
            }

            //put items in valid array
            $validItems[] = [
                'key' => $item['key'],
                'value' => $item['value'],
                'ttl' => $item['ttl'] ?? null
            ];
        }

        return $validItems;
    }

    //new function to check key validness
    private function isValidKey(string $key): bool
    {
        //Only allows letters, nums, . , _ , : , -
        return $key !== '' && strlen($key) <= CACHE_ITEM_KEY_LENGTH_MAX && preg_match(CACHE_ITEM_KEY_REGEX, $key) === 1;
    }
}

Some new files we need bu thwy lets see:::::



CacheServerValidationUtility.php keeps defensive cache key/value/ttl checks

CacheServerHttpUtility.php keeps cache HTTP header/context/status 

HttpRequestGlobalReader.php reads PHP globals and headers, so HttpRequest.php only represents the request object

HttpJsonBodyParser.php parses JSON body, so JSON parsing is not mixed with request storage

HashAlgorithmValue.php avoids hardcoded sha256

TimeValue.php avoids hardcoded 1000 for ms/sec conversion
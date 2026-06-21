File structure::

simple-cache-server/

├── bin/

│   ├── start.sh // 

│   ├── stop.sh

│   └── restart.sh

├── config/

│   ├── bootstrap.json

│   └── auth.php

├── logs/

│   └── cache-server.log

├── run/

│   └── cache-server.pid

├── public/

│   └── router.php

├── src/

│   ├── App/

│   │   └── Application.php

│   ├── Bootstrap/

│   │   └── BootstrapLoader.php

│   ├── Cache/

│   │   ├── CacheItem.php

│   │   └── CacheService.php

│   ├── Controller/

│   │   ├── CacheController.php

│   │   └── AdminCacheController.php

│   ├── Auth/

│   │   ├── AuthService.php

│   │   └── Role.php

│   ├── Logging/

│   │   └── Logger.php

│   └── Http/

│       ├── Request.php

│       ├── JsonResponse.php

│       └── ResponseFactory.php

├── server.php

├── composer.json

└── README.md



//so now starting with independent files
1. Role.php- done - Stores role names like normal and admin in one place.

2. JsonResponse.php- done - Sends every API response as JSON with correct HTTP status code

3. ResponseFactory.php - Creates std success/error response formats so all api look same!

4. Logger.php - Writes startup,error,auth,and cache op logs to file.



server.php
-> creates Request
-> creates Application
-> Application loads config/auth/cache/controllers/router
-> router authenticates request
-> router authorizes route
-> router calls correct controller
-> controller calls CacheService
-> JsonResponse sends response

Application.php

what it will do????
lets see
it will create :::: 
- BootstrapLoader
- CacheService
- AuthService
- ResponseFactory
- CacheController
- AdminCacheController

will also load preload cache items from bootstap.json


router.php

now what this will do 

it will decide

which URL should call which controller method????

so akso check following::
- authentication
- authorization
- unknown route

server.php
here we will start actually
actual req entry pt

what it will do now::: 
- creates Request
- creates Application
- calls Application handle
- sends JsonResponse
- catches unexpected errors



Because now you are not using PHP built-in globals like:

$_SERVER
$_GET
php://input

Your custom socket server receives request like plain text, so we manually parse it.

Example raw HTTP request looks like this:

POST /v1/cache/set HTTP/1.1
Host: 127.0.0.1:8080
Content-Type: application/json
X-API-Key: NORMALAPIKEY12345678901234567890
Content-Length: 48

{"key":"test.name","value":"Neetika","ttl":60}

This function breaks that into:

method       = POST
path         = /v1/cache/set
query params = []
headers      = Host, Content-Type, X-API-Key
body         = ["key" => "test.name", "value" => "Neetika", "ttl" => 60]
rawBody      = original JSON string
invalidJson  = false
#!/bin/bash

# go to courier war game root
cd "$(dirname "$0")/.." || exit 1

# path to existing simple cache server
CACHE_SERVER_DIR="../SimpleCachingServer/Project/Backend"

# start cache server using its own script
bash "$CACHE_SERVER_DIR/scripts/start.sh" 


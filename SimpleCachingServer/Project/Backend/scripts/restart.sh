#!/bin/bash

# go to project root from scripts folder
cd "$(dirname "$0")/.." || exit 1

# stop existing server
./scripts/stop.sh

# start server again
./scripts/start.sh
#!/bin/bash

# go to project root from scripts folder
cd "$(dirname "$0")/.." || exit 1

# define pid file path
PID_FILE="run/cache-server.pid"

# if pid file does not exist then server is not running
if [ ! -f "$PID_FILE" ]; then
    echo "Cache server is not running"
    exit 0
fi

# read pid
PID=$(cat "$PID_FILE")

# if process does not exist then remove stale pid file
if ! kill -0 "$PID" 2>/dev/null; then
    echo "Process not found, removing stale PID file"
    rm -f "$PID_FILE"
    exit 0
fi

# send graceful stop signal
kill "$PID"

# wait maximum 5 seconds for graceful shutdown
for i in {1..5}; do
    # if process already stopped then break
    if ! kill -0 "$PID" 2>/dev/null; then
        break
    fi

    sleep 1
done

# if still alive after waiting then force kill as last resort
if kill -0 "$PID" 2>/dev/null; then
    echo "Process still running, forcing stop"
    kill -9 "$PID"
fi

# remove pid file
rm -f "$PID_FILE"

# show success msg
echo "Cache server stopped"
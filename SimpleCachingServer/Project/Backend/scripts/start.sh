#!/bin/bash

# go to project root from scripts folder
cd "$(dirname "$0")/.." || exit 1

# create logs folder if missing
mkdir -p logs

# create run folder if missing
mkdir -p run

# define pid file path
PID_FILE="run/cache-server.pid"

# define log file path
LOG_FILE="logs/cache-server.log"

# define host
HOST="127.0.0.1"

# define port
PORT="8080"

# if pid file exists then check if process is running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")

    # kill -0 checks if process exists without killing it
    if kill -0 "$PID" 2>/dev/null; then
        echo "Cache server already running with PID $PID"
        exit 0
    fi

    # old pid file is stale so remove it
    echo "Removing stale PID file"
    rm -f "$PID_FILE"
fi

# start custom long running php cache server in background
php server.php >> "$LOG_FILE" 2>&1 &

# save new process id
echo $! > "$PID_FILE"

# show success msg
echo "Cache server started on http://$HOST:$PORT with PID $(cat "$PID_FILE")"
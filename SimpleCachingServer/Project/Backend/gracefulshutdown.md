Graceful shutdown means:

tell server politely:
please stop now
finish current work
cleanup resources
write final logs
close sockets
then exit



| Signal    | Meaning                     |
| --------- | --------------------------- |
| `SIGTERM` | polite shutdown request     |
| `SIGINT`  | Ctrl+C                      |
| `SIGKILL` | immediate force kill        |
| `SIGHUP`  | reload/restart style signal |


FINAL GRACEFUL FLOW::::


./scripts/stop.sh
    ↓
kill PID
    ↓
SIGTERM sent
    ↓
server.php receives SIGTERM
    ↓
serverShouldStop = true
    ↓
while loop exits
    ↓
server socket closes
    ↓
logs graceful shutdown
    ↓
process exits itself




Earlier stop.sh eventually used kill -9 which forcefully terminated the process immediately

So improved it by adding graceful shutdown using SIGTERM and signal handling in server.php

Now server.php listens for shutdown signals using pcntl_signal

When stop.sh sends SIGTERM, the server exits the main loop, closes sockets, writes final logs, and shuts down cleanly

kill -9 is now only used as last resort if graceful shutdown hangs


SO CHANGES IN SERVER.PHP

1. server socket closes only after while loop ends
2. client socket closes after every request
3. signal setup happens once before loop
4. shutdown flag is created before loop
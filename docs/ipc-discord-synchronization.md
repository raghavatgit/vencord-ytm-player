# IPC Discord Synchronization Protocol

## Architecture
The client connects via standard named pipes (`\\.\pipe\discord-ipc-0` on Windows) to the local Discord client daemon.

Handshake commands (`OP_HANDSHAKE = 0`) validate the client application ID, and heartbeats emit at 4,000ms intervals matching Discord Gateway rate limits.

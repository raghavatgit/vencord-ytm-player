# YouTube Music Companion REST API Specification

## Local Server Handshake (Port 9863)

### 1. Pairing Request
* **Endpoint:** `POST /api/v1/auth/request`
* **Payload:** `{ "appId": "vencord-ytm-player", "appName": "Vencord YTM" }`
* **Response:** `{ "status": "pending", "code": "1234" }`

### 2. State Polling
* **Endpoint:** `GET /api/v1/state`
* **Headers:** `Authorization: Bearer <token>`
* **Response:**
  ```json
  {
    "player": { "hasSong": true, "isPaused": false, "seek": 45, "volume": 85 },
    "track": { "title": "Track Name", "author": "Artist", "album": "Album" }
  }
  ```

### 3. Media Controls
* **Endpoint:** `POST /api/v1/command`
* **Payload:** `{ "command": "playPause" | "next" | "previous" | "setVolume" }`

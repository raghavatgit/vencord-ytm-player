# Troubleshooting and Diagnostic Guide

## Common Issues & Resolutions

### 1. Status indicates "Waiting for companion server..."
* **Cause:** YouTube Music Desktop App companion daemon is either not running or blocked by local firewalls.
* **Resolution:**
  1. Open YouTube Music Desktop App (`ytmdesktop`).
  2. Navigate to **Settings -> Integrations -> Companion Server**.
  3. Verify the server is enabled and listening on port **9863**.
  4. Ensure "Companion Authorization" is toggled ON.

### 2. Authorization PIN does not appear in Discord
* **Cause:** Existing invalid or expired token stored in Discord settings.
* **Resolution:**
  1. Open Discord Settings -> Vencord -> Plugins -> YouTubeMusicPlayer.
  2. Clear the API Token field.
  3. Restart Discord (`Ctrl + R`) to re-trigger the initial pairing handshake.

### 3. Port 9863 Conflict
* **Cause:** Another local background service is holding port 9863.
* **Resolution:**
  Run the PowerShell diagnostic utility from dotfiles:
  ```powershell
  Find-Port 9863
  ```
  If occupied by a rogue process, terminate it using:
  ```powershell
  Kill-Port 9863
  ```

### 4. Discord Rich Presence shows generic status
* **Cause:** Rich presence application ID is unconfigured.
* **Resolution:**
  Verify your custom Application ID in plugin settings matches the registered application in the Discord Developer Portal with the `ytm-logo` asset uploaded.

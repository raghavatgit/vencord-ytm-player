<div align="center">

# 🎵 YouTube Music Player for Vencord

### Desktop-grade media center and real-time Rich Presence embedded directly into Discord.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vencord](https://img.shields.io/badge/Vencord-Userplugin-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://vencord.dev/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/raghavatgit/vencord-ytm-player/pulls)

<p align="center">
  <b>Brings what Spotify users take for granted to millions of YouTube Music subscribers.</b><br/>
  Featuring dynamic ambient album-art lighting, 0ms optimistic controls, automated PIN authorization, and zero-reflow CSS layout containment.
</p>

</div>

---

## ✨ Features at a Glance

| Feature | Discord Native Spotify | **YouTubeMusicPlayer** (This Plugin) |
| :--- | :---: | :---: |
| **In-App Account Bar Player** | ✅ | ✅ |
| **Ambient Album Art Backdrop Glow** | ❌ *(Flat dark)* | ✅ *(GPU-accelerated blurred backdrop)* |
| **Direct Like / Dislike Control** | ⚠️ *(Like only)* | ✅ *(Both Like & Dislike tracked)* |
| **Zero-Lag Optimistic Controls** | ⚠️ *(Network delay)* | ✅ *(0ms instant UI state prediction)* |
| **Live Drag-Seeking Scrubber** | ⚠️ | ✅ *(Smooth second ticker + drag locks)* |
| **Volume Slider with Quick Mute** | ❌ | ✅ *(Interactive slider + icon mute toggle)* |
| **Discord Rich Presence (RPC)** | ✅ | ✅ *(Elapsed timestamps, album art, buttons)* |
| **Auto-Idle Inactivity Sleep** | ❌ | ✅ *(Hides automatically after 5m of pause)* |

---

## 📸 Interface Anatomy

```
┌─────────────────────────────────────────────────────────────────┐
│ [🔴 Ambient Album Art Glow Backdrop via CSS Filter Layer]      │
│                                                                 │
│  [ 60x60 Art ]   Song Title (Click to open in browser)   [👍]   │
│  [ Hover Zoom]   Artist Name · Album Title               [👎]   │
│                                                          [↗ ]   │
│  01:24 ━━━━━━━━━━━━━━━●──────────────────────── 03:45           │
│                                                                 │
│             [🔀]   [⏮]   [ ▶ / ⏸ ]   [⏭]   [🔁]               │
│                                                                 │
│  🔊 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━●──────  85%                    │
└─────────────────────────────────────────────────────────────────┘
│  Raghav Goyal (Discord User Account Tag Bar)            ⚙️ 🎙️ 🎧 │
└─────────────────────────────────────────────────────────────────┘
```

* **Ambient Visuals**: Uses dynamic pseudo-elements pulling `--vc-ytm-thumb` through `filter: blur(32px) saturate(1.8) brightness(0.15)` to bathe the player card in colors matching the current album.
* **Layout Isolation**: Styled with `contain: layout style` to prevent DOM layout recalculations from spilling into Discord chat rendering or voice call feeds.

---

## ⚡ 1-Click Quick Installation

### Option A: Windows (PowerShell)
Run PowerShell as your standard user:
```powershell
irm https://raw.githubusercontent.com/raghavatgit/vencord-ytm-player/main/install.ps1 | iex
```

### Option B: Linux & macOS (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/raghavatgit/vencord-ytm-player/main/install.sh | bash
```

### Option C: Manual Setup
Clone this repository directly into your Vencord `src/userplugins` directory:
```bash
# 1. Navigate to your Vencord root
cd ~/Documents/Vencord

# 2. Clone into userplugins
git clone https://github.com/raghavatgit/vencord-ytm-player.git src/userplugins/youtubeMusicPlayer

# 3. Build Vencord
pnpm build
```
Once built, restart Discord (`Ctrl + R`).

---

## 🔌 Companion Server Requirements

This plugin interfaces with your local YouTube Music client via its local companion REST API on port `9863`. Choose either companion app:

### Method 1: YouTube Music Desktop App (`ytmdesktop` v2) — Recommended
1. Install [YouTube Music Desktop App](https://ytmdesktop.app/).
2. Open Settings ➔ **Integrations**.
3. Enable **Companion Server** (default port: `9863`).
4. Enable **Companion Authorization**.
5. When the plugin initializes, a 4-digit PIN will appear in the Discord status bar. Click **Authorize** in the ytmdesktop popup to complete the pairing.

### Method 2: `th-ch/youtube-music`
1. Install [th-ch/youtube-music](https://github.com/th-ch/youtube-music).
2. Open Settings ➔ **Plugins**.
3. Enable the **Companion Server** plugin on port `9863`.

---

## 🎮 Discord Rich Presence Setup

To broadcast your playing tracks with album art and an "Open in YouTube Music" button to your Discord profile:

1. Visit the [Discord Developer Portal](https://discord.com/developers/applications) and create a **New Application** named `YouTube Music`.
2. Navigate to **Rich Presence ➔ Rich Presence Assets** and upload a 512×512 PNG named `ytm-logo`.
3. Copy your **Application ID** and paste it into Discord Settings ➔ **Vencord ➔ Plugins ➔ YouTubeMusicPlayer**.

---

## 🛠️ Architecture & Under the Hood

### 1. Webpack AST Monkey-Patching
Rather than injecting detached DOM elements that break during Discord navigation, the plugin hooks into Discord’s minified Webpack module tree at runtime:
```typescript
patches: [
    {
        find: "#{intl::USER_PROFILE_ACCOUNT_POPOUT_BUTTON_A11Y_LABEL}",
        replacement: {
            match: /(?<=\i\.jsxs?\)\()(\i),{(?=[^}]*?userTag:\i,occluded:)/,
            replace: "$self.PanelWrapper,{VencordOriginal:$1,",
        },
    },
]
```
The patch inserts `<Player />` directly above the native user profile popout wrapper inside an `<ErrorBoundary>` so the Discord client remains 100% crash-safe.

### 2. Optimistic State Replication (0ms Latency)
Network calls to local REST daemons inevitably introduce round-trip latency. `YTMStore` implements optimistic state prediction:
```typescript
playPause() {
    set({ isPlaying: !s.isPlaying }); // Immediately flips state in UI
    cmd("playPause");                 // Dispatches HTTP POST asynchronously
}
```
If the companion takes 80ms to respond, the user experiences immediate UI responsiveness with zero perceived lag.

### 3. Rate-Limit Handling & Auto-Recovery
* **Rate-Limit Resilience**: Polling runs on a 6-second interval to stay within companion daemon rate limits (1 req / 5s). Silent HTTP `429` backoff avoids UI jitter.
* **Self-Healing Auth**: Catches `401 Unauthorized` and `403 Forbidden` responses to invalidate stored tokens and automatically re-trigger the PIN handshake.

---

## ⚙️ Configuration Options

Configurable via Discord Settings ➔ **Vencord ➔ Plugins ➔ YouTubeMusicPlayer**:

* **Companion Server Port**: Configurable port (default: `9863`).
* **Show Player Panel**: Toggle mini-player visibility above your account bar.
* **Rich Presence**: Toggle profile status broadcast on/off.
* **Listening Status**: Switch between `"Listening to..."` and `"Playing..."`.
* **Show Elapsed Time**: Display live seek progress in Rich Presence.
* **Show Open Button**: Display a clickable URL button on your Discord profile card.

---

## 🤝 Contributing

Pull requests, bug reports, and suggestions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **GNU General Public License v3.0**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  Crafted with ❤️ by <a href="https://github.com/raghavatgit">@raghavatgit</a>
</div>

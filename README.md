# 🎵 Spicy Lyrics Studio

A modern, timeline-based lyric synchronization studio built specifically for the **Spicetify Spicy Lyrics** plugin. It connects directly to the desktop **Spotify** application on Windows via GSMTC (Global System Media Transport Controls) to provide real-time playhead tracking, live millisecond seek/playback, automatic Turkish syllable splitting, interactive multi-track editing, and seamless `.ttml` export.

---

## ✨ Features

- **⚡ Spotify Windows Bridge (GSMTC):** Real-time, sub-frame playback synchronization with extrapolation. Seek, play, and pause directly from the timeline ruler without downloading MP3s.
- **✂️ Syllable-by-Syllable Splitting:** Split words into consecutive inline spans (`<span>kur</span><span ...>tar</span><span>sana</span> `) following Spicy Lyrics' strict formatting rules.
- **🇹🇷 Algorithmic Turkish Hyphenator:** Automatically splits Turkish lyrics into syllables according to vowel-consonant rules on generation.
- **🎯 Live Tap-to-Sync (`T` Key):** Tap along with the song in real time; each tap snaps and chains the next lyric block to the exact playhead timestamp.
- **🎛️ Micro-Nudge Keyboard Controls:** Fine-tune block boundaries with 10ms or 50ms precision using the arrow keys (`←`/`→`, `Shift + ←/→`, `Alt + ←/→`).
- **🌐 Auto Lyric Fetcher:** Powered by LRCLIB API to pull plain and synced lyrics automatically based on the current track playing on Spotify.
- **📁 Full Project System:** Save and reopen workspace sessions (`.json`), auto-save to browser local storage, and export production-ready `.ttml` files.
- **🎨 Visual Studio 2026 Style Launcher:** Clean start window with recent project history, fast search, and one-click session resume.

---

## 🚀 Quick Start

### 1. Launch the Spotify Bridge
Run the launcher script to start the local background bridge listening on `http://localhost:48484`:
```cmd
Spotify_Koprusunu_Baslat.bat
```

### 2. Open the Studio
Double click **`Timeline_Editor.html`** or open it in any modern browser (Chrome, Edge, Firefox, Brave).

### 3. Sync & Export
1. Start playing any song on your Spotify desktop app.
2. Click **⚡ Auto Fetch** or paste your lyrics into the editor.
3. Click **🚀 Align from Playhead** to generate timeline clips.
4. Press **Space** to play/pause Spotify. Tap **`T`** to sync live, or drag and resize block edges.
5. Hit **💾 Export TTML** and load it into Spicy Lyrics!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Space`** | Toggle Spotify Play / Pause |
| **`T`** | Live Tap-to-Sync next block to playhead |
| **`S`** | Snap selected block to playhead |
| **`X`** | Split selected word into syllables |
| **`←` / `→`** | Nudge selected block by 10ms |
| **`Shift` + `←` / `→`** | Nudge selected block by 50ms |
| **`Alt` + `←` / `→`** | Extend / shrink block duration by 10ms |
| **`Delete`** / **`Backspace`** | Delete selected block(s) |
| **`Ctrl` + `A`** | Select all timeline blocks |
| **`Esc`** | Close dialogs / launcher window |

---

## 📦 Project Structure

```text
SpicyLyricsSync/
├── Timeline_Editor.html       # Studio HTML layout & start screen
├── style.css                  # Studio styling, dark theme & animations
├── app.js                     # Core editor logic, GSMTC polling & TTML generator
├── Spotify_Koprusunu_Baslat.bat # Batch launcher for the C# bridge
├── Spotify_Koprusu.ps1        # PowerShell runner
└── SpotifyBridge/             # Windows GSMTC .NET bridge source
    ├── Program.cs
    └── SpotifyBridge.csproj
```

---

## 📄 License
MIT License. Created for the Spicetify community.

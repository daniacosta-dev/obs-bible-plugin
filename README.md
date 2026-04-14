# OBS Bible Overlay

A local tool for displaying Bible verses as an overlay in OBS Studio.
Uses the **Reina-Valera 1909** translation, which is in the public domain with no usage restrictions.

---

## Requirements

- **Node.js 18** or higher
- Internet connection (setup only)
- OBS Studio (any modern version)

---

## Installation

### Linux / macOS

```bash
# 1. Enter the project folder
cd obs-bible-plugin

# 2. Install dependencies
npm install

# 3. Download and normalize the RV1909 Bible
npm run setup

# 4. Start the server
npm start
```

### Windows (PowerShell)

```powershell
# 1. Enter the project folder
cd obs-bible-plugin

# 2. Install dependencies
npm install

# 3. Download and normalize the RV1909 Bible
npm run setup

# 4. Start the server
npm start
```

The server runs on `http://localhost:3000`. Keep it open while using OBS.

---

## Adding the overlay in OBS

1. In OBS, go to **Sources → Add → Browser Source**
2. Configure:
   - **URL:** `http://localhost:3000/overlay.html`
   - **Width:** `1920`
   - **Height:** `1080`
   - Enable **"Shutdown source when not visible"** (recommended)
3. Under **Custom CSS**, paste:
   ```css
   body { background: transparent !important; }
   ```
4. Click **OK**

The overlay is fully transparent. Layer it on top of your other sources.

---

## Adding the control panel as a Custom Dock

1. In OBS, go to **View → Docks → Custom Browser Dock**
2. Configure:
   - **Dock Name:** `Bible`
   - **URL:** `http://localhost:3000/panel.html`
3. The panel appears as a floating dock inside OBS

---

## Basic usage

1. In the panel, select a **book → chapter**
2. A scrollable list of all verses in that chapter appears, showing the verse number and text
3. Click any verse to preview it — it won't be sent to the screen yet
4. Click **"Mostrar ▶"** (or press Enter) to display it on the overlay
5. Click **"Ocultar"** to hide the verse with an animation
6. Click **"✕"** to clear the selection and hide the screen

### Verse session

Use the **☆** button to add a verse to your session list — useful for planning which verses you'll use during a service:

- Verses in the session list show a **green border** in the verse list so you can spot them at a glance
- Click any session item (or its **▶** button) to send it to the overlay immediately
- Click **✕** on a session item to remove it
- **"Limpiar todo"** clears the entire session
- The session persists in `localStorage` and survives panel refreshes during a service

---

## CSS customization

The overlay uses **CSS custom properties** for all styling. Change them in real time from the **"Personalizar CSS"** section of the panel.

### Available variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--verse-font-family` | `'Georgia', serif` | Font family |
| `--verse-font-size` | `2.4rem` | Verse text size |
| `--verse-font-weight` | `400` | Weight (400 = normal, 700 = bold) |
| `--verse-line-height` | `1.6` | Line height |
| `--verse-color` | `#ffffff` | Verse text color |
| `--verse-text-shadow` | dark shadow | Text shadow |
| `--ref-font-size` | `1.1rem` | Reference text size |
| `--ref-color` | `#ffe08a` | Reference text color |
| `--bg-color` | `rgba(0,0,0,0.55)` | Background color |
| `--bg-border-radius` | `12px` | Border radius |
| `--overlay-padding` | `2rem 2.8rem` | Inner padding |
| `--overlay-max-width` | `900px` | Maximum width |
| `--overlay-position-bottom` | `10%` | Distance from bottom |
| `--transition-duration` | `0.5s` | Animation duration |

### Built-in presets

**Iglesia clásica** — Serif font, semi-transparent background, gold reference. Standard church projection look.

**Texto grande** — Bold sans-serif, larger text. Good for smaller screens or bright backgrounds.

**Fondo oscuro fuerte** — Near-opaque dark background, warm text. Best for bright or busy video backgrounds.

### Custom CSS example

```css
:root {
  --verse-font-family: 'Arial', sans-serif;
  --verse-font-size: 2.8rem;
  --verse-color: #fff9e6;
  --ref-color: #ffd700;
  --bg-color: rgba(0, 0, 50, 0.7);
  --overlay-position-bottom: 15%;
}
```

---

## Troubleshooting

### Port 3000 is already in use

```
Error: listen EADDRINUSE :::3000
```

Another process is using the port. Options:
- Find and kill it: `lsof -i :3000` (Linux/macOS) or `netstat -ano | findstr :3000` (Windows)
- Or change `const PORT = 3000` in `server.js` to another number (e.g. 3001) and update the URLs in OBS accordingly

### "Bible data not found. Please run: npm run setup"

The Bible data hasn't been downloaded yet. Run:
```bash
npm run setup
```

If the setup fails with a network error, check your internet connection and try again.

### OBS is not showing the overlay

1. Make sure the server is running (`npm start` in the terminal)
2. Open `http://localhost:3000/overlay.html` in a browser to confirm it loads
3. Check that the Browser Source URL is correct
4. Make sure the OBS Custom CSS includes `body { background: transparent !important; }`

### The panel shows a red dot (disconnected)

The red dot means the WebSocket is not connected. Make sure the server is running. The panel retries the connection automatically every 3 seconds.

---

## Bible data license

The **Reina-Valera 1909** was published in 1909 and is in the public domain worldwide. Source data from [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases), also public domain.

## License

[GPL-3.0](LICENSE) — required by the libmpv dependency.

Made with ❤️ · MIT License · [Ko-fi](https://ko-fi.com/daniacostadev)
Created by [@daniacosta-dev](https://github.com/daniacosta-dev)

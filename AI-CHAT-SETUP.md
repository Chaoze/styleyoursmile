# StyleYourSmile — AI Chat "Mia" · Setup-Anleitung

Vollständige Anleitung: Qwen auf Hetzner VPS + Node.js Backend + Chat-Widget auf der Website.

---

## Übersicht

```
Besucher (Browser)
    ↓  HTTPS
Hetzner VPS
    ├── Nginx (reverse proxy, SSL)
    ├── Node.js API (chat-server.js) — Port 3001
    └── Ollama (Qwen) — Port 11434 (nur intern)
```

---

## 1. Hetzner VPS einrichten

### Empfohlener Server
| Option | Typ | RAM | CPU | Preis/Monat |
|--------|-----|-----|-----|-------------|
| Minimum | CPX31 | 8 GB | 4 vCPU | ~13 € |
| Empfohlen | CPX41 | 16 GB | 8 vCPU | ~26 € |

> Qwen2.5:7b läuft auf 8 GB, Qwen2.5:14b braucht 16 GB. Für flüssige Antworten empfehlen wir 16 GB.

### Server erstellen
1. Hetzner Cloud Console → **Neues Projekt** → **Server hinzufügen**
2. Location: **Nürnberg** oder **Falkenstein** (nahe Schweiz)
3. Image: **Ubuntu 24.04**
4. SSH Key hinterlegen (oder Root-Passwort notieren)
5. Server erstellen → IP-Adresse notieren (z.B. `49.12.xxx.xxx`)

### Ersten Login & Basis-Setup
```bash
ssh root@49.12.xxx.xxx

# System updaten
apt update && apt upgrade -y

# Firewall einrichten
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# Swap-Datei (wichtig für Modell-Ladezeiten)
fallocate -l 8G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 2. Ollama installieren

```bash
# Ollama installieren
curl -fsSL https://ollama.com/install.sh | sh

# Als Service starten (startet automatisch bei Neustart)
systemctl enable ollama
systemctl start ollama

# Status prüfen
systemctl status ollama
```

### Qwen Modell herunterladen
```bash
# Qwen2.5 7B — gute Balance aus Qualität und Geschwindigkeit
ollama pull qwen2.5:7b

# Alternativ: Qwen3 8B (neuer, bessere Gesprächsführung)
ollama pull qwen3:8b

# Test ob es funktioniert
ollama run qwen2.5:7b "Hallo, wie geht es dir?"
# Mit Ctrl+D beenden
```

> **Wichtig:** Ollama hört standardmässig nur auf `localhost:11434`.
> Nicht nach aussen öffnen — das übernimmt unser Node.js Backend sicher.

---

## 3. Node.js Backend installieren

```bash
# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Projektordner anlegen
mkdir -p /opt/mia-chat
cd /opt/mia-chat

# package.json erstellen
npm init -y
npm install express cors express-rate-limit
```

### chat-server.js erstellen
```bash
nano /opt/mia-chat/chat-server.js
```

Inhalt einfügen:

```javascript
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// CORS: nur deine Domain erlauben
app.use(cors({
  origin: ['https://www.styleyoursmile.ch', 'http://localhost'],
}));

// Rate Limiting: max 20 Nachrichten pro Minute pro IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
});
app.use('/chat', limiter);

// System-Prompt für "Mia"
const SYSTEM_PROMPT = `Du bist Mia, die freundliche virtuelle Assistentin der Zahnarztpraxis StyleYourSmile in Zürich (Weinbergstrasse 62). Die Praxis wird von Dr. Jan Munzinger und Dr. Cedric Regez geleitet.

DEINE PERSÖNLICHKEIT:
- Warm, einfühlsam und professionell — wie eine freundliche Mitarbeiterin am Empfang
- Du kennst die Praxis und ihre Leistungen sehr gut
- Du bist keine Ärztin und stellst keine Diagnosen — du hilfst, beruhigst und vermittelst

LEISTUNGEN DER PRAXIS (die du kennst):
Invisalign, Veneers, Kronen, Implantate, Bleaching, Dentalhygiene, Zahnreinigung, Zahnarztangst-Behandlung (inkl. Hypnose & Lachgas), Notfallzahnarzt, Wurzelbehandlung, Parodontitis, Brücken, Inlays, CMD, Vollnarkose und mehr.

PREISE (ungefähr):
- Dentalhygiene: ab CHF 140
- Implantate: ab CHF 2'900
- Erstberatung: kostenlos

GESPRÄCHSSTRATEGIE:
1. Erst zuhören und empathisch reagieren
2. Kurze, hilfreiche Antwort geben (nie mehr als 3 Sätze)
3. Nach 1-2 Antworten natürlich einen Termin erwähnen — nie aufdringlich, immer im Kontext
4. Bei Schmerzen oder akuten Beschwerden: sofort zum Termin raten
5. Bei Angst: besonders einfühlsam, die sanften Methoden der Praxis erwähnen
6. Bei Preisfragen: "Das klären wir gern persönlich — die erste Beratung ist kostenlos"

TERMINBUCHUNG:
Online-Termin: https://styleyoursmile.simplybook.it
Telefon: +41 43 443 42 42
WhatsApp: https://wa.me/41434434242

SPRACHE:
Antworte immer in der Sprache des Benutzers (DE, EN, FR, RU).
Standardmässig Deutsch.

WICHTIG:
- Halte Antworten kurz (2-4 Sätze) — du bist ein Chat, kein Aufsatz
- Erwähne den Termin-Link nur wenn es natürlich passt
- Nie sagen dass du eine KI bist, ausser der Nutzer fragt direkt`;

// Chat-Endpoint
app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Ungültige Anfrage' });
  }

  // Max. 20 Nachrichten im Verlauf (Kosten/Performance)
  const recentMessages = messages.slice(-20);

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',   // ← Modell hier anpassen
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
        stream: true,
      }),
    });

    // Streaming direkt an Browser weitergeben
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            res.write(`data: ${JSON.stringify({ content: json.message.content })}\n\n`);
          }
          if (json.done) {
            res.write('data: [DONE]\n\n');
          }
        } catch {}
      }
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Modell nicht erreichbar' });
  }
});

app.listen(3001, 'localhost', () => {
  console.log('Mia Chat API läuft auf Port 3001');
});
```

### Als Service einrichten (läuft immer)
```bash
nano /etc/systemd/system/mia-chat.service
```

```ini
[Unit]
Description=Mia Chat API
After=network.target ollama.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/mia-chat
ExecStart=/usr/bin/node chat-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable mia-chat
systemctl start mia-chat
systemctl status mia-chat
```

---

## 4. Nginx + SSL einrichten

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### Nginx-Konfiguration
```bash
nano /etc/nginx/sites-available/mia-chat
```

```nginx
server {
    listen 80;
    server_name chat.styleyoursmile.ch;   # ← Subdomain anlegen (DNS A-Record → VPS-IP)

    location /chat {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 120s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/mia-chat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL-Zertifikat (kostenlos via Let's Encrypt)
certbot --nginx -d chat.styleyoursmile.ch
```

### DNS-Eintrag
Bei deinem Domain-Anbieter:
```
Typ: A
Name: chat
Wert: 49.12.xxx.xxx   (deine VPS-IP)
TTL: 3600
```

---

## 5. Chat-Widget auf der Website

Diesen Code in `index.html` vor `</body>` einfügen (und auf anderen Seiten falls gewünscht):

```html
<!-- ── MIA CHAT WIDGET ── -->
<div id="miaChat" class="mia-chat">
  <button class="mia-toggle" id="miaToggle" aria-label="Chat mit Mia">
    <svg class="mia-icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg class="mia-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
    <span class="mia-label">Mia fragen</span>
  </button>

  <div class="mia-window" id="miaWindow" aria-hidden="true">
    <div class="mia-header">
      <div class="mia-avatar">M</div>
      <div>
        <strong>Mia</strong>
        <span>Virtuelle Praxisassistentin</span>
      </div>
      <div class="mia-online"><span></span>Online</div>
    </div>

    <div class="mia-messages" id="miaMessages">
      <div class="mia-msg mia-msg--bot">
        <p>Hallo! Ich bin Mia 👋 Ich helfe Ihnen gern bei Fragen rund um unsere Praxis oder Behandlungen. Womit kann ich Ihnen helfen?</p>
      </div>
    </div>

    <form class="mia-form" id="miaForm">
      <input
        type="text"
        id="miaInput"
        placeholder="Ihre Frage..."
        autocomplete="off"
        maxlength="500"
      />
      <button type="submit" aria-label="Senden">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </form>
  </div>
</div>
```

Das zugehörige CSS und JS kommt in `styles.css` und `main.js` — diese werden in einem separaten Schritt von Claude Code hinzugefügt sobald der Server läuft.

---

## 6. Testen

```bash
# Direkt auf dem Server testen
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hallo, was kostet eine Dentalhygiene?"}]}'

# Von aussen testen (nach DNS-Propagation)
curl -X POST https://chat.styleyoursmile.ch/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hallo"}]}'
```

---

## 7. Checkliste

- [ ] Hetzner VPS CPX41 erstellt (16 GB RAM)
- [ ] Ubuntu 24.04, Firewall, Swap eingerichtet
- [ ] Ollama installiert & läuft als Service
- [ ] Qwen-Modell heruntergeladen (`ollama pull qwen2.5:7b`)
- [ ] Node.js Backend (`/opt/mia-chat/chat-server.js`) läuft
- [ ] `mia-chat` systemd Service aktiv
- [ ] DNS A-Record `chat.styleyoursmile.ch` → VPS-IP gesetzt
- [ ] Nginx konfiguriert + SSL via Certbot
- [ ] Curl-Test erfolgreich
- [ ] Chat-Widget in Website integriert

---

## Kosten (monatlich)

| Position | Preis |
|----------|-------|
| Hetzner CPX41 VPS | ~26 € |
| Domain/SSL | 0 € (Let's Encrypt) |
| Ollama | 0 € (Open Source) |
| Qwen2.5:7b | 0 € (Open Source) |
| **Total** | **~26 €/Monat** |

---

## Nächste Schritte

Sobald der Server läuft und der Curl-Test funktioniert, implementiert Claude Code automatisch:
1. Das vollständige Chat-Widget (CSS + JS) im Glassmorphism-Stil der Website
2. Streaming-Antworten (Buchstabe für Buchstabe wie ChatGPT)
3. Termin-Button der automatisch erscheint wenn Mia es vorschlägt

**Fang an mit Schritt 1 — VPS erstellen. Alles andere folgt.**

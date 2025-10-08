# Scratch Collaboration Extension

Eine Chrome-Erweiterung für echte Zusammenarbeit an Scratch-Projekten in Echtzeit mit einem lokalen Server.

**GitHub Repository:** [github.com/r4k5O/ScratchCollab](https://github.com/r4k5O/ScratchCollab)

## 🌟 Features

- **Echtzeit-Zusammenarbeit**: Mehrere Benutzer können gleichzeitig an einem Scratch-Projekt arbeiten
- **Integrierter Chat**: Kommunizieren Sie direkt über die Erweiterung mit anderen Mitarbeitern
- **Lokaler Server**: Keine externen Abhängigkeiten - alles läuft lokal
- **WebSocket-Kommunikation**: Schnelle, bidirektionale Kommunikation
- **Benutzerverfolgung**: Sehen Sie, wer sonst noch am Projekt arbeitet
- **Projekt-Synchronisation**: Alle Änderungen werden zwischen Benutzern geteilt
- **Cursor-Verfolgung**: Sehen Sie, wo andere Benutzer arbeiten (Framework implementiert)
- **Mehrsprachigkeit**: Automatische Spracherkennung und Unterstützung für Scratch-Sprachen
- **Übersetzungssystem**: Vollständige Lokalisierung der Benutzeroberfläche
- **Scratch-Account-Integration**: Automatische Erkennung und Verwendung von Scratch-Benutzerkonten
- **Benutzerprofile**: Anzeige von Scratch-Profilbildern und Benutzernamen
- **Authentifizierte Zusammenarbeit**: Verifizierte Benutzeridentitäten in Kollaborationssitzungen
- **Freundesystem**: Freunde hinzufügen und zu Zusammenarbeit einladen
- **Browser-Kompatibilität**: Unterstützung für Chrome, Firefox, Edge und weitere Browser
- **Cursor-Vorschau**: Echtzeit-Anzeige von anderen Benutzern mit Namen
- **Projekt-Sharing**: "Mit ScratchCollab teilen"-Button für einfache Projektfreigabe

## 📋 Voraussetzungen

- **Node.js** (>= 14.0.0)
- **Google Chrome** (für die Erweiterung)
- **Internetverbindung** (für Scratch-Projekte)

## 🚀 Installation

### Automatische Installation

```bash
# 1. Repository klonen oder herunterladen
git clone https://github.com/r4k5O/ScratchCollab.git
cd ScratchCollab

# 2. Projekt aufbauen
npm run build

# 3. Server starten
npm run start:server
```

### Manuelle Installation

#### Chrome-Erweiterung installieren:

1. Öffnen Sie Chrome und navigieren Sie zu `chrome://extensions/`
2. Aktivieren Sie den "Entwicklermodus" (Schalter oben rechts)
3. Klicken Sie auf "Ungepackte Erweiterung laden"
4. Wählen Sie den `dist`-Ordner aus
5. Die Erweiterung sollte jetzt in Ihrer Erweiterungsliste erscheinen

#### Server starten:

```bash
# 1. In das Server-Verzeichnis wechseln
cd server

# 2. Abhängigkeiten installieren
npm install

# 3. Server starten
npm start
```

Der Server startet standardmäßig auf `http://localhost:3000`.

## 🎯 Verwendung

1. **Scratch-Projekt öffnen**: Gehen Sie zu https://scratch.mit.edu/projects/[PROJECT_ID]
2. **Erweiterung aktivieren**: Klicken Sie auf das Erweiterungs-Icon in Chrome
3. **Zusammenarbeit starten**:
   - Geben Sie Ihren Namen ein
   - Klicken Sie auf "Zusammenarbeit starten"
4. **Projekt teilen**: Teilen Sie die Projekt-ID mit Ihren Mitarbeitern
5. **Gemeinsam arbeiten**: Alle Änderungen werden in Echtzeit synchronisiert!

### 4. Chat verwenden

- **Nachrichten senden**: Verwenden Sie das Chat-Feld im Erweiterungs-Popup
- **Enter-Taste**: Drücken Sie Enter oder klicken Sie "Senden" zum Versenden
- **Nachrichten empfangen**: Alle Nachrichten werden automatisch im Chat-Bereich angezeigt
- **Echtzeit-Kommunikation**: Chatten Sie in Echtzeit mit Ihren Mitarbeitern

### 5. Scratch-Account-Integration

Die Erweiterung erkennt automatisch, ob Sie bei Scratch angemeldet sind und verwendet Ihre Account-Informationen:

**Automatische Erkennung:**
- **Login-Status**: Erkennt automatisch Scratch-Anmeldung
- **Benutzername**: Verwendet Ihren Scratch-Benutzernamen für die Zusammenarbeit
- **Profilbild**: Zeigt Ihr Scratch-Profilbild in der Teilnehmerliste
- **Profil-Link**: Direkter Link zu Ihrem Scratch-Profil

**Vorteile der Account-Integration:**
- **Verifizierte Identität**: Andere Benutzer sehen Ihren echten Scratch-Benutzernamen
- **Profil-Informationen**: Zeigt Profilbilder und Links zu Scratch-Profilen
- **Authentifizierte Sitzungen**: Sichere Benutzerverifikation im Kollaborationssystem
- **Nahtlose Erfahrung**: Keine separate Anmeldung erforderlich

**Wenn Sie nicht angemeldet sind:**
- Die Erweiterung funktioniert weiterhin mit einem Standard-Benutzernamen
- Sie können die Erweiterung nutzen, aber ohne verifizierte Benutzeridentität
- Andere Teilnehmer sehen Sie als "Anonymous" oder Ihren gewählten Namen

### 6. Freundesystem

Verwalten Sie Ihre Scratch-Freunde und laden Sie sie zu Zusammenarbeitssitzungen ein:

**Freunde hinzufügen:**
- Klicken Sie auf "Freunde anzeigen" im Erweiterungs-Popup
- Verwenden Sie "Freund einladen" um neue Freunde hinzuzufügen
- Freunde werden in Ihrer Freundesliste angezeigt

**Freunde zu Zusammenarbeit einladen:**
- Starten Sie eine Zusammenarbeitssitzung
- Klicken Sie auf "Freund einladen"
- Wählen Sie einen Freund aus der Liste oder geben Sie einen Benutzernamen ein
- Ihr Freund erhält eine Einladung zur Zusammenarbeit

**Vorteile des Freundesystems:**
- **Einfache Einladungen**: Laden Sie Freunde direkt über die Erweiterung ein
- **Freundesliste**: Behalten Sie den Überblick über Ihre Scratch-Freunde
- **Schnelle Zusammenarbeit**: Starten Sie gemeinsame Projekte mit einem Klick

### 7. Browser-Kompatibilität

Die Erweiterung unterstützt mehrere Browser:

**Unterstützte Browser:**
- **Google Chrome** (Manifest V3)
- **Microsoft Edge** (Chromium-basiert)
- **Mozilla Firefox** (Manifest V2)
- **Opera** (Chromium-basiert)

**Browser-spezifische Installation:**
- **Chrome/Edge**: Verwenden Sie den `dist/chrome` oder `dist/edge` Ordner
- **Firefox**: Verwenden Sie den `dist/firefox` Ordner
- **Safari**: Kompatibilität durch WebExtensions-Standard (experimentell)

**Browser-spezifische Features:**
- Automatische Browser-Erkennung und Anpassung
- Fallback-Systeme für nicht unterstützte APIs
- Einheitliche Benutzererfahrung über alle Browser

### 8. Cursor-Vorschau

Sehen Sie in Echtzeit, wo andere Benutzer arbeiten:

**Wie es funktioniert:**
- **Cursor-Anzeige**: Farbige Kreise zeigen die Position anderer Benutzer an
- **Benutzernamen**: Namen werden neben den Cursors angezeigt
- **Echtzeit-Synchronisation**: Cursor-Positionen werden sofort aktualisiert
- **Auto-Ausblendung**: Inaktive Cursor verschwinden nach 5 Sekunden

**Cursor-Farben:**
- Jeder Benutzer erhält eine einzigartige Cursor-Farbe
- Farben werden automatisch zugewiesen
- Einfache Unterscheidung zwischen verschiedenen Benutzern

### 9. Projekt-Sharing

Teilen Sie Scratch-Projekte einfach mit Freunden:

**"Mit ScratchCollab teilen"-Button:**
- **Automatische Platzierung**: Button wird neben Scratch-Share-Buttons hinzugefügt
- **Ein-Klick-Sharing**: Generiert sofort teilbaren Link
- **Zwischenablage**: Kopiert Link automatisch in Zwischenablage
- **Server-URL**: Verwendet konfigurierte Server-Adresse

**Link-Format:**
- \`http://localhost:3000?project=123456&source=scratch\`
- Projekt-ID wird automatisch aus aktueller Scratch-Seite extrahiert
- Server-URL kann in Erweiterungs-Einstellungen angepasst werden

**Verwendung:**
1. Öffnen Sie ein Scratch-Projekt
2. Klicken Sie auf "Mit ScratchCollab teilen"
3. Link wird in Zwischenablage kopiert
4. Teilen Sie den Link mit Freunden
5. Freunde können sofort mit der Zusammenarbeit beginnen

### 10. Sprachunterstützung

Die Erweiterung erkennt automatisch die Sprache der Scratch-Website und passt ihre Benutzeroberfläche entsprechend an:

- **Automatische Spracherkennung**: Erkennt die Scratch-Sprache aus URL, Cookies, HTML-Attributen und mehr
- **Unterstützte Sprachen**: Englisch, Deutsch und weitere Scratch-Sprachen
- **Fallback-Mechanismus**: Verwendet Englisch als Standard bei nicht erkannter Sprache
- **Browser-Sprachenerkennung**: Verwendet Browser-Sprache als zusätzlichen Fallback

**Wie es funktioniert:**
1. Erweiterung lädt auf Scratch-Seite
2. Automatische Erkennung der Scratch-Sprache
3. UI-Elemente werden in erkannter Sprache angezeigt
4. Chat und alle Beschriftungen werden übersetzt

## 📁 Projektstruktur

```
├── dist/                    # Gebaute Erweiterung (für Chrome laden)
│   ├── manifest.json       # Erweiterungs-Manifest
│   ├── popup.html          # Popup-Interface
│   ├── popup.js            # Popup-Logik
│   ├── content.js          # Scratch-Seiten-Integration
│   ├── background.js       # Hintergrund-Script
│   └── icons/              # Erweiterungs-Icons
├── server/                 # Kollaborations-Server
│   ├── server.js           # WebSocket-Server
│   ├── package.json        # Server-Abhängigkeiten
│   └── README.md           # Server-Dokumentation
├── translations/           # Übersetzungsdateien
│   ├── en.json            # Englische Übersetzungen
│   ├── de.json            # Deutsche Übersetzungen
│   └── translator.js       # Übersetzungs-Manager
├── build.js               # Build-Script
├── package.json           # Projekt-Konfiguration
└── README.md             # Diese Datei
```

## 🔧 Entwicklung

### Erweiterung modifizieren:

```bash
# Änderungen vornehmen
# Dateien in der Hauptverzeichnis bearbeiten

# Projekt neu bauen
npm run build

# Erweiterung in Chrome neu laden (chrome://extensions/)
# Änderungen testen
```

### Server entwickeln:

```bash
# Server im Entwicklungsmodus starten (mit auto-restart)
cd server
npm run dev

# Server-Logs werden angezeigt
# Bei Änderungen automatisch neustarten
```

## 🔍 Fehlerbehebung

### Erweiterung lädt nicht?
- Stellen Sie sicher, dass Sie aus dem `dist`-Ordner laden, nicht aus dem Hauptverzeichnis
- Überprüfen Sie die Konsole auf Fehler

### Server startet nicht?
- Stellen Sie sicher, dass Port 3000 verfügbar ist
- Überprüfen Sie, dass Node.js installiert ist
- Versuchen Sie: `npm install` im Server-Verzeichnis

### Zusammenarbeit funktioniert nicht?
- Stellen Sie sicher, dass der Server läuft
- Überprüfen Sie, dass alle Benutzer am gleichen Projekt arbeiten
- Überprüfen Sie die Server-URL in den Erweiterungs-Einstellungen

## 🌐 WebSocket-Events

### Client → Server

```javascript
// Projekt beitreten
{
  "type": "join",
  "projectId": "123456789",
  "userName": "Ihr Name"
}

// Projekt verlassen
{
  "type": "leave",
  "projectId": "123456789"
}

// Projekt-Update senden
{
  "type": "projectUpdate",
  "projectId": "123456789",
  "updateData": { /* Projektdaten */ }
}

// Chat-Nachricht senden
{
  "type": "chatMessage",
  "projectId": "123456789",
  "message": "Hallo zusammen!"
}
```

### Server → Client

```javascript
// Willkommensnachricht
{
  "type": "welcome",
  "clientId": "eindeutige-client-id"
}

// Erfolgreich beigetreten
{
  "type": "joined",
  "projectId": "123456789",
  "participantCount": 3
}

// Neuer Benutzer beigetreten
{
  "type": "userJoined",
  "userName": "Neuer Benutzer",
  "participantCount": 3
}

// Chat-Nachricht empfangen
{
  "type": "chatMessage",
  "userName": "Benutzer Name",
  "message": "Hallo zusammen!",
  "timestamp": 1234567890
}
```

## 🤝 Mitwirken

Beiträge sind willkommen! Bitte öffnen Sie ein Issue oder einen Pull Request.

## 📄 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 🙏 Danksagungen

- Scratch-Team für die großartige Plattform
- WebSocket-Community für die Echtzeit-Kommunikation
- Open-Source-Community für Inspiration und Tools

---

**Viel Spaß beim gemeinsamen Programmieren!** 🎉
# Server Extension Builder

Dieses Dokument beschreibt die Verwendung des automatischen Server-Erweiterungs- und Bau-Skripts.

## Übersicht

Das `server-extension-builder.js` Skript erweitert den Scratch Collaboration Server automatisch um neue Features und konfiguriert ihn für verschiedene Bereitstellungsumgebungen.

## Verwendung

### Grundlegende Verwendung

```bash
# Erweitert Server mit Standard-Features (monitoring, api, logging)
node server-extension-builder.js

# Mit spezifischen Erweiterungen
node server-extension-builder.js --extensions monitoring,api,logging

# Für mehrere Umgebungen mit Docker-Unterstützung
node server-extension-builder.js --environments development,production --docker

# Mit Tests und Docker
node server-extension-builder.js --extensions monitoring,api,logging --docker --testing
```

### Kommandozeilen-Optionen

- `--extensions <list>`: Durch Komma getrennte Liste von Erweiterungen
  - `monitoring`: Server-Metriken und Gesundheitsprüfungen
  - `api`: Zusätzliche REST-API Endpunkte
  - `logging`: Erweiterte Protokollierung
  - `auth`: Authentifizierung und Autorisierung
  - `deployment`: Deployment-Tools

- `--environments <list>`: Durch Komma getrennte Liste von Umgebungen
  - `development`: Entwicklungs-Umgebung
  - `production`: Produktions-Umgebung
  - `test`: Test-Umgebung

- `--docker`: Erstellt Docker-Images und Container-Konfiguration
- `--testing`: Fügt Test-Framework und Tests hinzu
- `--help`: Zeigt Hilfe an

## Erweiterungen

### Monitoring Extension
- Echtzeit-Server-Metriken (CPU, Memory, Connections)
- Automatische Gesundheitsprüfungen
- Performance-Überwachung

### API Extensions
- `/api/projects/{id}/stats` - Projekt-Statistiken
- `/api/users/activity` - Benutzer-Aktivitätsberichte
- `/api/metrics` - Server-Metriken
- `/api/sessions/{id}/export` - Session-Daten Export

### Logging Extension
- Strukturierte JSON-Logs
- Log-Rotation
- Verschiedene Log-Levels
- Request-Logging Middleware

### Authentication Extension
- JWT-basierte Authentifizierung
- Benutzerverwaltung
- Zugriffskontrolle

### Deployment Tools
- Automatische Builds für verschiedene Umgebungen
- Docker-Image-Erstellung
- Start-Skripte für verschiedene Plattformen

## Umgebungen

### Development
- Debug-Logging aktiviert
- CORS für localhost konfiguriert
- Kein Rate Limiting
- Monitoring aktiviert

### Production
- Warn-Level Logging
- Eingeschränkte CORS
- Rate Limiting aktiviert
- Erweiterte Sicherheit

### Test
- Error-Level Logging
- Minimale Konfiguration
- Schnelle Starts

## Docker-Bereitstellung

### Automatisches Setup
```bash
# Erstellt Docker-Images für alle Umgebungen
node server-extension-builder.js --environments production --docker

# Startet Container
cd server/dist/production
docker-compose up -d
```

### Manueller Betrieb
```bash
# Baue Image
docker build -t scratch-collab-server ./server/dist/production

# Starte Container
docker run -d --name scratch-collab -p 3000:3000 scratch-collab-server
```

## Tests

### Automatisches Setup
```bash
node server-extension-builder.js --testing
```

### Test-Ausführung
```bash
cd server
npm test                    # Alle Tests
npm run test:watch         # Watch-Modus
npm run test:coverage      # Coverage-Bericht
```

## Konfiguration

### config/development.json
```json
{
  "name": "development",
  "port": 3000,
  "environment": "dev",
  "logging": {
    "level": "debug",
    "file": "./logs/dev.log"
  },
  "cors": {
    "origin": ["http://localhost:3000"],
    "credentials": true
  }
}
```

### config/production.json
```json
{
  "name": "production",
  "port": 3000,
  "environment": "prod",
  "logging": {
    "level": "warn",
    "file": "./logs/prod.log"
  },
  "cors": {
    "origin": ["https://yourdomain.com"],
    "credentials": true
  },
  "rateLimiting": {
    "enabled": true,
    "windowMs": 900000,
    "max": 100
  }
}
```

## Troubleshooting

### Häufige Probleme

1. **Extension lädt nicht**
   - Prüfe die Konsole auf Fehler
   - Stelle sicher, dass alle Dependencies installiert sind
   - Prüfe die config.json-Datei

2. **Docker build schlägt fehl**
   - Stelle sicher, dass Docker installiert ist
   - Prüfe, dass alle Dateien kopiert wurden
   - Kontrolliere die Dockerfile-Syntax

3. **Tests schlagen fehl**
   - Stelle sicher, dass alle Test-Dependencies installiert sind
   - Prüfe die Test-Konfiguration
   - Kontrolliere die Server-URL in Tests

### Logs

Logs finden sich in:
- `server/dist/{environment}/logs/`
- Docker-Container: `docker logs scratch-collab-{environment}`

## Sicherheit

- Rate Limiting für API-Endpunkte
- CORS-Konfiguration für verschiedene Umgebungen
- Audit-Logging für Sicherheits-Events
- JWT-basierte Authentifizierung (optional)

## Performance

- Log-Rotation verhindert Speicherprobleme
- WebSocket-Verbindungen werden überwacht
- Memory-Usage wird getrackt
- Automatische Ressourcen-Bereinigung

## Support

Bei Problemen:
1. Prüfe die Logs auf Fehlermeldungen
2. Stelle sicher, dass alle Dependencies aktuell sind
3. Teste mit einer minimalen Konfiguration
4. Erstelle ein Issue im GitHub-Repository
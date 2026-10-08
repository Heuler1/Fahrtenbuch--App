# Android / iOS: technische Vorbereitung

Stand: 08.10.2026. Dieses Paket ist eine erste Korrekturrunde, keine Store-Freigabe.

## In diesem Paket

- Anmeldung über AsyncStorage auf Android/iOS/Web; native Token-Aktualisierung abhängig vom App-Zustand.
- Keine Session- oder Benutzerobjekte mehr im Registrierungs-Debuglog.
- Native PDFs mit expo-print und expo-sharing, A4; Browser-Druck bleibt verfügbar.
- Fahrtenexport verwendet die tatsächlichen Felder, DD.MM.YYYY-Datum, Geschäftsfilter und HTML-Escaping.
- Unbelegte Aussage über gesetzliche Konformität aus dem Export entfernt.
- Wartungsformular ruft nun die Speicherfunktion statt nur den React-State-Setter auf.
- Cloudfehler werden weitergegeben; UI-Listen ändern sich erst nach erfolgreicher Speicherung.
- Automatische Demodaten und stiller lokaler Fallback entfernt. Die aktuelle App benötigt ein Konto und Internet. Bestehende lokale Daten werden nicht gelöscht; eine Migration dieser Altbestände ist noch offen.
- Android-Paketkennung, iOS-Bundlekennung und EAS-Profile vorbereitet. Kennungen vor erstem Store-Upload prüfen.

## Prüfung

- `npm test`: 36 Tests für PDF-Daten, HTML-Escaping, native PDF-Aufrufe, Fehlerbehandlung und Auth-Speicher.
- `npx expo export --platform all`: erfolgreich für Android, iOS und Web mit Test-Konfigurationswerten. Dies prüft Bundling, nicht native Installation oder die produktive Datenbank.
- `npm run typecheck`: noch nicht erfolgreich. Bereits der unveränderte Ausgangsstand hat 353 TypeScript-Diagnosen, vor allem untypisierte React-Zustände. Die Rückgabetyp-Inferenz der Speicherfassade legt zusätzliche untypisierte Zustände offen; die Zahl nach weiteren Änderungen wurde nicht als Release-Gate verwendet. Die Typisierung muss vor Release aufgeräumt werden.
- Kein Android-/iOS-Gerätetest, kein signiertes AAB/IPA, kein Live-Datenbanktest.

## Vor einem Testrelease weiterhin erforderlich

1. Umgesetzt: Einzeloperationen statt Listenersetzung; UUIDs und updated_at aus der Datenbank bleiben erhalten. Updates und Löschungen filtern atomar nach ID, Benutzer und geladener Version. Fehlgeschlagene Schreibvorgänge löschen keine Listen. Reale Tests mit zwei Geräten stehen noch aus.
2. Umgesetzt in der App: explizite Fahrzeugauswahl, Prüfung des Fahrzeugbesitzers vor dem Schreiben, Fahrzeugfilter und Zuordnung alter Einträge beim Bearbeiten. Serverseitige Absicherung gegen manipulierte API-Aufrufe bleibt vor Store-Release zu ergänzen (die bestehenden RLS-Regeln schützen Datensatzbesitzer, prüfen aber nicht den Fahrzeugbesitzer).
3. Kilometerplausibilität und serverseitige Änderungshistorie einbauen; Audit-Log allein ist keine zugesicherte behördliche Anerkennung.
4. Expo SDK 52 auf eine aktuell unterstützte stabile Version mit kompatiblen Abhängigkeiten migrieren und echte native Builds testen. Die neu hinzugefügten PDF-Module sind passend zum bestehenden SDK 52 installiert, nicht als SDK-Upgrade.
5. Konto- und Datenlöschung, Datenschutzinformationen, externe Löschmöglichkeit, Passwortwiederherstellung und Bestätigungslinks fertigstellen.
6. Backup/Restore und gegebenenfalls ein ausdrücklich entworfenes Offline-Sync-System implementieren.
7. Store-Branding, Metadaten, Berechtigungen und Bezahlmodell für beide Stores abschließen.

## Manuell auf Android und iPhone prüfen

- Registrieren, E-Mail bestätigen, anmelden, App beenden und erneut öffnen.
- Zwischen Vorder- und Hintergrund wechseln, später erneut einen Datensatz laden.
- Netzwerk unterbrechen: keine Erfolgsmeldung und kein lokaler Ersatzdatensatz bei Schreibfehlern.
- Wartung erstellen, App neu starten, Wartung erneut laden (nur Testkonto).
- Fahrten mit Umlauten, Ampersand, Kilometerstand 0 und Geschäfts-/Privatkategorien exportieren.
- Mehrseitige PDF in einer Ziel-App öffnen und speichern; Teilen auch abbrechen.
- Im Browser Pop-up blockieren: Fehlermeldung statt angeblichem Exporterfolg.

## Speichersicherheit (07.10.2026, zweites Paket)

- Die neuen Regressionstests modellieren die PostgREST-Prädikate und den vorhandenen updated_at-Trigger. Es wurde kein produktiver Benutzerdatensatz für Tests angelegt oder verändert.
- Das vorhandene Datenbankschema muss seinen updated_at-Trigger für vehicles, trips, fuel_entries, maintenance_entries und reminders enthalten. Fehlende Versionswerte werden beim Schreiben abgelehnt.
- Alte Browser-Tabs bitte neu laden: bereits geladener Altcode enthält weiterhin die alten Speicherfunktionen.
- Konflikte verändern die Formulareingaben nicht. Zum Laden der aktuellen Daten die Ansicht wechseln und zurückkehren; nicht blind denselben alten Stand erneut speichern.
- Ohne Fahrzeugzuordnung bleibt sichtbar. Es gibt keine automatische Zuordnung anhand des ersten Fahrzeugs.
- Netzwerkfehler direkt nach serverseitig erfolgreichem Anlegen können einen unklaren Bestätigungszustand erzeugen: vor erneutem Anlegen neu laden. Eine serverseitige Idempotenz für wiederholte Anlageversuche ist noch offen.

## Paket vom 08.10.2026

- Statistik enthält ausschließlich erfasste Kraftstoff- und Wartungskosten. Keine Mindestkosten pro km, erfundenen Fixkosten, Demo-Kategorien oder Demo-Diagramme.
- Ein gemeinsamer Rechenkern filtert nach Fahrzeug und Zeitraum; zukünftige/ungültige Datumswerte fließen nicht ein. Zeitraum bedeutet rollierender Monat / drei Monate / zwölf Monate bis heute.
- Fahrtstrecke wird aus Kilometerständen berechnet. Überschneidungen und zeitlich rückläufige Fahrten desselben Fahrzeugs werden beim Eingeben abgewiesen. Das ersetzt keine serverseitige Audit-Historie.
- Verbrauch wird nach Änderungen und Löschungen aus benachbarten Tankstopps pro Fahrzeug neu abgeleitet, nach Distanz gewichtet und ausdrücklich als Schätzung ausgewiesen. Voll-/Teilbetankungen sind noch nicht als eigenes Feld erfasst.
- Kilometerverläufe werden nur für ein einzelnes Fahrzeug gezeigt. Kosten pro km beziehen sich auf erfasste Fahrten, nicht auf den absoluten Tachostand.
- Datenbankmigration für Fahrzeugbesitzerprüfung mit PGlite getestet. In Supabase noch NICHT aktiviert; Anleitung in STORE-PREPARATION.md.
- Expo-52-Paketversionen angeglichen; Android-Test-APK-Workflow mit eigener Test-Paketkennung hinzugefügt. Kein Upgrade auf die für den Store notwendige aktuelle SDK-Basis.
- Store-Texte, Testfälle, technisches Dateninventar und Verkaufsmodellvergleich vorbereitet. Betreiberangaben, Produktionssignatur, Löschfunktion, natives Gerätetesting und finales Bezahlmodell bleiben offen.

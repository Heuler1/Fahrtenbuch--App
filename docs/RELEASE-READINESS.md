# Android / iOS: technische Vorbereitung

Stand: 07.10.2026. Dieses Paket ist eine erste Korrekturrunde, keine Store-Freigabe.

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

- `npm test`: neun Tests für PDF-Daten, HTML-Escaping, native PDF-Aufrufe, Fehlerbehandlung und Auth-Speicher.
- `npx expo export --platform all`: erfolgreich für Android, iOS und Web mit Test-Konfigurationswerten. Dies prüft Bundling, nicht native Installation oder die produktive Datenbank.
- `npm run typecheck`: noch nicht erfolgreich. Bereits der unveränderte Ausgangsstand hat 353 TypeScript-Diagnosen, vor allem untypisierte React-Zustände. Der geänderte Stand hat 358 Diagnosen; die strengere Rückgabetyp-Inferenz der Speicherfassade legt zusätzliche untypisierte Zustände offen. Die Typisierung muss vor Release aufgeräumt werden.
- Kein Android-/iOS-Gerätetest, kein signiertes AAB/IPA, kein Live-Datenbanktest.

## Vor einem Testrelease weiterhin erforderlich

1. Gesamte Listen nicht mehr per DELETE + INSERT ersetzen. Einzeloperationen mit stabilen IDs, Datenbanktransaktionen und Konflikterkennung implementieren. Aktuell kann ein fehlgeschlagener INSERT nach erfolgreichem DELETE Daten verlieren; parallele Geräte können Daten überschreiben. Diese Branch-Version deshalb nur mit Testdaten verwenden.
2. Fahrzeugzuordnung für Fahrten, Tankungen, Wartungen und Erinnerungen durchgehend sicherstellen; passende Integritätsregeln und Tests ergänzen.
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

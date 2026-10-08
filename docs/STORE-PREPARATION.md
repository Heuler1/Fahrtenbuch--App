# Vorbereitung: Android-Test und späterer Verkauf

Stand: 08.10.2026. Interne Testversion, keine Store-Freigabe.

## Installierbare Android-Testversion

Der Workflow `Android test APK` baut eine eigenständig startbare Release-APK mit Testsignatur, ohne Metro-Server und ohne Expo-Konto. Die App heißt **Fahrtenbuch Test** und verwendet die separate Paketkennung `at.grobner.oldtimerfahrtenbuch.preview`. Sie verbindet sich mit derselben Supabase-Datenbank wie die Web-Testversion. Änderungen wirken deshalb auf dieselben Kontodaten. Nur ein separates Testkonto verwenden.

Nach erfolgreichem Lauf: GitHub → Actions → Android test APK → letzter erfolgreicher Lauf → Artifact `fahrtenbuch-android-test`. ZIP herunterladen, entpacken und die APK auf Android installieren. Der Download erfordert eine GitHub-Anmeldung. Die APK ist für ARM64-Handys, nicht für einen x86-Emulator. Das Artefakt bleibt 30 Tage verfügbar. Die Testsignatur darf nicht für den Store verwendet werden.

Ein erfolgreicher Build bestätigt noch keine Geräteeignung. Auf dem Handy prüfen:

| Fall | Erwartung |
| --- | --- |
| Anmeldung, App schließen und öffnen | Sitzung bleibt erhalten |
| Zwei Fahrzeuge | Dashboard-Auswahl bleibt erhalten; Datensatzfilter trennen Fahrzeuge |
| Fahrt 0 → 100 km | Strecke 100 km; keine zusätzliche freie Strecke |
| Zweite Fahrt 90 → 150 km am selben Fahrzeug | Überschneidung wird abgewiesen |
| 20 Liter × 1,65 € | 33,00 € Kosten |
| Erster Tankstopp | Verbrauch nicht verfügbar statt 0 L/100 km |
| Zwei gleichzeitige Änderungen | Veraltete Version wird nicht überschrieben |
| Foto auswählen / Kamera | Berechtigung bei Bedarf, Bild bleibt nach Neustart vorhanden |
| PDF öffnen / Teilen abbrechen | Kein Absturz; Umlaute und Beträge stimmen |
| Flugmodus beim Speichern | Fehler sichtbar, keine Erfolgsmeldung, Eingaben bleiben |
| Leere Statistik | Keine erfundenen Werte oder Beispielkosten |

## Datenbankregeln aktivieren

Die Migration `supabase/migrations/20261008050000_vehicle_owner_checks.sql` wurde in einer isolierten PostgreSQL-Engine (PGlite) geprüft, aber **noch nicht auf dem produktiven Supabase-Projekt ausgeführt**. Sie ergänzt vorhandene Eigentümerregeln um eine restriktive Prüfung des referenzierten Fahrzeugs. Bereits vorhandene Zeilen werden nicht verändert. Alte Einträge ohne Zuordnung bleiben lesbar und löschbar; eine Bearbeitung muss sie einem eigenen Fahrzeug zuordnen.

Anwendung mit Projektadministrator-Zugang: Supabase-Projekt `taembulnsbdbwtdzktgm` öffnen → SQL Editor → Inhalt dieser Migration ausführen. Alternativ über die Supabase CLI nach Prüfung der Migrationshistorie. Den öffentlichen App-Schlüssel nicht durch einen Administrator-Schlüssel ersetzen und keinen Administrator-Schlüssel in das öffentliche Repository eintragen.

Danach mit zwei Testkonten INSERT/UPDATE gegen ein fremdes Fahrzeug sowie normale Speicherung testen. `npm run test:db` prüft die Regeln reproduzierbar lokal, ersetzt jedoch keinen Live-Projekttest.

## Store-Texte – Entwurf

**Name:** Oldtimer Fahrtenbuch

**Kurzbeschreibung:** Fahrten, Tankstopps und Wartungen deiner Oldtimer an einem Ort.

**Beschreibung:**

Behalte deine Fahrzeuge und ihre laufenden Aufzeichnungen im Blick. Oldtimer Fahrtenbuch verbindet Fahrzeugdaten, Fahrten, Tankstopps, Wartungen und Erinnerungen in einer übersichtlichen App.

- Mehrere Fahrzeuge verwalten und getrennt auswerten.
- Fahrten mit Start, Ziel, Kilometerständen und Kategorie erfassen.
- Kraftstoffmengen, Preise und Wartungskosten dokumentieren.
- Erfasste Kosten und Fahrtkilometer nach Zeitraum auswerten.
- Fahrten und Statistiken als PDF ausgeben.

Die App benötigt ein Benutzerkonto und eine Internetverbindung. Verbrauchswerte sind Schätzwerte zwischen Tankstopps; vergleichbare Tankfüllstände sind Voraussetzung für aussagekräftige Werte. Es wird keine steuerliche Anerkennung des Fahrtenbuchs zugesichert.

## Gestaltung und Screenshots

Bestehendes App-Symbol zunächst für den internen Test verwenden. Für das Verkaufslisting ein eigenes finales Symbol und eine Feature-Grafik erstellen. Screenshots erst aus dem installierten, geprüften Build mit ausschließlich fiktiven Beispieldaten aufnehmen: Dashboard mit Fahrzeugwahl, Fahrtenformular, Tankstopps, Wartungen, echte Statistik, PDF. Keine privaten Kennzeichen, Personenfotos oder Kontaktdaten veröffentlichen.

## Datenschutz und Kontolöschung – noch offene Freigabepunkte

Benötigte Betreiberangaben: vollständiger rechtlicher Betreibername, ladungsfähige Kontaktadresse und Support-/Datenschutz-E-Mail. Diese Angaben liegen nicht bestätigt vor und werden nicht erfunden.

Technisches Dateninventar für die spätere Datenschutzerklärung und Data-Safety-Angaben:

- Supabase Auth: E-Mail, Konto-ID und Authentifizierungsdaten.
- Datenbank: Profilname/Telefon/Foto, Fahrzeugdaten einschließlich Kennzeichen und VIN, manuell eingegebene Fahrtorte, Kosten, Wartungen, Erinnerungen, Bilder und Belege.
- Auf dem Gerät: Authentifizierungssitzung und kontobezogene Dashboard-Fahrzeugauswahl in AsyncStorage.
- Netzwerk/Hosting: Supabase für die Kontodaten, GitHub Pages für die Web-Testversion. Konkrete Projektregion, Verträge, Aufbewahrungs- und Backupfristen müssen anhand des Supabase-Kontos bestätigt werden.
- Keine Zahlungsdatenverarbeitung und keine automatische GPS-Fahrterfassung implementiert. Nicht mit Werbe- oder Analysefreiheit werben, bevor sämtliche eingebundenen SDKs überprüft wurden.

Kontolöschung einschließlich zugehöriger Daten und eine erreichbare externe Löschmöglichkeit sind vor Veröffentlichung zu implementieren und mit einem Testkonto nachzuweisen. Der öffentliche Supabase-Client darf keine administrativen Löschrechte erhalten. Eine endgültige Datenschutzerklärung wird erst nach Bestätigung der Betreiberangaben und des tatsächlichen Lösch-/Speicherkonzepts veröffentlicht.

## Verkaufsmodell – Entscheidungsvorlage

| Modell | Nutzen | Noch zu bauen |
| --- | --- | --- |
| Einmalkauf | Einfach verständlicher Kauf | Storepreis festlegen; laufende Cloudkosten müssen über den Kauf gedeckt sein |
| Abo | Wiederkehrende Einnahmen für Cloudbetrieb und Pflege | Google Play Billing, serverseitige Kaufprüfung, Berechtigungen, Kündigungs-/Wiederherstellungsfälle |

Arbeitsvorschlag: interner Test zunächst ohne Bezahlung. Danach anhand realer Speicher-/Nutzungskosten entscheiden. Noch kein Preis festgelegt, keine Kauf- oder Abofunktion aktiviert. Eine Umstellung der öffentlichen Web-Testversion auf Bezahlzugang erfolgt nicht automatisch.

## Verbleibende technische Gates

- Expo SDK 52 wurde innerhalb seiner kompatiblen Paketversionen bereinigt. Dies ist **kein Upgrade auf ein aktuelles Store-SDK**.
- Neues Store-Release benötigt aktuell Android API 36. SDK-Migration, 16-KB-Seitengrößen-Kompatibilität und native Gerätetests sind vor Store-Upload erforderlich.
- Vollständige TypeScript-Prüfung hat bekannte Altfehler; vor Release beheben.
- Datenbankmigration live aktivieren; Backup/Wiederherstellung, Kontolöschung, Mail-Links und Zwei-Geräte-Test abschließen.
- Produktionssignatur, Entwicklerkonto und Storeformulare fehlen noch. Keine Veröffentlichung oder Abbuchung gestartet.

## Offizielle Quellen (geprüft 08.10.2026)

- Android-Build: https://docs.expo.dev/guides/local-app-production/
- Ziel-API: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
- Kontolöschung: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
- Datenbankregeln: https://supabase.com/docs/guides/database/postgres/row-level-security

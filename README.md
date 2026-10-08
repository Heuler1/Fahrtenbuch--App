# Oldtimer Fahrtenbuch

Expo / React Native App für Android, iOS und Web mit Supabase.

## Lokaler Start

1. `npm ci`
2. `.env.example` nach `.env` kopieren und die öffentlichen Werte des eigenen Supabase-Projekts eintragen. Niemals einen Service-Role-Schlüssel in die App eintragen.
3. `npm run dev` bzw. `npm run web`
4. `npm test` für die gezielten Regressionstests; `npm run typecheck` zeigt die noch offenen Typfehler.

Der aktuelle Entwicklungsstand ist **nicht für produktive Fahrtenbuchdaten oder Store-Veröffentlichung freigegeben**. Bekannte Risiken und nächste Schritte stehen in [docs/RELEASE-READINESS.md](docs/RELEASE-READINESS.md).

## Native Builds vorbereiten

`eas.json` enthält ein internes Android-APK-Profil (`preview`) und ein Store-Profil (`production`, Android App Bundle). Für iOS sind ein passendes Apple-Entwicklerkonto und Signing erforderlich; interne Geräte müssen entsprechend registriert werden. Expo-Projekt und Signing müssen noch eingerichtet werden. Die Kennung `at.grobner.oldtimerfahrtenbuch` ist für beide Plattformen vorbereitet.

Vor dem ersten Store-Build sind SDK-Upgrade, native Gerätetests und die offenen Release-Blocker abzuarbeiten.

# Web-Testversion auf GitHub Pages

Der Workflow `Web preview` baut `playstore-release` mit den öffentlichen Supabase-Verbindungswerten. Keine Administrator-Schlüssel in diesen Workflow eintragen.

## Einmalig im GitHub-Konto

1. Repository → Settings → Pages → Build and deployment → Source: GitHub Actions.
2. Bei privatem Repository erfordert Pages einen passenden GitHub-Tarif. Das Repository muss deshalb nicht öffentlich gemacht werden; alternativ kann ein anderer Host verwendet werden.
3. Falls die Umgebung `github-pages` nur `main` zulässt: Settings → Environments → github-pages → Deployment branches and tags → `playstore-release` zulassen.
4. Actions → Web preview → fehlgeschlagenen Lauf erneut ausführen, sobald Pages aktiviert wurde.

Erwartete Adresse nach erfolgreichem Deployment: https://heuler1.github.io/Fahrtenbuch--App/

Supabase muss aktiv und erreichbar sein. In Supabase Authentication → URL Configuration die Testadresse als Site URL bzw. erlaubte Redirect URL für diese Testumgebung hinterlegen, damit E-Mail-Bestätigungen nicht auf eine alte Adresse führen. Bestehende produktive Redirects beibehalten.

Die Oberfläche ist eine öffentliche Web-Testversion mit Anmeldung. Nur Testdaten verwenden: die Einzelspeicherung und Versionsprüfung sind implementiert, der angemeldete Mehrgeräte-Test und die serverseitige Absicherung der Fahrzeugzuordnung aus RELEASE-READINESS.md stehen noch aus. Der Web-Build allein bestätigt keine funktionierende Anmeldung oder Datenbankverbindung.

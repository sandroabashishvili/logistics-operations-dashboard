# Northline Logistics Operations Dashboard

![Northline Logistics Operations Dashboard](assets/images/dashboard-preview.jpg)

Ein interaktives Operations-Dashboard für ein kleines Transportunternehmen. Es
verwandelt Lade-, Touren-, Kraftstoff-, Fahrer- und Kostendaten in eine
übersichtliche Grundlage für operative Entscheidungen.

**Live-Demo:** [Dashboard öffnen](https://sandro-abashishvili.sandroabashishvili.chatgpt.site/demos/logistics/)

## Was das Projekt demonstriert

- KPI-Berechnung aus realistisch strukturierten Betriebsdaten
- Flottenauslastung und Profitabilität einzelner Routen
- Kraftstoffkosten und Fahrereffizienz in Litern pro 100 Kilometer
- Erkennung verspäteter und gefährdeter Transporte
- kombinierbare Filter nach Status, Route, Fahrer, Kunde, Datum und Region
- zugängliche Ladungsauswahl mit Touren-, Margen- und Kostenanalyse
- CSV-Import als realistischer Übergabeprozess
- Export der gefilterten Ansicht als JSON-Snapshot
- druckoptimierter Bericht für PDF oder Papier
- responsive Desktop- und Mobile-Ansicht
- verständliche Leer-, Filter- und Bestätigungszustände

## Lokal ansehen

Das Projekt hat weder Build-Schritt noch Paketabhängigkeiten:

```bash
git clone https://github.com/sandroabashishvili/logistics-operations-dashboard.git
cd logistics-operations-dashboard
python3 -m http.server 8000
```

Danach `http://127.0.0.1:8000/` öffnen.

## CSV-Import testen

Die Datei [data/sample_import.csv](data/sample_import.csv) enthält einen
passenden Beispieldatensatz. Benötigte Spalten:

```text
load_id, client_name, pickup_city, delivery_city, driver_name,
vehicle_id, contract_price, status, fuel_cost, driver_cost,
distance_km, pickup_date, delivery_date
```

Importierte Einträge ersetzen die entsprechenden Demo-Datengruppen im
Arbeitsspeicher. Der mitgelieferte Ausgangsdatensatz kann ohne Neuladen der
Seite wiederhergestellt werden.

## Berichte und Export

- **Export Snapshot JSON** speichert sichtbaren Datenumfang, aktive Filter,
  Kennzahlen und gefilterte Transporte.
- **Print / Save PDF** aktiviert ein A4-Querformat und öffnet den Druckdialog
  des Browsers.

## Projektstruktur

```text
.
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
├── data/
│   ├── mock_operations.json
│   └── sample_import.csv
├── docs/
└── index.html
```

## Status und Grenzen

Der aktuelle Stand ist ein abgeschlossener Portfolio-MVP mit realistischen
Mock-Daten und clientseitigen Berechnungen. Das Projekt behauptet keine
Live-Anbindung an ein TMS- oder ERP-System.

Eine nächste Produktstufe würde ein kleines Backend, authentifizierte
Arbeitsbereiche, persistierte Importe, geplante Berichte und Adapter für echte
TMS-/ERP-Daten benötigen.

## Dokumentation

- [Aktueller Stand](docs/current_status.md)
- [Datenübersicht](docs/data_map.md)
- [MVP-Schema](docs/mvp_schema.md)
- [Dashboard-Logik](docs/dashboard_logic.md)

## Autor

Aleksandre (Sandro) Abashishvili

[Portfolio](https://sandro-abashishvili.sandroabashishvili.chatgpt.site/) ·
[GitHub](https://github.com/sandroabashishvili) ·
[LinkedIn](https://www.linkedin.com/in/aleksandre-abashishvili-03417617a/)

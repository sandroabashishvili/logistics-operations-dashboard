# Dashboard Logic

სტატუსი: `აქტიური სამუშაო დოკი`
განახლდა: `2026-04-03`

ეს დოკი აჯამებს როგორ უნდა გადაიქცეს raw logistics data dashboard blocks-ად.

## მთავარი KPI Cards

### Monthly Revenue

წყარო:
- `loads.contract_price`

ლოგიკა:
- მიმდინარე თვეში დასრულებული loads-ის ჯამი

### Fleet Utilization

წყარო:
- `vehicles.status`

ლოგიკა:
- `active vehicles / total vehicles * 100`

### Fuel Cost Per Load

წყარო:
- `fuel_events.total_cost`
- `loads`

ლოგიკა:
- პერიოდის fuel total / delivered loads count

### Delayed Loads

წყარო:
- `loads.status`
- `trips.delay_minutes`

ლოგიკა:
- ის loads, სადაც delay აღემატება შეთანხმებულ ზღვარს

## Route Profitability

წყარო:
- `loads.contract_price`
- `cost_summary.*`
- `trips.route_name`

ლოგიკა:
- route margin = `(revenue - total_cost) / revenue`
- route-ების დაჯგუფება lane-ის მიხედვით

## Fleet Utilization Block

წყარო:
- `vehicles.status`

სეგმენტები:
- active
- idle
- maintenance
- delayed / unavailable

## Fuel Trend

წყარო:
- `fuel_events.total_cost`

ლოგიკა:
- ბოლო 7 დღის fuel total by day

## Driver Performance

წყარო:
- `drivers`
- `trips`
- `loads`
- `fuel_events`

ლოგიკა:
- completed loads per driver
- on-time ratio
- average fuel consumption proxy
- incidents
- health/status label

## Risk Loads

წყარო:
- `loads`
- `trips`
- `vehicles`
- `fuel_events`
- `cost_summary`

ლოგიკა:
- delay risk
- fuel anomaly
- maintenance pressure
- low margin lane

## დიზაინის წესი

dashboard უნდა პასუხობდეს კითხვას:
- სად ვართ ახლა
- სად იკარგება ფული
- სად გვექმნება operational risk
- ვინ ან რომელი მანქანა მუშაობს სუსტად

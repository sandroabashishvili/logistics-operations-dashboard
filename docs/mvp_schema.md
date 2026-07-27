# MVP Schema

სტატუსი: `აქტიური სამუშაო დოკი`
განახლდა: `2026-04-03`

პირველ ვერსიაში არ გვჭირდება ყველა family. MVP უნდა დაეყრდნოს იმ მინიმალურ ცხრილებს, რომლებიც უკვე საკმარისია კარგ dashboard-ს ასაწყობად.

## MVP Families

### 1. vehicles

აუცილებელი ველები:
- vehicle_id
- plate_number
- type
- status
- capacity_tons
- assigned_driver_id

### 2. drivers

აუცილებელი ველები:
- driver_id
- full_name
- assigned_vehicle_id
- active_status
- incident_count

### 3. loads

აუცილებელი ველები:
- load_id
- client_name
- pickup_city
- delivery_city
- contract_price
- status
- scheduled_delivery_at
- actual_delivery_at

### 4. trips

აუცილებელი ველები:
- trip_id
- load_id
- driver_id
- vehicle_id
- route_name
- distance_km
- departure_at
- arrival_at
- delay_minutes

### 5. fuel_events

აუცილებელი ველები:
- fuel_event_id
- trip_id
- vehicle_id
- date
- liters
- total_cost

### 6. cost_summary

აუცილებელი ველები:
- trip_id
- fuel_cost
- toll_cost
- driver_cost
- maintenance_cost
- penalty_cost

## MVP Derived Outputs

ამ data-დან უნდა ავაწყოთ:
- active vs idle fleet
- loads in progress
- delayed loads
- route profitability
- fuel cost trend
- driver performance table
- risk cards

## ჯერ არ გვჭირდება

- full billing layer
- contract management
- permissions/auth
- invoice workflow
- warehouse module

# Data Map

სტატუსი: `აქტიური სამუშაო დოკი`
განახლდა: `2026-04-03`

ეს დოკი აჯამებს რა ტიპის operational data ინახება ჩვეულებრივ მცირე ან საშუალო ლოგისტიკურ კომპანიებში.

## 1. Fleet / Vehicles

- vehicle_id
- trailer_id
- plate_number
- vehicle_type
- capacity
- current_status
- assigned_driver_id
- service_due_date
- lease_or_owned

## 2. Drivers

- driver_id
- full_name
- phone
- license_status
- assigned_vehicle_id
- active_status
- total_completed_trips
- incident_count

## 3. Loads / Orders

- load_id
- client_id
- pickup_location
- delivery_location
- cargo_type
- weight
- scheduled_pickup_at
- scheduled_delivery_at
- contract_price
- load_status

## 4. Trips / Dispatch

- trip_id
- load_id
- vehicle_id
- driver_id
- route_name
- departure_at
- eta_at
- actual_arrival_at
- distance_km
- trip_status
- delay_minutes

## 5. Fuel Events

- fuel_event_id
- trip_id
- vehicle_id
- driver_id
- date
- liters
- total_cost
- price_per_liter
- station_name

## 6. Maintenance

- maintenance_id
- vehicle_id
- issue_type
- service_date
- downtime_hours
- repair_cost
- next_service_due

## 7. Billing / Revenue

- invoice_id
- client_id
- trip_id
- billed_amount
- paid_amount
- payment_status
- payment_date

## 8. Operational Costs

- fuel_cost
- toll_cost
- driver_cost
- maintenance_cost
- insurance_cost
- leasing_cost
- fine_cost
- delay_penalty_cost

## 9. Customers / Contracts

- client_id
- company_name
- lane_rate
- payment_terms
- active_contract
- contact_name

## 10. Alerts / Exceptions

- delayed_load
- vehicle_maintenance_overdue
- fuel_anomaly
- driver_document_issue
- low_utilization
- low_margin_route

## დასკვნა

dashboard-ის ამოცანაა არა ამ raw data-ს პირდაპირ ჩვენება, არამედ:
- KPI summary
- profitability view
- utilization view
- risk visibility
- operator decision support

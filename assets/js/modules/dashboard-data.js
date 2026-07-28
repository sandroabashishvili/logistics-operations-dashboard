import { UTILIZATION_COLORS } from "./constants.js";
import { euro, percent, dayLabel, titleCase } from "./formatters.js";
import { filterRawData } from "./filters.js";

export function buildDashboardData(rawData) {
  const filteredRawData = filterRawData(rawData);
  const vehicles = filteredRawData.vehicles || [];
  const drivers = filteredRawData.drivers || [];
  const loads = filteredRawData.loads || [];
  const trips = filteredRawData.trips || [];
  const fuelEvents = filteredRawData.fuel_events || [];
  const costSummary = filteredRawData.cost_summary || [];

  const loadById = Object.fromEntries(loads.map((load) => [load.load_id, load]));
  const driverById = Object.fromEntries(drivers.map((driver) => [driver.driver_id, driver]));
  const vehicleById = Object.fromEntries(vehicles.map((vehicle) => [vehicle.vehicle_id, vehicle]));
  const costByTripId = Object.fromEntries(costSummary.map((item) => [item.trip_id, item]));
  const fuelByTripId = fuelEvents.reduce((acc, item) => {
    acc[item.trip_id] = (acc[item.trip_id] || 0) + Number(item.total_cost || 0);
    return acc;
  }, {});
  const litersByTripId = fuelEvents.reduce((acc, item) => {
    acc[item.trip_id] = (acc[item.trip_id] || 0) + Number(item.liters || 0);
    return acc;
  }, {});

  const deliveredLoads = loads.filter((load) => load.status === "DELIVERED");
  const delayedLoads = loads.filter((load) => load.status === "DELAYED");
  const monthlyRevenue = deliveredLoads.reduce(
    (sum, load) => sum + Number(load.contract_price || 0),
    0,
  );
  const fuelTotal = fuelEvents.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);
  const utilizationPct = vehicles.length
    ? (vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length / vehicles.length) * 100
    : 0;

  const routeMap = new Map();
  trips.forEach((trip) => {
    const load = loadById[trip.load_id];
    const costs = costByTripId[trip.trip_id] || {};
    if (!load) return;
    const key = trip.route_name;
    const revenue = Number(load.contract_price || 0);
    const totalCost =
      Number(costs.fuel_cost || 0) +
      Number(costs.toll_cost || 0) +
      Number(costs.driver_cost || 0) +
      Number(costs.maintenance_cost || 0) +
      Number(costs.penalty_cost || 0);
    const current = routeMap.get(key) || { lane: key, revenue: 0, cost: 0 };
    current.revenue += revenue;
    current.cost += totalCost;
    routeMap.set(key, current);
  });

  const routes = Array.from(routeMap.values())
    .map((route) => ({
      lane: route.lane,
      margin: route.revenue > 0 ? ((route.revenue - route.cost) / route.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 6);

  const utilizationCounts = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
    return acc;
  }, {});
  const utilization = Object.entries(utilizationCounts).map(([label, count]) => ({
    label: titleCase(label),
    count,
    color: UTILIZATION_COLORS[label] || "#8ea5b6",
  }));

  const fuelTrendMap = fuelEvents.reduce((acc, item) => {
    acc[item.date] = (acc[item.date] || 0) + Number(item.total_cost || 0);
    return acc;
  }, {});
  const fuelTrend = Object.entries(fuelTrendMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ day: dayLabel(date), value }));
  const avgFuel = fuelTrend.length
    ? fuelTrend.reduce((sum, item) => sum + item.value, 0) / fuelTrend.length
    : 0;
  const bestFuelDay = fuelTrend.reduce(
    (best, item) => (item.value < best.value ? item : best),
    fuelTrend[0] || { day: "—", value: 0 },
  );
  const worstFuelDay = fuelTrend.reduce(
    (worst, item) => (item.value > worst.value ? item : worst),
    fuelTrend[0] || { day: "—", value: 0 },
  );

  const driverRows = drivers
    .map((driver) => {
      const driverTrips = trips.filter((trip) => trip.driver_id === driver.driver_id);
      const loadsCompleted = driverTrips.length;
      const onTimeTrips = driverTrips.filter(
        (trip) => Number(trip.delay_minutes || 0) <= 15,
      ).length;
      const onTimeRatio = loadsCompleted ? (onTimeTrips / loadsCompleted) * 100 : 0;
      const totalDistance = driverTrips.reduce(
        (sum, trip) => sum + Number(trip.distance_km || 0),
        0,
      );
      const totalFuelLiters = driverTrips.reduce(
        (sum, trip) => sum + Number(litersByTripId[trip.trip_id] || 0),
        0,
      );
      const fuelPer100Km = totalDistance ? (totalFuelLiters / totalDistance) * 100 : 0;
      let status = "Strong";
      if (driver.incident_count >= 2 || onTimeRatio < 90) {
        status = "Risk";
      } else if (driver.incident_count === 1 || onTimeRatio < 95) {
        status = "Watch";
      }
      return {
        name: driver.full_name,
        truck: vehicleById[driver.assigned_vehicle_id]?.plate_number || "—",
        loads: loadsCompleted,
        onTime: percent(onTimeRatio),
        fuel: fuelPer100Km,
        incidents: driver.incident_count,
        status,
      };
    })
    .sort((a, b) => b.loads - a.loads);

  const risks = [];
  delayedLoads.forEach((load) => {
    const trip = trips.find((item) => item.load_id === load.load_id);
    if (!trip) return;
    const driver = driverById[trip.driver_id];
    risks.push({
      title: `Load #${load.load_id}`,
      text: `ETA slipped by ${Math.round(
        Number(trip.delay_minutes || 0) / 60,
      )} hours on ${trip.route_name}. Delivery margin is exposed if penalty pressure continues.`,
      tags: [trip.route_name, "ETA Risk", `Driver: ${driver?.full_name || "Unknown"}`],
    });
  });

  const highFuelTrip = trips
    .map((trip) => ({ trip, fuelCost: Number(fuelByTripId[trip.trip_id] || 0) }))
    .sort((a, b) => b.fuelCost - a.fuelCost)[0];
  if (highFuelTrip) {
    const vehicle = vehicleById[highFuelTrip.trip.vehicle_id];
    risks.push({
      title: `Trailer ${vehicle?.plate_number || highFuelTrip.trip.vehicle_id}`,
      text: `Highest fuel spend is currently on ${highFuelTrip.trip.route_name}. Review route conditions and maintenance before the next dispatch.`,
      tags: ["Fuel Drift", "Maintenance", highFuelTrip.trip.route_name],
    });
  }

  const weakRoute = routes[routes.length - 1];
  if (weakRoute) {
    risks.push({
      title: `${weakRoute.lane} Lane`,
      text: `This route is the weakest margin lane in the current mock set. Price, tolls, and delay exposure should be reviewed.`,
      tags: ["Low Margin", weakRoute.lane, "Pricing Review"],
    });
  }

  const loadRows = trips
    .map((trip) => {
      const load = loadById[trip.load_id];
      const driver = driverById[trip.driver_id];
      const vehicle = vehicleById[trip.vehicle_id];
      const costs = costByTripId[trip.trip_id] || {};
      const totalCost =
        Number(costs.fuel_cost || 0) +
        Number(costs.toll_cost || 0) +
        Number(costs.driver_cost || 0) +
        Number(costs.maintenance_cost || 0) +
        Number(costs.penalty_cost || 0);
      if (!load) return null;
      return {
        loadId: load.load_id,
        tripId: trip.trip_id,
        client: load.client_name,
        lane: trip.route_name,
        truck: vehicle?.plate_number || "—",
        driver: driver?.full_name || "Unknown",
        status: String(load.status || "").toLowerCase(),
        statusLabel: titleCase(load.status || "unknown"),
        revenue: euro(Number(load.contract_price || 0)),
        revenueValue: Number(load.contract_price || 0),
        delayMinutes: Number(trip.delay_minutes || 0),
        pickup: load.pickup_city,
        delivery: load.delivery_city,
        distanceKm: Number(trip.distance_km || 0),
        departureAt: trip.departure_at || "—",
        arrivalAt: trip.arrival_at || "—",
        fuelCost: Number(costs.fuel_cost || 0),
        tollCost: Number(costs.toll_cost || 0),
        driverCost: Number(costs.driver_cost || 0),
        maintenanceCost: Number(costs.maintenance_cost || 0),
        penaltyCost: Number(costs.penalty_cost || 0),
        totalCost,
        marginPct:
          Number(load.contract_price || 0) > 0
            ? ((Number(load.contract_price || 0) - totalCost) / Number(load.contract_price || 0)) *
              100
            : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.delayMinutes - a.delayMinutes);

  return {
    kpis: [
      { label: "Monthly Revenue", value: euro(monthlyRevenue), tone: "good" },
      {
        label: "Fleet Utilization",
        value: percent(utilizationPct),
        tone: utilizationPct >= 75 ? "good" : "warn",
      },
      {
        label: "Fuel Cost / Load",
        value: euro(trips.length ? fuelTotal / trips.length : 0),
        tone: trips.length && fuelTotal / trips.length > 380 ? "warn" : "good",
      },
      {
        label: "Delayed Loads",
        value: String(delayedLoads.length),
        tone: delayedLoads.length ? "bad" : "good",
      },
    ],
    routes,
    utilization,
    fuelTrend,
    fuelSummary: [
      { label: "7-Day Average", value: euro(avgFuel) },
      { label: "Best Day", value: bestFuelDay.day },
      { label: "Worst Day", value: worstFuelDay.day },
    ],
    drivers: driverRows,
    loads: loadRows,
    risks: risks.slice(0, 3),
  };
}

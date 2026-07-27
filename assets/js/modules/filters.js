import { filterState } from "./constants.js";
import { titleCase } from "./formatters.js";

export function resetFilterState() {
  filterState.status = "ALL";
  filterState.lane = "ALL";
  filterState.driver = "ALL";
  filterState.client = "ALL";
  filterState.date = "ALL";
  filterState.region = "ALL";
}

export function syncFilterControls() {
  const statusSelect = document.querySelector("[data-filter-status]");
  const laneSelect = document.querySelector("[data-filter-lane]");
  const driverSelect = document.querySelector("[data-filter-driver]");
  const clientSelect = document.querySelector("[data-filter-client]");
  const dateSelect = document.querySelector("[data-filter-date]");
  const regionSelect = document.querySelector("[data-filter-region]");
  if (
    !statusSelect ||
    !laneSelect ||
    !driverSelect ||
    !clientSelect ||
    !dateSelect ||
    !regionSelect
  ) {
    return;
  }
  statusSelect.value = filterState.status;
  laneSelect.value = filterState.lane;
  driverSelect.value = filterState.driver;
  clientSelect.value = filterState.client;
  dateSelect.value = filterState.date;
  regionSelect.value = filterState.region;
}

function tripDate(trip) {
  return String(trip.departure_at || trip.arrival_at || "").slice(0, 10);
}

function loadRegion(load) {
  return load?.delivery_city || load?.pickup_city || "";
}

export function buildFilterOptions(rawData) {
  const loads = rawData.loads || [];
  const trips = rawData.trips || [];
  const loadById = Object.fromEntries(loads.map((load) => [load.load_id, load]));
  return {
    statuses: [...new Set(loads.map((load) => load.status))].sort(),
    lanes: [...new Set(trips.map((trip) => trip.route_name))].sort(),
    drivers: [...new Set((rawData.drivers || []).map((driver) => driver.full_name))].sort(),
    clients: [...new Set(loads.map((load) => load.client_name))].sort(),
    dates: [...new Set(trips.map((trip) => tripDate(trip)).filter(Boolean))].sort(),
    regions: [
      ...new Set(trips.map((trip) => loadRegion(loadById[trip.load_id])).filter(Boolean)),
    ].sort(),
  };
}

export function renderFilterOptions(rawData) {
  const options = buildFilterOptions(rawData);
  const statusSelect = document.querySelector("[data-filter-status]");
  const laneSelect = document.querySelector("[data-filter-lane]");
  const driverSelect = document.querySelector("[data-filter-driver]");
  const clientSelect = document.querySelector("[data-filter-client]");
  const dateSelect = document.querySelector("[data-filter-date]");
  const regionSelect = document.querySelector("[data-filter-region]");
  if (
    !statusSelect ||
    !laneSelect ||
    !driverSelect ||
    !clientSelect ||
    !dateSelect ||
    !regionSelect
  ) {
    return;
  }

  statusSelect.innerHTML =
    `<option value="ALL">All statuses</option>` +
    options.statuses
      .map((status) => `<option value="${status}">${titleCase(status)}</option>`)
      .join("");

  laneSelect.innerHTML =
    `<option value="ALL">All lanes</option>` +
    options.lanes.map((lane) => `<option value="${lane}">${lane}</option>`).join("");

  driverSelect.innerHTML =
    `<option value="ALL">All drivers</option>` +
    options.drivers.map((driver) => `<option value="${driver}">${driver}</option>`).join("");

  clientSelect.innerHTML =
    `<option value="ALL">All clients</option>` +
    options.clients.map((client) => `<option value="${client}">${client}</option>`).join("");

  dateSelect.innerHTML =
    `<option value="ALL">All dates</option>` +
    options.dates.map((date) => `<option value="${date}">${date}</option>`).join("");

  regionSelect.innerHTML =
    `<option value="ALL">All regions</option>` +
    options.regions.map((region) => `<option value="${region}">${region}</option>`).join("");
}

export function filterRawData(rawData) {
  const loads = rawData.loads || [];
  const trips = rawData.trips || [];
  const drivers = rawData.drivers || [];
  const vehicles = rawData.vehicles || [];
  const fuelEvents = rawData.fuel_events || [];
  const costSummary = rawData.cost_summary || [];

  const loadById = Object.fromEntries(loads.map((load) => [load.load_id, load]));
  const driverById = Object.fromEntries(drivers.map((driver) => [driver.driver_id, driver]));

  const filteredTrips = trips.filter((trip) => {
    const load = loadById[trip.load_id];
    const driver = driverById[trip.driver_id];

    if (filterState.status !== "ALL" && load?.status !== filterState.status) {
      return false;
    }
    if (filterState.lane !== "ALL" && trip.route_name !== filterState.lane) {
      return false;
    }
    if (filterState.driver !== "ALL" && driver?.full_name !== filterState.driver) {
      return false;
    }
    if (filterState.client !== "ALL" && load?.client_name !== filterState.client) {
      return false;
    }
    if (filterState.date !== "ALL" && tripDate(trip) !== filterState.date) {
      return false;
    }
    if (filterState.region !== "ALL" && loadRegion(load) !== filterState.region) {
      return false;
    }
    return true;
  });

  const tripIds = new Set(filteredTrips.map((trip) => trip.trip_id));
  const loadIds = new Set(filteredTrips.map((trip) => trip.load_id));
  const vehicleIds = new Set(filteredTrips.map((trip) => trip.vehicle_id));
  const driverIds = new Set(filteredTrips.map((trip) => trip.driver_id));
  const noFilterActive =
    filterState.status === "ALL" &&
    filterState.lane === "ALL" &&
    filterState.driver === "ALL" &&
    filterState.client === "ALL" &&
    filterState.date === "ALL" &&
    filterState.region === "ALL";

  return {
    vehicles: noFilterActive
      ? vehicles
      : vehicles.filter((vehicle) => vehicleIds.has(vehicle.vehicle_id)),
    drivers: drivers.filter((driver) => driverIds.has(driver.driver_id)),
    loads: loads.filter((load) => loadIds.has(load.load_id)),
    trips: filteredTrips,
    fuel_events: fuelEvents.filter((item) => tripIds.has(item.trip_id)),
    cost_summary: costSummary.filter((item) => tripIds.has(item.trip_id)),
  };
}

export function bindFilters(getRawData, rerender) {
  const statusSelect = document.querySelector("[data-filter-status]");
  const laneSelect = document.querySelector("[data-filter-lane]");
  const driverSelect = document.querySelector("[data-filter-driver]");
  const clientSelect = document.querySelector("[data-filter-client]");
  const dateSelect = document.querySelector("[data-filter-date]");
  const regionSelect = document.querySelector("[data-filter-region]");
  const resetButton = document.querySelector("[data-reset-filters]");
  if (
    !statusSelect ||
    !laneSelect ||
    !driverSelect ||
    !clientSelect ||
    !dateSelect ||
    !regionSelect ||
    !resetButton
  ) {
    return;
  }

  statusSelect.addEventListener("change", () => {
    filterState.status = statusSelect.value;
    rerender(getRawData());
  });

  laneSelect.addEventListener("change", () => {
    filterState.lane = laneSelect.value;
    rerender(getRawData());
  });

  driverSelect.addEventListener("change", () => {
    filterState.driver = driverSelect.value;
    rerender(getRawData());
  });

  clientSelect.addEventListener("change", () => {
    filterState.client = clientSelect.value;
    rerender(getRawData());
  });

  dateSelect.addEventListener("change", () => {
    filterState.date = dateSelect.value;
    rerender(getRawData());
  });

  regionSelect.addEventListener("change", () => {
    filterState.region = regionSelect.value;
    rerender(getRawData());
  });

  resetButton.addEventListener("click", () => {
    resetFilterState();
    syncFilterControls();
    rerender(getRawData());
  });
}

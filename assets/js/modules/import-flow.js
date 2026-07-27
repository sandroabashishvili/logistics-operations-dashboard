function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current !== "" || row.length) {
    row.push(current.trim());
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
  );
}

function numberValue(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function csvDriverId(name, index) {
  return `CSV-D-${String(index + 1).padStart(2, "0")}`;
}

function normalizeStatus(status) {
  return String(status || "PLANNED").trim().toUpperCase() || "PLANNED";
}

function buildImportedDataset(baseData, rows) {
  const drivers = [...(baseData.drivers || [])];
  const vehicles = [...(baseData.vehicles || [])];
  const driverIdByName = new Map(
    drivers.map((driver) => [String(driver.full_name || "").trim().toLowerCase(), driver.driver_id]),
  );
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.vehicle_id, vehicle]));

  const loads = [];
  const trips = [];
  const fuelEvents = [];
  const costSummary = [];

  rows.forEach((row, index) => {
    const driverName = row.driver_name || `Imported Driver ${index + 1}`;
    const driverKey = String(driverName).trim().toLowerCase();
    let driverId = driverIdByName.get(driverKey);
    const vehicleId = row.vehicle_id || `CSV-V-${String(index + 1).padStart(3, "0")}`;
    const plateNumber = row.plate_number || vehicleId;

    if (!driverId) {
      driverId = csvDriverId(driverName, driverIdByName.size);
      driverIdByName.set(driverKey, driverId);
      drivers.push({
        driver_id: driverId,
        full_name: driverName,
        assigned_vehicle_id: vehicleId,
        active_status: true,
        incident_count: numberValue(row.incident_count, 0),
      });
    }

    if (!vehicleById.has(vehicleId)) {
      vehicleById.set(vehicleId, {
        vehicle_id: vehicleId,
        plate_number: plateNumber,
        type: row.vehicle_type || "Trailer",
        status: row.vehicle_status || "ACTIVE",
        capacity_tons: numberValue(row.capacity_tons, 24),
        assigned_driver_id: driverId,
      });
      vehicles.push(vehicleById.get(vehicleId));
    }

    const loadId = row.load_id || `CSV-L-${String(index + 1).padStart(4, "0")}`;
    const tripId = row.trip_id || `CSV-T-${String(index + 1).padStart(3, "0")}`;
    const pickupCity = row.pickup_city || "Unknown";
    const deliveryCity = row.delivery_city || "Unknown";
    const departureAt = row.departure_at || "";
    const arrivalAt = row.arrival_at || "";
    const scheduledDeliveryAt = row.scheduled_delivery_at || arrivalAt || "";
    const actualDeliveryAt = normalizeStatus(row.status) === "DELIVERED" ? arrivalAt : "";
    const routeName = row.route_name || `${pickupCity} -> ${deliveryCity}`;
    const fuelDate = row.fuel_date || departureAt.slice(0, 10) || "2026-04-04";

    loads.push({
      load_id: loadId,
      client_name: row.client_name || `Imported Client ${index + 1}`,
      pickup_city: pickupCity,
      delivery_city: deliveryCity,
      contract_price: numberValue(row.contract_price, 0),
      status: normalizeStatus(row.status),
      scheduled_delivery_at: scheduledDeliveryAt,
      actual_delivery_at: actualDeliveryAt,
    });

    trips.push({
      trip_id: tripId,
      load_id: loadId,
      driver_id: driverId,
      vehicle_id: vehicleId,
      route_name: routeName,
      distance_km: numberValue(row.distance_km, 0),
      departure_at: departureAt,
      arrival_at: arrivalAt,
      delay_minutes: numberValue(row.delay_minutes, 0),
    });

    fuelEvents.push({
      fuel_event_id: row.fuel_event_id || `CSV-F-${String(index + 1).padStart(3, "0")}`,
      trip_id: tripId,
      vehicle_id: vehicleId,
      date: fuelDate,
      liters: numberValue(row.liters, 0),
      total_cost: numberValue(row.total_fuel_cost || row.fuel_cost, 0),
    });

    costSummary.push({
      trip_id: tripId,
      fuel_cost: numberValue(row.fuel_cost, 0),
      toll_cost: numberValue(row.toll_cost, 0),
      driver_cost: numberValue(row.driver_cost, 0),
      maintenance_cost: numberValue(row.maintenance_cost, 0),
      penalty_cost: numberValue(row.penalty_cost, 0),
    });
  });

  return {
    vehicles,
    drivers,
    loads,
    trips,
    fuel_events: fuelEvents,
    cost_summary: costSummary,
  };
}

function renderImportPreview(rows) {
  const previewNode = document.querySelector("[data-import-preview]");
  if (!previewNode) return;
  if (!rows.length) {
    previewNode.innerHTML = "";
    return;
  }

  const clientCount = new Set(rows.map((row) => row.client_name || "")).size;
  const laneCount = new Set(
    rows.map((row) => row.route_name || `${row.pickup_city || "Unknown"} -> ${row.delivery_city || "Unknown"}`),
  ).size;
  const driverCount = new Set(rows.map((row) => row.driver_name || "")).size;
  const revenue = rows.reduce((sum, row) => sum + numberValue(row.contract_price, 0), 0);

  previewNode.innerHTML = `
    <article class="import-preview-card">
      <span>Imported Rows</span>
      <strong>${rows.length}</strong>
    </article>
    <article class="import-preview-card">
      <span>Clients</span>
      <strong>${clientCount}</strong>
    </article>
    <article class="import-preview-card">
      <span>Lanes</span>
      <strong>${laneCount}</strong>
    </article>
    <article class="import-preview-card">
      <span>Revenue</span>
      <strong>EUR ${Math.round(revenue).toLocaleString()}</strong>
    </article>
    <article class="import-preview-card">
      <span>Drivers</span>
      <strong>${driverCount}</strong>
    </article>
  `;
}

function setImportStatus(message) {
  const statusNode = document.querySelector("[data-import-status]");
  if (!statusNode) return;
  statusNode.textContent = message;
}

export function bindCsvImport({ getBaseRawData, onImport, onRestore }) {
  const fileInput = document.querySelector("[data-import-file]");
  const fileNameNode = document.querySelector("[data-import-file-name]");
  const restoreButton = document.querySelector("[data-restore-mock]");
  if (!fileInput || !restoreButton) return;

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (fileNameNode) {
      fileNameNode.textContent = file.name;
    }

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        setImportStatus("The uploaded CSV is empty or could not be parsed.");
        renderImportPreview([]);
        return;
      }

      const importedData = buildImportedDataset(getBaseRawData(), rows);
      renderImportPreview(rows);
      setImportStatus(
        `Imported ${rows.length} CSV rows. Dashboard now reflects uploaded loads, trips, fuel, and cost records.`,
      );
      onImport(importedData, file.name);
    } catch (error) {
      console.error("Failed to import CSV", error);
      setImportStatus("Import failed. Check CSV structure and try again.");
      renderImportPreview([]);
    }
  });

  restoreButton.addEventListener("click", () => {
    fileInput.value = "";
    if (fileNameNode) {
      fileNameNode.textContent = "No file selected";
    }
    renderImportPreview([]);
    setImportStatus("Restored bundled mock operations data.");
    onRestore();
  });
}

export function renderKpis(dashboardData) {
  const root = document.querySelector("[data-kpi-grid]");
  if (!root) return;
  root.innerHTML = dashboardData.kpis
    .map(
      (item) => `
        <article class="kpi-card">
          <span>${item.label}</span>
          <strong class="${item.tone}">${item.value}</strong>
        </article>
      `,
    )
    .join("");
}

export function renderRoutes(dashboardData) {
  const root = document.querySelector("[data-route-bars]");
  if (!root) return;
  if (!dashboardData.routes.length) {
    root.innerHTML = `<div class="empty-state">No route data matches the current filters.</div>`;
    return;
  }
  root.innerHTML = dashboardData.routes
    .map(
      (route) => `
        <div class="route-row">
          <div class="route-label">${route.lane}</div>
          <div class="route-track">
            <div class="route-fill" style="width: ${Math.max(4, Math.min(route.margin, 30) / 30 * 100)}%"></div>
          </div>
          <div class="route-margin">${route.margin.toFixed(1)}%</div>
        </div>
      `,
    )
    .join("");
}

export function renderUtilization(dashboardData) {
  const stack = document.querySelector("[data-utilization]");
  const legend = document.querySelector("[data-utilization-legend]");
  if (!stack || !legend) return;
  const total = dashboardData.utilization.reduce((sum, item) => sum + item.count, 0);
  if (!total) {
    stack.innerHTML = `<div class="empty-state compact">No fleet data available.</div>`;
    legend.innerHTML = "";
    return;
  }

  stack.innerHTML = dashboardData.utilization
    .map(
      (item) => `
        <div class="util-segment" style="width:${(item.count / total) * 100}%; background:${item.color}"></div>
      `,
    )
    .join("");

  legend.innerHTML = dashboardData.utilization
    .map(
      (item) => `
        <div class="legend-item">
          <div class="legend-label">
            <span class="swatch" style="background:${item.color}"></span>
            <span>${item.label}</span>
          </div>
          <strong>${item.count}</strong>
        </div>
      `,
    )
    .join("");
}

export function renderFuelTrend(dashboardData) {
  const spark = document.querySelector("[data-fuel-spark]");
  const notes = document.querySelector("[data-fuel-notes]");
  if (!spark || !notes) return;
  if (!dashboardData.fuelTrend.length) {
    spark.innerHTML = `<div class="empty-state">No fuel events match the current filters.</div>`;
    notes.innerHTML = "";
    return;
  }
  const max = Math.max(...dashboardData.fuelTrend.map((item) => item.value), 1);

  spark.innerHTML = dashboardData.fuelTrend
    .map(
      (item) => `
        <div class="spark-col">
          <div class="spark-bar" style="height:${(item.value / max) * 170}px"></div>
          <div class="spark-label">${item.day}</div>
        </div>
      `,
    )
    .join("");

  notes.innerHTML = dashboardData.fuelSummary
    .map(
      (item) => `
        <div>
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `,
    )
    .join("");
}

export function renderDrivers(dashboardData) {
  const root = document.querySelector("[data-driver-table]");
  if (!root) return;
  if (!dashboardData.drivers.length) {
    root.innerHTML = `<tr><td colspan="7"><div class="empty-state">No driver records match the current filters.</div></td></tr>`;
    return;
  }
  root.innerHTML = dashboardData.drivers
    .map((driver) => {
      const statusClass =
        driver.status === "Strong" ? "ok" : driver.status === "Watch" ? "watch" : "risk";
      return `
        <tr>
          <td>${driver.name}</td>
          <td>${driver.truck}</td>
          <td>${driver.loads}</td>
          <td>${driver.onTime}</td>
          <td>${driver.fuel.toFixed(1)} L</td>
          <td>${driver.incidents}</td>
          <td><strong class="${statusClass}">${driver.status}</strong></td>
        </tr>
      `;
    })
    .join("");
}

export function renderLoads(dashboardData, selectedLoadId = null) {
  const root = document.querySelector("[data-load-table]");
  if (!root) return;
  if (!dashboardData.loads.length) {
    root.innerHTML = `<tr><td colspan="8"><div class="empty-state">No loads match the current filters.</div></td></tr>`;
    return;
  }
  root.innerHTML = dashboardData.loads
    .map((load) => {
      const delayText =
        load.delayMinutes > 0 ? `${Math.round(load.delayMinutes / 60)}h` : "On time";
      const delayClass =
        load.delayMinutes >= 120 ? "risk" : load.delayMinutes > 0 ? "watch" : "ok";
      const isSelected = load.loadId === selectedLoadId;
      return `
        <tr
          class="load-row${isSelected ? " is-selected" : ""}"
          data-load-row
          data-load-id="${load.loadId}"
          role="button"
          tabindex="0"
          aria-selected="${String(isSelected)}"
          aria-label="Inspect load ${load.loadId}"
        >
          <td>${load.loadId}</td>
          <td>${load.client}</td>
          <td>${load.lane}</td>
          <td>${load.truck}</td>
          <td>${load.driver}</td>
          <td><span class="status-chip status-${load.status}">${load.statusLabel}</span></td>
          <td>${load.revenue}</td>
          <td><strong class="${delayClass}">${delayText}</strong></td>
        </tr>
      `;
    })
    .join("");
}

function getActionRecommendation(load) {
  if (load.delayMinutes >= 120) {
    return {
      tone: "risk",
      title: "Dispatch follow-up required",
      text: "Confirm the revised ETA with the driver and notify the client before penalty exposure grows.",
    };
  }
  if (load.marginPct < 10) {
    return {
      tone: "watch",
      title: "Margin review recommended",
      text: "Check fuel, toll, and driver cost assumptions before pricing the next load on this lane.",
    };
  }
  return {
    tone: "ok",
    title: "Trip is within operating range",
    text: "No immediate intervention is required. Continue monitoring ETA and cost variance.",
  };
}

function formatDateTime(value) {
  if (!value || value === "—") return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}

export function renderLoadDrawer(load) {
  const root = document.querySelector("[data-load-drawer]");
  if (!root) return;
  if (!load) {
    root.innerHTML = `
      <div class="drawer-empty">
        <h3>No load selected</h3>
        <p>Select a load row to inspect route, driver, revenue, delay, and cost structure.</p>
      </div>
    `;
    return;
  }

  const delayText =
    load.delayMinutes > 0 ? `${Math.round(load.delayMinutes / 60)}h delayed` : "On time";
  const profitValue = load.revenueValue - load.totalCost;
  const costShare = load.revenueValue
    ? Math.min((load.totalCost / load.revenueValue) * 100, 100)
    : 0;
  const action = getActionRecommendation(load);

  root.innerHTML = `
    <div class="drawer-head">
      <div>
        <p class="drawer-eyebrow">Selected Load</p>
        <h3>${load.loadId}</h3>
      </div>
      <span class="status-chip status-${load.status}">${load.statusLabel}</span>
    </div>

    <div class="drawer-summary">
      <div>
        <span>Revenue</span>
        <strong>EUR ${Math.round(load.revenueValue).toLocaleString("en-US")}</strong>
      </div>
      <div>
        <span>Total cost</span>
        <strong>EUR ${Math.round(load.totalCost).toLocaleString("en-US")}</strong>
      </div>
      <div>
        <span>Estimated profit</span>
        <strong class="${profitValue >= 0 ? "ok" : "risk"}">EUR ${Math.round(profitValue).toLocaleString("en-US")}</strong>
      </div>
      <div>
        <span>Margin</span>
        <strong class="${load.marginPct >= 12 ? "ok" : "watch"}">${load.marginPct.toFixed(1)}%</strong>
      </div>
    </div>

    <div class="cost-share" aria-label="Cost share of revenue">
      <div><span>Cost share of revenue</span><strong>${costShare.toFixed(1)}%</strong></div>
      <div class="cost-share-track"><span style="width:${costShare}%"></span></div>
    </div>

    <div class="drawer-grid">
      <div><span>Client</span><strong>${load.client}</strong></div>
      <div><span>Lane</span><strong>${load.pickup} -> ${load.delivery}</strong></div>
      <div><span>Truck</span><strong>${load.truck}</strong></div>
      <div><span>Driver</span><strong>${load.driver}</strong></div>
      <div><span>Trip ID</span><strong>${load.tripId}</strong></div>
      <div><span>Distance</span><strong>${load.distanceKm} km</strong></div>
      <div><span>Delay</span><strong>${delayText}</strong></div>
      <div><span>Departure</span><strong>${formatDateTime(load.departureAt)}</strong></div>
      <div><span>Arrival</span><strong>${formatDateTime(load.arrivalAt)}</strong></div>
    </div>

    <div class="drawer-costs">
      <h4>Cost Breakdown</h4>
      <div class="drawer-grid drawer-grid-tight">
        <div><span>Fuel</span><strong>EUR ${Math.round(load.fuelCost)}</strong></div>
        <div><span>Tolls</span><strong>EUR ${Math.round(load.tollCost)}</strong></div>
        <div><span>Driver Cost</span><strong>EUR ${Math.round(load.driverCost)}</strong></div>
        <div><span>Maintenance</span><strong>EUR ${Math.round(load.maintenanceCost)}</strong></div>
        <div><span>Penalty</span><strong>EUR ${Math.round(load.penaltyCost)}</strong></div>
      </div>
    </div>

    <div class="drawer-action drawer-action-${action.tone}">
      <span>Recommended next step</span>
      <strong>${action.title}</strong>
      <p>${action.text}</p>
    </div>
  `;
}

export function renderRisks(dashboardData) {
  const root = document.querySelector("[data-risk-cards]");
  if (!root) return;
  if (!dashboardData.risks.length) {
    root.innerHTML = `<div class="empty-state">No operational risks detected in the current scope.</div>`;
    return;
  }
  root.innerHTML = dashboardData.risks
    .map(
      (risk) => `
        <article class="risk-card">
          <h3>${risk.title}</h3>
          <p>${risk.text}</p>
          <div class="risk-meta">
            ${risk.tags.map((tag) => `<span>${tag}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

export function renderHero(dashboardData) {
  const active = dashboardData.utilization.find((item) => item.label === "Active")?.count ?? 0;
  const total = dashboardData.utilization.reduce((sum, item) => sum + item.count, 0);
  const avgMargin = dashboardData.routes.length
    ? dashboardData.routes.reduce((sum, route) => sum + route.margin, 0) /
      dashboardData.routes.length
    : 0;
  const openLoads = dashboardData.loads.filter((load) => load.status !== "delivered").length;

  document.querySelector("[data-hero-active]").textContent = `${active} / ${total}`;
  document.querySelector("[data-hero-loads]").textContent = String(openLoads);
  document.querySelector("[data-hero-margin]").textContent = `${avgMargin.toFixed(1)}%`;
}

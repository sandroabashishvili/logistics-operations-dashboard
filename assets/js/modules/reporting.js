function getActiveFilters() {
  const controls = [
    ["status", "[data-filter-status]"],
    ["lane", "[data-filter-lane]"],
    ["driver", "[data-filter-driver]"],
    ["client", "[data-filter-client]"],
    ["date", "[data-filter-date]"],
    ["region", "[data-filter-region]"],
  ];

  return Object.fromEntries(
    controls
      .map(([key, selector]) => [key, document.querySelector(selector)?.value || "ALL"])
      .filter(([, value]) => value !== "ALL"),
  );
}

function createSnapshot(dashboardData, datasetLabel) {
  return {
    report: "Northline Logistics Operations Snapshot",
    generatedAt: new Date().toISOString(),
    dataset: datasetLabel,
    activeFilters: getActiveFilters(),
    kpis: dashboardData?.kpis || [],
    routeProfitability: dashboardData?.routes || [],
    fleetUtilization: dashboardData?.utilization || [],
    fuelSummary: dashboardData?.fuelSummary || [],
    driverPerformance: dashboardData?.drivers || [],
    loads: dashboardData?.loads || [],
    riskItems: dashboardData?.risks || [],
  };
}

function downloadSnapshot(getState) {
  const { dashboardData, datasetLabel } = getState();
  if (!dashboardData) return;

  const snapshot = createSnapshot(dashboardData, datasetLabel);
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `northline-operations-snapshot-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function updateReportMeta(dashboardData, datasetLabel) {
  const timestamp = document.querySelector("[data-report-updated]");
  const dataset = document.querySelector("[data-report-dataset]");
  const loadCount = document.querySelector("[data-report-load-count]");
  if (timestamp) {
    timestamp.textContent = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
  }
  if (dataset) dataset.textContent = datasetLabel;
  if (loadCount) loadCount.textContent = `${dashboardData.loads.length} visible loads`;
}

function showActionFeedback(button, message, fallback) {
  if (!button) return;
  button.textContent = message;
  button.classList.add("is-confirmed");
  window.setTimeout(() => {
    button.textContent = fallback;
    button.classList.remove("is-confirmed");
  }, 1800);
}

export function bindReporting(getState) {
  const exportButton = document.querySelector("[data-export-json]");
  const printButton = document.querySelector("[data-print-report]");

  exportButton?.addEventListener("click", () => {
    downloadSnapshot(getState);
    showActionFeedback(exportButton, "Snapshot downloaded ✓", "Export snapshot JSON");
  });

  printButton?.addEventListener("click", () => {
    showActionFeedback(printButton, "Opening print dialog…", "Print / Save PDF");
    window.print();
  });
}

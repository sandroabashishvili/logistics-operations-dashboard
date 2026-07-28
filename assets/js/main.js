import { loadRawData } from "./modules/data.js";
import {
  renderFilterOptions,
  bindFilters,
  resetFilterState,
  syncFilterControls,
} from "./modules/filters.js";
import { buildDashboardData } from "./modules/dashboard-data.js";
import { bindCsvImport } from "./modules/import-flow.js";
import { bindReporting, updateReportMeta } from "./modules/reporting.js";
import {
  renderHero,
  renderKpis,
  renderRoutes,
  renderUtilization,
  renderFuelTrend,
  renderDrivers,
  renderLoads,
  renderLoadDrawer,
  renderRisks,
} from "./modules/renderers.js";

let selectedLoadId = null;
const appState = {
  baseRawData: null,
  currentRawData: null,
  currentDashboardData: null,
  datasetLabel: "Bundled mock dataset",
};

function syncSelectedLoadRow() {
  document.querySelectorAll("[data-load-row]").forEach((row) => {
    const isSelected = row.getAttribute("data-load-id") === selectedLoadId;
    row.classList.toggle("is-selected", isSelected);
    row.setAttribute("aria-selected", String(isSelected));
  });
}

function selectLoad(loadId, dashboardData) {
  selectedLoadId = loadId;
  const selectedLoad =
    dashboardData.loads.find((load) => load.loadId === selectedLoadId) || null;
  renderLoadDrawer(selectedLoad);
  syncSelectedLoadRow();
}

function bindLoadDrawer(dashboardData) {
  document.querySelectorAll("[data-load-row]").forEach((row) => {
    const activate = () => selectLoad(row.getAttribute("data-load-id"), dashboardData);
    row.addEventListener("click", activate);
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activate();
    });
  });
}

function updateScopeSummary(dashboardData) {
  const filters = Array.from(document.querySelectorAll("[data-filter-status], [data-filter-lane], [data-filter-driver], [data-filter-client], [data-filter-date], [data-filter-region]"));
  const activeCount = filters.filter((control) => control.value !== "ALL").length;
  const summary = document.querySelector("[data-filter-summary]");
  const resetButton = document.querySelector("[data-reset-filters]");
  if (summary) {
    summary.textContent = activeCount
      ? `${dashboardData.loads.length} loads match ${activeCount} active ${activeCount === 1 ? "filter" : "filters"}.`
      : `${dashboardData.loads.length} loads in the current dataset.`;
  }
  if (resetButton) resetButton.disabled = activeCount === 0;
}

function rerender(rawData) {
  const dashboardData = buildDashboardData(rawData);
  appState.currentDashboardData = dashboardData;

  const selectedExists = dashboardData.loads.some(
    (load) => load.loadId === selectedLoadId,
  );
  if (!selectedExists) {
    selectedLoadId = dashboardData.loads[0]?.loadId || null;
  }

  renderHero(dashboardData);
  renderKpis(dashboardData);
  renderRoutes(dashboardData);
  renderUtilization(dashboardData);
  renderFuelTrend(dashboardData);
  renderDrivers(dashboardData);
  renderLoads(dashboardData, selectedLoadId);
  renderLoadDrawer(
    dashboardData.loads.find((load) => load.loadId === selectedLoadId) || null,
  );
  bindLoadDrawer(dashboardData);
  renderRisks(dashboardData);
  updateReportMeta(dashboardData, appState.datasetLabel);
  updateScopeSummary(dashboardData);
}

async function main() {
  const rawData = await loadRawData();
  appState.baseRawData = rawData;
  appState.currentRawData = rawData;

  renderFilterOptions(appState.currentRawData);
  resetFilterState();
  syncFilterControls();
  bindFilters(() => appState.currentRawData, rerender);
  bindReporting(() => ({
    dashboardData: appState.currentDashboardData,
    datasetLabel: appState.datasetLabel,
  }));
  bindCsvImport({
    getBaseRawData: () => appState.baseRawData,
    onImport(nextData, fileName = "Imported CSV dataset") {
      appState.currentRawData = nextData;
      appState.datasetLabel = fileName;
      selectedLoadId = null;
      renderFilterOptions(appState.currentRawData);
      resetFilterState();
      syncFilterControls();
      rerender(appState.currentRawData);
    },
    onRestore() {
      appState.currentRawData = appState.baseRawData;
      appState.datasetLabel = "Bundled mock dataset";
      selectedLoadId = null;
      renderFilterOptions(appState.currentRawData);
      resetFilterState();
      syncFilterControls();
      rerender(appState.currentRawData);
    },
  });
  rerender(appState.currentRawData);
}

main().catch((error) => {
  console.error("Failed to render logistics dashboard", error);
});

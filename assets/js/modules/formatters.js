export function euro(value) {
  return `EUR ${Math.round(value).toLocaleString("en-US")}`;
}

export function percent(value) {
  return `${value.toFixed(1)}%`;
}

export function dayLabel(dateIso) {
  const parsed = new Date(`${dateIso}T00:00:00Z`);
  return parsed.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
}

export function titleCase(value) {
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

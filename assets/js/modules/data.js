export async function loadRawData() {
  const response = await fetch("./data/mock_operations.json");
  if (!response.ok) {
    throw new Error(`Failed to load mock_operations.json: ${response.status}`);
  }
  return response.json();
}

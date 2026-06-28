import { apiDataSource } from "./ApiDataSource.js";

// Single data source — always the real API.
// Backwards-compatible signature so callers don't need touching.
export function getDataSource(_unused?: boolean) {
  return apiDataSource;
}

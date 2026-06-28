import type { DataSource } from "./DataSource.js";
import { apiDataSource } from "./ApiDataSource.js";
import { mockDataSource } from "./MockDataSource.js"; // REMOVABLE import

export function getDataSource(displayMode: boolean): DataSource {
  return displayMode ? mockDataSource : apiDataSource; // REMOVABLE branch -> always apiDataSource
}
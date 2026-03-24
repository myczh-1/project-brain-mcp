import { buildDashboardData, buildDashboardSummary, BuildDashboardInput } from './buildDashboard.js';
import { DashboardData } from './types.js';

export interface DashboardToolInput extends BuildDashboardInput {}

export interface DashboardToolOutput {
  summary: string;
  dashboard: DashboardData;
}

export async function brainDashboard(
  input: DashboardToolInput
): Promise<DashboardToolOutput> {
  const dashboard = await buildDashboardData(input);

  return {
    summary: buildDashboardSummary(dashboard),
    dashboard,
  };
}

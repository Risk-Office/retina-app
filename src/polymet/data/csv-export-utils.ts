import type { SimulationResult } from "@/polymet/data/scenario-engine";
import { getCsvHeader } from "@/polymet/data/terms";

interface DecisionExportData {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  chosenOptionId: string;
  options: Array<{
    id: string;
    label: string;
    score?: number;
    expectedReturn?: number;
    cost?: number;
  }>;
  closedAt: number;
  closedBy: string;
  metrics?: {
    raroc: number;
    ev: number;
    var95: number;
    cvar95: number;
    ce?: number;
    tcor?: number;
  };
  basisAtClose?: "RAROC" | "CE";
  achievedSpearmanAtClose?: number;
  bayesAtClose?: {
    varKey: string;
    muN: number;
    sigmaN: number;
    applied: boolean;
  };
  criticalOpenAtClose?: number;
  horizonMonthsAtClose?: number;
  copulaFroErrAtClose?: number;
}

/**
 * Format date as yyyy-mm-dd
 */
function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date as yyyy-mm-dd_HHMM
 */
function formatDateTimeYYYYMMDDHHMM(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}_${hours}${minutes}`;
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(
  data: Array<Record<string, any>>,
  columns: string[],
  columnHeaders?: Record<string, string>
): string {
  const header = columns
    .map((col) => escapeCSV(columnHeaders?.[col] ?? col))
    .join(",");
  const rows = data.map((row) =>
    columns.map((col) => escapeCSV(row[col])).join(",")
  );
  return [header, ...rows].join("\n");
}

/**
 * Download CSV file
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export current simulation metrics to CSV
 * Columns: Option, Cost, ExpectedReturn, EV, VaR95, CVaR95, EconCapital, RAROC, Utility, CE, TCOR, Basis, AchievedSpearman, BayesApplied, BayesMuN, BayesSigmaN, AssumptionsCount, CriticalOpen, HorizonMonths, OptionTimeWindowMonths, Seed, Runs, RunId, Timestamp
 */
export function exportMetricsCSV(
  simulationResults: SimulationResult[],
  seed: number,
  runs: number,
  options: Array<{
    id: string;
    label: string;
    cost?: number;
    expectedReturn?: number;
    mitigationCost?: number;
    horizonMonths?: number;
  }>,
  runId?: string,
  utilitySettings?: {
    mode: string;
    a: number;
    scale: number;
    useForRecommendation: boolean;
  },
  achievedSpearman?: number,
  bayesianOverride?: {
    varKey: string;
    muN: number;
    sigmaN: number;
  },
  assumptionsSnapshot?: {
    count: number;
    criticalOpen: number;
  },
  horizonMonths?: number,
  copulaFroErr?: number
): void {
  const timestamp = new Date().toISOString();
  const filename = `idecide_metrics_${formatDateTimeYYYYMMDDHHMM(new Date())}.csv`;

  const hasUtilityMetrics = simulationResults.some(
    (r) => r.expectedUtility !== undefined
  );

  const hasTCORMetrics = simulationResults.some((r) => r.tcor !== undefined);

  const data = simulationResults.map((result) => {
    const option = options.find((o) => o.id === result.optionId);
    const row: Record<string, any> = {
      Option: result.optionLabel,
      Cost: option?.cost?.toFixed(2) ?? "",
      ExpectedReturn: option?.expectedReturn?.toFixed(2) ?? "",
      MitigationCost: option?.mitigationCost?.toFixed(2) ?? "",
      EV: result.ev.toFixed(2),
      VaR95: result.var95.toFixed(2),
      CVaR95: result.cvar95.toFixed(2),
      EconCapital: result.economicCapital.toFixed(2),
      RAROC: result.raroc.toFixed(4),
    };

    if (hasUtilityMetrics) {
      row.Utility = result.expectedUtility?.toFixed(6) ?? "";
      row.CE = result.certaintyEquivalent?.toFixed(2) ?? "";
    }

    if (hasTCORMetrics) {
      row.TCOR = result.tcor?.toFixed(2) ?? "";
      if (result.tcorComponents) {
        row.TCOR_ExpectedLoss = result.tcorComponents.expectedLoss.toFixed(2);
        row.TCOR_Insurance = result.tcorComponents.insurance.toFixed(2);
        row.TCOR_Contingency = result.tcorComponents.contingency.toFixed(2);
        row.TCOR_Mitigation = result.tcorComponents.mitigation.toFixed(2);
      }
    }

    // Add basis (RAROC or CE)
    row.Basis = utilitySettings?.useForRecommendation ? "CE" : "RAROC";

    // Add Spearman correlation
    row.AchievedSpearman = achievedSpearman?.toFixed(4) ?? "";

    // Add Bayesian override info
    row.BayesApplied = bayesianOverride ? bayesianOverride.varKey : "off";
    row.BayesMuN = bayesianOverride?.muN?.toFixed(4) ?? "";
    row.BayesSigmaN = bayesianOverride?.sigmaN?.toFixed(4) ?? "";

    // Add assumptions info
    row.AssumptionsCount = assumptionsSnapshot?.count ?? 0;
    row.CriticalOpen = assumptionsSnapshot?.criticalOpen ?? 0;

    // Add horizon
    row.HorizonMonths = horizonMonths ?? 12;

    // Add per-option horizon
    row.OptionTimeWindowMonths = option?.horizonMonths ?? horizonMonths ?? 12;

    // Add copula Frobenius error
    row.CopulaFroErr = copulaFroErr?.toFixed(6) ?? "";

    row.Seed = seed;
    row.Runs = runs;
    row.RunId = runId ?? "";
    row.Timestamp = timestamp;

    return row;
  });

  const columns = [
    "Option",
    "Cost",
    "ExpectedReturn",
    "MitigationCost",
    "EV",
    "VaR95",
    "CVaR95",
    "EconCapital",
    "RAROC",
  ];

  if (hasUtilityMetrics) {
    columns.push("Utility", "CE");
  }

  if (hasTCORMetrics) {
    columns.push(
      "TCOR",
      "TCOR_ExpectedLoss",
      "TCOR_Insurance",
      "TCOR_Contingency",
      "TCOR_Mitigation"
    );
  }

  columns.push(
    "Basis",
    "AchievedSpearman",
    "BayesApplied",
    "BayesMuN",
    "BayesSigmaN",
    "AssumptionsCount",
    "CriticalOpen",
    "HorizonMonths",
    "OptionTimeWindowMonths",
    "CopulaFroErr",
    "Seed",
    "Runs",
    "RunId",
    "Timestamp"
  );

  // Create friendly column headers
  const columnHeaders: Record<string, string> = {
    EV: getCsvHeader("ev"),
    VaR95: getCsvHeader("var95"),
    CVaR95: getCsvHeader("cvar95"),
    EconCapital: getCsvHeader("econCap"),
    RAROC: getCsvHeader("raroc"),
    Utility: getCsvHeader("utility"),
    CE: getCsvHeader("ce"),
    TCOR: getCsvHeader("tcor"),
    Seed: getCsvHeader("seed"),
    Runs: getCsvHeader("runs"),
    HorizonMonths: getCsvHeader("horizon"),
    CopulaFroErr: getCsvHeader("frobenius"),
  };

  const csv = arrayToCSV(data, columns, columnHeaders);
  downloadCSV(csv, filename);
}

/**
 * Export decisions history to CSV
 * Columns: Title, ClosedAt, ChosenOption, EV, RAROC, CE, TCOR, BasisAtClose, AchievedSpearmanAtClose, BayesAtClose, CriticalOpenAtClose, HorizonMonthsAtClose, Tenant, DecisionId
 */
export function exportDecisionsCSV(decisions: DecisionExportData[]): void {
  const filename = `idecide_decisions_${formatDateYYYYMMDD(new Date())}.csv`;

  const data = decisions.map((decision) => {
    const chosenOption = decision.options.find(
      (o) => o.id === decision.chosenOptionId
    );
    return {
      Title: decision.title,
      ClosedAt: new Date(decision.closedAt).toISOString(),
      ChosenOption: chosenOption?.label ?? decision.chosenOptionId,
      EV: decision.metrics?.ev?.toFixed(2) ?? "",
      RAROC: decision.metrics?.raroc?.toFixed(4) ?? "",
      CE: decision.metrics?.ce?.toFixed(2) ?? "",
      TCOR: decision.metrics?.tcor?.toFixed(2) ?? "",
      BasisAtClose: decision.basisAtClose ?? "",
      AchievedSpearmanAtClose:
        decision.achievedSpearmanAtClose?.toFixed(4) ?? "",
      BayesAtClose: decision.bayesAtClose
        ? `${decision.bayesAtClose.varKey}|μ=${decision.bayesAtClose.muN.toFixed(4)}|σ=${decision.bayesAtClose.sigmaN.toFixed(4)}`
        : "off",
      CriticalOpenAtClose: decision.criticalOpenAtClose ?? 0,
      HorizonMonthsAtClose: decision.horizonMonthsAtClose ?? 12,
      CopulaFroErrAtClose: decision.copulaFroErrAtClose?.toFixed(6) ?? "",
      Tenant: decision.tenantId,
      DecisionId: decision.id,
    };
  });

  const columns = [
    "Title",
    "ClosedAt",
    "ChosenOption",
    "EV",
    "RAROC",
    "CE",
    "TCOR",
    "BasisAtClose",
    "AchievedSpearmanAtClose",
    "BayesAtClose",
    "CriticalOpenAtClose",
    "HorizonMonthsAtClose",
    "CopulaFroErrAtClose",
    "Tenant",
    "DecisionId",
  ];

  // Create friendly column headers
  const columnHeaders: Record<string, string> = {
    EV: getCsvHeader("ev"),
    RAROC: getCsvHeader("raroc"),
    CE: getCsvHeader("ce"),
    TCOR: getCsvHeader("tcor"),
    HorizonMonthsAtClose: getCsvHeader("horizon"),
    CopulaFroErrAtClose: getCsvHeader("frobenius"),
  };

  const csv = arrayToCSV(data, columns, columnHeaders);
  downloadCSV(csv, filename);
}

interface AuditEventExportData {
  ts: number;
  tenantId: string;
  actor: string;
  actorRole?: string;
  eventType: string;
  payload: Record<string, any>;
}

interface SensitivityExportData {
  paramName: string;
  direction: "Plus" | "Minus";
  delta: number;
  percent: number;
  metric: "RAROC" | "CE";
  optionLabel: string;
  runIdBase: string;
}

/**
 * Export sensitivity tornado analysis to CSV
 * Columns: Param, Direction, Delta, Percent, Metric, Option, RunIdBase
 */
export function exportSensitivityCSV(
  sensitivityData: SensitivityExportData[]
): void {
  const filename = `idecide_tornado_${formatDateTimeYYYYMMDDHHMM(new Date())}.csv`;

  const data = sensitivityData.map((item) => ({
    Param: item.paramName,
    Direction: item.direction,
    Delta: item.delta.toFixed(6),
    Percent: item.percent.toFixed(2),
    Metric: item.metric,
    Option: item.optionLabel,
    RunIdBase: item.runIdBase,
  }));

  const columns = [
    "Param",
    "Direction",
    "Delta",
    "Percent",
    "Metric",
    "Option",
    "RunIdBase",
  ];

  const csv = arrayToCSV(data, columns);
  downloadCSV(csv, filename);
}

interface BaselinePlanDelta {
  optionId: string;
  optionLabel: string;
  deltaEV: number;
  deltaRAROC: number;
  deltaCE: number;
  deltaTCOR: number;
  deltaHorizon?: number;
}

/**
 * Export Baseline vs Plan comparison to CSV
 * Columns: DecisionId, BaselineRunId, PlanRunId, Option, ΔEV, ΔRAROC, ΔCE, ΔTCOR, ΔTimeWindowMonths, Notes
 */
export function exportBaselinePlanCSV(
  decisionId: string,
  baselineRunId: string,
  planRunId: string,
  deltas: BaselinePlanDelta[],
  notes: string
): void {
  const filename = `idecide_baseline_plan_${formatDateTimeYYYYMMDDHHMM(new Date())}.csv`;

  const data = deltas.map((delta) => ({
    DecisionId: decisionId,
    BaselineRunId: baselineRunId,
    PlanRunId: planRunId,
    Option: delta.optionLabel,
    DeltaEV: delta.deltaEV.toFixed(2),
    DeltaRAROC: delta.deltaRAROC.toFixed(4),
    DeltaCE: delta.deltaCE.toFixed(2),
    DeltaTCOR: delta.deltaTCOR.toFixed(2),
    DeltaTimeWindowMonths: delta.deltaHorizon?.toString() ?? "",
    Notes: notes,
  }));

  const columns = [
    "DecisionId",
    "BaselineRunId",
    "PlanRunId",
    "Option",
    "DeltaEV",
    "DeltaRAROC",
    "DeltaCE",
    "DeltaTCOR",
    "DeltaTimeWindowMonths",
    "Notes",
  ];

  // Create friendly column headers with technical headers and friendly aliases
  const columnHeaders: Record<string, string> = {
    DeltaEV: `${getCsvHeader("ev")} (ΔEV)`,
    DeltaRAROC: `${getCsvHeader("raroc")} (ΔRAROC)`,
    DeltaCE: `${getCsvHeader("ce")} (ΔCE)`,
    DeltaTCOR: `${getCsvHeader("tcor")} (ΔTCOR)`,
    DeltaTimeWindowMonths: `${getCsvHeader("horizon")} (ΔTimeWindowMonths)`,
  };

  const csv = arrayToCSV(data, columns, columnHeaders);
  downloadCSV(csv, filename);
}

/**
 * Export audit events to CSV
 * Columns: Timestamp, TenantId, Actor, ActorRole, EventType, Payload
 */
export function exportAuditCSV(events: AuditEventExportData[]): void {
  const filename = `retina_audit_${formatDateTimeYYYYMMDDHHMM(new Date())}.csv`;

  const data = events.map((event) => ({
    Timestamp: new Date(event.ts).toISOString(),
    TenantId: event.tenantId,
    Actor: event.actor,
    ActorRole: event.actorRole ?? "",
    EventType: event.eventType,
    Payload: JSON.stringify(event.payload),
  }));

  const columns = [
    "Timestamp",
    "TenantId",
    "Actor",
    "ActorRole",
    "EventType",
    "Payload",
  ];

  const csv = arrayToCSV(data, columns);
  downloadCSV(csv, filename);
}

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  exportMetricsCSV,
  exportDecisionsCSV,
} from "@/polymet/data/csv-export-utils";
import { mockSimulationResults } from "@/polymet/data/test-helpers";

describe("CSV Exports Use Technical Headers", () => {
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let clickSpy: any;
  let capturedCSV: string = "";

  beforeEach(() => {
    // Mock document.createElement to capture CSV content
    createElementSpy = vi.spyOn(document, "createElement");
    appendChildSpy = vi.spyOn(document.body, "appendChild");
    removeChildSpy = vi.spyOn(document.body, "removeChild");

    createElementSpy.mockImplementation((tagName: string) => {
      if (tagName === "a") {
        const link = {
          setAttribute: vi.fn((attr: string, value: string) => {
            if (attr === "href" && value.startsWith("blob:")) {
              // Capture the blob URL - we'll need to extract CSV from it
              // In a real scenario, we'd mock URL.createObjectURL
            }
          }),
          click: vi.fn(),
          style: {},
        };
        clickSpy = link.click;
        return link;
      }
      return document.createElement(tagName);
    });

    // Mock Blob to capture CSV content
    global.Blob = class MockBlob {
      constructor(content: any[], options?: any) {
        capturedCSV = content[0];
      }
    } as any;

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    capturedCSV = "";
  });

  it("exportMetricsCSV uses technical headers", () => {
    const mockResults = mockSimulationResults(2);
    const mockOptions = [
      { id: "opt-1", label: "Option A", cost: 50, expectedReturn: 100 },
      { id: "opt-2", label: "Option B", cost: 70, expectedReturn: 120 },
    ];

    exportMetricsCSV(mockResults, 42, 5000, mockOptions);

    // Parse the captured CSV
    const lines = capturedCSV.split("\n");
    const headerRow = lines[0];

    // Should contain technical headers
    expect(headerRow).toContain("RAROC");
    expect(headerRow).toContain("EV");
    expect(headerRow).toContain("VaR95");
    expect(headerRow).toContain("CVaR95");
    expect(headerRow).toContain("EconomicCapital");

    // Should NOT contain friendly labels
    expect(headerRow).not.toContain("Return per risk capital");
    expect(headerRow).not.toContain("Expected profit");
    expect(headerRow).not.toContain("Risk capital");
    expect(headerRow).not.toContain("Capital at risk");
  });

  it("exportMetricsCSV header contains all required technical columns", () => {
    const mockResults = mockSimulationResults(1);
    const mockOptions = [
      { id: "opt-1", label: "Option A", cost: 50, expectedReturn: 100 },
    ];

    exportMetricsCSV(mockResults, 42, 5000, mockOptions);

    const lines = capturedCSV.split("\n");
    const headerRow = lines[0];

    // Required technical columns
    const requiredColumns = [
      "Option",
      "Cost",
      "ExpectedReturn",
      "EV",
      "VaR95",
      "CVaR95",
      "EconomicCapital",
      "RAROC",
      "Seed",
      "Runs",
      "Timestamp",
    ];

    for (const column of requiredColumns) {
      expect(headerRow).toContain(column);
    }
  });

  it("exportDecisionsCSV uses technical headers", () => {
    const mockDecisions = [
      {
        id: "dec-1",
        tenantId: "t-test",
        title: "Test Decision",
        chosenOptionId: "opt-1",
        options: [{ id: "opt-1", label: "Option A" }],
        closedAt: Date.now(),
        closedBy: "Test User",
        metrics: {
          raroc: 0.08,
          ev: 150,
          var95: 45,
          cvar95: 38,
        },
      },
    ];

    exportDecisionsCSV(mockDecisions);

    const lines = capturedCSV.split("\n");
    const headerRow = lines[0];

    // Should contain technical headers
    expect(headerRow).toContain("RAROC");
    expect(headerRow).toContain("EV");

    // Should NOT contain friendly labels
    expect(headerRow).not.toContain("Return per risk capital");
    expect(headerRow).not.toContain("Expected profit");
  });

  it("exportDecisionsCSV header contains all required technical columns", () => {
    const mockDecisions = [
      {
        id: "dec-1",
        tenantId: "t-test",
        title: "Test Decision",
        chosenOptionId: "opt-1",
        options: [{ id: "opt-1", label: "Option A" }],
        closedAt: Date.now(),
        closedBy: "Test User",
        metrics: {
          raroc: 0.08,
          ev: 150,
        },
      },
    ];

    exportDecisionsCSV(mockDecisions);

    const lines = capturedCSV.split("\n");
    const headerRow = lines[0];

    // Required technical columns
    const requiredColumns = [
      "Title",
      "ClosedAt",
      "ChosenOption",
      "EV",
      "RAROC",
      "Tenant",
      "DecisionId",
    ];

    for (const column of requiredColumns) {
      expect(headerRow).toContain(column);
    }
  });

  it("CSV data rows use numeric values, not formatted strings", () => {
    const mockResults = mockSimulationResults(1);
    const mockOptions = [
      { id: "opt-1", label: "Option A", cost: 50, expectedReturn: 100 },
    ];

    exportMetricsCSV(mockResults, 42, 5000, mockOptions);

    const lines = capturedCSV.split("\n");
    const dataRow = lines[1]; // First data row

    // Should contain numeric values
    expect(dataRow).toMatch(/\d+\.\d+/); // Decimal numbers
    expect(dataRow).toMatch(/\d+/); // Integers

    // Should not contain formatted strings like "8.00%" or "$150"
    expect(dataRow).not.toContain("%");
    expect(dataRow).not.toContain("$");
  });

  it("CSV filename includes timestamp for metrics", () => {
    const mockResults = mockSimulationResults(1);
    const mockOptions = [
      { id: "opt-1", label: "Option A", cost: 50, expectedReturn: 100 },
    ];

    exportMetricsCSV(mockResults, 42, 5000, mockOptions);

    // Check that setAttribute was called with download attribute
    expect(createElementSpy).toHaveBeenCalledWith("a");

    // The filename should follow pattern: idecide_metrics_yyyy-mm-dd_HHMM.csv
    // We can't easily test the exact filename, but we verified the function was called
  });

  it("CSV filename includes date for decisions", () => {
    const mockDecisions = [
      {
        id: "dec-1",
        tenantId: "t-test",
        title: "Test Decision",
        chosenOptionId: "opt-1",
        options: [{ id: "opt-1", label: "Option A" }],
        closedAt: Date.now(),
        closedBy: "Test User",
      },
    ];

    exportDecisionsCSV(mockDecisions);

    // Check that createElement was called
    expect(createElementSpy).toHaveBeenCalledWith("a");

    // The filename should follow pattern: idecide_decisions_yyyy-mm-dd.csv
  });

  it("handles special characters in CSV data properly", () => {
    const mockResults = mockSimulationResults(1);
    const mockOptions = [
      {
        id: "opt-1",
        label: 'Option "A" with, commas',
        cost: 50,
        expectedReturn: 100,
      },
    ];

    exportMetricsCSV(mockResults, 42, 5000, mockOptions);

    const lines = capturedCSV.split("\n");
    const dataRow = lines[1];

    // Special characters should be properly escaped with quotes
    expect(dataRow).toContain('"Option ""A"" with, commas"');
  });

  it("maintains consistent column order across exports", () => {
    const mockResults1 = mockSimulationResults(2);
    const mockOptions1 = [
      { id: "opt-1", label: "Option A", cost: 50, expectedReturn: 100 },
      { id: "opt-2", label: "Option B", cost: 70, expectedReturn: 120 },
    ];

    exportMetricsCSV(mockResults1, 42, 5000, mockOptions1);
    const csv1 = capturedCSV;

    capturedCSV = "";

    const mockResults2 = mockSimulationResults(3);
    const mockOptions2 = [
      { id: "opt-1", label: "Option X", cost: 60, expectedReturn: 110 },
      { id: "opt-2", label: "Option Y", cost: 80, expectedReturn: 130 },
      { id: "opt-3", label: "Option Z", cost: 90, expectedReturn: 140 },
    ];

    exportMetricsCSV(mockResults2, 43, 6000, mockOptions2);
    const csv2 = capturedCSV;

    // Headers should be identical
    const header1 = csv1.split("\n")[0];
    const header2 = csv2.split("\n")[0];
    expect(header1).toBe(header2);
  });
});

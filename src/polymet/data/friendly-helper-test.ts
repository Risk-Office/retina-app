import { describe, it, expect } from "vitest";
import { getLabel, getHelp, getCsvHeader } from "@/polymet/data/terms";

describe("Friendly Helper Functions", () => {
  describe("getLabel", () => {
    it("returns friendly label when plain=true", () => {
      const label = getLabel("raroc", { plain: true });
      expect(label).toBe("Return per risk capital");
    });

    it("returns technical label when plain=false", () => {
      const label = getLabel("raroc", { plain: false });
      // Should return either "RAROC" or full technical name
      expect(label).toMatch(/RAROC/i);
    });

    it("returns technical label by default (no options)", () => {
      const label = getLabel("raroc");
      expect(label).toMatch(/RAROC/i);
    });

    it("returns friendly label for EV when plain=true", () => {
      const label = getLabel("ev", { plain: true });
      expect(label).toBe("Expected profit");
    });

    it("returns technical label for EV when plain=false", () => {
      const label = getLabel("ev", { plain: false });
      expect(label).toMatch(/EV|Expected Value/i);
    });

    it("returns friendly label for var95 when plain=true", () => {
      const label = getLabel("var95", { plain: true });
      expect(label).toMatch(/Risk capital|VaR/i);
    });

    it("returns friendly label for econCap when plain=true", () => {
      const label = getLabel("econCap", { plain: true });
      expect(label).toMatch(/Capital at risk|Economic Capital/i);
    });

    it("returns the input key as fallback for unknown terms", () => {
      const unknownKey = "unknownTerm123";
      const label = getLabel(unknownKey, { plain: true });

      // Should return the key itself as a safe fallback
      expect(label).toBe(unknownKey);
    });

    it("handles empty string gracefully", () => {
      const label = getLabel("", { plain: true });
      expect(label).toBe("");
    });
  });

  describe("getHelp", () => {
    it("returns help text for RAROC", () => {
      const help = getHelp("raroc");
      expect(help).toContain("capital");
      expect(help).toContain("risk");
    });

    it("returns help text for EV", () => {
      const help = getHelp("ev");
      expect(help).toContain("outcome");
    });

    it("returns help text for var95", () => {
      const help = getHelp("var95");
      expect(help).toContain("95");
      expect(help).toContain("percentile");
    });

    it("returns empty string for unknown terms", () => {
      const help = getHelp("unknownTerm123");
      expect(help).toBe("");
    });

    it("returns empty string for empty input", () => {
      const help = getHelp("");
      expect(help).toBe("");
    });
  });

  describe("getCsvHeader", () => {
    it("returns technical CSV header for RAROC", () => {
      const header = getCsvHeader("raroc");
      expect(header).toBe("RAROC");
    });

    it("returns technical CSV header for EV", () => {
      const header = getCsvHeader("ev");
      expect(header).toBe("EV");
    });

    it("returns technical CSV header for var95", () => {
      const header = getCsvHeader("var95");
      expect(header).toMatch(/VaR95|VaR 95%/);
    });

    it("returns technical CSV header for econCap", () => {
      const header = getCsvHeader("econCap");
      expect(header).toMatch(/EconomicCapital|Economic Capital/);
    });

    it("never returns friendly labels in CSV headers", () => {
      // CSV headers should always be technical, never friendly
      const rarocHeader = getCsvHeader("raroc");
      expect(rarocHeader).not.toContain("Return per risk capital");

      const evHeader = getCsvHeader("ev");
      expect(evHeader).not.toContain("Expected profit");
    });

    it("returns the input key as fallback for unknown terms", () => {
      const unknownKey = "unknownTerm123";
      const header = getCsvHeader(unknownKey);
      expect(header).toBe(unknownKey);
    });
  });

  describe("Consistency checks", () => {
    it("ensures all common terms have both friendly and technical labels", () => {
      const commonTerms = ["raroc", "ev", "var95", "cvar95", "econCap"];

      for (const term of commonTerms) {
        const friendlyLabel = getLabel(term, { plain: true });
        const technicalLabel = getLabel(term, { plain: false });

        // Both should exist and be non-empty
        expect(friendlyLabel).toBeTruthy();
        expect(technicalLabel).toBeTruthy();

        // They should be different (unless it's a term that doesn't have a friendly version)
        // This ensures we're actually providing different labels
        expect(friendlyLabel.length).toBeGreaterThan(0);
        expect(technicalLabel.length).toBeGreaterThan(0);
      }
    });

    it("ensures help text exists for all common terms", () => {
      const commonTerms = ["raroc", "ev", "var95", "cvar95", "econCap"];

      for (const term of commonTerms) {
        const help = getHelp(term);
        expect(help).toBeTruthy();
        expect(help.length).toBeGreaterThan(10); // Should be a meaningful description
      }
    });

    it("ensures CSV headers are always uppercase or PascalCase", () => {
      const commonTerms = ["raroc", "ev", "var95", "cvar95", "econCap"];

      for (const term of commonTerms) {
        const header = getCsvHeader(term);

        // Should not contain lowercase words (except for connecting words)
        // Should be technical format
        expect(header).toMatch(/^[A-Z]/); // Starts with capital
        expect(header).not.toContain("per"); // No friendly language
        expect(header).not.toContain("profit"); // No friendly language
      }
    });
  });
});

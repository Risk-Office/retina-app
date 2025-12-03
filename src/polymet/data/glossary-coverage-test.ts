import { describe, it, expect, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/polymet/data/test-helpers";
import { GlossaryModal } from "@/polymet/components/glossary-modal";
import { TERMS } from "@/polymet/data/terms";

describe("Glossary Coverage - All TERMS Rendered", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders every term from TERMS dictionary", async () => {
    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    // Get all term keys from TERMS
    const termKeys = Object.keys(TERMS);
    const missingTerms: string[] = [];

    // Check each term is rendered
    for (const key of termKeys) {
      const term = TERMS[key];

      // Look for either the label or tech string
      const labelExists = screen.queryByText(term.label);
      const techExists = screen.queryByText(
        new RegExp(`\\(${term.tech}\\)`, "i")
      );

      if (!labelExists && !techExists) {
        missingTerms.push(key);
      }
    }

    // Fail if any terms are missing
    if (missingTerms.length > 0) {
      throw new Error(
        `Missing terms in glossary: ${missingTerms.join(", ")}\n` +
          `Expected all ${termKeys.length} terms to be rendered, but ${missingTerms.length} are missing.`
      );
    }

    // Verify we have the expected number of term entries
    expect(termKeys.length).toBeGreaterThan(0);
  });

  it("displays all required fields for each term", async () => {
    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    const termKeys = Object.keys(TERMS);

    for (const key of termKeys) {
      const term = TERMS[key];

      // Check label is displayed
      expect(screen.getByText(term.label)).toBeInTheDocument();

      // Check technical term is displayed in parentheses
      expect(
        screen.getByText(new RegExp(`\\(${term.tech}\\)`, "i"))
      ).toBeInTheDocument();

      // If help text exists, it should be displayed
      if (term.help) {
        expect(screen.getByText(term.help)).toBeInTheDocument();
      }

      // If formula exists, it should be displayed
      if (term.formula) {
        expect(screen.getByText(term.formula)).toBeInTheDocument();
      }
    }
  });

  it("provides copy buttons for each term", async () => {
    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    const termKeys = Object.keys(TERMS);

    // Each term should have 2 copy buttons (friendly + technical)
    const copyFriendlyButtons = screen.getAllByRole("button", {
      name: /copy friendly/i,
    });
    const copyTechnicalButtons = screen.getAllByRole("button", {
      name: /copy technical/i,
    });

    expect(copyFriendlyButtons).toHaveLength(termKeys.length);
    expect(copyTechnicalButtons).toHaveLength(termKeys.length);
  });

  it("shows correct term count in badge", async () => {
    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    const termKeys = Object.keys(TERMS);
    const expectedCount = termKeys.length;

    // Find the badge showing term count
    const countText = expectedCount === 1 ? "1 term" : `${expectedCount} terms`;
    expect(screen.getByText(countText)).toBeInTheDocument();
  });

  it("maintains term order and structure", async () => {
    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    const termKeys = Object.keys(TERMS);

    // Verify terms are rendered in a structured way
    // Each term should be in its own container with proper hierarchy
    for (const key of termKeys) {
      const term = TERMS[key];
      const labelElement = screen.getByText(term.label);

      // Label should be in a container with the technical term
      const container = labelElement.closest('[id^="term-"]');
      expect(container).toBeInTheDocument();

      if (container) {
        // Technical term should be in the same container
        const techInContainer = within(container as HTMLElement).getByText(
          new RegExp(`\\(${term.tech}\\)`, "i")
        );
        expect(techInContainer).toBeInTheDocument();
      }
    }
  });
});

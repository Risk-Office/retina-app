import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders,
  mockClipboard,
} from "@/polymet/data/test-helpers";
import { GlossaryModal } from "@/polymet/components/glossary-modal";

// Mock TERMS
vi.mock("@/polymet/data/terms", () => ({
  TERMS: {
    raroc: {
      tech: "RAROC",
      label: "Return per risk capital",
      short: "RAROC",
      help: "Value per unit of capital at risk.",
      formula: "EV ÷ Capital at risk",
    },
    ev: {
      tech: "EV",
      label: "Expected profit",
      short: "EV",
      help: "Average outcome across all scenarios.",
      formula: "Σ(probability × outcome)",
    },
    var95: {
      tech: "VaR 95%",
      label: "Risk capital (95%)",
      short: "VaR95",
      help: "95th percentile worst-case loss.",
      formula: "Percentile(outcomes, 0.05)",
    },
    econCap: {
      tech: "Economic Capital",
      label: "Capital at risk",
      short: "EconCap",
      help: "Capital needed to cover unexpected losses.",
      formula: "VaR95 - EV",
    },
  },
  getLabel: (key: string, options?: { plain?: boolean }) => {
    const terms: any = {
      raroc: options?.plain ? "Return per risk capital" : "RAROC",
      ev: options?.plain ? "Expected profit" : "EV",
      var95: options?.plain ? "Risk capital (95%)" : "VaR 95%",
      econCap: options?.plain ? "Capital at risk" : "Economic Capital",
    };
    return terms[key] || key;
  },
  getHelp: (key: string) => {
    const help: any = {
      raroc: "Value per unit of capital at risk.",
      ev: "Average outcome across all scenarios.",
      var95: "95th percentile worst-case loss.",
      econCap: "Capital needed to cover unexpected losses.",
    };
    return help[key] || "";
  },
  getCsvHeader: (key: string) => {
    const headers: any = {
      raroc: "RAROC",
      ev: "EV",
      var95: "VaR95",
      econCap: "EconomicCapital",
    };
    return headers[key] || key;
  },
}));

describe("Glossary Search and Copy", () => {
  let clipboardMock: ReturnType<typeof mockClipboard>;

  beforeEach(() => {
    localStorage.clear();
    clipboardMock = mockClipboard();
    vi.clearAllMocks();
  });

  it("renders all terms when no search filter is applied", async () => {
    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Return per risk capital")).toBeInTheDocument();
    });

    expect(screen.getByText("Expected profit")).toBeInTheDocument();
    expect(screen.getByText(/Risk capital \(95%\)/i)).toBeInTheDocument();
    expect(screen.getByText("Capital at risk")).toBeInTheDocument();
  });

  it('filters terms when searching for "risk capital"', async () => {
    const user = userEvent.setup();

    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    // Find search input
    const searchInput = await screen.findByPlaceholderText(/search terms/i);

    // Type search query
    await user.type(searchInput, "risk capital");

    // Should show RAROC entry with label "Return per risk capital"
    await waitFor(() => {
      expect(screen.getByText("Return per risk capital")).toBeInTheDocument();
    });

    // Should also show the technical term
    expect(screen.getByText("(RAROC)")).toBeInTheDocument();

    // Should show VaR95 entry with "Risk capital (95%)"
    expect(screen.getByText(/Risk capital \(95%\)/i)).toBeInTheDocument();

    // Should show econCap entry with "Capital at risk"
    expect(screen.getByText("Capital at risk")).toBeInTheDocument();

    // Should NOT show "Expected profit" (EV) as it doesn't match
    expect(screen.queryByText("Expected profit")).not.toBeInTheDocument();
  });

  it('copies technical term to clipboard when clicking "Copy technical"', async () => {
    const user = userEvent.setup();

    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    // Wait for glossary to render
    await waitFor(() => {
      expect(screen.getByText("Return per risk capital")).toBeInTheDocument();
    });

    // Find all "Copy technical" buttons
    const copyButtons = screen.getAllByRole("button", {
      name: /copy technical/i,
    });

    // Click the first one (RAROC)
    await user.click(copyButtons[0]);

    // Verify clipboard.writeText was called with "RAROC"
    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith("RAROC");
    });

    // Button should show "Copied!" feedback
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it('copies friendly term to clipboard when clicking "Copy friendly"', async () => {
    const user = userEvent.setup();

    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    // Wait for glossary to render
    await waitFor(() => {
      expect(screen.getByText("Return per risk capital")).toBeInTheDocument();
    });

    // Find all "Copy friendly" buttons
    const copyButtons = screen.getAllByRole("button", {
      name: /copy friendly/i,
    });

    // Click the first one (RAROC)
    await user.click(copyButtons[0]);

    // Verify clipboard.writeText was called with friendly label
    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith(
        "Return per risk capital"
      );
    });
  });

  it("shows term count badge that updates with search", async () => {
    const user = userEvent.setup();

    renderWithProviders(<GlossaryModal open={true} onOpenChange={() => {}} />);

    // Initially shows all 4 terms
    await waitFor(() => {
      expect(screen.getByText("4 terms")).toBeInTheDocument();
    });

    // Search for "risk capital"
    const searchInput = await screen.findByPlaceholderText(/search terms/i);
    await user.type(searchInput, "risk capital");

    // Should show 3 terms (raroc, var95, econCap)
    await waitFor(() => {
      expect(screen.getByText("3 terms")).toBeInTheDocument();
    });
  });
});

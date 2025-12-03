import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/polymet/data/test-helpers";
import { Friendly } from "@/polymet/components/friendly-term";

describe("Tooltip Content Sanity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows tooltip with friendly label, technical term, help text, and formula on hover", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Friendly term="raroc" />);

    // Find the element with info icon (the trigger)
    const trigger = screen.getByRole("button", { name: /more information/i });

    // Hover over the trigger
    await user.hover(trigger);

    // Wait for tooltip to appear
    await waitFor(() => {
      // Should show big label "Return per risk capital"
      expect(screen.getByText("Return per risk capital")).toBeInTheDocument();
    });

    // Should show small technical term "(RAROC)"
    expect(screen.getByText(/\(RAROC\)/i)).toBeInTheDocument();

    // Should show help text
    expect(
      screen.getByText(/Value per unit of capital at risk/i)
    ).toBeInTheDocument();

    // Should show formula
    expect(screen.getByText(/EV ÷ Capital at risk/i)).toBeInTheDocument();
  });

  it("shows tooltip for EV term with correct content", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Friendly term="ev" />);

    const trigger = screen.getByRole("button", { name: /more information/i });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText("Expected profit")).toBeInTheDocument();
    });

    expect(screen.getByText(/\(EV\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Average outcome across all scenarios/i)
    ).toBeInTheDocument();
  });

  it("shows tooltip for var95 term with correct content", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Friendly term="var95" />);

    const trigger = screen.getByRole("button", { name: /more information/i });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText(/Risk capital/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/VaR 95%/i)).toBeInTheDocument();
    expect(screen.getByText(/95th percentile/i)).toBeInTheDocument();
  });

  it("tooltip contains formula section when formula exists", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Friendly term="raroc" />);

    const trigger = screen.getByRole("button", { name: /more information/i });
    await user.hover(trigger);

    await waitFor(() => {
      // Look for formula label or the formula itself
      const formulaText = screen.getByText(/EV ÷ Capital at risk/i);
      expect(formulaText).toBeInTheDocument();
    });
  });

  it("tooltip respects plain language setting", async () => {
    const user = userEvent.setup();

    // Render with plain language ON
    renderWithProviders(
      <Friendly term="raroc" />,

      { plainLanguage: true }
    );

    const trigger = screen.getByRole("button", { name: /more information/i });
    await user.hover(trigger);

    await waitFor(() => {
      // Should show friendly label
      expect(screen.getByText("Return per risk capital")).toBeInTheDocument();
    });
  });

  it("tooltip closes when mouse leaves", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Friendly term="raroc" />);

    const trigger = screen.getByRole("button", { name: /more information/i });

    // Hover to open
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText("Return per risk capital")).toBeInTheDocument();
    });

    // Unhover to close
    await user.unhover(trigger);

    // Tooltip should disappear
    await waitFor(() => {
      expect(
        screen.queryByText("Return per risk capital")
      ).not.toBeInTheDocument();
    });
  });

  it("displays info icon next to term label", () => {
    renderWithProviders(<Friendly term="raroc" />);

    // Should have the label visible
    expect(screen.getByText(/Return per risk capital/i)).toBeInTheDocument();

    // Should have info icon button
    const infoButton = screen.getByRole("button", {
      name: /more information/i,
    });
    expect(infoButton).toBeInTheDocument();
  });

  it("tooltip has proper accessibility attributes", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Friendly term="raroc" />);

    const trigger = screen.getByRole("button", { name: /more information/i });

    // Should have proper ARIA attributes
    expect(trigger).toHaveAttribute("aria-label");

    await user.hover(trigger);

    // Tooltip content should be accessible
    await waitFor(() => {
      const tooltipContent = screen.getByText("Return per risk capital");
      expect(tooltipContent).toBeInTheDocument();
    });
  });

  it("handles terms without formulas gracefully", async () => {
    const user = userEvent.setup();

    // Some terms might not have formulas
    renderWithProviders(<Friendly term="ev" />);

    const trigger = screen.getByRole("button", { name: /more information/i });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText("Expected profit")).toBeInTheDocument();
    });

    // Should still show help text even without formula
    expect(
      screen.getByText(/Average outcome across all scenarios/i)
    ).toBeInTheDocument();
  });
});

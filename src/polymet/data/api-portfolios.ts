/**
 * # Portfolio REST API
 *
 * Standard REST endpoints for portfolio CRUD operations with:
 * - Referential integrity (delete → unlink decisions, not cascade)
 * - Audit logging for all create/update/delete actions
 * - Tenant scoping
 */

import {
  loadPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addDecisionToPortfolio,
  removeDecisionFromPortfolio,
  type DecisionPortfolio,
  type CreatePortfolioInput,
  type UpdatePortfolioInput,
} from "@/polymet/data/decision-portfolios";

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * GET /api/portfolios
 * List all portfolios for a tenant
 */
export async function getPortfolios(
  tenantId: string
): Promise<APIResponse<DecisionPortfolio[]>> {
  try {
    const portfolios = loadPortfolios(tenantId);
    return {
      success: true,
      data: portfolios,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load portfolios",
    };
  }
}

/**
 * GET /api/portfolios/:id
 * Get a single portfolio by ID
 */
export async function getPortfolio(
  tenantId: string,
  portfolioId: string
): Promise<APIResponse<DecisionPortfolio>> {
  try {
    const portfolios = loadPortfolios(tenantId);
    const portfolio = portfolios.find((p) => p.id === portfolioId);

    if (!portfolio) {
      return {
        success: false,
        error: "Portfolio not found",
      };
    }

    return {
      success: true,
      data: portfolio,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load portfolio",
    };
  }
}

/**
 * POST /api/portfolios
 * Create a new portfolio
 */
export async function postPortfolio(
  tenantId: string,
  input: CreatePortfolioInput,
  actor: string = "System"
): Promise<APIResponse<DecisionPortfolio>> {
  try {
    const portfolio = createPortfolio(tenantId, input);

    // Log audit event
    logAuditEvent(tenantId, "portfolio.created", {
      portfolioId: portfolio.id,
      portfolioName: portfolio.portfolio_name,
      actor,
    });

    return {
      success: true,
      data: portfolio,
      message: "Portfolio created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create portfolio",
    };
  }
}

/**
 * PUT /api/portfolios/:id
 * Update an existing portfolio
 */
export async function putPortfolio(
  tenantId: string,
  portfolioId: string,
  input: UpdatePortfolioInput,
  actor: string = "System"
): Promise<APIResponse<DecisionPortfolio>> {
  try {
    const portfolio = updatePortfolio(tenantId, portfolioId, input);

    if (!portfolio) {
      return {
        success: false,
        error: "Portfolio not found",
      };
    }

    // Log audit event
    logAuditEvent(tenantId, "portfolio.updated", {
      portfolioId: portfolio.id,
      portfolioName: portfolio.portfolio_name,
      changes: input,
      actor,
    });

    return {
      success: true,
      data: portfolio,
      message: "Portfolio updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update portfolio",
    };
  }
}

/**
 * DELETE /api/portfolios/:id
 * Delete a portfolio (unlinks decisions, does not cascade delete)
 */
export async function deletePortfolioAPI(
  tenantId: string,
  portfolioId: string,
  actor: string = "System"
): Promise<APIResponse<void>> {
  try {
    // Get portfolio info before deletion for audit log
    const portfolios = loadPortfolios(tenantId);
    const portfolio = portfolios.find((p) => p.id === portfolioId);

    if (!portfolio) {
      return {
        success: false,
        error: "Portfolio not found",
      };
    }

    const portfolioName = portfolio.portfolio_name;
    const decisionCount = portfolio.decision_ids.length;

    // Delete portfolio (this unlinks decisions but doesn't delete them)
    const success = deletePortfolio(tenantId, portfolioId);

    if (!success) {
      return {
        success: false,
        error: "Failed to delete portfolio",
      };
    }

    // Log audit event
    logAuditEvent(tenantId, "portfolio.deleted", {
      portfolioId,
      portfolioName,
      decisionCount,
      actor,
    });

    return {
      success: true,
      message: `Portfolio deleted successfully. ${decisionCount} decision(s) unlinked.`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete portfolio",
    };
  }
}

/**
 * POST /api/portfolios/:id/decisions
 * Add a decision to a portfolio
 */
export async function addDecisionToPortfolioAPI(
  tenantId: string,
  portfolioId: string,
  decisionId: string,
  actor: string = "System"
): Promise<APIResponse<DecisionPortfolio>> {
  try {
    const portfolio = addDecisionToPortfolio(tenantId, portfolioId, decisionId);

    if (!portfolio) {
      return {
        success: false,
        error: "Portfolio not found or decision already in portfolio",
      };
    }

    // Log audit event
    logAuditEvent(tenantId, "portfolio.decision_added", {
      portfolioId,
      portfolioName: portfolio.portfolio_name,
      decisionId,
      actor,
    });

    return {
      success: true,
      data: portfolio,
      message: "Decision added to portfolio successfully",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add decision to portfolio",
    };
  }
}

/**
 * DELETE /api/portfolios/:id/decisions/:decisionId
 * Remove a decision from a portfolio
 */
export async function removeDecisionFromPortfolioAPI(
  tenantId: string,
  portfolioId: string,
  decisionId: string,
  actor: string = "System"
): Promise<APIResponse<DecisionPortfolio>> {
  try {
    const portfolios = loadPortfolios(tenantId);
    const portfolio = portfolios.find((p) => p.id === portfolioId);

    if (!portfolio) {
      return {
        success: false,
        error: "Portfolio not found",
      };
    }

    const updatedPortfolio = removeDecisionFromPortfolio(
      tenantId,
      portfolioId,
      decisionId
    );

    if (!updatedPortfolio) {
      return {
        success: false,
        error: "Failed to remove decision from portfolio",
      };
    }

    // Log audit event
    logAuditEvent(tenantId, "portfolio.decision_removed", {
      portfolioId,
      portfolioName: portfolio.portfolio_name,
      decisionId,
      actor,
    });

    return {
      success: true,
      data: updatedPortfolio,
      message: "Decision removed from portfolio successfully",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove decision from portfolio",
    };
  }
}

/**
 * Helper function to log audit events
 * This integrates with the retina-store audit system
 */
function logAuditEvent(
  tenantId: string,
  eventType: string,
  payload: Record<string, any>
) {
  // Get audit events from localStorage
  const storageKey = "retina:audit";
  const stored = localStorage.getItem(storageKey);
  const auditEvents = stored ? JSON.parse(stored) : [];

  // Create new audit event
  const auditEvent = {
    ts: Date.now(),
    tenantId,
    eventType,
    actor: payload.actor || "System",
    payload,
  };

  // Add to audit log
  auditEvents.push(auditEvent);

  // Save back to localStorage
  localStorage.setItem(storageKey, JSON.stringify(auditEvents));

  console.log(`[Audit] ${eventType}:`, payload);
}

/**
 * Mock fetch wrapper for demonstration
 * In production, this would make actual HTTP requests
 */
export async function fetchPortfolios(tenantId: string) {
  return getPortfolios(tenantId);
}

export async function fetchPortfolio(tenantId: string, portfolioId: string) {
  return getPortfolio(tenantId, portfolioId);
}

export async function createPortfolioAPI(
  tenantId: string,
  input: CreatePortfolioInput,
  actor?: string
) {
  return postPortfolio(tenantId, input, actor);
}

export async function updatePortfolioAPI(
  tenantId: string,
  portfolioId: string,
  input: UpdatePortfolioInput,
  actor?: string
) {
  return putPortfolio(tenantId, portfolioId, input, actor);
}

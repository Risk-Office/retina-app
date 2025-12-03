/**
 * # Decisions REST API
 *
 * REST API endpoints for decision CRUD operations with tenant scoping and RBAC.
 *
 * ## Endpoints
 * - GET    /api/decisions              - List decisions (filtered by tenant)
 * - GET    /api/decisions/:id          - Get decision by ID
 * - POST   /api/decisions              - Create new decision
 * - PUT    /api/decisions/:id          - Update decision
 * - DELETE /api/decisions/:id          - Delete decision
 * - POST   /api/decisions/:id/close    - Close decision
 * - GET    /api/decisions/:id/snapshots - Get snapshots for decision
 *
 * ## Authentication & Authorization
 * - All endpoints require authentication
 * - Tenant isolation enforced via x-tenant-id header
 * - RBAC: admin, analyst, viewer roles
 *
 * ## Request/Response Format
 * - Content-Type: application/json
 * - Tenant header: x-tenant-id
 * - Auth header: Authorization: Bearer <token>
 */

import type { DecisionSchemaType } from "@/polymet/data/decision-schema";
import { validateDecision } from "@/polymet/data/decision-schema";

// ============================================================================
// Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ListDecisionsParams {
  status?: "draft" | "analyzing" | "deciding" | "closed";
  portfolio_id?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "closedAt" | "title";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface CloseDecisionRequest {
  chosenOptionId: string;
  closedBy: string;
  basisAtClose?: "RAROC" | "CE";
  horizonMonthsAtClose?: number;
  achievedSpearmanAtClose?: number;
  bayesAtClose?: {
    varKey: string;
    muN: number;
    sigmaN: number;
    applied: boolean;
  };
  copulaFroErrAtClose?: number;
  criticalOpenAtClose?: number;
  lockedAssumptions?: Array<{
    id: string;
    scope: "decision" | "option" | "variable";
    statement: string;
    status: "open" | "validated" | "invalidated";
    critical: boolean;
    lockedAt: string;
  }>;
  topSensitiveFactors?: Array<{
    paramName: string;
    impact: number;
  }>;
}

// ============================================================================
// API Client
// ============================================================================

export class DecisionsAPI {
  private baseURL: string;
  private tenantId: string;
  private authToken?: string;

  constructor(baseURL: string = "/api", tenantId: string, authToken?: string) {
    this.baseURL = baseURL;
    this.tenantId = tenantId;
    this.authToken = authToken;
  }

  /**
   * Get headers with tenant and auth
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "x-tenant-id": this.tenantId,
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.error?.code || "API_ERROR",
          message: data.error?.message || "An error occurred",
          details: data.error?.details,
        },
      };
    }

    return data;
  }

  /**
   * List decisions
   */
  async listDecisions(
    params?: ListDecisionsParams
  ): Promise<APIResponse<DecisionSchemaType[]>> {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append("status", params.status);
    if (params?.portfolio_id)
      queryParams.append("portfolio_id", params.portfolio_id);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params?.search) queryParams.append("search", params.search);

    const url = `${this.baseURL}/decisions?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<DecisionSchemaType[]>(response);
  }

  /**
   * Get decision by ID
   */
  async getDecision(id: string): Promise<APIResponse<DecisionSchemaType>> {
    const url = `${this.baseURL}/decisions/${id}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<DecisionSchemaType>(response);
  }

  /**
   * Create decision
   */
  async createDecision(
    decision: Omit<DecisionSchemaType, "id" | "createdAt">
  ): Promise<APIResponse<DecisionSchemaType>> {
    // Validate decision
    const validation = validateDecision({
      ...decision,
      id: "temp-id",
      createdAt: Date.now(),
    });

    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Decision validation failed",
          details: validation.errors,
        },
      };
    }

    const url = `${this.baseURL}/decisions`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(decision),
    });

    return this.handleResponse<DecisionSchemaType>(response);
  }

  /**
   * Update decision
   */
  async updateDecision(
    id: string,
    updates: Partial<DecisionSchemaType>
  ): Promise<APIResponse<DecisionSchemaType>> {
    const url = `${this.baseURL}/decisions/${id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    return this.handleResponse<DecisionSchemaType>(response);
  }

  /**
   * Delete decision
   */
  async deleteDecision(id: string): Promise<APIResponse<void>> {
    const url = `${this.baseURL}/decisions/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  /**
   * Close decision
   */
  async closeDecision(
    id: string,
    request: CloseDecisionRequest
  ): Promise<APIResponse<DecisionSchemaType>> {
    const url = `${this.baseURL}/decisions/${id}/close`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse<DecisionSchemaType>(response);
  }

  /**
   * Get snapshots for decision
   */
  async getDecisionSnapshots(id: string): Promise<APIResponse<any[]>> {
    const url = `${this.baseURL}/decisions/${id}/snapshots`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }
}

// ============================================================================
// Mock Server Implementation (for development)
// ============================================================================

/**
 * Mock server for development/testing
 * In production, replace with actual backend implementation
 */
export class MockDecisionsServer {
  private decisions: Map<string, DecisionSchemaType> = new Map();

  /**
   * Handle list decisions request
   */
  async handleListDecisions(
    tenantId: string,
    params?: ListDecisionsParams
  ): Promise<APIResponse<DecisionSchemaType[]>> {
    // Filter by tenant
    let decisions = Array.from(this.decisions.values()).filter(
      (d) => d.tenantId === tenantId
    );

    // Filter by status
    if (params?.status) {
      decisions = decisions.filter((d) => d.status === params.status);
    }

    // Filter by portfolio
    if (params?.portfolio_id) {
      decisions = decisions.filter(
        (d) => d.portfolio_id === params.portfolio_id
      );
    }

    // Search
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      decisions = decisions.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sortBy = params?.sortBy || "createdAt";
    const sortOrder = params?.sortOrder || "desc";

    decisions.sort((a, b) => {
      let aVal: any = a[sortBy as keyof DecisionSchemaType];
      let bVal: any = b[sortBy as keyof DecisionSchemaType];

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedDecisions = decisions.slice(start, end);

    return {
      success: true,
      data: paginatedDecisions,
      meta: {
        total: decisions.length,
        page,
        pageSize,
      },
    };
  }

  /**
   * Handle get decision request
   */
  async handleGetDecision(
    tenantId: string,
    id: string
  ): Promise<APIResponse<DecisionSchemaType>> {
    const decision = this.decisions.get(id);

    if (!decision) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Decision ${id} not found`,
        },
      };
    }

    if (decision.tenantId !== tenantId) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      };
    }

    return {
      success: true,
      data: decision,
    };
  }

  /**
   * Handle create decision request
   */
  async handleCreateDecision(
    tenantId: string,
    decision: Omit<DecisionSchemaType, "id" | "createdAt">
  ): Promise<APIResponse<DecisionSchemaType>> {
    const id = `dec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();

    const newDecision: DecisionSchemaType = {
      ...decision,
      id,
      tenantId,
      createdAt,
    };

    // Validate
    const validation = validateDecision(newDecision);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Decision validation failed",
          details: validation.errors,
        },
      };
    }

    this.decisions.set(id, newDecision);

    return {
      success: true,
      data: newDecision,
    };
  }

  /**
   * Handle update decision request
   */
  async handleUpdateDecision(
    tenantId: string,
    id: string,
    updates: Partial<DecisionSchemaType>
  ): Promise<APIResponse<DecisionSchemaType>> {
    const decision = this.decisions.get(id);

    if (!decision) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Decision ${id} not found`,
        },
      };
    }

    if (decision.tenantId !== tenantId) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      };
    }

    const updatedDecision: DecisionSchemaType = {
      ...decision,
      ...updates,
      id: decision.id, // Prevent ID change
      tenantId: decision.tenantId, // Prevent tenant change
      createdAt: decision.createdAt, // Prevent createdAt change
    };

    // Validate
    const validation = validateDecision(updatedDecision);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Decision validation failed",
          details: validation.errors,
        },
      };
    }

    this.decisions.set(id, updatedDecision);

    return {
      success: true,
      data: updatedDecision,
    };
  }

  /**
   * Handle delete decision request
   */
  async handleDeleteDecision(
    tenantId: string,
    id: string
  ): Promise<APIResponse<void>> {
    const decision = this.decisions.get(id);

    if (!decision) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Decision ${id} not found`,
        },
      };
    }

    if (decision.tenantId !== tenantId) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      };
    }

    this.decisions.delete(id);

    return {
      success: true,
    };
  }

  /**
   * Handle close decision request
   */
  async handleCloseDecision(
    tenantId: string,
    id: string,
    request: CloseDecisionRequest
  ): Promise<APIResponse<DecisionSchemaType>> {
    const decision = this.decisions.get(id);

    if (!decision) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Decision ${id} not found`,
        },
      };
    }

    if (decision.tenantId !== tenantId) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      };
    }

    if (decision.status === "closed") {
      return {
        success: false,
        error: {
          code: "ALREADY_CLOSED",
          message: "Decision is already closed",
        },
      };
    }

    const closedDecision: DecisionSchemaType = {
      ...decision,
      status: "closed",
      chosenOptionId: request.chosenOptionId,
      closedAt: Date.now(),
      closedBy: request.closedBy,
      basisAtClose: request.basisAtClose,
      horizonMonthsAtClose: request.horizonMonthsAtClose,
      achievedSpearmanAtClose: request.achievedSpearmanAtClose,
      bayesAtClose: request.bayesAtClose,
      copulaFroErrAtClose: request.copulaFroErrAtClose,
      criticalOpenAtClose: request.criticalOpenAtClose,
      lockedAssumptions: request.lockedAssumptions,
      topSensitiveFactors: request.topSensitiveFactors,
    };

    // Validate
    const validation = validateDecision(closedDecision);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Decision validation failed",
          details: validation.errors,
        },
      };
    }

    this.decisions.set(id, closedDecision);

    return {
      success: true,
      data: closedDecision,
    };
  }
}

// ============================================================================
// Singleton instance for mock server
// ============================================================================

export const mockDecisionsServer = new MockDecisionsServer();

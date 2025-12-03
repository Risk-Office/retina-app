/**
 * # Simulation Snapshots REST API
 *
 * REST API endpoints for simulation snapshot CRUD operations.
 *
 * ## Endpoints
 * - GET    /api/snapshots              - List snapshots (filtered by tenant/decision)
 * - GET    /api/snapshots/:runId       - Get snapshot by run ID
 * - POST   /api/snapshots              - Create new snapshot
 * - DELETE /api/snapshots/:runId       - Delete snapshot
 * - GET    /api/snapshots/decision/:decisionId/latest - Get latest snapshot for decision
 */

import type { SimulationSnapshotSchemaType } from "@/polymet/data/simulation-snapshot-schema";
import {
  validateSimulationSnapshot,
  generateRunFingerprint,
} from "@/polymet/data/simulation-snapshot-schema";
import type { APIResponse } from "@/polymet/data/api-decisions";

export interface ListSnapshotsParams {
  decisionId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "timestamp";
  sortOrder?: "asc" | "desc";
}

export class SnapshotsAPI {
  private baseURL: string;
  private tenantId: string;
  private authToken?: string;

  constructor(baseURL: string = "/api", tenantId: string, authToken?: string) {
    this.baseURL = baseURL;
    this.tenantId = tenantId;
    this.authToken = authToken;
  }

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

  async listSnapshots(
    params?: ListSnapshotsParams
  ): Promise<APIResponse<SimulationSnapshotSchemaType[]>> {
    const queryParams = new URLSearchParams();
    if (params?.decisionId) queryParams.append("decisionId", params.decisionId);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = `${this.baseURL}/snapshots?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return this.handleResponse<SimulationSnapshotSchemaType[]>(response);
  }

  async getSnapshot(
    runId: string
  ): Promise<APIResponse<SimulationSnapshotSchemaType>> {
    const url = `${this.baseURL}/snapshots/${runId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return this.handleResponse<SimulationSnapshotSchemaType>(response);
  }

  async createSnapshot(
    snapshot: Omit<SimulationSnapshotSchemaType, "runId" | "timestamp">
  ): Promise<APIResponse<SimulationSnapshotSchemaType>> {
    const validation = validateSimulationSnapshot({
      ...snapshot,
      runId: "temp-id",
      timestamp: Date.now(),
    });

    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Snapshot validation failed",
          details: validation.errors,
        },
      };
    }

    const url = `${this.baseURL}/snapshots`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(snapshot),
    });
    return this.handleResponse<SimulationSnapshotSchemaType>(response);
  }

  async deleteSnapshot(runId: string): Promise<APIResponse<void>> {
    const url = `${this.baseURL}/snapshots/${runId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return this.handleResponse<void>(response);
  }

  async getLatestSnapshot(
    decisionId: string
  ): Promise<APIResponse<SimulationSnapshotSchemaType>> {
    const url = `${this.baseURL}/snapshots/decision/${decisionId}/latest`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return this.handleResponse<SimulationSnapshotSchemaType>(response);
  }
}

export class MockSnapshotsServer {
  private snapshots: Map<string, SimulationSnapshotSchemaType> = new Map();

  async handleListSnapshots(
    tenantId: string,
    params?: ListSnapshotsParams
  ): Promise<APIResponse<SimulationSnapshotSchemaType[]>> {
    let snapshots = Array.from(this.snapshots.values()).filter(
      (s) => s.tenantId === tenantId
    );

    if (params?.decisionId) {
      snapshots = snapshots.filter((s) => s.decisionId === params.decisionId);
    }

    const sortOrder = params?.sortOrder || "desc";
    snapshots.sort((a, b) => {
      return sortOrder === "asc"
        ? a.timestamp - b.timestamp
        : b.timestamp - a.timestamp;
    });

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedSnapshots = snapshots.slice(start, end);

    return {
      success: true,
      data: paginatedSnapshots,
      meta: {
        total: snapshots.length,
        page,
        pageSize,
      },
    };
  }

  async handleGetSnapshot(
    tenantId: string,
    runId: string
  ): Promise<APIResponse<SimulationSnapshotSchemaType>> {
    const snapshot = this.snapshots.get(runId);
    if (!snapshot) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Snapshot ${runId} not found`,
        },
      };
    }
    if (snapshot.tenantId !== tenantId) {
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
      data: snapshot,
    };
  }

  async handleCreateSnapshot(
    tenantId: string,
    snapshot: Omit<SimulationSnapshotSchemaType, "runId" | "timestamp">
  ): Promise<APIResponse<SimulationSnapshotSchemaType>> {
    const runId = generateRunFingerprint({
      decisionId: snapshot.decisionId,
      seed: snapshot.seed,
      runs: snapshot.runs,
      scenarioVars: (snapshot as any).scenarioVars,
      utilityParams: (snapshot as any).utilityParams,
      tcorParams: (snapshot as any).tcorParams,
      gameConfig: (snapshot as any).gameConfig,
      dependenceConfig: (snapshot as any).dependenceConfig,
      bayesianOverride: (snapshot as any).bayesianOverride,
      copulaConfig: (snapshot as any).copulaConfig,
    });
    const timestamp = Date.now();

    const newSnapshot: SimulationSnapshotSchemaType = {
      ...snapshot,
      runId,
      tenantId,
      timestamp,
    };

    const validation = validateSimulationSnapshot(newSnapshot);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Snapshot validation failed",
          details: validation.errors,
        },
      };
    }

    this.snapshots.set(runId, newSnapshot);

    return {
      success: true,
      data: newSnapshot,
    };
  }

  async handleDeleteSnapshot(
    tenantId: string,
    runId: string
  ): Promise<APIResponse<void>> {
    const snapshot = this.snapshots.get(runId);
    if (!snapshot) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Snapshot ${runId} not found`,
        },
      };
    }
    if (snapshot.tenantId !== tenantId) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      };
    }
    this.snapshots.delete(runId);
    return {
      success: true,
    };
  }

  async handleGetLatestSnapshot(
    tenantId: string,
    decisionId: string
  ): Promise<APIResponse<SimulationSnapshotSchemaType>> {
    const snapshots = Array.from(this.snapshots.values())
      .filter((s) => s.tenantId === tenantId && s.decisionId === decisionId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (snapshots.length === 0) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `No snapshots found for decision ${decisionId}`,
        },
      };
    }

    return {
      success: true,
      data: snapshots[0],
    };
  }
}

export const mockSnapshotsServer = new MockSnapshotsServer();

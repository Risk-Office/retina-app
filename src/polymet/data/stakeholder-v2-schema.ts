/**
 * Stakeholder v2 Schema
 *
 * Authoritative schema for organizational stakeholders.
 * Supports individuals, teams, and external stakeholders.
 */

export type StakeholderGroup =
  | "Board"
  | "CEO"
  | "CFO & Finance"
  | "CRO / Risk"
  | "COO & Operations"
  | "CIO / CISO (IT)"
  | "CHRO / HR"
  | "Compliance & Legal"
  | "Internal Audit"
  | "BU Leader"
  | "Procurement & Supply Chain"
  | "Product/Project"
  | "External Auditor"
  | "Regulator"
  | "Investor/Shareholder"
  | "Lender/Insurer"
  | "Crisis Team"
  | "Employee"
  | "Other";

export type StakeholderType = "individual" | "team" | "external";

export interface StakeholderV2 {
  id: string; // uuid
  tenantId: string;
  name: string;
  email?: string;
  group: StakeholderGroup;
  type: StakeholderType;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Stakeholder v2 Schema Registry
 */
export const STAKEHOLDER_V2_SCHEMA_VERSION = "2.0.0";

export const STAKEHOLDER_V2_SCHEMA = {
  version: STAKEHOLDER_V2_SCHEMA_VERSION,
  name: "stakeholder_v2",
  description: "Authoritative schema for organizational stakeholders",
  created_at: Date.now(),
};

/**
 * LocalStorage key for stakeholders
 */
export const STAKEHOLDERS_V2_STORAGE_KEY = "retina_stakeholders_v2";

/**
 * Load stakeholders from localStorage
 */
export function loadStakeholdersV2(tenantId: string): StakeholderV2[] {
  try {
    const stored = localStorage.getItem(
      `${STAKEHOLDERS_V2_STORAGE_KEY}_${tenantId}`
    );
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load stakeholders v2:", error);
    return [];
  }
}

/**
 * Save stakeholders to localStorage
 */
export function saveStakeholdersV2(
  tenantId: string,
  stakeholders: StakeholderV2[]
): void {
  try {
    localStorage.setItem(
      `${STAKEHOLDERS_V2_STORAGE_KEY}_${tenantId}`,
      JSON.stringify(stakeholders)
    );
  } catch (error) {
    console.error("Failed to save stakeholders v2:", error);
  }
}

/**
 * Create a new stakeholder
 */
export function createStakeholderV2(
  partial: Partial<StakeholderV2>
): StakeholderV2 {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    tenantId: partial.tenantId || "",
    name: partial.name || "",
    email: partial.email,
    group: partial.group || "Other",
    type: partial.type || "individual",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing stakeholder
 */
export function updateStakeholderV2(
  stakeholder: StakeholderV2,
  updates: Partial<StakeholderV2>
): StakeholderV2 {
  return {
    ...stakeholder,
    ...updates,
    id: stakeholder.id, // Prevent ID change
    tenantId: stakeholder.tenantId, // Prevent tenantId change
    createdAt: stakeholder.createdAt, // Prevent createdAt change
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get stakeholder by ID
 */
export function getStakeholderV2ById(
  tenantId: string,
  stakeholderId: string
): StakeholderV2 | undefined {
  const stakeholders = loadStakeholdersV2(tenantId);
  return stakeholders.find((s) => s.id === stakeholderId);
}

/**
 * Delete stakeholder
 */
export function deleteStakeholderV2(
  tenantId: string,
  stakeholderId: string
): void {
  const stakeholders = loadStakeholdersV2(tenantId);
  const filtered = stakeholders.filter((s) => s.id !== stakeholderId);
  saveStakeholdersV2(tenantId, filtered);
}

/**
 * Get stakeholders by group
 */
export function getStakeholdersByGroup(
  tenantId: string,
  group: StakeholderGroup
): StakeholderV2[] {
  const stakeholders = loadStakeholdersV2(tenantId);
  return stakeholders.filter((s) => s.group === group);
}

/**
 * Get stakeholders by type
 */
export function getStakeholdersByType(
  tenantId: string,
  type: StakeholderType
): StakeholderV2[] {
  const stakeholders = loadStakeholdersV2(tenantId);
  return stakeholders.filter((s) => s.type === type);
}

/**
 * Validate stakeholder
 */
export function validateStakeholderV2(stakeholder: Partial<StakeholderV2>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!stakeholder.name || stakeholder.name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!stakeholder.group) {
    errors.push("Group is required");
  }

  if (!stakeholder.type) {
    errors.push("Type is required");
  }

  if (stakeholder.email && !isValidEmail(stakeholder.email)) {
    errors.push("Invalid email format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Email validation helper
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Seed default stakeholders for a tenant
 */
export function seedDefaultStakeholders(tenantId: string): void {
  const existing = loadStakeholdersV2(tenantId);
  if (existing.length > 0) {
    return; // Already seeded
  }

  const defaults: Partial<StakeholderV2>[] = [
    { tenantId, name: "Board of Directors", group: "Board", type: "team" },
    {
      tenantId,
      name: "Chief Executive Officer",
      group: "CEO",
      type: "individual",
    },
    {
      tenantId,
      name: "Chief Financial Officer",
      group: "CFO & Finance",
      type: "individual",
    },
    {
      tenantId,
      name: "Chief Risk Officer",
      group: "CRO / Risk",
      type: "individual",
    },
    {
      tenantId,
      name: "Chief Operating Officer",
      group: "COO & Operations",
      type: "individual",
    },
    {
      tenantId,
      name: "Chief Information Officer",
      group: "CIO / CISO (IT)",
      type: "individual",
    },
    {
      tenantId,
      name: "Chief Human Resources Officer",
      group: "CHRO / HR",
      type: "individual",
    },
    {
      tenantId,
      name: "Compliance Team",
      group: "Compliance & Legal",
      type: "team",
    },
    { tenantId, name: "Internal Audit", group: "Internal Audit", type: "team" },
  ];

  const stakeholders = defaults.map((d) => createStakeholderV2(d));
  saveStakeholdersV2(tenantId, stakeholders);
}

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/polymet/data/tenant-context";
import type { StakeholderV2 } from "@/polymet/data/stakeholder-v2-schema";

/**
 * Custom hook for managing stakeholders v2
 */
export function useStakeholdersV2() {
  const { tenantId } = useTenant();
  const [stakeholders, setStakeholders] = useState<StakeholderV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load stakeholders from localStorage (simulating API)
  const loadStakeholders = useCallback(() => {
    try {
      setLoading(true);
      const key = `retina_stakeholders_v2_${tenantId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStakeholders(parsed);
      } else {
        // Seed with default stakeholders
        const defaultStakeholders: StakeholderV2[] = [
          {
            id: "stakeholder-1",
            tenantId,
            name: "Board of Directors",
            group: "Board",
            type: "team",
            email: "board@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "stakeholder-2",
            tenantId,
            name: "CEO",
            group: "C-Suite",
            type: "individual",
            email: "ceo@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "stakeholder-3",
            tenantId,
            name: "CFO",
            group: "C-Suite",
            type: "individual",
            email: "cfo@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "stakeholder-4",
            tenantId,
            name: "COO",
            group: "C-Suite",
            type: "individual",
            email: "coo@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "stakeholder-5",
            tenantId,
            name: "Product Team",
            group: "Product",
            type: "team",
            email: "product@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "stakeholder-6",
            tenantId,
            name: "Engineering Team",
            group: "Engineering",
            type: "team",
            email: "engineering@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        localStorage.setItem(key, JSON.stringify(defaultStakeholders));
        setStakeholders(defaultStakeholders);
      }
      setError(null);
    } catch (err) {
      setError("Failed to load stakeholders");
      console.error("Error loading stakeholders:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Save stakeholders to localStorage
  const saveStakeholders = useCallback(
    (updatedStakeholders: StakeholderV2[]) => {
      try {
        const key = `retina_stakeholders_v2_${tenantId}`;
        localStorage.setItem(key, JSON.stringify(updatedStakeholders));
        setStakeholders(updatedStakeholders);
      } catch (err) {
        console.error("Error saving stakeholders:", err);
        throw new Error("Failed to save stakeholders");
      }
    },
    [tenantId]
  );

  // Create a new stakeholder
  const createStakeholder = useCallback(
    async (
      stakeholder: Omit<StakeholderV2, "id" | "createdAt" | "updatedAt">
    ): Promise<StakeholderV2> => {
      try {
        const newStakeholder: StakeholderV2 = {
          ...stakeholder,
          id: `stakeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedStakeholders = [...stakeholders, newStakeholder];
        saveStakeholders(updatedStakeholders);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        return newStakeholder;
      } catch (err) {
        console.error("Error creating stakeholder:", err);
        throw new Error("Failed to create stakeholder");
      }
    },
    [stakeholders, saveStakeholders]
  );

  // Update an existing stakeholder
  const updateStakeholder = useCallback(
    async (
      id: string,
      updates: Partial<StakeholderV2>
    ): Promise<StakeholderV2> => {
      try {
        const updatedStakeholders = stakeholders.map((stakeholder) =>
          stakeholder.id === id
            ? {
                ...stakeholder,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : stakeholder
        );
        saveStakeholders(updatedStakeholders);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updatedStakeholder = updatedStakeholders.find((s) => s.id === id);
        if (!updatedStakeholder) throw new Error("Stakeholder not found");

        return updatedStakeholder;
      } catch (err) {
        console.error("Error updating stakeholder:", err);
        throw new Error("Failed to update stakeholder");
      }
    },
    [stakeholders, saveStakeholders]
  );

  // Delete a stakeholder
  const deleteStakeholder = useCallback(
    async (id: string): Promise<void> => {
      try {
        const updatedStakeholders = stakeholders.filter(
          (stakeholder) => stakeholder.id !== id
        );
        saveStakeholders(updatedStakeholders);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.error("Error deleting stakeholder:", err);
        throw new Error("Failed to delete stakeholder");
      }
    },
    [stakeholders, saveStakeholders]
  );

  // Get stakeholders by group
  const getStakeholdersByGroup = useCallback(
    (group: StakeholderV2["group"]) => {
      return stakeholders.filter((stakeholder) => stakeholder.group === group);
    },
    [stakeholders]
  );

  // Search stakeholders
  const searchStakeholders = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return stakeholders.filter(
        (stakeholder) =>
          stakeholder.name.toLowerCase().includes(lowerQuery) ||
          stakeholder.email?.toLowerCase().includes(lowerQuery) ||
          stakeholder.group.toLowerCase().includes(lowerQuery)
      );
    },
    [stakeholders]
  );

  // Load stakeholders on mount or tenant change
  useEffect(() => {
    loadStakeholders();
  }, [loadStakeholders]);

  return {
    stakeholders,
    loading,
    error,
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
    getStakeholdersByGroup,
    searchStakeholders,
    refetch: loadStakeholders,
  };
}

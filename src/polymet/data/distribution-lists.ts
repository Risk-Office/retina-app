/**
 * Distribution Lists for Email Recipients
 * Manage groups of recipients for easy email distribution
 */

export interface Recipient {
  email: string;
  name: string;
  role?: string;
}

export interface DistributionList {
  id: string;
  name: string;
  description: string;
  recipients: Recipient[];
  createdAt: string;
  updatedAt: string;
}

// Storage key prefix
const STORAGE_PREFIX = "retina:distribution-lists";

/**
 * Get all distribution lists for a tenant
 */
export function getDistributionLists(tenantId: string): DistributionList[] {
  const storageKey = `${STORAGE_PREFIX}:${tenantId}`;
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save a distribution list
 */
export function saveDistributionList(
  tenantId: string,
  list: DistributionList
): void {
  const lists = getDistributionLists(tenantId);
  const existingIndex = lists.findIndex((l) => l.id === list.id);

  if (existingIndex >= 0) {
    lists[existingIndex] = { ...list, updatedAt: new Date().toISOString() };
  } else {
    lists.push(list);
  }

  const storageKey = `${STORAGE_PREFIX}:${tenantId}`;
  localStorage.setItem(storageKey, JSON.stringify(lists));
}

/**
 * Delete a distribution list
 */
export function deleteDistributionList(tenantId: string, listId: string): void {
  const lists = getDistributionLists(tenantId);
  const filtered = lists.filter((l) => l.id !== listId);

  const storageKey = `${STORAGE_PREFIX}:${tenantId}`;
  localStorage.setItem(storageKey, JSON.stringify(filtered));
}

/**
 * Get a single distribution list by ID
 */
export function getDistributionList(
  tenantId: string,
  listId: string
): DistributionList | undefined {
  const lists = getDistributionLists(tenantId);
  return lists.find((l) => l.id === listId);
}

/**
 * Create a new distribution list
 */
export function createDistributionList(
  tenantId: string,
  name: string,
  description: string,
  recipients: Recipient[]
): DistributionList {
  const list: DistributionList = {
    id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    recipients,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveDistributionList(tenantId, list);
  return list;
}

/**
 * Add recipient to a distribution list
 */
export function addRecipientToList(
  tenantId: string,
  listId: string,
  recipient: Recipient
): void {
  const list = getDistributionList(tenantId, listId);
  if (!list) return;

  // Check if recipient already exists
  const exists = list.recipients.some((r) => r.email === recipient.email);
  if (exists) return;

  list.recipients.push(recipient);
  saveDistributionList(tenantId, list);
}

/**
 * Remove recipient from a distribution list
 */
export function removeRecipientFromList(
  tenantId: string,
  listId: string,
  email: string
): void {
  const list = getDistributionList(tenantId, listId);
  if (!list) return;

  list.recipients = list.recipients.filter((r) => r.email !== email);
  saveDistributionList(tenantId, list);
}

/**
 * Get all recipients from multiple distribution lists
 */
export function getRecipientsFromLists(
  tenantId: string,
  listIds: string[]
): Recipient[] {
  const allRecipients: Recipient[] = [];
  const seenEmails = new Set<string>();

  listIds.forEach((listId) => {
    const list = getDistributionList(tenantId, listId);
    if (list) {
      list.recipients.forEach((recipient) => {
        if (!seenEmails.has(recipient.email)) {
          allRecipients.push(recipient);
          seenEmails.add(recipient.email);
        }
      });
    }
  });

  return allRecipients;
}

/**
 * Default distribution lists
 */
export const DEFAULT_LISTS: Omit<
  DistributionList,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Board Members",
    description: "All board members and directors",
    recipients: [
      { email: "chair@example.com", name: "Board Chair", role: "Chair" },
      { email: "director1@example.com", name: "Director 1", role: "Director" },
      { email: "director2@example.com", name: "Director 2", role: "Director" },
    ],
  },
  {
    name: "Executive Team",
    description: "C-suite executives",
    recipients: [
      { email: "ceo@example.com", name: "CEO", role: "CEO" },
      { email: "cfo@example.com", name: "CFO", role: "CFO" },
      { email: "cro@example.com", name: "CRO", role: "CRO" },
    ],
  },
  {
    name: "Risk Committee",
    description: "Risk management committee members",
    recipients: [
      { email: "risk.chair@example.com", name: "Risk Chair", role: "Chair" },
      {
        email: "risk.member1@example.com",
        name: "Risk Member 1",
        role: "Member",
      },
      {
        email: "risk.member2@example.com",
        name: "Risk Member 2",
        role: "Member",
      },
    ],
  },
  {
    name: "Audit Committee",
    description: "Audit committee members",
    recipients: [
      { email: "audit.chair@example.com", name: "Audit Chair", role: "Chair" },
      {
        email: "audit.member1@example.com",
        name: "Audit Member 1",
        role: "Member",
      },
    ],
  },
];

/**
 * Initialize default distribution lists for a tenant
 */
export function initializeDefaultLists(tenantId: string): void {
  const existing = getDistributionLists(tenantId);
  if (existing.length > 0) return; // Already initialized

  DEFAULT_LISTS.forEach((listData) => {
    createDistributionList(
      tenantId,
      listData.name,
      listData.description,
      listData.recipients
    );
  });
}

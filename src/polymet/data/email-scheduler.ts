/**
 * Email Scheduler for Recurring Reports
 * Supports one-time and recurring email schedules
 */

export type ScheduleFrequency =
  | "once"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly";

export interface EmailSchedule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  frequency: ScheduleFrequency;

  // Schedule details
  startDate: string; // ISO date
  endDate?: string; // ISO date, optional
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  monthOfQuarter?: number; // 1-3 for quarterly

  // Email details
  recipients: string[];
  subject: string;
  template: string;

  // Report details
  decisionId?: string;
  includeAttachments: boolean;

  // Status
  enabled: boolean;
  lastRun?: string; // ISO date
  nextRun?: string; // ISO date
  runCount: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Storage key prefix
const STORAGE_PREFIX = "retina:email-schedules";

/**
 * Get all email schedules for a tenant
 */
export function getEmailSchedules(tenantId: string): EmailSchedule[] {
  const storageKey = `${STORAGE_PREFIX}:${tenantId}`;
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save an email schedule
 */
export function saveEmailSchedule(schedule: EmailSchedule): void {
  const schedules = getEmailSchedules(schedule.tenantId);
  const existingIndex = schedules.findIndex((s) => s.id === schedule.id);

  const updatedSchedule = {
    ...schedule,
    updatedAt: new Date().toISOString(),
    nextRun: calculateNextRun(schedule),
  };

  if (existingIndex >= 0) {
    schedules[existingIndex] = updatedSchedule;
  } else {
    schedules.push(updatedSchedule);
  }

  const storageKey = `${STORAGE_PREFIX}:${schedule.tenantId}`;
  localStorage.setItem(storageKey, JSON.stringify(schedules));
}

/**
 * Delete an email schedule
 */
export function deleteEmailSchedule(
  tenantId: string,
  scheduleId: string
): void {
  const schedules = getEmailSchedules(tenantId);
  const filtered = schedules.filter((s) => s.id !== scheduleId);

  const storageKey = `${STORAGE_PREFIX}:${tenantId}`;
  localStorage.setItem(storageKey, JSON.stringify(filtered));
}

/**
 * Get a single email schedule by ID
 */
export function getEmailSchedule(
  tenantId: string,
  scheduleId: string
): EmailSchedule | undefined {
  const schedules = getEmailSchedules(tenantId);
  return schedules.find((s) => s.id === scheduleId);
}

/**
 * Create a new email schedule
 */
export function createEmailSchedule(
  tenantId: string,
  name: string,
  frequency: ScheduleFrequency,
  recipients: string[],
  subject: string,
  template: string,
  createdBy: string,
  options: Partial<EmailSchedule> = {}
): EmailSchedule {
  const now = new Date();
  const schedule: EmailSchedule = {
    id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    name,
    description: options.description || "",
    frequency,
    startDate: options.startDate || now.toISOString(),
    endDate: options.endDate,
    time: options.time || "09:00",
    dayOfWeek: options.dayOfWeek,
    dayOfMonth: options.dayOfMonth,
    monthOfQuarter: options.monthOfQuarter,
    recipients,
    subject,
    template,
    decisionId: options.decisionId,
    includeAttachments: options.includeAttachments ?? true,
    enabled: true,
    runCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy,
  };

  schedule.nextRun = calculateNextRun(schedule);
  saveEmailSchedule(schedule);
  return schedule;
}

/**
 * Calculate next run time based on schedule
 */
export function calculateNextRun(schedule: EmailSchedule): string {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(":").map(Number);

  let nextRun = new Date(schedule.startDate);
  nextRun.setHours(hours, minutes, 0, 0);

  // If start date is in the past, calculate from now
  if (nextRun < now) {
    nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
  }

  switch (schedule.frequency) {
    case "once":
      // One-time schedule
      return nextRun.toISOString();

    case "daily":
      // If today's time has passed, schedule for tomorrow
      if (nextRun < now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      // Find next occurrence of the specified day of week
      if (schedule.dayOfWeek !== undefined) {
        while (nextRun.getDay() !== schedule.dayOfWeek || nextRun < now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;

    case "monthly":
      // Find next occurrence of the specified day of month
      if (schedule.dayOfMonth !== undefined) {
        while (nextRun.getDate() !== schedule.dayOfMonth || nextRun < now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;

    case "quarterly":
      // Find next quarter start
      const currentMonth = nextRun.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      nextRun.setMonth(quarterStartMonth + (schedule.monthOfQuarter || 1) - 1);
      nextRun.setDate(1);

      if (nextRun < now) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
  }

  // Check if end date is set and next run exceeds it
  if (schedule.endDate && nextRun > new Date(schedule.endDate)) {
    return schedule.endDate;
  }

  return nextRun.toISOString();
}

/**
 * Mark schedule as run
 */
export function markScheduleAsRun(tenantId: string, scheduleId: string): void {
  const schedule = getEmailSchedule(tenantId, scheduleId);
  if (!schedule) return;

  schedule.lastRun = new Date().toISOString();
  schedule.runCount += 1;

  // If one-time schedule, disable it
  if (schedule.frequency === "once") {
    schedule.enabled = false;
  }

  saveEmailSchedule(schedule);
}

/**
 * Toggle schedule enabled status
 */
export function toggleScheduleEnabled(
  tenantId: string,
  scheduleId: string
): void {
  const schedule = getEmailSchedule(tenantId, scheduleId);
  if (!schedule) return;

  schedule.enabled = !schedule.enabled;
  saveEmailSchedule(schedule);
}

/**
 * Get schedules that are due to run
 */
export function getDueSchedules(tenantId: string): EmailSchedule[] {
  const schedules = getEmailSchedules(tenantId);
  const now = new Date();

  return schedules.filter((schedule) => {
    if (!schedule.enabled) return false;
    if (!schedule.nextRun) return false;

    const nextRun = new Date(schedule.nextRun);
    return nextRun <= now;
  });
}

/**
 * Get frequency display text
 */
export function getFrequencyText(schedule: EmailSchedule): string {
  switch (schedule.frequency) {
    case "once":
      return "One time";
    case "daily":
      return "Daily";
    case "weekly":
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      return `Weekly on ${days[schedule.dayOfWeek || 0]}`;
    case "monthly":
      return `Monthly on day ${schedule.dayOfMonth || 1}`;
    case "quarterly":
      return `Quarterly (month ${schedule.monthOfQuarter || 1} of quarter)`;
    default:
      return schedule.frequency;
  }
}

/**
 * Validate schedule configuration
 */
export function validateSchedule(schedule: Partial<EmailSchedule>): string[] {
  const errors: string[] = [];

  if (!schedule.name?.trim()) {
    errors.push("Schedule name is required");
  }

  if (!schedule.recipients || schedule.recipients.length === 0) {
    errors.push("At least one recipient is required");
  }

  if (!schedule.subject?.trim()) {
    errors.push("Email subject is required");
  }

  if (!schedule.template?.trim()) {
    errors.push("Email template is required");
  }

  if (schedule.frequency === "weekly" && schedule.dayOfWeek === undefined) {
    errors.push("Day of week is required for weekly schedules");
  }

  if (schedule.frequency === "monthly" && schedule.dayOfMonth === undefined) {
    errors.push("Day of month is required for monthly schedules");
  }

  if (
    schedule.frequency === "quarterly" &&
    schedule.monthOfQuarter === undefined
  ) {
    errors.push("Month of quarter is required for quarterly schedules");
  }

  return errors;
}

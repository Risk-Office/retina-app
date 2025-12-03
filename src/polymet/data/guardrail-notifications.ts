import type { Guardrail, AlertLevel } from "@/polymet/data/decision-guardrails";
import type { GuardrailViolation } from "@/polymet/data/guardrail-violations";
import { sendEmail } from "@/polymet/data/email-backend";

export interface NotificationConfig {
  enabled: boolean;
  recipients: string[];
  notifyOnLevels: AlertLevel[];
  includeMetrics: boolean;
  includeTrend: boolean;
}

export interface NotificationPreferences {
  decisionId: string;
  optionId: string;
  config: NotificationConfig;
}

// Default notification config
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  recipients: [],
  notifyOnLevels: ["critical", "caution"],
  includeMetrics: true,
  includeTrend: false,
};

// Get storage key for notification preferences
const getStorageKey = (decisionId: string, optionId: string) => {
  return `retina:guardrail-notifications:${decisionId}:${optionId}`;
};

// Load notification preferences
export function loadNotificationPreferences(
  decisionId: string,
  optionId: string
): NotificationConfig {
  const key = getStorageKey(decisionId, optionId);
  const stored = localStorage.getItem(key);
  if (!stored) return DEFAULT_NOTIFICATION_CONFIG;

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse notification preferences:", error);
    return DEFAULT_NOTIFICATION_CONFIG;
  }
}

// Save notification preferences
export function saveNotificationPreferences(
  decisionId: string,
  optionId: string,
  config: NotificationConfig
): void {
  const key = getStorageKey(decisionId, optionId);
  localStorage.setItem(key, JSON.stringify(config));
}

// Generate email subject for violation
function generateEmailSubject(
  violation: GuardrailViolation,
  decisionTitle: string
): string {
  const urgency =
    violation.alertLevel === "critical"
      ? "🚨 CRITICAL"
      : violation.alertLevel === "caution"
        ? "⚠️ CAUTION"
        : "ℹ️ INFO";

  return `${urgency} Guardrail Violation: ${violation.metricName} - ${decisionTitle}`;
}

// Generate email body for violation
function generateEmailBody(
  violation: GuardrailViolation,
  decisionTitle: string,
  config: NotificationConfig
): string {
  const alertColor =
    violation.alertLevel === "critical"
      ? "#dc2626"
      : violation.alertLevel === "caution"
        ? "#f59e0b"
        : "#3b82f6";

  const directionText =
    violation.direction === "below" ? "fell below" : "exceeded";

  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: ${alertColor};
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .alert-badge {
            display: inline-block;
            background: ${alertColor};
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }
          .metric-box {
            background: white;
            border: 2px solid ${alertColor};
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .metric-row:last-child {
            border-bottom: none;
          }
          .metric-label {
            font-weight: bold;
            color: #666;
          }
          .metric-value {
            color: #333;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .action-button {
            display: inline-block;
            background: ${alertColor};
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Guardrail Violation Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${decisionTitle}</p>
        </div>
        
        <div class="content">
          <p>A guardrail has been violated for <strong>${violation.optionLabel}</strong>.</p>
          
          <div class="metric-box">
            <div class="metric-row">
              <span class="metric-label">Metric:</span>
              <span class="metric-value">${violation.metricName}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Threshold:</span>
              <span class="metric-value">${violation.thresholdValue.toLocaleString()}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Actual Value:</span>
              <span class="metric-value" style="color: ${alertColor}; font-weight: bold;">
                ${violation.actualValue.toLocaleString()}
              </span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Status:</span>
              <span class="metric-value">Value ${directionText} threshold</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Alert Level:</span>
              <span class="alert-badge">${violation.alertLevel}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Time:</span>
              <span class="metric-value">${new Date(violation.violatedAt).toLocaleString()}</span>
            </div>
          </div>

          ${
            config.includeMetrics
              ? `
          <h3 style="margin-top: 20px;">What This Means</h3>
          <p>
            The ${violation.metricName} metric has ${directionText} the configured threshold of 
            ${violation.thresholdValue.toLocaleString()}. The current value is 
            ${violation.actualValue.toLocaleString()}.
          </p>
          
          ${
            violation.alertLevel === "critical"
              ? `
          <p style="color: ${alertColor}; font-weight: bold;">
            ⚠️ This is a CRITICAL violation that requires immediate attention and action.
          </p>
          `
              : violation.alertLevel === "caution"
                ? `
          <p style="color: ${alertColor};">
            This violation requires attention and monitoring to prevent escalation.
          </p>
          `
                : `
          <p>
            This is an informational alert for your awareness.
          </p>
          `
          }
          `
              : ""
          }

          <h3 style="margin-top: 20px;">Recommended Actions</h3>
          <ul>
            <li>Review the decision parameters and assumptions</li>
            <li>Assess the impact on overall risk profile</li>
            <li>Consider adjusting the strategy or guardrail thresholds</li>
            ${
              violation.alertLevel === "critical"
                ? "<li><strong>Take immediate corrective action</strong></li>"
                : ""
            }
          </ul>

          <div style="text-align: center; margin: 20px 0;">
            <a href="#" class="action-button">View Decision Details</a>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated notification from Retina Intelligence Suite.</p>
          <p>You are receiving this because you are subscribed to guardrail alerts for this decision.</p>
        </div>
      </body>
    </html>
  `;

  return html;
}

// Send violation notification
export async function sendViolationNotification(
  violation: GuardrailViolation,
  decisionTitle: string,
  config: NotificationConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Check if notifications are enabled
  if (!config.enabled) {
    return { success: false, error: "Notifications are disabled" };
  }

  // Check if we should notify for this alert level
  if (!config.notifyOnLevels.includes(violation.alertLevel)) {
    return {
      success: false,
      error: `Notifications not configured for ${violation.alertLevel} level`,
    };
  }

  // Check if there are recipients
  if (config.recipients.length === 0) {
    return { success: false, error: "No recipients configured" };
  }

  try {
    const subject = generateEmailSubject(violation, decisionTitle);
    const htmlBody = generateEmailBody(violation, decisionTitle, config);

    const response = await sendEmail({
      to: config.recipients.map((email) => ({ email })),
      subject,
      htmlBody,
      textBody: `Guardrail violation detected for ${violation.metricName} in ${decisionTitle}. Threshold: ${violation.thresholdValue}, Actual: ${violation.actualValue}. Alert Level: ${violation.alertLevel}.`,
    });

    return response;
  } catch (error) {
    console.error("Failed to send violation notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send batch notification for multiple violations
export async function sendBatchViolationNotification(
  violations: GuardrailViolation[],
  decisionTitle: string,
  config: NotificationConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.enabled || violations.length === 0) {
    return { success: false, error: "No violations to notify" };
  }

  const criticalCount = violations.filter(
    (v) => v.alertLevel === "critical"
  ).length;
  const cautionCount = violations.filter(
    (v) => v.alertLevel === "caution"
  ).length;
  const infoCount = violations.filter((v) => v.alertLevel === "info").length;

  const subject = `🚨 ${violations.length} Guardrail Violations Detected - ${decisionTitle}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #dc2626;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .summary-box {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .summary-item {
            text-align: center;
            padding: 10px;
            border-radius: 6px;
          }
          .critical { background: #fee; color: #dc2626; }
          .caution { background: #fef3c7; color: #f59e0b; }
          .info { background: #dbeafe; color: #3b82f6; }
          .violation-list {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .violation-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .violation-item:last-child {
            border-bottom: none;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Multiple Guardrail Violations</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${decisionTitle}</p>
        </div>
        
        <div class="content">
          <p><strong>${violations.length} guardrail violations</strong> have been detected across your decision options.</p>
          
          <div class="summary-box">
            <div class="summary-item critical">
              <div style="font-size: 24px; font-weight: bold;">${criticalCount}</div>
              <div style="font-size: 12px;">Critical</div>
            </div>
            <div class="summary-item caution">
              <div style="font-size: 24px; font-weight: bold;">${cautionCount}</div>
              <div style="font-size: 12px;">Caution</div>
            </div>
            <div class="summary-item info">
              <div style="font-size: 24px; font-weight: bold;">${infoCount}</div>
              <div style="font-size: 12px;">Info</div>
            </div>
          </div>

          <h3>Violations Summary</h3>
          <div class="violation-list">
            ${violations
              .slice(0, 10)
              .map(
                (v) => `
              <div class="violation-item">
                <strong>${v.optionLabel}</strong> - ${v.metricName}<br>
                <small>Threshold: ${v.thresholdValue.toLocaleString()} | Actual: ${v.actualValue.toLocaleString()}</small>
              </div>
            `
              )
              .join("")}
            ${violations.length > 10 ? `<div class="violation-item"><em>... and ${violations.length - 10} more</em></div>` : ""}
          </div>

          <p style="margin-top: 20px;">
            Please review these violations and take appropriate action to bring metrics back within acceptable ranges.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await sendEmail({
      to: config.recipients.map((email) => ({ email })),
      subject,
      htmlBody,
      textBody: `${violations.length} guardrail violations detected in ${decisionTitle}. Critical: ${criticalCount}, Caution: ${cautionCount}, Info: ${infoCount}.`,
    });

    return response;
  } catch (error) {
    console.error("Failed to send batch notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test notification (sends a test email)
export async function sendTestNotification(
  recipients: string[],
  decisionTitle: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Test: Guardrail Notification - ${decisionTitle}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Notification</h2>
        <p>This is a test notification for guardrail alerts.</p>
        <p>If you received this email, your notification settings are configured correctly.</p>
        <p><strong>Decision:</strong> ${decisionTitle}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is a test email from Retina Intelligence Suite.
        </p>
      </body>
    </html>
  `;

  try {
    const response = await sendEmail({
      to: recipients.map((email) => ({ email })),
      subject,
      htmlBody,
      textBody: `Test notification for guardrail alerts in ${decisionTitle}.`,
    });

    return response;
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

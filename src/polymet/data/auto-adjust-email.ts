import type { AutoAdjustmentRecord } from "@/polymet/data/guardrail-auto-adjust";
import { markAdjustmentEmailSent } from "@/polymet/data/guardrail-auto-adjust";
import { sendEmail } from "@/polymet/data/email-backend";

interface EmailTemplate {
  subject: string;
  body: string;
}

// Generate email template for auto-adjustment notification
function generateAutoAdjustmentEmail(
  adjustment: AutoAdjustmentRecord,
  decisionTitle: string,
  tenantName: string
): EmailTemplate {
  const severityLabel = adjustment.severity
    ? adjustment.severity.charAt(0).toUpperCase() + adjustment.severity.slice(1)
    : "Repeated";

  const severityColor =
    adjustment.severity === "critical"
      ? "#dc2626"
      : adjustment.severity === "severe"
        ? "#ea580c"
        : adjustment.severity === "moderate"
          ? "#ca8a04"
          : "#16a34a";

  const subject = `[${tenantName}] Guardrail Auto-Adjusted: ${adjustment.metricName}`;

  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guardrail Auto-Adjustment Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">⚠️ Guardrail Auto-Adjusted</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">${tenantName}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 30px;">
    
    <!-- Alert Badge -->
    <div style="background: ${severityColor}; color: white; display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 20px;">
      ${severityLabel} Breach Detected
    </div>

    <!-- Summary -->
    <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111827;">Summary</h2>
    <p style="margin: 0 0 20px 0; color: #6b7280;">
      A guardrail threshold has been automatically adjusted due to repeated breaches. The system has tightened the limit to prevent future violations.
    </p>

    <!-- Details Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; font-weight: 600; color: #374151;">Decision:</td>
        <td style="padding: 12px 0; color: #6b7280;">${decisionTitle}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; font-weight: 600; color: #374151;">Metric:</td>
        <td style="padding: 12px 0; color: #6b7280;">${adjustment.metricName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; font-weight: 600; color: #374151;">Old Threshold:</td>
        <td style="padding: 12px 0; color: #6b7280;">${adjustment.oldThreshold.toFixed(2)}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; font-weight: 600; color: #374151;">New Threshold:</td>
        <td style="padding: 12px 0; color: #16a34a; font-weight: 600;">${adjustment.newThreshold.toFixed(2)}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; font-weight: 600; color: #374151;">Adjustment:</td>
        <td style="padding: 12px 0; color: #6b7280;">${adjustment.adjustmentPercent.toFixed(1)}% tightening</td>
      </tr>
      ${
        adjustment.breachSeverityPercent
          ? `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; font-weight: 600; color: #374151;">Breach Severity:</td>
        <td style="padding: 12px 0; color: ${severityColor}; font-weight: 600;">${adjustment.breachSeverityPercent.toFixed(1)}%</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="padding: 12px 0; font-weight: 600; color: #374151;">Adjusted At:</td>
        <td style="padding: 12px 0; color: #6b7280;">${new Date(
          adjustment.adjustedAt
        ).toLocaleString()}</td>
      </tr>
    </table>

    <!-- Reason -->
    <div style="background: #f9fafb; border-left: 4px solid ${severityColor}; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #374151;">
        <strong>Reason:</strong> ${adjustment.reason}
      </p>
    </div>

    <!-- What This Means -->
    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #111827;">What This Means</h3>
    <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
      The guardrail system detected ${adjustment.triggeredBy.length} breach${adjustment.triggeredBy.length > 1 ? "es" : ""} and automatically tightened the threshold by ${adjustment.adjustmentPercent.toFixed(1)}%. This helps ensure that future decisions stay within acceptable risk limits.
    </p>

    <!-- Plain Language -->
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        💡 <strong>Plain Language:</strong> The system learned from repeated problems and made the limits stricter to keep things safer.
      </p>
    </div>

    <!-- Action Required -->
    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #111827;">Action Required</h3>
    <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
      Please review the adjusted guardrail in the Retina Intelligence Suite. You may want to:
    </p>
    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
      <li style="margin-bottom: 8px;">Review the breach history and root causes</li>
      <li style="margin-bottom: 8px;">Verify the new threshold is appropriate</li>
      <li style="margin-bottom: 8px;">Update decision parameters if needed</li>
      <li style="margin-bottom: 8px;">Communicate changes to stakeholders</li>
    </ul>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        View in Retina
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 5px 0;">This is an automated notification from Retina Intelligence Suite</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} Retina Intelligence Suite. All rights reserved.</p>
  </div>

</body>
</html>
  `.trim();

  return { subject, body };
}

// Send auto-adjustment notification email
export async function sendAutoAdjustmentNotification(
  adjustment: AutoAdjustmentRecord,
  decisionId: string,
  decisionTitle: string,
  tenantName: string
): Promise<boolean> {
  if (!adjustment.emailRecipients || adjustment.emailRecipients.length === 0) {
    console.warn(
      "No email recipients configured for adjustment:",
      adjustment.id
    );
    return false;
  }

  const { subject, body } = generateAutoAdjustmentEmail(
    adjustment,
    decisionTitle,
    tenantName
  );

  try {
    // Send email to all recipients
    const success = await sendEmail({
      to: adjustment.emailRecipients,
      subject,
      html: body,
      from: "notifications@retina-intelligence.com",
      replyTo: "support@retina-intelligence.com",
    });

    if (success) {
      // Mark email as sent
      markAdjustmentEmailSent(decisionId, adjustment.id);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to send auto-adjustment email:", error);
    return false;
  }
}

// Send batch notifications for multiple adjustments
export async function sendBatchAutoAdjustmentNotifications(
  adjustments: Array<{
    adjustment: AutoAdjustmentRecord;
    decisionId: string;
    decisionTitle: string;
  }>,
  tenantName: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const { adjustment, decisionId, decisionTitle } of adjustments) {
    const success = await sendAutoAdjustmentNotification(
      adjustment,
      decisionId,
      decisionTitle,
      tenantName
    );

    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

// Generate summary email for multiple adjustments
export function generateAdjustmentSummaryEmail(
  adjustments: Array<{
    adjustment: AutoAdjustmentRecord;
    decisionTitle: string;
  }>,
  tenantName: string,
  periodDays: number
): EmailTemplate {
  const subject = `[${tenantName}] Guardrail Adjustment Summary - ${adjustments.length} Adjustments`;

  const adjustmentRows = adjustments
    .map(
      ({ adjustment, decisionTitle }) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; color: #374151;">${decisionTitle}</td>
      <td style="padding: 12px 8px; color: #374151;">${adjustment.metricName}</td>
      <td style="padding: 12px 8px; color: #6b7280;">${adjustment.oldThreshold.toFixed(2)}</td>
      <td style="padding: 12px 8px; color: #16a34a; font-weight: 600;">${adjustment.newThreshold.toFixed(2)}</td>
      <td style="padding: 12px 8px; color: #6b7280;">${adjustment.adjustmentPercent.toFixed(1)}%</td>
      <td style="padding: 12px 8px; color: #6b7280;">${new Date(adjustment.adjustedAt).toLocaleDateString()}</td>
    </tr>
  `
    )
    .join("");

  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guardrail Adjustment Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">📊 Guardrail Adjustment Summary</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">${tenantName} - Last ${periodDays} Days</p>
  </div>

  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 30px;">
    
    <p style="margin: 0 0 20px 0; color: #6b7280;">
      This summary shows all guardrail auto-adjustments that occurred in the last ${periodDays} days. The system automatically tightened ${adjustments.length} threshold${adjustments.length > 1 ? "s" : ""} based on repeated breach patterns.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <thead>
        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #111827;">Decision</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #111827;">Metric</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #111827;">Old</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #111827;">New</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #111827;">Change</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #111827;">Date</th>
        </tr>
      </thead>
      <tbody>
        ${adjustmentRows}
      </tbody>
    </table>

    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        View Full Report
      </a>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} Retina Intelligence Suite. All rights reserved.</p>
  </div>

</body>
</html>
  `.trim();

  return { subject, body };
}

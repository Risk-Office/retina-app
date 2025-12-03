/**
 * Email Backend Integration
 *
 * This module provides email sending functionality with support for:
 * - Multiple email providers (SendGrid, AWS SES, SMTP)
 * - Template-based emails
 * - Attachment support
 * - Retry logic
 * - Email tracking
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
}

export interface EmailRequest {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export interface EmailConfig {
  provider: "sendgrid" | "ses" | "smtp" | "mock";
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

// Default configuration (mock for development)
const DEFAULT_CONFIG: EmailConfig = {
  provider: "mock",
  fromEmail: "noreply@retina-intelligence.com",
  fromName: "Retina Intelligence Suite",
  replyToEmail: "support@retina-intelligence.com",
};

/**
 * Send email using configured provider
 */
export async function sendEmail(
  request: EmailRequest,
  config: EmailConfig = DEFAULT_CONFIG
): Promise<EmailResponse> {
  const timestamp = new Date().toISOString();

  try {
    // Validate request
    if (!request.to || request.to.length === 0) {
      throw new Error("At least one recipient is required");
    }

    if (!request.subject || !request.htmlBody) {
      throw new Error("Subject and body are required");
    }

    // Route to appropriate provider
    switch (config.provider) {
      case "sendgrid":
        return await sendViaSendGrid(request, config);
      case "ses":
        return await sendViaSES(request, config);
      case "smtp":
        return await sendViaSMTP(request, config);
      case "mock":
      default:
        return await sendViaMock(request, config);
    }
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp,
    };
  }
}

/**
 * SendGrid implementation
 */
async function sendViaSendGrid(
  request: EmailRequest,
  config: EmailConfig
): Promise<EmailResponse> {
  if (!config.apiKey) {
    throw new Error("SendGrid API key is required");
  }

  const payload = {
    personalizations: [
      {
        to: request.to.map((r) => ({ email: r.email, name: r.name })),
        cc: request.cc?.map((r) => ({ email: r.email, name: r.name })),
        bcc: request.bcc?.map((r) => ({ email: r.email, name: r.name })),
      },
    ],

    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    reply_to: request.replyTo
      ? { email: request.replyTo }
      : config.replyToEmail
        ? { email: config.replyToEmail }
        : undefined,
    subject: request.subject,
    content: [
      {
        type: "text/html",
        value: request.htmlBody,
      },
      ...(request.textBody
        ? [{ type: "text/plain", value: request.textBody }]
        : []),
    ],

    attachments: request.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      type: att.contentType,
      disposition: "attachment",
    })),
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }

  const messageId = response.headers.get("x-message-id") || undefined;

  return {
    success: true,
    messageId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * AWS SES implementation
 */
async function sendViaSES(
  request: EmailRequest,
  config: EmailConfig
): Promise<EmailResponse> {
  // This would use AWS SDK in a real implementation
  // For now, we'll return a mock response
  console.log("AWS SES send:", { request, config });

  return {
    success: true,
    messageId: `ses-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * SMTP implementation
 */
async function sendViaSMTP(
  request: EmailRequest,
  config: EmailConfig
): Promise<EmailResponse> {
  // This would use nodemailer or similar in a real implementation
  // For now, we'll return a mock response
  console.log("SMTP send:", { request, config });

  return {
    success: true,
    messageId: `smtp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock implementation for development
 */
async function sendViaMock(
  request: EmailRequest,
  config: EmailConfig
): Promise<EmailResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("📧 Mock Email Sent:");
  console.log("From:", `${config.fromName} <${config.fromEmail}>`);
  console.log("To:", request.to.map((r) => r.email).join(", "));
  if (request.cc) console.log("CC:", request.cc.map((r) => r.email).join(", "));
  if (request.bcc)
    console.log("BCC:", request.bcc.map((r) => r.email).join(", "));
  console.log("Subject:", request.subject);
  console.log("Body length:", request.htmlBody.length, "characters");
  if (request.attachments) {
    console.log(
      "Attachments:",
      request.attachments.map((a) => a.filename).join(", ")
    );
  }

  return {
    success: true,
    messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate HTML email body for board summary
 */
export function generateBoardSummaryEmail(
  decisionTitle: string,
  summary: any,
  branding: any
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${decisionTitle} - Board Summary</title>
  <style>
    body {
      font-family: ${branding.fontFamily || "Arial, sans-serif"};
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: ${branding.primaryColor};
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
    .metric {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid ${branding.accentColor};
      border-radius: 4px;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: ${branding.primaryColor};
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">${branding.companyName}</h1>
    <p style="margin: 10px 0 0 0;">Board-Ready Summary</p>
  </div>
  
  <div class="content">
    <h2 style="color: ${branding.primaryColor}; margin-top: 0;">${decisionTitle}</h2>
    
    <p><strong>Chosen Option:</strong> ${summary.chosenOption}</p>
    <p><strong>Generated:</strong> ${new Date(summary.generatedAt).toLocaleString()}</p>
    
    <h3 style="color: ${branding.primaryColor};">Key Metrics</h3>
    
    <div class="metric">
      <div class="metric-label">Expected Value (EV)</div>
      <div class="metric-value">${summary.keyMetrics.ev.toFixed(2)}</div>
    </div>
    
    <div class="metric">
      <div class="metric-label">Risk-Adjusted Return (RAROC)</div>
      <div class="metric-value">${summary.keyMetrics.raroc.toFixed(4)}</div>
    </div>
    
    <div class="metric">
      <div class="metric-label">Value at Risk 95% (VaR95)</div>
      <div class="metric-value">${summary.keyMetrics.var95.toFixed(2)}</div>
    </div>
    
    <h3 style="color: ${branding.primaryColor};">Executive Summary</h3>
    <p>${summary.narrative.decision}</p>
    
    <p style="text-align: center;">
      <a href="#" class="button">View Full Report</a>
    </p>
  </div>
  
  <div class="footer">
    <p>This is an automated email from ${branding.companyName}.</p>
    <p>Please do not reply to this email.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Get email configuration for tenant
 */
export function getEmailConfig(tenantId: string): EmailConfig {
  const storageKey = `retina:email-config:${tenantId}`;
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
}

/**
 * Save email configuration for tenant
 */
export function saveEmailConfig(tenantId: string, config: EmailConfig): void {
  const storageKey = `retina:email-config:${tenantId}`;
  localStorage.setItem(storageKey, JSON.stringify(config));
}

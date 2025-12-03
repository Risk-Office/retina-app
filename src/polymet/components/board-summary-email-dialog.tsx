import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DistributionListManager } from "@/polymet/components/distribution-list-manager";
import { EmailScheduleDialog } from "@/polymet/components/email-schedule-dialog";
import { useTenant } from "@/polymet/data/tenant-context";
import type { Recipient } from "@/polymet/data/distribution-lists";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MailIcon, PlusIcon, XIcon, SendIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BoardSummaryEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionTitle: string;
  summary: any;
  branding: any;
  onSendEmail: (
    recipients: string[],
    subject: string,
    message: string,
    template: string
  ) => void;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

const EMAIL_TEMPLATES = [
  {
    id: "executive",
    name: "Executive Summary",
    description: "High-level overview for C-suite",
    subject: "Board Decision Summary: {title}",
    message:
      "Please find attached the executive summary for the recent board decision on {title}.\n\nThis summary includes key metrics, risk factors, and strategic recommendations.\n\nBest regards,\nDecision Support Team",
  },
  {
    id: "technical",
    name: "Technical Report",
    description: "Detailed analysis for technical teams",
    subject: "Technical Analysis: {title}",
    message:
      "Attached is the comprehensive technical analysis for {title}.\n\nThis report includes detailed metrics, sensitivity analysis, and risk assessments.\n\nPlease review and provide feedback.\n\nRegards,\nAnalytics Team",
  },
  {
    id: "stakeholder",
    name: "Stakeholder Update",
    description: "General update for stakeholders",
    subject: "Decision Update: {title}",
    message:
      "We're sharing an update on the recent decision regarding {title}.\n\nThe attached summary provides an overview of the decision rationale and expected outcomes.\n\nThank you,\nProject Team",
  },
];

export function BoardSummaryEmailDialog({
  open,
  onOpenChange,
  decisionTitle,
  summary,
  branding,
  onSendEmail,
  onAuditEvent = () => {},
}: BoardSummaryEmailDialogProps) {
  const { tenant } = useTenant();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [selectedDistributionRecipients, setSelectedDistributionRecipients] =
    useState<Recipient[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("executive");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const template = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);

  const handleAddRecipient = () => {
    if (currentEmail && currentEmail.includes("@")) {
      if (!recipients.includes(currentEmail)) {
        setRecipients([...recipients, currentEmail]);
      }
      setCurrentEmail("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSend = () => {
    // Combine manual recipients and distribution list recipients
    const allRecipients = [
      ...recipients,
      ...selectedDistributionRecipients.map((r) => r.email),
    ];

    const uniqueRecipients = Array.from(new Set(allRecipients));

    if (uniqueRecipients.length === 0) {
      alert("Please add at least one recipient");
      return;
    }

    const subject =
      customSubject ||
      template?.subject.replace("{title}", decisionTitle) ||
      "";
    const message =
      customMessage ||
      template?.message.replace(/{title}/g, decisionTitle) ||
      "";

    onSendEmail(uniqueRecipients, subject, message, selectedTemplate);

    // Reset form
    setRecipients([]);
    setSelectedDistributionRecipients([]);
    setCurrentEmail("");
    setCustomSubject("");
    setCustomMessage("");
    onOpenChange(false);
  };

  const handleDistributionListsSelected = (listRecipients: Recipient[]) => {
    setSelectedDistributionRecipients(listRecipients);
  };

  const totalRecipients =
    recipients.length + selectedDistributionRecipients.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MailIcon className="w-5 h-5" />
            Email Board Summary
          </DialogTitle>
          <DialogDescription>
            Send the board summary to stakeholders via email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{tmpl.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tmpl.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Recipients</Label>
              <DistributionListManager
                tenantId={tenant.tenantId}
                onRecipientsSelected={handleDistributionListsSelected}
                selectedRecipients={selectedDistributionRecipients}
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddRecipient}
                disabled={!currentEmail || !currentEmail.includes("@")}
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
            {(recipients.length > 0 ||
              selectedDistributionRecipients.length > 0) && (
              <div className="space-y-2 mt-2">
                {recipients.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Manual Recipients
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recipients.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="gap-1"
                        >
                          {email}
                          <button
                            onClick={() => handleRemoveRecipient(email)}
                            className="ml-1 hover:text-destructive"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedDistributionRecipients.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      From Distribution Lists
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedDistributionRecipients.map((recipient) => (
                        <Badge
                          key={recipient.email}
                          variant="outline"
                          className="gap-1"
                        >
                          {recipient.name} ({recipient.email})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Total: {totalRecipients} recipient(s)
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder={template?.subject.replace("{title}", decisionTitle)}
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder={template?.message.replace(/{title}/g, decisionTitle)}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
            />
          </div>

          {/* Schedule Option */}
          <div className="border-t border-border pt-4">
            <EmailScheduleDialog
              tenantId={tenant.tenantId}
              decisionTitle={decisionTitle}
              recipients={[
                ...recipients,
                ...selectedDistributionRecipients.map((r) => r.email),
              ]}
              template={selectedTemplate}
              onScheduleCreated={(scheduleId) => {
                onAuditEvent("email.schedule.created.from.summary", {
                  scheduleId,
                });
                alert(`Schedule created: ${scheduleId}`);
              }}
              onAuditEvent={onAuditEvent}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSend}
              disabled={totalRecipients === 0}
              className="flex-1"
            >
              <SendIcon className="w-4 h-4 mr-2" />
              Send Email ({totalRecipients})
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

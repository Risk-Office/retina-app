import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MailIcon, XIcon, UsersIcon } from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";
import {
  getDistributionLists,
  type DistributionList,
} from "@/polymet/data/distribution-lists";

interface PortfolioEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioName: string;
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
    subject: "Portfolio Brief: {portfolioName}",
    body: "Dear Executive Team,\n\nPlease find attached the portfolio brief for {portfolioName}.\n\nKey Highlights:\n• Total Expected Value: {totalEV}\n• Diversification Index: {diversification}\n• Antifragility Score: {antifragility}\n\nBest regards",
  },
  {
    id: "board",
    name: "Board Report",
    subject: "Board Report: {portfolioName} Portfolio Analysis",
    body: "Dear Board Members,\n\nAttached is the comprehensive portfolio analysis for {portfolioName}.\n\nThis report includes:\n• Aggregate metrics across all decisions\n• Top portfolio drivers\n• Risk assessment breakdown\n\nPlease review before our next meeting.\n\nBest regards",
  },
  {
    id: "stakeholder",
    name: "Stakeholder Update",
    subject: "{portfolioName} - Portfolio Update",
    body: "Hello,\n\nI'm sharing an update on the {portfolioName} portfolio.\n\nThe attached brief provides:\n• Current portfolio performance\n• Decision breakdown\n• Key risk factors\n\nPlease let me know if you have any questions.\n\nBest regards",
  },
  {
    id: "custom",
    name: "Custom",
    subject: "",
    body: "",
  },
];

export function PortfolioEmailDialog({
  open,
  onOpenChange,
  portfolioName,
  onSendEmail,
  onAuditEvent,
}: PortfolioEmailDialogProps) {
  const { tenant } = useTenant();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("executive");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Load distribution lists
  const distributionLists = getDistributionLists(tenant.tenantId);

  // Update subject and message when template changes
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template && templateId !== "custom") {
      setSubject(template.subject.replace("{portfolioName}", portfolioName));
      setMessage(template.body.replace("{portfolioName}", portfolioName));
    }
  };

  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (email && !recipients.includes(email)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        setRecipients([...recipients, email]);
        setRecipientInput("");
      }
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleAddDistributionList = (list: DistributionList) => {
    const newRecipients = list.recipients
      .map((r) => r.email)
      .filter((email) => !recipients.includes(email));
    setRecipients([...recipients, ...newRecipients]);
  };

  const handleSend = async () => {
    if (recipients.length === 0 || !subject || !message) {
      return;
    }

    setIsSending(true);

    try {
      await onSendEmail(recipients, subject, message, selectedTemplate);

      onAuditEvent?.("portfolio.brief.emailed", {
        portfolioName,
        recipients: recipients.length,
        template: selectedTemplate,
      });

      // Reset form
      setRecipients([]);
      setRecipientInput("");
      setSelectedTemplate("executive");
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to send email:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MailIcon className="w-5 h-5" />
            Email Portfolio Brief
          </DialogTitle>
          <DialogDescription>
            Send {portfolioName} portfolio brief to stakeholders
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="recipients">
              Recipients ({recipients.length})
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Email message"
                rows={10}
              />

              <p className="text-xs text-muted-foreground">
                The portfolio brief will be attached as a PDF
              </p>
            </div>
          </TabsContent>

          {/* Recipients Tab */}
          <TabsContent value="recipients" className="space-y-4">
            {/* Add Individual Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Add Recipient</Label>
              <div className="flex gap-2">
                <Input
                  id="recipient"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRecipient();
                    }
                  }}
                  placeholder="email@example.com"
                />

                <Button onClick={handleAddRecipient}>Add</Button>
              </div>
            </div>

            {/* Distribution Lists */}
            {distributionLists.length > 0 && (
              <div className="space-y-2">
                <Label>Distribution Lists</Label>
                <div className="grid grid-cols-1 gap-2">
                  {distributionLists.map((list) => (
                    <Card
                      key={list.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleAddDistributionList(list)}
                    >
                      <CardHeader className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4 text-muted-foreground" />

                            <CardTitle className="text-sm">
                              {list.name}
                            </CardTitle>
                          </div>
                          <Badge variant="secondary">
                            {list.recipients.length}
                          </Badge>
                        </div>
                        {list.description && (
                          <CardDescription className="text-xs">
                            {list.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Current Recipients */}
            <div className="space-y-2">
              <Label>Current Recipients ({recipients.length})</Label>
              {recipients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recipients added yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recipients.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1"
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
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              recipients.length === 0 || !subject || !message || isSending
            }
          >
            {isSending
              ? "Sending..."
              : `Send to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

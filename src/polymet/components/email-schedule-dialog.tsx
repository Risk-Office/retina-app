import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon } from "lucide-react";
import {
  createEmailSchedule,
  validateSchedule,
  getFrequencyText,
  type ScheduleFrequency,
} from "@/polymet/data/email-scheduler";

interface EmailScheduleDialogProps {
  tenantId: string;
  decisionTitle: string;
  recipients: string[];
  template: string;
  onScheduleCreated: (scheduleId: string) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function EmailScheduleDialog({
  tenantId,
  decisionTitle,
  recipients,
  template,
  onScheduleCreated,
  onAuditEvent,
}: EmailScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${decisionTitle} - Recurring Report`);
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("weekly");
  const [time, setTime] = useState("09:00");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [monthOfQuarter, setMonthOfQuarter] = useState<number>(1);
  const [subject, setSubject] = useState(`Board Summary: ${decisionTitle}`);
  const [errors, setErrors] = useState<string[]>([]);

  const handleCreateSchedule = () => {
    // Validate
    const scheduleData = {
      name,
      description,
      frequency,
      time,
      dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
      monthOfQuarter: frequency === "quarterly" ? monthOfQuarter : undefined,
      recipients,
      subject,
      template,
    };

    const validationErrors = validateSchedule(scheduleData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create schedule
    const schedule = createEmailSchedule(
      tenantId,
      name,
      frequency,
      recipients,
      subject,
      template,
      "current-user", // In production, get from auth context
      {
        description,
        time,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
        monthOfQuarter: frequency === "quarterly" ? monthOfQuarter : undefined,
        includeAttachments: true,
      }
    );

    // Audit event
    onAuditEvent("email.schedule.created", {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      frequency: schedule.frequency,
      recipientCount: schedule.recipients.length,
    });

    // Callback
    onScheduleCreated(schedule.id);

    // Close dialog
    setOpen(false);
    setErrors([]);
  };

  const mockSchedule = {
    name,
    frequency,
    time,
    dayOfWeek,
    dayOfMonth,
    monthOfQuarter,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ClockIcon className="w-4 h-4 mr-2" />
          Schedule Recurring Email
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Recurring Email</DialogTitle>
          <DialogDescription>
            Set up automatic email delivery for board summaries
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <Card className="border-red-500 bg-red-50 dark:bg-red-950">
              <CardContent className="pt-6">
                <div className="space-y-1">
                  {errors.map((error, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      • {error}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Weekly Board Report"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-description">
                  Description (optional)
                </Label>
                <Textarea
                  id="schedule-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this schedule"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frequency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">How often?</Label>
                <Select
                  value={frequency}
                  onValueChange={(v: ScheduleFrequency) => setFrequency(v)}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One Time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              {frequency === "weekly" && (
                <div className="space-y-2">
                  <Label htmlFor="day-of-week">Day of Week</Label>
                  <Select
                    value={dayOfWeek.toString()}
                    onValueChange={(v) => setDayOfWeek(parseInt(v))}
                  >
                    <SelectTrigger id="day-of-week">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {frequency === "monthly" && (
                <div className="space-y-2">
                  <Label htmlFor="day-of-month">Day of Month</Label>
                  <Select
                    value={dayOfMonth.toString()}
                    onValueChange={(v) => setDayOfMonth(parseInt(v))}
                  >
                    <SelectTrigger id="day-of-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {frequency === "quarterly" && (
                <div className="space-y-2">
                  <Label htmlFor="month-of-quarter">Month of Quarter</Label>
                  <Select
                    value={monthOfQuarter.toString()}
                    onValueChange={(v) => setMonthOfQuarter(parseInt(v))}
                  >
                    <SelectTrigger id="month-of-quarter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">First Month</SelectItem>
                      <SelectItem value="2">Second Month</SelectItem>
                      <SelectItem value="3">Third Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                />
              </div>

              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  {recipients.map((email) => (
                    <div key={email} className="text-sm">
                      {email}
                    </div>
                  ))}
                  <Badge variant="outline" className="mt-2">
                    {recipients.length} recipient(s)
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <div className="text-sm text-muted-foreground">{template}</div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />

                  <span className="font-medium">
                    {getFrequencyText(mockSchedule as any)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-muted-foreground" />

                  <span>at {time}</span>
                </div>
                <div className="text-muted-foreground">
                  Emails will be sent to {recipients.length} recipient(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule}>Create Schedule</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

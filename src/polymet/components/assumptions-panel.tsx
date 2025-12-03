import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  PlusIcon,
  EditIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ExternalLinkIcon,
} from "lucide-react";
import {
  loadAssumptions,
  addAssumption,
  updateAssumption,
  deleteAssumption,
  getCriticalOpenAssumptions,
  getConfidenceLabel,
  getConfidenceColor,
  getStatusColor,
  type Assumption,
  type AssumptionScope,
  type AssumptionConfidence,
  type AssumptionStatus,
} from "@/polymet/data/assumptions-store";

interface AssumptionsPanelProps {
  decisionId: string;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function AssumptionsPanel({
  decisionId,
  onAuditEvent,
}: AssumptionsPanelProps) {
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAssumption, setEditingAssumption] = useState<Assumption | null>(
    null
  );

  // Form state
  const [formScope, setFormScope] = useState<AssumptionScope>("decision");
  const [formLinkId, setFormLinkId] = useState("");
  const [formStatement, setFormStatement] = useState("");
  const [formEvidenceUrl, setFormEvidenceUrl] = useState("");
  const [formConfidence, setFormConfidence] = useState<AssumptionConfidence>(1);
  const [formCritical, setFormCritical] = useState(false);
  const [formOwner, setFormOwner] = useState("");
  const [formReviewBy, setFormReviewBy] = useState("");
  const [formStatus, setFormStatus] = useState<AssumptionStatus>("open");

  // Load assumptions
  useEffect(() => {
    setAssumptions(loadAssumptions(decisionId));
  }, [decisionId]);

  // Reset form
  const resetForm = () => {
    setFormScope("decision");
    setFormLinkId("");
    setFormStatement("");
    setFormEvidenceUrl("");
    setFormConfidence(1);
    setFormCritical(false);
    setFormOwner("");
    setFormReviewBy("");
    setFormStatus("open");
  };

  // Handle add assumption
  const handleAddAssumption = () => {
    if (!formStatement.trim()) return;

    const newAssumption = addAssumption(decisionId, {
      scope: formScope,
      linkId: formLinkId || undefined,
      statement: formStatement.trim(),
      evidenceUrl: formEvidenceUrl || undefined,
      confidence: formConfidence,
      critical: formCritical,
      owner: formOwner || undefined,
      reviewBy: formReviewBy || undefined,
      status: formStatus,
    });

    setAssumptions(loadAssumptions(decisionId));
    onAuditEvent("assumption.added", {
      assumptionId: newAssumption.id,
      scope: newAssumption.scope,
      linkId: newAssumption.linkId,
      statement: newAssumption.statement,
      critical: newAssumption.critical,
    });

    resetForm();
    setShowAddDialog(false);
  };

  // Handle edit assumption
  const handleEditAssumption = () => {
    if (!editingAssumption || !formStatement.trim()) return;

    const updated = updateAssumption(decisionId, editingAssumption.id, {
      scope: formScope,
      linkId: formLinkId || undefined,
      statement: formStatement.trim(),
      evidenceUrl: formEvidenceUrl || undefined,
      confidence: formConfidence,
      critical: formCritical,
      owner: formOwner || undefined,
      reviewBy: formReviewBy || undefined,
      status: formStatus,
    });

    if (updated) {
      setAssumptions(loadAssumptions(decisionId));
      onAuditEvent("assumption.updated", {
        assumptionId: updated.id,
        scope: updated.scope,
        linkId: updated.linkId,
        statement: updated.statement,
        critical: updated.critical,
        status: updated.status,
      });
    }

    resetForm();
    setEditingAssumption(null);
    setShowEditDialog(false);
  };

  // Handle status change
  const handleStatusChange = (
    assumptionId: string,
    newStatus: AssumptionStatus
  ) => {
    const updated = updateAssumption(decisionId, assumptionId, {
      status: newStatus,
    });

    if (updated) {
      setAssumptions(loadAssumptions(decisionId));
      onAuditEvent("assumption.statusChanged", {
        assumptionId: updated.id,
        oldStatus: assumptions.find((a) => a.id === assumptionId)?.status,
        newStatus,
        statement: updated.statement,
      });
    }
  };

  // Handle delete
  const handleDelete = (assumptionId: string) => {
    const assumption = assumptions.find((a) => a.id === assumptionId);
    if (deleteAssumption(decisionId, assumptionId)) {
      setAssumptions(loadAssumptions(decisionId));
      onAuditEvent("assumption.deleted", {
        assumptionId,
        statement: assumption?.statement,
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (assumption: Assumption) => {
    setEditingAssumption(assumption);
    setFormScope(assumption.scope);
    setFormLinkId(assumption.linkId || "");
    setFormStatement(assumption.statement);
    setFormEvidenceUrl(assumption.evidenceUrl || "");
    setFormConfidence(assumption.confidence);
    setFormCritical(assumption.critical);
    setFormOwner(assumption.owner || "");
    setFormReviewBy(assumption.reviewBy || "");
    setFormStatus(assumption.status);
    setShowEditDialog(true);
  };

  const criticalOpen = getCriticalOpenAssumptions(decisionId);

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      {criticalOpen.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-2">
          <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />

          <div className="text-sm">
            <span className="font-medium text-amber-700 dark:text-amber-400">
              {criticalOpen.length} critical assumption(s) open
            </span>
            <span className="text-amber-600 dark:text-amber-500 ml-2">
              Review before closing decision
            </span>
          </div>
        </div>
      )}

      {/* Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">
            {assumptions.length} assumption(s)
          </div>
          <div className="text-xs text-muted-foreground">
            Track key assumptions for this decision
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Assumption
        </Button>
      </div>

      {/* Assumptions Table */}
      {assumptions.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <AlertTriangleIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              No assumptions yet
            </p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add First Assumption
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statement</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Critical</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assumptions.map((assumption) => (
                <TableRow key={assumption.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium max-w-md">
                        {assumption.statement}
                      </div>
                      {assumption.evidenceUrl && (
                        <a
                          href={assumption.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Evidence <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      )}
                      {assumption.owner && (
                        <div className="text-xs text-muted-foreground">
                          Owner: {assumption.owner}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {assumption.scope}
                      </Badge>
                      {assumption.linkId && (
                        <div className="text-xs text-muted-foreground">
                          {assumption.linkId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${getConfidenceColor(assumption.confidence)}`}
                    >
                      {getConfidenceLabel(assumption.confidence)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {assumption.critical ? (
                      <Badge variant="destructive" className="text-xs">
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={assumption.status}
                      onValueChange={(value: AssumptionStatus) =>
                        handleStatusChange(assumption.id, value)
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="validated">Validated</SelectItem>
                        <SelectItem value="invalidated">Invalidated</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {new Date(assumption.updatedAt).toLocaleDateString()}
                    </div>
                    {assumption.reviewBy && (
                      <div className="text-xs text-muted-foreground">
                        Review:{" "}
                        {new Date(assumption.reviewBy).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(assumption)}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(assumption.id)}
                      >
                        <XCircleIcon className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setEditingAssumption(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAssumption ? "Edit Assumption" : "Add Assumption"}
            </DialogTitle>
            <DialogDescription>
              {editingAssumption
                ? "Update the assumption details"
                : "Add a new assumption to track"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scope">Scope</Label>
                <Select
                  value={formScope}
                  onValueChange={(value: AssumptionScope) =>
                    setFormScope(value)
                  }
                >
                  <SelectTrigger id="scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="option">Option</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formScope !== "decision" && (
                <div className="space-y-2">
                  <Label htmlFor="linkId">
                    {formScope === "option" ? "Option ID" : "Variable ID"}
                  </Label>
                  <Input
                    id="linkId"
                    value={formLinkId}
                    onChange={(e) => setFormLinkId(e.target.value)}
                    placeholder={
                      formScope === "option" ? "opt-1" : "var-demand"
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="statement">Statement *</Label>
              <Textarea
                id="statement"
                value={formStatement}
                onChange={(e) => setFormStatement(e.target.value)}
                placeholder="Concise statement of the assumption..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidenceUrl">Evidence URL (Optional)</Label>
              <Input
                id="evidenceUrl"
                value={formEvidenceUrl}
                onChange={(e) => setFormEvidenceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence</Label>
                <Select
                  value={formConfidence.toString()}
                  onValueChange={(value) =>
                    setFormConfidence(parseInt(value) as AssumptionConfidence)
                  }
                >
                  <SelectTrigger id="confidence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Low</SelectItem>
                    <SelectItem value="1">Medium</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(value: AssumptionStatus) =>
                    setFormStatus(value)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="invalidated">Invalidated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="critical"
                checked={formCritical}
                onCheckedChange={setFormCritical}
              />

              <Label htmlFor="critical" className="cursor-pointer">
                Critical (gate at decision close)
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner (Optional)</Label>
                <Input
                  id="owner"
                  value={formOwner}
                  onChange={(e) => setFormOwner(e.target.value)}
                  placeholder="Name or email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewBy">Review By (Optional)</Label>
                <Input
                  id="reviewBy"
                  type="date"
                  value={formReviewBy}
                  onChange={(e) => setFormReviewBy(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                setEditingAssumption(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={
                editingAssumption ? handleEditAssumption : handleAddAssumption
              }
              disabled={!formStatement.trim()}
            >
              {editingAssumption ? "Update" : "Add"} Assumption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline add button for options
export function AddAssumptionForOption({
  decisionId,
  optionId,
  optionLabel,
  onAuditEvent,
}: {
  decisionId: string;
  optionId: string;
  optionLabel: string;
  onAuditEvent: (eventType: string, payload: any) => void;
}) {
  const handleAdd = () => {
    const newAssumption = addAssumption(decisionId, {
      scope: "option",
      linkId: optionId,
      statement: `Assumption for ${optionLabel}`,
      confidence: 1,
      critical: false,
      status: "open",
    });

    onAuditEvent("assumption.added", {
      assumptionId: newAssumption.id,
      scope: "option",
      linkId: optionId,
      statement: newAssumption.statement,
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleAdd}>
      <PlusIcon className="w-3 h-3 mr-1" />
      Add assumption
    </Button>
  );
}

// Inline add button for variables
export function AddAssumptionForVariable({
  decisionId,
  variableId,
  variableName,
  onAuditEvent,
}: {
  decisionId: string;
  variableId: string;
  variableName: string;
  onAuditEvent: (eventType: string, payload: any) => void;
}) {
  const handleAdd = () => {
    const newAssumption = addAssumption(decisionId, {
      scope: "variable",
      linkId: variableId,
      statement: `Assumption for ${variableName}`,
      confidence: 1,
      critical: false,
      status: "open",
    });

    onAuditEvent("assumption.added", {
      assumptionId: newAssumption.id,
      scope: "variable",
      linkId: variableId,
      statement: newAssumption.statement,
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleAdd}>
      <PlusIcon className="w-3 h-3 mr-1" />
      Add assumption
    </Button>
  );
}

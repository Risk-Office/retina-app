import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LayoutTemplateIcon,
  SaveIcon,
  TrashIcon,
  PlusIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  getAllTemplates,
  saveUserTemplate,
  deleteUserTemplate,
  type DecisionTemplate,
} from "@/polymet/data/decision-templates";
import { ScenarioVar } from "@/polymet/data/scenario-engine";
import { Friendly } from "@/polymet/components/friendly-term";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TemplatesDrawerProps {
  tenantId: string;
  currentTitle: string;
  currentDescription: string;
  currentOptions: Array<{ id: string; label: string }>;
  currentScenarioVars: ScenarioVar[];
  onApplyTemplate: (
    title: string,
    description: string,
    options: Array<{ id: string; label: string }>,
    scenarioVars: ScenarioVar[]
  ) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function TemplatesDrawer({
  tenantId,
  currentTitle,
  currentDescription,
  currentOptions,
  currentScenarioVars,
  onApplyTemplate,
  onAuditEvent,
}: TemplatesDrawerProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<DecisionTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<DecisionTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<DecisionTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [applyMode, setApplyMode] = useState<"replace" | "merge">("replace");

  // Load templates when drawer opens
  React.useEffect(() => {
    if (open) {
      setTemplates(getAllTemplates(tenantId));
    }
  }, [open, tenantId]);

  const isCurrentDecisionEmpty = () => {
    return (
      !currentTitle &&
      !currentDescription &&
      currentOptions.length <= 2 &&
      currentScenarioVars.length === 0
    );
  };

  const handleTemplateClick = (template: DecisionTemplate) => {
    setSelectedTemplate(template);

    if (isCurrentDecisionEmpty()) {
      // Directly apply template
      applyTemplate(template, "replace");
    } else {
      // Ask user: Replace or Merge
      setShowApplyDialog(true);
    }
  };

  const applyTemplate = (
    template: DecisionTemplate,
    mode: "replace" | "merge"
  ) => {
    const title = mode === "replace" ? template.name : currentTitle;
    const description =
      mode === "replace" ? template.description : currentDescription;

    // Generate options with unique IDs
    const templateOptions = template.options.map((opt, idx) => ({
      id: `opt-${Date.now()}-${idx}`,
      label: opt.label,
    }));

    const options =
      mode === "replace"
        ? templateOptions
        : [...currentOptions, ...templateOptions];

    // Generate scenario vars with unique IDs
    const templateVars = template.scenarioVars.map((v) => ({
      ...v,
      id: `var-${Date.now()}-${Math.random()}`,
    }));

    const scenarioVars =
      mode === "replace"
        ? templateVars
        : [...currentScenarioVars, ...templateVars];

    onApplyTemplate(title, description, options, scenarioVars);

    // Add audit event
    onAuditEvent("template.applied", {
      name: template.name,
      mode,
      options: template.options.length,
      vars: template.scenarioVars.length,
    });

    setShowApplyDialog(false);
    setOpen(false);
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate = saveUserTemplate(tenantId, {
      name: newTemplateName,
      description: currentDescription || "Custom template",
      options: currentOptions.map((opt) => ({ label: opt.label })),
      scenarioVars: currentScenarioVars,
    });

    // Add audit event
    onAuditEvent("template.saved", {
      name: newTemplate.name,
      options: currentOptions.length,
      vars: currentScenarioVars.length,
    });

    setTemplates(getAllTemplates(tenantId));
    setShowSaveDialog(false);
    setNewTemplateName("");
  };

  const handleDeleteTemplate = () => {
    if (!templateToDelete) return;

    deleteUserTemplate(tenantId, templateToDelete.id);

    // Add audit event
    onAuditEvent("template.deleted", {
      name: templateToDelete.name,
      options: templateToDelete.options.length,
      vars: templateToDelete.scenarioVars.length,
    });

    setTemplates(getAllTemplates(tenantId));
    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  const builtInTemplates = templates.filter((t) => t.isBuiltIn);
  const userTemplates = templates.filter((t) => !t.isBuiltIn);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <LayoutTemplateIcon className="w-4 h-4 mr-2" />
            Templates
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[500px] sm:w-[600px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Decision Templates</SheetTitle>
            <SheetDescription>
              Quick-start templates for common decision scenarios
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                disabled={
                  currentOptions.length === 0 &&
                  currentScenarioVars.length === 0
                }
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save current as template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManageDialog(true)}
                disabled={userTemplates.length === 0}
              >
                Manage templates
              </Button>
            </div>

            {/* Built-in Templates */}
            <div className="space-y-3">
              <div className="text-sm font-semibold">Built-in Templates</div>
              <div className="space-y-3">
                {builtInTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          Built-in
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div className="text-xs">
                        <span className="font-medium">Options:</span>{" "}
                        <span className="text-muted-foreground">
                          {template.options.map((opt) => opt.label).join(", ")}
                        </span>
                      </div>
                      <div className="text-xs">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium cursor-help">
                                <Friendly term="scenario" as="label" />:
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                {template.scenarioVars.map((v) => (
                                  <div key={v.id} className="text-xs">
                                    {v.name} ({v.dist})
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>{" "}
                        <span className="text-muted-foreground">
                          {template.scenarioVars.length} variable(s)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* User Templates */}
            {userTemplates.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Your Templates</div>
                <div className="space-y-3">
                  {userTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleTemplateClick(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2 shrink-0">
                            Custom
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        <div className="text-xs">
                          <span className="font-medium">Options:</span>{" "}
                          <span className="text-muted-foreground">
                            {template.options
                              .map((opt) => opt.label)
                              .join(", ")}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">
                            <Friendly term="scenario" as="label" />:
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {template.scenarioVars.length} variable(s)
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current decision setup as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., My Decision Template"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                <strong>Will save:</strong>
              </div>
              <div>• {currentOptions.length} option(s)</div>
              <div>• {currentScenarioVars.length} what-if variable(s)</div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setNewTemplateName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!newTemplateName.trim()}
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Template Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>
              You have an existing decision. How would you like to apply this
              template?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 border border-orange-500/20 bg-orange-500/10 rounded-lg">
              <AlertCircleIcon className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />

              <div className="text-sm text-orange-700 dark:text-orange-400">
                <strong>Replace</strong> will clear your current decision and
                start fresh with the template.
                <br />
                <strong>Merge</strong> will add template options and variables
                to your existing decision.
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApplyDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedTemplate) {
                  applyTemplate(selectedTemplate, "merge");
                }
              }}
              className="w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Merge
            </Button>
            <Button
              onClick={() => {
                if (selectedTemplate) {
                  applyTemplate(selectedTemplate, "replace");
                }
              }}
              className="w-full sm:w-auto"
            >
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Templates Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Templates</DialogTitle>
            <DialogDescription>
              View and delete your custom templates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {userTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No custom templates yet
              </p>
            ) : (
              userTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {template.options.length} option(s) •{" "}
                      {template.scenarioVars.length} variable(s)
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTemplateToDelete(template);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <TrashIcon className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowManageDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

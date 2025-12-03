import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DownloadIcon,
  UploadIcon,
  FileJsonIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  XIcon,
} from "lucide-react";
import type { GoalV2 } from "@/polymet/data/goal-v2-schema";
import {
  validateGoals,
  detectCircularDependencies,
  formatValidationErrors,
  type ValidationError,
} from "@/polymet/data/goal-import-validator-v2";

export interface ImportExportPanelV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: GoalV2[];
  onImport: (goals: GoalV2[], dedupStrategy: DedupStrategy) => Promise<void>;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export type DedupStrategy = "skip" | "replace" | "merge";

interface CSVFieldMapping {
  csvColumn: string;
  goalField: string;
}

interface ImportPreview {
  goals: Partial<GoalV2>[];
  errors: ValidationError[];
  warnings: ValidationError[];
  duplicates: Array<{
    importGoal: Partial<GoalV2>;
    existingGoal: GoalV2;
    matchType: "id" | "statement";
  }>;
}

export function ImportExportPanelV2({
  open,
  onOpenChange,
  goals,
  onImport,
  onAuditEvent,
}: ImportExportPanelV2Props) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [importFormat, setImportFormat] = useState<"json" | "csv">("json");
  const [importStep, setImportStep] = useState<
    "upload" | "mapping" | "preview" | "dedup"
  >("upload");
  const [importData, setImportData] = useState<string>("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<CSVFieldMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [dedupStrategy, setDedupStrategy] = useState<DedupStrategy>("skip");
  const [selectedGoals, setSelectedGoals] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Export handlers
  const handleExportJSON = useCallback(() => {
    const dataStr = JSON.stringify(goals, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `goals-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    onAuditEvent?.("goals_exported", {
      format: "json",
      count: goals.length,
      timestamp: Date.now(),
    });
  }, [goals, onAuditEvent]);

  const handleExportCSV = useCallback(() => {
    // Flatten goals to CSV format
    const rows: string[][] = [];

    // Headers
    const headers = [
      "id",
      "category",
      "statement",
      "description",
      "priority",
      "time_horizon",
      "status",
      "start_date",
      "target_date",
      "owners_emails",
      "related_stakeholders",
      "depends_on_ids",
      "kpi_name_1",
      "kpi_target_1",
      "kpi_unit_1",
      "kpi_name_2",
      "kpi_target_2",
      "kpi_unit_2",
      "kpi_name_3",
      "kpi_target_3",
      "kpi_unit_3",
      "tags",
    ];

    rows.push(headers);

    // Data rows
    goals.forEach((goal) => {
      const row = [
        goal.id,
        goal.category,
        goal.statement,
        goal.description || "",
        goal.priority,
        goal.time_horizon,
        goal.status,
        goal.start_date?.toString() || "",
        goal.target_date?.toString() || "",
        goal.owners.map((o) => o.stakeholder_id).join(";"),
        goal.related_stakeholders.join(";"),
        goal.depends_on.join(";"),
        goal.kpis[0]?.name || "",
        goal.kpis[0]?.target_value || "",
        goal.kpis[0]?.unit || "",
        goal.kpis[1]?.name || "",
        goal.kpis[1]?.target_value || "",
        goal.kpis[1]?.unit || "",
        goal.kpis[2]?.name || "",
        goal.kpis[2]?.target_value || "",
        goal.kpis[2]?.unit || "",
        goal.tags.join(";"),
      ];

      rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `goals-export-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    onAuditEvent?.("goals_exported", {
      format: "csv",
      count: goals.length,
      timestamp: Date.now(),
    });
  }, [goals, onAuditEvent]);

  // Import handlers
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);

        if (importFormat === "json") {
          // Skip to preview for JSON
          setImportStep("preview");
          processJSONImport(content);
        } else {
          // Parse CSV headers for mapping
          const lines = content.split("\n");
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/^"|"$/g, ""));
          setCsvHeaders(headers);
          setImportStep("mapping");
          initializeFieldMappings(headers);
        }
      };
      reader.readAsText(file);
    },
    [importFormat]
  );

  const initializeFieldMappings = useCallback((headers: string[]) => {
    const mappings: CSVFieldMapping[] = [];
    const fieldMap: Record<string, string> = {
      id: "id",
      category: "category",
      statement: "statement",
      description: "description",
      priority: "priority",
      time_horizon: "time_horizon",
      status: "status",
      start_date: "start_date",
      target_date: "target_date",
      owners_emails: "owners",
      related_stakeholders: "related_stakeholders",
      depends_on_ids: "depends_on",
      tags: "tags",
    };

    headers.forEach((header) => {
      const normalized = header.toLowerCase().replace(/\s+/g, "_");
      const goalField = fieldMap[normalized] || "";
      mappings.push({ csvColumn: header, goalField });
    });

    setFieldMappings(mappings);
  }, []);

  const processJSONImport = useCallback(
    (content: string) => {
      try {
        const parsed = JSON.parse(content);
        const importedGoals = Array.isArray(parsed) ? parsed : [parsed];

        // Validate
        const validation = validateGoals(importedGoals);
        const circularErrors = detectCircularDependencies(importedGoals);

        // Find duplicates
        const duplicates = findDuplicates(importedGoals, goals);

        setPreview({
          goals: importedGoals,
          errors: [...validation.errors, ...circularErrors],
          warnings: validation.warnings,
          duplicates,
        });

        if (duplicates.length > 0) {
          setImportStep("dedup");
        }
      } catch (error) {
        setPreview({
          goals: [],
          errors: [
            {
              row: 0,
              field: "json",
              message: "Invalid JSON format: " + (error as Error).message,
            },
          ],

          warnings: [],
          duplicates: [],
        });
      }
    },
    [goals]
  );

  const processCSVImport = useCallback(() => {
    const lines = importData.split("\n").slice(1); // Skip header
    const importedGoals: Partial<GoalV2>[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      const values = parseCSVLine(line);
      const goal: Partial<GoalV2> = {};

      fieldMappings.forEach((mapping, idx) => {
        if (!mapping.goalField || idx >= values.length) return;

        const value = values[idx].trim();
        if (!value) return;

        switch (mapping.goalField) {
          case "id":
            goal.id = value;
            break;
          case "category":
            goal.category = value as any;
            break;
          case "statement":
            goal.statement = value;
            break;
          case "description":
            goal.description = value;
            break;
          case "priority":
            goal.priority = value as any;
            break;
          case "time_horizon":
            goal.time_horizon = value as any;
            break;
          case "status":
            goal.status = value as any;
            break;
          case "start_date":
            goal.start_date = parseInt(value) || undefined;
            break;
          case "target_date":
            goal.target_date = parseInt(value) || undefined;
            break;
          case "owners":
            goal.owners = value.split(";").map((id) => ({
              stakeholder_id: id.trim(),
              ownership_percentage: 100,
            }));
            break;
          case "related_stakeholders":
            goal.related_stakeholders = value.split(";").map((s) => s.trim());
            break;
          case "depends_on":
            goal.depends_on = value.split(";").map((s) => s.trim());
            break;
          case "tags":
            goal.tags = value.split(";").map((s) => s.trim());
            break;
        }
      });

      // Parse KPIs from multiple columns
      const kpis: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const nameMapping = fieldMappings.find(
          (m) => m.csvColumn === `kpi_name_${i}`
        );
        const targetMapping = fieldMappings.find(
          (m) => m.csvColumn === `kpi_target_${i}`
        );
        const unitMapping = fieldMappings.find(
          (m) => m.csvColumn === `kpi_unit_${i}`
        );

        if (nameMapping && targetMapping && unitMapping) {
          const nameIdx = fieldMappings.indexOf(nameMapping);
          const targetIdx = fieldMappings.indexOf(targetMapping);
          const unitIdx = fieldMappings.indexOf(unitMapping);

          if (values[nameIdx] && values[targetIdx] && values[unitIdx]) {
            kpis.push({
              name: values[nameIdx].trim(),
              target_value: values[targetIdx].trim(),
              unit: values[unitIdx].trim(),
              current_value: "0",
            });
          }
        }
      }
      goal.kpis = kpis;

      importedGoals.push(goal);
    });

    // Validate
    const validation = validateGoals(importedGoals);
    const circularErrors = detectCircularDependencies(importedGoals);

    // Find duplicates
    const duplicates = findDuplicates(importedGoals, goals);

    setPreview({
      goals: importedGoals,
      errors: [...validation.errors, ...circularErrors],
      warnings: validation.warnings,
      duplicates,
    });

    setImportStep("preview");
    if (duplicates.length > 0) {
      setImportStep("dedup");
    }
  }, [importData, fieldMappings, goals]);

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  };

  const findDuplicates = (
    importedGoals: Partial<GoalV2>[],
    existingGoals: GoalV2[]
  ) => {
    const duplicates: ImportPreview["duplicates"] = [];

    importedGoals.forEach((importGoal) => {
      // Check by ID
      if (importGoal.id) {
        const existing = existingGoals.find((g) => g.id === importGoal.id);
        if (existing) {
          duplicates.push({
            importGoal,
            existingGoal: existing,
            matchType: "id",
          });
          return;
        }
      }

      // Check by statement + category
      if (importGoal.statement && importGoal.category) {
        const existing = existingGoals.find(
          (g) =>
            g.statement.toLowerCase() === importGoal.statement!.toLowerCase() &&
            g.category === importGoal.category
        );
        if (existing) {
          duplicates.push({
            importGoal,
            existingGoal: existing,
            matchType: "statement",
          });
        }
      }
    });

    return duplicates;
  };

  const handleImportCommit = useCallback(async () => {
    if (!preview) return;

    setIsProcessing(true);
    try {
      // Filter out goals with errors
      const validGoals = preview.goals.filter((_, index) => {
        return !preview.errors.some((e) => e.row === index + 1);
      });

      // Apply selection if in dedup mode
      let goalsToImport = validGoals;
      if (preview.duplicates.length > 0) {
        goalsToImport = validGoals.filter((_, index) =>
          selectedGoals.has(index)
        );
      }

      await onImport(goalsToImport as GoalV2[], dedupStrategy);

      onAuditEvent?.("goals_imported", {
        format: importFormat,
        count: goalsToImport.length,
        dedupStrategy,
        timestamp: Date.now(),
      });

      // Reset state
      setImportStep("upload");
      setImportData("");
      setPreview(null);
      setSelectedGoals(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    preview,
    selectedGoals,
    dedupStrategy,
    onImport,
    importFormat,
    onAuditEvent,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import / Export Goals</DialogTitle>
          <DialogDescription>
            Export goals to JSON or CSV, or import from external sources
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <UploadIcon className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Format</CardTitle>
                <CardDescription>
                  Choose the format for exporting your goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="export-json" />

                    <Label
                      htmlFor="export-json"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <FileJsonIcon className="h-4 w-4" />
                      JSON (exact goal_v2 schema)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="export-csv" />

                    <Label
                      htmlFor="export-csv"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <FileTextIcon className="h-4 w-4" />
                      CSV (flat columns)
                    </Label>
                  </div>
                </RadioGroup>

                <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                  <div>
                    <div className="font-medium">
                      {goals.length} goal{goals.length !== 1 ? "s" : ""} ready
                      to export
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exportFormat === "json"
                        ? "Full schema with all fields"
                        : "Flattened format with up to 3 KPIs"}
                    </div>
                  </div>
                  <Button
                    onClick={
                      exportFormat === "json"
                        ? handleExportJSON
                        : handleExportCSV
                    }
                    disabled={goals.length === 0}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export {exportFormat.toUpperCase()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            {importStep === "upload" && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload File</CardTitle>
                  <CardDescription>
                    Select a JSON or CSV file to import goals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Import Format</Label>
                    <RadioGroup
                      value={importFormat}
                      onValueChange={(v) => setImportFormat(v as any)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="json" id="import-json" />

                        <Label
                          htmlFor="import-json"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <FileJsonIcon className="h-4 w-4" />
                          JSON
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="import-csv" />

                        <Label
                          htmlFor="import-csv"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <FileTextIcon className="h-4 w-4" />
                          CSV
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Select File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept={importFormat === "json" ? ".json" : ".csv"}
                      onChange={handleFileUpload}
                    />
                  </div>

                  <Alert>
                    <InfoIcon className="h-4 w-4" />

                    <AlertDescription>
                      {importFormat === "json"
                        ? "JSON files should match the goal_v2 schema exactly"
                        : "CSV files will be mapped to goal fields in the next step"}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {importStep === "mapping" && (
              <Card>
                <CardHeader>
                  <CardTitle>Field Mapping</CardTitle>
                  <CardDescription>
                    Map CSV columns to goal fields
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {fieldMappings.map((mapping, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 gap-4 items-center"
                      >
                        <div className="text-sm font-medium">
                          {mapping.csvColumn}
                        </div>
                        <Select
                          value={mapping.goalField}
                          onValueChange={(value) => {
                            const updated = [...fieldMappings];
                            updated[index].goalField = value;
                            setFieldMappings(updated);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Skip</SelectItem>
                            <SelectItem value="id">ID</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="statement">Statement</SelectItem>
                            <SelectItem value="description">
                              Description
                            </SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                            <SelectItem value="time_horizon">
                              Time Horizon
                            </SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="start_date">
                              Start Date
                            </SelectItem>
                            <SelectItem value="target_date">
                              Target Date
                            </SelectItem>
                            <SelectItem value="owners">Owners</SelectItem>
                            <SelectItem value="related_stakeholders">
                              Related Stakeholders
                            </SelectItem>
                            <SelectItem value="depends_on">
                              Dependencies
                            </SelectItem>
                            <SelectItem value="tags">Tags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setImportStep("upload")}
                    >
                      Back
                    </Button>
                    <Button onClick={processCSVImport}>
                      Continue to Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {importStep === "preview" && preview && (
              <Card>
                <CardHeader>
                  <CardTitle>Import Preview</CardTitle>
                  <CardDescription>
                    Review goals before importing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {preview.goals.length} goals
                    </Badge>
                    {preview.errors.length > 0 && (
                      <Badge variant="destructive">
                        {preview.errors.length} errors
                      </Badge>
                    )}
                    {preview.warnings.length > 0 && (
                      <Badge variant="secondary">
                        {preview.warnings.length} warnings
                      </Badge>
                    )}
                    {preview.duplicates.length > 0 && (
                      <Badge variant="secondary">
                        {preview.duplicates.length} duplicates
                      </Badge>
                    )}
                  </div>

                  {preview.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircleIcon className="h-4 w-4" />

                      <AlertDescription>
                        <div className="font-medium mb-2">
                          Validation Errors:
                        </div>
                        <pre className="text-xs whitespace-pre-wrap">
                          {formatValidationErrors(preview.errors)}
                        </pre>
                      </AlertDescription>
                    </Alert>
                  )}

                  {preview.warnings.length > 0 && (
                    <Alert>
                      <InfoIcon className="h-4 w-4" />

                      <AlertDescription>
                        <div className="font-medium mb-2">Warnings:</div>
                        <div className="space-y-1">
                          {preview.warnings.slice(0, 3).map((w, idx) => (
                            <div key={idx} className="text-xs">
                              Row {w.row}: {w.message}
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Statement</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.goals.slice(0, 10).map((goal, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {goal.statement}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{goal.category}</Badge>
                            </TableCell>
                            <TableCell>{goal.priority}</TableCell>
                            <TableCell>{goal.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setImportStep("upload")}
                    >
                      Cancel
                    </Button>
                    {preview.duplicates.length > 0 ? (
                      <Button onClick={() => setImportStep("dedup")}>
                        Handle Duplicates
                      </Button>
                    ) : (
                      <Button
                        onClick={handleImportCommit}
                        disabled={preview.errors.length > 0 || isProcessing}
                      >
                        {isProcessing ? "Importing..." : "Import Goals"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {importStep === "dedup" && preview && (
              <Card>
                <CardHeader>
                  <CardTitle>Handle Duplicates</CardTitle>
                  <CardDescription>
                    {preview.duplicates.length} duplicate goal
                    {preview.duplicates.length !== 1 ? "s" : ""} found
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>De-duplication Strategy</Label>
                    <RadioGroup
                      value={dedupStrategy}
                      onValueChange={(v) => setDedupStrategy(v as any)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="skip" id="dedup-skip" />

                        <Label htmlFor="dedup-skip" className="cursor-pointer">
                          Skip duplicates (keep existing)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="replace" id="dedup-replace" />

                        <Label
                          htmlFor="dedup-replace"
                          className="cursor-pointer"
                        >
                          Replace existing with imported
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="merge" id="dedup-merge" />

                        <Label htmlFor="dedup-merge" className="cursor-pointer">
                          Merge (update existing fields)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {preview.duplicates.map((dup, index) => (
                      <div
                        key={index}
                        className="p-3 border border-border rounded-md space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedGoals.has(index)}
                              onCheckedChange={(checked) => {
                                const updated = new Set(selectedGoals);
                                if (checked) {
                                  updated.add(index);
                                } else {
                                  updated.delete(index);
                                }
                                setSelectedGoals(updated);
                              }}
                            />

                            <div className="text-sm font-medium">
                              {dup.importGoal.statement}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            Match by {dup.matchType}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground pl-6">
                          Existing: {dup.existingGoal.statement} (
                          {dup.existingGoal.status})
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setImportStep("preview")}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleImportCommit}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Importing..." : "Import Selected"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

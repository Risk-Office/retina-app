import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  EyeIcon,
  KeyboardIcon,
  MousePointerClickIcon,
  ZapIcon,
  PlayIcon,
} from "lucide-react";
import { ThemeProvider } from "@/polymet/components/theme-provider";
import type { ThemeLevel } from "@/polymet/data/theme-tokens";
import {
  runAccessibilityAudit,
  formatAccessibilityReport,
  type AccessibilityReport,
} from "@/polymet/data/accessibility-checker";

interface LevelPreviewProps {
  level: ThemeLevel;
  onRunAudit: (level: ThemeLevel, report: AccessibilityReport) => void;
}

function LevelPreview({ level, onRunAudit }: LevelPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAudit = () => {
    if (!containerRef.current) return;

    setIsRunning(true);
    // Small delay to ensure theme is applied
    setTimeout(() => {
      const report = runAccessibilityAudit(containerRef.current!, level);
      onRunAudit(level, report);
      setIsRunning(false);
    }, 100);
  };

  return (
    <ThemeProvider defaultLevel={level}>
      <div
        ref={containerRef}
        className="h-full flex flex-col bg-background text-foreground"
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold capitalize">{level} Level</h3>
            <Button size="sm" onClick={handleRunAudit} disabled={isRunning}>
              <PlayIcon className="w-4 h-4 mr-2" />

              {isRunning ? "Running..." : "Run Audit"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {level === "basic" && "Friendly, spacious interface for beginners"}
            {level === "intermediate" && "Balanced interface for regular users"}
            {level === "advanced" && "Dense, efficient interface for experts"}
          </p>
        </div>

        {/* Sample Components */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Typography Samples */}
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Text samples at this level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <h1 className="text-4xl font-bold">Heading 1</h1>
                <h2 className="text-3xl font-semibold">Heading 2</h2>
                <h3 className="text-2xl font-semibold">Heading 3</h3>
                <p className="text-base">
                  Body text: The quick brown fox jumps over the lazy dog. This
                  is a sample paragraph to demonstrate text rendering and
                  contrast.
                </p>
                <p className="text-sm text-muted-foreground">
                  Muted text: Secondary information with reduced emphasis.
                </p>
              </CardContent>
            </Card>

            {/* Button Samples */}
            <Card>
              <CardHeader>
                <CardTitle>Interactive Elements</CardTitle>
                <CardDescription>Buttons and controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default Badge</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Form Elements */}
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>Input fields and controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor={`input-${level}`}
                    className="text-sm font-medium"
                  >
                    Text Input
                  </label>
                  <input
                    id={`input-${level}`}
                    type="text"
                    placeholder="Enter text..."
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor={`select-${level}`}
                    className="text-sm font-medium"
                  >
                    Select
                  </label>
                  <select
                    id={`select-${level}`}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Sample */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
                <CardDescription>Tabs and navigation elements</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tab1">
                  <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tab1" className="pt-4">
                    <p className="text-sm">Content for tab 1</p>
                  </TabsContent>
                  <TabsContent value="tab2" className="pt-4">
                    <p className="text-sm">Content for tab 2</p>
                  </TabsContent>
                  <TabsContent value="tab3" className="pt-4">
                    <p className="text-sm">Content for tab 3</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Alert Samples */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>Status messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle2Icon className="h-4 w-4" />

                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Your changes have been saved successfully.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <XCircleIcon className="h-4 w-4" />

                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was a problem processing your request.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </ThemeProvider>
  );
}

interface AuditResultsProps {
  reports: Record<ThemeLevel, AccessibilityReport | null>;
}

function AuditResults({ reports }: AuditResultsProps) {
  const levels: ThemeLevel[] = ["basic", "intermediate", "advanced"];

  const getStatusIcon = (pass: boolean) => {
    return pass ? (
      <CheckCircle2Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
    ) : (
      <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Accessibility Audit Results</h2>
        <p className="text-muted-foreground">
          WCAG AA compliance checks for all three interface levels
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {levels.map((level) => {
          const report = reports[level];
          if (!report) {
            return (
              <Card key={level}>
                <CardHeader>
                  <CardTitle className="capitalize">{level}</CardTitle>
                  <CardDescription>No audit run yet</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Click "Run Audit" to test this level
                  </p>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card
              key={level}
              className={
                report.overallPass ? "border-green-500" : "border-red-500"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{level}</CardTitle>
                  {getStatusIcon(report.overallPass)}
                </div>
                <CardDescription>
                  {report.overallPass
                    ? "All checks passed"
                    : "Some checks failed"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <EyeIcon className="w-4 h-4" />
                    Contrast
                  </span>
                  {getStatusIcon(report.contrast.every((c) => c.pass))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <MousePointerClickIcon className="w-4 h-4" />
                    Focus Order
                  </span>
                  {getStatusIcon(report.focusOrder.pass)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <KeyboardIcon className="w-4 h-4" />
                    Keyboard Nav
                  </span>
                  {getStatusIcon(report.keyboardNav.pass)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ZapIcon className="w-4 h-4" />
                    Reduced Motion
                  </span>
                  {getStatusIcon(report.reducedMotion.pass)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {levels.map((level) => {
          const report = reports[level];
          return (
            <TabsContent key={level} value={level} className="space-y-4">
              {!report ? (
                <Alert>
                  <AlertTriangleIcon className="h-4 w-4" />

                  <AlertTitle>No Audit Data</AlertTitle>
                  <AlertDescription>
                    Run the audit for this level to see detailed results.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Contrast Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <EyeIcon className="w-5 h-5" />
                        Contrast Checks (WCAG AA)
                      </CardTitle>
                      <CardDescription>
                        {report.contrast.filter((c) => c.pass).length} of{" "}
                        {report.contrast.length} passed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.contrast.map((check, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                          >
                            <span>{check.context}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">
                                {check.ratio}:1 (req: {check.required}:1)
                              </span>
                              {getStatusIcon(check.pass)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Focus Order Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MousePointerClickIcon className="w-5 h-5" />
                        Focus Order
                      </CardTitle>
                      <CardDescription>
                        {report.focusOrder.focusableElements} focusable elements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {report.focusOrder.issues.length === 0 ? (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ No issues found
                        </p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {report.focusOrder.issues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <XCircleIcon className="w-4 h-4 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />

                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  {/* Keyboard Navigation Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <KeyboardIcon className="w-5 h-5" />
                        Keyboard Navigation
                      </CardTitle>
                      <CardDescription>
                        Tested:{" "}
                        {report.keyboardNav.testedElements.join(", ") ||
                          "No interactive elements"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {report.keyboardNav.issues.length === 0 ? (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ No issues found
                        </p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {report.keyboardNav.issues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <XCircleIcon className="w-4 h-4 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />

                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reduced Motion Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ZapIcon className="w-5 h-5" />
                        Reduced Motion
                      </CardTitle>
                      <CardDescription>
                        {report.reducedMotion.animatedElements} animated
                        elements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p>
                          Respects preference:{" "}
                          <span
                            className={
                              report.reducedMotion.respectsPreference
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {report.reducedMotion.respectsPreference
                              ? "Yes"
                              : "No"}
                          </span>
                        </p>
                        {report.reducedMotion.pass ? (
                          <p className="text-green-600 dark:text-green-400">
                            ✓ Reduced motion support is working
                          </p>
                        ) : (
                          <p className="text-red-600 dark:text-red-400">
                            ✗ Animations are still running despite user
                            preference
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Raw Report */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Raw Report</CardTitle>
                      <CardDescription>Complete audit output</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 w-full rounded border border-border">
                        <pre className="p-4 text-xs font-mono">
                          {formatAccessibilityReport(report)}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export function ThemeCheckPlayground() {
  const [reports, setReports] = useState<
    Record<ThemeLevel, AccessibilityReport | null>
  >({
    basic: null,
    intermediate: null,
    advanced: null,
  });

  const handleRunAudit = (level: ThemeLevel, report: AccessibilityReport) => {
    setReports((prev) => ({
      ...prev,
      [level]: report,
    }));
  };

  const handleRunAllAudits = () => {
    // Trigger audits for all levels
    const levels: ThemeLevel[] = ["basic", "intermediate", "advanced"];
    levels.forEach((level) => {
      const container = document.querySelector(
        `[data-level="${level}"]`
      ) as HTMLElement;
      if (container) {
        const report = runAccessibilityAudit(container, level);
        handleRunAudit(level, report);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Theme Check Playground
              </h1>
              <p className="text-muted-foreground">
                Preview and test accessibility across all three interface levels
              </p>
            </div>
            <Button onClick={handleRunAllAudits} size="lg">
              <PlayIcon className="w-5 h-5 mr-2" />
              Run All Audits
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="preview">Level Previews</TabsTrigger>
            <TabsTrigger value="results">Audit Results</TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                className="border border-border rounded-lg overflow-hidden h-[800px]"
                data-level="basic"
              >
                <LevelPreview level="basic" onRunAudit={handleRunAudit} />
              </div>
              <div
                className="border border-border rounded-lg overflow-hidden h-[800px]"
                data-level="intermediate"
              >
                <LevelPreview
                  level="intermediate"
                  onRunAudit={handleRunAudit}
                />
              </div>
              <div
                className="border border-border rounded-lg overflow-hidden h-[800px]"
                data-level="advanced"
              >
                <LevelPreview level="advanced" onRunAudit={handleRunAudit} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results">
            <AuditResults reports={reports} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

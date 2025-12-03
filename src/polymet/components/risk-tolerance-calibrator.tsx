import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircleIcon, CheckCircleIcon, TrendingUpIcon } from "lucide-react";
import type {
  UtilityMode,
  UtilitySettings,
} from "@/polymet/data/tenant-settings";

interface RiskQuestion {
  id: string;
  question: string;
  scenario: string;
  optionA: {
    label: string;
    value: number;
    certainty: number;
  };
  optionB: {
    label: string;
    expected: number;
    outcomes: { value: number; probability: number }[];
  };
}

const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: "q1",
    question: "Investment Choice 1",
    scenario: "You have $100,000 to invest. Which option do you prefer?",
    optionA: {
      label: "Guaranteed return of $5,000",
      value: 5000,
      certainty: 1.0,
    },
    optionB: {
      label: "50% chance of $12,000, 50% chance of $0",
      expected: 6000,
      outcomes: [
        { value: 12000, probability: 0.5 },
        { value: 0, probability: 0.5 },
      ],
    },
  },
  {
    id: "q2",
    question: "Investment Choice 2",
    scenario: "You have $50,000 to invest. Which option do you prefer?",
    optionA: {
      label: "Guaranteed return of $2,000",
      value: 2000,
      certainty: 1.0,
    },
    optionB: {
      label: "60% chance of $4,000, 40% chance of $0",
      expected: 2400,
      outcomes: [
        { value: 4000, probability: 0.6 },
        { value: 0, probability: 0.4 },
      ],
    },
  },
  {
    id: "q3",
    question: "Investment Choice 3",
    scenario: "You have $200,000 to invest. Which option do you prefer?",
    optionA: {
      label: "Guaranteed return of $10,000",
      value: 10000,
      certainty: 1.0,
    },
    optionB: {
      label: "70% chance of $15,000, 30% chance of $2,000",
      expected: 11100,
      outcomes: [
        { value: 15000, probability: 0.7 },
        { value: 2000, probability: 0.3 },
      ],
    },
  },
  {
    id: "q4",
    question: "Loss Aversion Test",
    scenario: "You face a potential loss. Which option do you prefer?",
    optionA: {
      label: "Accept a certain loss of $3,000",
      value: -3000,
      certainty: 1.0,
    },
    optionB: {
      label: "50% chance of losing $6,000, 50% chance of losing $0",
      expected: -3000,
      outcomes: [
        { value: -6000, probability: 0.5 },
        { value: 0, probability: 0.5 },
      ],
    },
  },
];

interface RiskToleranceCalibratorProps {
  currentSettings: UtilitySettings;
  onApplySettings: (settings: UtilitySettings) => void;
}

export function RiskToleranceCalibrator({
  currentSettings,
  onApplySettings,
}: RiskToleranceCalibratorProps) {
  const [answers, setAnswers] = useState<Record<string, "A" | "B">>({});
  const [calibrated, setCalibrated] = useState(false);
  const [recommendedCoefficient, setRecommendedCoefficient] = useState<
    number | null
  >(null);
  const [riskProfile, setRiskProfile] = useState<
    "conservative" | "moderate" | "aggressive" | null
  >(null);

  const progress = (Object.keys(answers).length / RISK_QUESTIONS.length) * 100;

  const handleAnswer = (questionId: string, answer: "A" | "B") => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setCalibrated(false);
  };

  const calibrateRiskTolerance = () => {
    // Count risk-seeking vs risk-averse choices
    let riskSeekingScore = 0;
    let totalQuestions = RISK_QUESTIONS.length;

    RISK_QUESTIONS.forEach((q) => {
      const answer = answers[q.id];
      if (!answer) return;

      // Option B is typically the riskier choice (higher variance)
      if (answer === "B") {
        riskSeekingScore++;
      }
    });

    const riskSeekingRatio = riskSeekingScore / totalQuestions;

    // Determine risk profile
    let profile: "conservative" | "moderate" | "aggressive";
    let coefficient: number;

    if (riskSeekingRatio < 0.33) {
      profile = "conservative";
      // Higher risk aversion coefficient
      coefficient = currentSettings.mode === "CARA" ? 0.00001 : 0.8;
    } else if (riskSeekingRatio < 0.67) {
      profile = "moderate";
      // Moderate risk aversion
      coefficient = currentSettings.mode === "CARA" ? 0.000005 : 0.5;
    } else {
      profile = "aggressive";
      // Lower risk aversion coefficient
      coefficient = currentSettings.mode === "CARA" ? 0.000001 : 0.2;
    }

    setRiskProfile(profile);
    setRecommendedCoefficient(coefficient);
    setCalibrated(true);
  };

  const applyRecommendation = () => {
    if (recommendedCoefficient !== null) {
      onApplySettings({
        ...currentSettings,
        a: recommendedCoefficient,
      });
    }
  };

  const resetCalibration = () => {
    setAnswers({});
    setCalibrated(false);
    setRecommendedCoefficient(null);
    setRiskProfile(null);
  };

  const isComplete = Object.keys(answers).length === RISK_QUESTIONS.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Risk Tolerance Calibration
          </CardTitle>
          <CardDescription>
            Answer a series of questions to calibrate your risk aversion
            coefficient
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {Object.keys(answers).length} / {RISK_QUESTIONS.length}{" "}
                questions
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {calibrated && riskProfile && recommendedCoefficient !== null && (
            <div className="p-4 border border-border rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />

                <span className="font-semibold">Calibration Complete</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Risk Profile:
                  </span>
                  <Badge
                    variant={
                      riskProfile === "conservative"
                        ? "destructive"
                        : riskProfile === "moderate"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {riskProfile.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Recommended Coefficient:
                  </span>
                  <span className="font-mono text-sm">
                    {recommendedCoefficient.toExponential(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {riskProfile === "conservative" &&
                    "You prefer certainty and are willing to accept lower returns to avoid risk."}
                  {riskProfile === "moderate" &&
                    "You balance risk and return, accepting moderate uncertainty for better outcomes."}
                  {riskProfile === "aggressive" &&
                    "You are comfortable with high risk and volatility for potentially higher returns."}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={applyRecommendation}
                  size="sm"
                  className="flex-1"
                >
                  Apply Recommendation
                </Button>
                <Button onClick={resetCalibration} size="sm" variant="outline">
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {RISK_QUESTIONS.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                Question {index + 1}: {question.question}
              </CardTitle>
              <CardDescription>{question.scenario}</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[question.id]}
                onValueChange={(value) =>
                  handleAnswer(question.id, value as "A" | "B")
                }
              >
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem
                      value="A"
                      id={`${question.id}-a`}
                      className="mt-1"
                    />

                    <Label
                      htmlFor={`${question.id}-a`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium mb-1">
                        Option A: {question.optionA.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Certain outcome: $
                        {question.optionA.value.toLocaleString()}
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem
                      value="B"
                      id={`${question.id}-b`}
                      className="mt-1"
                    />

                    <Label
                      htmlFor={`${question.id}-b`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium mb-1">
                        Option B: {question.optionB.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expected value: $
                        {question.optionB.expected.toLocaleString()}
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {isComplete && !calibrated && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={calibrateRiskTolerance}
              className="w-full"
              size="lg"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Calculate Risk Tolerance
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

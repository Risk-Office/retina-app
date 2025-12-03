import React from "react";
import { LayeredFrame } from "@/polymet/components/layered-frame";
import { DensityBox, DensityStack } from "@/polymet/components/density-box";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusIcon, CheckCircle2Icon } from "lucide-react";
import {
  GoalSelector,
  type LinkedGoal,
} from "@/polymet/components/goal-selector";

interface DecisionOption {
  id: string;
  label: string;
  score?: number;
  expectedReturn?: number;
  cost?: number;
  mitigationCost?: number;
  horizonMonths?: number;
}

export interface DecisionFormSectionProps {
  title: string;
  description: string;
  linkedGoals: LinkedGoal[];
  options: DecisionOption[];
  selectedOption: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onLinkedGoalsChange: (goals: LinkedGoal[]) => void;
  onAddOption: () => void;
  onUpdateOption: (id: string, label: string) => void;
  onSelectedOptionChange: (optionId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Decision Form Section (Layer 1-2)
 *
 * Wizard-like form for creating decisions with goals, options, and selection
 */
export function DecisionFormSection({
  title,
  description,
  linkedGoals,
  options,
  selectedOption,
  onTitleChange,
  onDescriptionChange,
  onLinkedGoalsChange,
  onAddOption,
  onUpdateOption,
  onSelectedOptionChange,
  onConfirm,
  onCancel,
}: DecisionFormSectionProps) {
  return (
    <LayeredFrame
      sectionTitle="New Decision"
      helpTip="Define your decision by providing a title, description, linking to strategic goals, and listing your options. This helps structure your decision-making process."
    >
      <DensityBox>
        <div>
          <Label htmlFor="title">Decision Title</Label>
          <Input
            id="title"
            placeholder="What decision needs to be made?"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Provide context and details..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <GoalSelector
            selectedGoals={linkedGoals}
            onGoalsChange={onLinkedGoalsChange}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Options</Label>
            <Button variant="outline" size="sm" onClick={onAddOption}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Option
            </Button>
          </div>
          <DensityBox spacing="tight">
            {options.map((option, idx) => (
              <Input
                key={option.id}
                placeholder={`Option ${idx + 1}`}
                value={option.label}
                onChange={(e) => onUpdateOption(option.id, e.target.value)}
              />
            ))}
          </DensityBox>
        </div>

        <div>
          <Label>Choose Your Decision</Label>
          <RadioGroup
            value={selectedOption}
            onValueChange={onSelectedOptionChange}
          >
            <DensityBox spacing="tight">
              {options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />

                  <Label
                    htmlFor={option.id}
                    className="font-normal cursor-pointer"
                  >
                    {option.label || "Unnamed option"}
                  </Label>
                </div>
              ))}
            </DensityBox>
          </RadioGroup>
        </div>

        <DensityStack direction="horizontal" align="center">
          <Button
            onClick={onConfirm}
            disabled={!title || !selectedOption || linkedGoals.length === 0}
            className="flex-1"
          >
            <CheckCircle2Icon className="w-4 h-4 mr-2" />
            Confirm Decision
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DensityStack>
      </DensityBox>
    </LayeredFrame>
  );
}

export default DecisionFormSection;

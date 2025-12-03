import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OwnershipMatrixV2 } from "@/polymet/components/ownership-matrix-v2";
import { StakeholderDetailV2 } from "@/polymet/components/stakeholder-detail-v2";

export function RetinaGoalsMatrix() {
  const navigate = useNavigate();
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<
    string | null
  >(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleGoalClick = (goalId: string) => {
    navigate(`/retina/goals?goal=${goalId}`);
  };

  const handleStakeholderClick = (stakeholderId: string) => {
    setSelectedStakeholderId(stakeholderId);
    setDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <OwnershipMatrixV2
        onGoalClick={handleGoalClick}
        onStakeholderClick={handleStakeholderClick}
      />

      <StakeholderDetailV2
        open={detailOpen}
        onOpenChange={setDetailOpen}
        stakeholderId={selectedStakeholderId}
      />
    </div>
  );
}

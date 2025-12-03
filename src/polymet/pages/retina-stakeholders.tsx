import React, { useState } from "react";
import { StakeholderDirectoryV2 } from "@/polymet/components/stakeholder-directory-v2";
import { StakeholderDetailV2 } from "@/polymet/components/stakeholder-detail-v2";

export function RetinaStakeholders() {
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<
    string | null
  >(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleStakeholderClick = (stakeholderId: string) => {
    setSelectedStakeholderId(stakeholderId);
    setDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <StakeholderDirectoryV2 onStakeholderClick={handleStakeholderClick} />

      <StakeholderDetailV2
        open={detailOpen}
        onOpenChange={setDetailOpen}
        stakeholderId={selectedStakeholderId}
      />
    </div>
  );
}

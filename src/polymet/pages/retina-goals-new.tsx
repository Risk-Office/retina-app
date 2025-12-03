import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTenant } from "@/polymet/data/tenant-context";
import { GoalWizardV2 } from "@/polymet/components/goal-wizard-v2";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export function RetinaGoalsNew() {
  const { tenant } = useTenant();
  const [wizardOpen, setWizardOpen] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Open wizard on mount
  useEffect(() => {
    setWizardOpen(true);
  }, []);

  // Handle wizard close
  const handleWizardClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      setShouldRedirect(true);
    }
  };

  // Handle successful goal creation
  const handleSuccess = () => {
    setShouldRedirect(true);
  };

  // Redirect to goals page if needed
  if (shouldRedirect) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="mb-4">Redirecting to goals...</p>
          <Button asChild>
            <Link to="/retina/goals">Go to Goals</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {!wizardOpen && (
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link to="/retina/goals">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Goals
            </Link>
          </Button>
        </div>
      )}
      <GoalWizardV2
        open={wizardOpen}
        onOpenChange={handleWizardClose}
        tenantId={tenant.tenantId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

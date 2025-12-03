import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpenIcon } from "lucide-react";

interface RetinaFooterProps {
  onGlossaryClick: () => void;
}

export function RetinaFooter({ onGlossaryClick }: RetinaFooterProps) {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Retina Intelligence Suite. All rights
          reserved.
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGlossaryClick}
          className="gap-2"
          aria-label="Open glossary"
        >
          <BookOpenIcon className="w-4 h-4" />
          Glossary
        </Button>
      </div>
    </footer>
  );
}

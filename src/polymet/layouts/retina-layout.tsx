import React, { useState, useEffect } from "react";
import { RetinaSidebar } from "@/polymet/components/retina-sidebar";
import { RetinaHeader } from "@/polymet/components/retina-header";
import { RetinaFooter } from "@/polymet/components/retina-footer";
import { GlossaryModal } from "@/polymet/components/glossary-modal";

interface RetinaLayoutProps {
  children: React.ReactNode;
}

export function RetinaLayout({ children }: RetinaLayoutProps) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [scrollToTerm, setScrollToTerm] = useState<string | undefined>();

  // Global keyboard shortcut: Ctrl+/ or Cmd+/ to open glossary
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setGlossaryOpen(true);
      }
      // ESC to close
      if (e.key === "Escape" && glossaryOpen) {
        setGlossaryOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [glossaryOpen]);

  // Listen for custom event to open glossary to specific term
  useEffect(() => {
    const handleOpenGlossary = (e: CustomEvent) => {
      setScrollToTerm(e.detail.term);
      setGlossaryOpen(true);
    };

    window.addEventListener(
      "open-glossary",
      handleOpenGlossary as EventListener
    );
    return () =>
      window.removeEventListener(
        "open-glossary",
        handleOpenGlossary as EventListener
      );
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <RetinaSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <RetinaHeader />

        <main className="flex-1 overflow-y-auto">{children}</main>

        <RetinaFooter onGlossaryClick={() => setGlossaryOpen(true)} />
      </div>

      {/* Global Glossary Modal */}
      <GlossaryModal
        open={glossaryOpen}
        onOpenChange={(open) => {
          setGlossaryOpen(open);
          if (!open) setScrollToTerm(undefined);
        }}
        scrollToTerm={scrollToTerm}
      />
    </div>
  );
}

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDownIcon, ChevronUpIcon, BellIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleInfoCardProps {
  /**
   * Card title
   */
  title: string;
  /**
   * Card description
   */
  description: string;
  /**
   * Icon component to display in header
   */
  icon?: React.ReactNode;
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Number of items to show in notification badge
   */
  itemCount?: number;
  /**
   * Whether the card is initially collapsed
   */
  defaultCollapsed?: boolean;
  /**
   * Additional actions to show in header (e.g., refresh button)
   */
  headerActions?: React.ReactNode;
  /**
   * Additional className for the card
   */
  className?: string;
}

export function CollapsibleInfoCard({
  title,
  description,
  icon,
  children,
  itemCount = 0,
  defaultCollapsed = true,
  headerActions,
  className,
}: CollapsibleInfoCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {icon}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle>{title}</CardTitle>
                {isCollapsed && itemCount > 0 && (
                  <div className="relative">
                    <BellIcon className="w-5 h-5 text-primary animate-pulse" />

                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {itemCount}
                    </Badge>
                  </div>
                )}
              </div>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="shrink-0"
            >
              {isCollapsed ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronUpIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && <CardContent>{children}</CardContent>}
    </Card>
  );
}

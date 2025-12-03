import { useAuthStore, UserRole } from "@/polymet/data/auth-store";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlertIcon } from "lucide-react";

interface PermissionGuardProps {
  requiredRole: UserRole;
  children: React.ReactNode;
}

export function PermissionGuard({
  requiredRole,
  children,
}: PermissionGuardProps) {
  const { user, hasPermission } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlertIcon className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be logged in to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/retina">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission(requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlertIcon className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Insufficient Permissions</CardTitle>
            <CardDescription>
              You don't have permission to access this page. This page requires{" "}
              <strong>{requiredRole}</strong> role or higher.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              Your current role: <strong>{user.role}</strong>
            </div>
            <div className="flex justify-center">
              <Button asChild>
                <Link to="/retina">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

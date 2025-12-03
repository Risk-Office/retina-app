import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { BellIcon, XIcon, ExternalLinkIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SignalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  signal_id: string;
  signal_label: string;
  change_percent: number;
  affected_decisions: number;
  timestamp: number;
  read: boolean;
}

interface SignalNotificationsProps {
  tenantId: string;
}

/**
 * Get notifications from localStorage
 */
function getNotifications(tenantId: string): SignalNotification[] {
  try {
    const notificationsKey = `retina:notifications:${tenantId}`;
    const data = localStorage.getItem(notificationsKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
function markAsRead(tenantId: string, notificationId: string) {
  try {
    const notificationsKey = `retina:notifications:${tenantId}`;
    const notifications = getNotifications(tenantId);
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem(notificationsKey, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Dismiss notification
 */
function dismissNotification(tenantId: string, notificationId: string) {
  try {
    const notificationsKey = `retina:notifications:${tenantId}`;
    const notifications = getNotifications(tenantId);
    const filtered = notifications.filter((n) => n.id !== notificationId);
    localStorage.setItem(notificationsKey, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to dismiss notification:", error);
  }
}

/**
 * Clear all notifications
 */
function clearAllNotifications(tenantId: string) {
  try {
    const notificationsKey = `retina:notifications:${tenantId}`;
    localStorage.setItem(notificationsKey, JSON.stringify([]));
  } catch (error) {
    console.error("Failed to clear notifications:", error);
  }
}

export function SignalNotifications({ tenantId }: SignalNotificationsProps) {
  const [notifications, setNotifications] = useState<SignalNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Load notifications
    const loadNotifications = () => {
      const notifs = getNotifications(tenantId);
      setNotifications(notifs);
    };

    loadNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [tenantId]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter(
    (n) => n.severity === "critical" && !n.read
  ).length;

  const handleNotificationClick = (notification: SignalNotification) => {
    markAsRead(tenantId, notification.id);
    setNotifications(getNotifications(tenantId));
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    dismissNotification(tenantId, notificationId);
    setNotifications(getNotifications(tenantId));
  };

  const handleClearAll = () => {
    clearAllNotifications(tenantId);
    setNotifications([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="w-5 h-5" />

          {unreadCount > 0 && (
            <Badge
              variant={criticalCount > 0 ? "destructive" : "default"}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Signal Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
              {criticalCount > 0 && ` • ${criticalCount} critical`}
            </p>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />

              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-blue-500/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notification.severity === "critical"
                          ? "bg-red-500"
                          : notification.severity === "warning"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => handleDismiss(e, notification.id)}
                        >
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            notification.severity === "critical"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {notification.signal_label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(
                            Math.abs(notification.change_percent) * 100
                          ).toFixed(1)}
                          % change
                        </Badge>
                        {notification.affected_decisions > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {notification.affected_decisions} decision
                            {notification.affected_decisions !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                        <Link
                          to="/retina/revaluation-tags"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          onClick={() => setOpen(false)}
                        >
                          View Details
                          <ExternalLinkIcon className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

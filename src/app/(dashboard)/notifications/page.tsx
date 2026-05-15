"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api/notifications";
import { Button } from "@/components/ui/button";
import { getRecordRoute } from "@/lib/utils/route";
import { Check, Bell, Calendar as CalendarIcon, Clock, AlertCircle, Info, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"notifications" | "reminders">("notifications");
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 1000 * 60 * 5, // Auto refresh every 5 mins
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => markNotificationRead(id),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => markAllNotificationsRead(),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Handle auto-select first item when data loads or tab changes
  React.useEffect(() => {
    if (data) {
      if (activeTab === "notifications" && data.notifications.length > 0 && !selectedItem) {
        setSelectedItem(data.notifications[0]);
      } else if (activeTab === "reminders" && data.reminders.length > 0 && !selectedItem) {
        setSelectedItem(data.reminders[0]);
      }
    }
  }, [data, activeTab, selectedItem]);

  // Reset selected item when switching tabs
  const handleTabChange = (tab: "notifications" | "reminders") => {
    setActiveTab(tab);
    setSelectedItem(null);
  };

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    if (activeTab === "notifications" && !item.read) {
      markReadMutation.mutate(item.name);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "Alert": return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "Assignment": return <Check className="h-5 w-5 text-emerald-500" />;
      case "System": return <Bell className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const items = activeTab === "notifications" ? (data?.notifications || []) : (data?.reminders || []);

  return (
    <div className="space-y-6 fluid-container h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Notifications Center"
          description="Stay updated on tasks, compliances, and alerts."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="shadow-sm"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", isRefetching && "animate-spin")} />
            Refresh
          </Button>
          {activeTab === "notifications" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || !data?.unread_count}
              className="shadow-sm !bg-primary/80"
            >
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        {/* Left Pane - List */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden h-[80vh]">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted/40 p-2 border-b">
            <button
              onClick={() => handleTabChange("notifications")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                activeTab === "notifications"
                  ? "bg-background text-primary shadow-sm border border-border/50"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Bell className="h-4 w-4" />
              Notifications
              {!!data?.unread_count && (
                <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {data.unread_count}
                </span>
              )}
            </button>
            {/*<button
              onClick={() => handleTabChange("reminders")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                activeTab === "reminders"
                  ? "bg-background text-amber-600 dark:text-amber-400 shadow-sm border border-border/50"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Clock className="h-4 w-4" />
              Reminders
              {!!data?.upcoming_reminders && (
                <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {data.upcoming_reminders}
                </span>
              )}
            </button>*/}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/10">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 animate-pulse bg-card rounded-xl border">
                    <div className="h-10 w-10 bg-muted rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="flex flex-col gap-1.5 p-2">
                {items.map((item: any) => {
                  const isSelected = selectedItem?.name === item.name;
                  const isUnread = activeTab === "notifications" ? !item.read : !item.notified;

                  return (
                    <div
                      key={item.name}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        "p-4 flex gap-4 cursor-pointer transition-all duration-200 border-l-2 rounded-xl border",
                        isSelected
                          ? "bg-primary/5 border-l-primary border-t-primary/10 border-r-primary/10 border-b-primary/10 shadow-sm"
                          : isUnread
                            ? "bg-card border-l-primary/50 hover:bg-muted/50 border-t-transparent border-r-transparent border-b-transparent"
                            : "bg-card border-l-transparent border-t-transparent border-r-transparent border-b-transparent hover:bg-muted/50"
                      )}
                    >
                      {activeTab === "notifications" ? (
                        <>
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                            isSelected && "bg-primary/20"
                          )}>
                            {getNotificationIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm truncate",
                                isUnread ? "font-bold text-foreground" : "font-medium text-foreground/80",
                                isSelected && "text-primary"
                              )}>
                                {item.subject}
                              </h4>
                              {isUnread && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                            </div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                              <span>{item.document_type}</span>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span>{item.creation ? new Date(item.creation).toLocaleDateString() : ""}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isUnread ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground",
                            isSelected && "bg-amber-500/20"
                          )}>
                            <CalendarIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm truncate font-medium",
                                isUnread ? "text-foreground" : "text-foreground/80",
                                isSelected && "text-amber-600 dark:text-amber-400"
                              )}>
                                {item.description}
                              </h4>
                              {isUnread && <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
                            </div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 font-mono">
                              <Clock className="h-3 w-3" />
                              {item.remind_at}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  {activeTab === "notifications" ? (
                    <Bell className="h-8 w-8 text-muted-foreground/40" />
                  ) : (
                    <Clock className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {activeTab === "notifications" ? "All Caught Up!" : "No Reminders"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  {activeTab === "notifications"
                    ? "You don't have any notifications right now."
                    : "You have no upcoming reminders scheduled."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Detail View */}
        <div className="lg:col-span-7 hidden lg:flex flex-col rounded-xl border bg-card shadow-sm h-[80vh] overflow-hidden">
          {selectedItem ? (
            <div className="flex flex-col h-full relative">
              {/* Header */}
              <div className="border-b px-8 py-6 bg-muted/10">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider",
                    activeTab === "notifications" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    {activeTab === "notifications" ? selectedItem.type || "Notification" : "Reminder"}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {activeTab === "notifications"
                      ? selectedItem.creation
                      : selectedItem.remind_at}
                  </div>
                </div>
                <h2 className="text-sm text-foreground leading-tight">
                  {activeTab === "notifications" ? selectedItem.subject : selectedItem.description}
                </h2>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="bg-muted/30 rounded-xl p-6 border border-border/50 space-y-4">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reference Document</p>
                      <p className="text-sm font-medium text-foreground">
                        {activeTab === "notifications" ? selectedItem.document_type : selectedItem.reminder_doctype}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Document ID</p>
                      <p className="text-sm font-medium text-primary cursor-pointer hover:underline" onClick={() => {
                        const doctype = activeTab === "notifications" ? selectedItem.document_type : selectedItem.reminder_doctype;
                        const name = activeTab === "notifications" ? selectedItem.document_name : selectedItem.reminder_docname;
                        if (doctype && name) {
                          window.location.href = getRecordRoute(doctype, name);
                        }
                      }}>
                        {activeTab === "notifications" ? selectedItem.document_name : selectedItem.reminder_docname}
                      </p>
                    </div>
                    {activeTab === "notifications" && selectedItem.from_user && (
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">From User</p>
                        <p className="text-sm font-medium text-foreground">{selectedItem.from_user}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground/80 leading-relaxed">
                    This is an automated {activeTab === "notifications" ? "notification" : "reminder"} generated by the CADesk365 system. Please review the referenced document for more detailed information and required actions.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t p-6 bg-muted/10 flex items-center justify-between">
                <Button variant="outline" className="shadow-sm" onClick={() => {
                  const doctype = activeTab === "notifications" ? selectedItem.document_type : selectedItem.reminder_doctype;
                  const name = activeTab === "notifications" ? selectedItem.document_name : selectedItem.reminder_docname;
                  if (doctype && name) {
                    window.location.href = getRecordRoute(doctype, name);
                  }
                }}>
                  View Document
                </Button>
                {activeTab === "notifications" && !selectedItem.read && (
                  <Button
                    variant="default"
                    className="shadow-sm !bg-primary/90"
                    onClick={() => markReadMutation.mutate(selectedItem.name)}
                    disabled={markReadMutation.isPending}

                  >
                    <Check className="mr-2 h-4 w-4" /> Mark as Read
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                <Info className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No Item Selected</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                Select a {activeTab === "notifications" ? "notification" : "reminder"} from the list on the left to view its full details here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { callMethod } from "./client";
import type { NotificationLog } from "@/types/api";

interface NotificationResponse {
  notifications: NotificationLog[];
  unread_count: number;
  reminders: Array<{
    name: string;
    description: string;
    remind_at: string;
    reminder_doctype: string;
    reminder_docname: string;
    notified: number;
    creation: string;
  }>;
  upcoming_reminders: number;
}

export function getNotifications(): Promise<NotificationResponse> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.get_notifications"
  );
}

export function markNotificationRead(
  name: string
): Promise<{ status: string }> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.mark_notification_read",
    { notification_name: name }
  );
}

export function markAllNotificationsRead(): Promise<{ status: string }> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.mark_all_notifications_read"
  );
}

export function getClientDocuments(client?: string): Promise<{
  documents: Array<any>;
  total: number;
  grouped: Record<string, Array<any>>;
  clients: string[];
}> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.get_client_documents",
    client ? { client } : {}
  );
}

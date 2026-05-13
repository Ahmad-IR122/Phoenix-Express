import { useCallback, useEffect, useState } from "react";
import {
  getMyNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";

const TYPE_CONFIG = {
  merchant_settlement_requested: { type: "warning", icon: "bi-cash-stack" },
  delegate_handover_request_created: { type: "warning", icon: "bi-wallet2" },
  returned_shipment_created: { type: "error", icon: "bi-arrow-counterclockwise" },
  shipment_delivered_by_employee: { type: "success", icon: "bi-check2-circle" },
  shipment_assigned_to_employee: { type: "info", icon: "bi-truck" },
  withdrawal_request_approved: { type: "success", icon: "bi-check-circle" },
  withdrawal_request_rejected: { type: "error", icon: "bi-x-circle" },
  support_message_received: { type: "warning", icon: "bi-chat-dots" },
};

const formatRelativeTime = (value) => {
  if (!value) return "الآن";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "الآن";

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;

  const diffDays = Math.round(diffHours / 24);
  return `منذ ${diffDays} يوم`;
};

const mapNotification = (item) => {
  const config = TYPE_CONFIG[item.type] || { type: "info", icon: "bi-bell" };

  return {
    id: item.id,
    title: item.title,
    body: item.body || "",
    time: formatRelativeTime(item.created_at),
    type: config.type,
    icon: config.icon,
    isRead: Boolean(item.is_read),
    actionUrl: item.action_url || null,
  };
};

export default function useDashboardNotifications({ enabled = true, pollInterval = 30000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [listResponse, countResponse] = await Promise.all([
        getMyNotifications(20),
        getUnreadNotificationsCount(),
      ]);

      setNotifications((listResponse.data || []).map(mapNotification));
      setUnreadCount(Number(countResponse.data?.unreadCount || 0));
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [enabled]);

  useEffect(() => {
    loadNotifications();

    if (!enabled) {
      return undefined;
    }

    const intervalId = window.setInterval(loadNotifications, pollInterval);

    const handleWindowFocus = () => {
      loadNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("phoenix:notifications-refresh", loadNotifications);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("phoenix:notifications-refresh", loadNotifications);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, loadNotifications, pollInterval]);

  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      try {
        await markNotificationAsRead(notificationId);
        await loadNotifications();
      } catch {
        return false;
      }

      return true;
    },
    [loadNotifications]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch {
      return false;
    }

    return true;
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    refreshNotifications: loadNotifications,
    markNotificationAsRead: handleMarkAsRead,
    markAllNotificationsAsRead: handleMarkAllAsRead,
  };
}

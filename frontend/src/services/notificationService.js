import API from "../apis/api";

export async function getMyNotifications(limit = 20) {
  const response = await API.get("/notifications/me", {
    params: { limit },
  });
  return response.data;
}

export async function getUnreadNotificationsCount() {
  const response = await API.get("/notifications/unread-count");
  return response.data;
}

export async function markNotificationAsRead(notificationId) {
  const response = await API.patch(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await API.patch("/notifications/read-all");
  return response.data;
}

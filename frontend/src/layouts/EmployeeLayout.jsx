import React, { useMemo, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../Components/layout/DashboardLayout";
import employeeNav from "../data/employeeNav";
import { getEmployeeSupportConversations } from "../services/supportChatService";
import { getEmployeeNewsletterStatus } from "../services/newsletterService";

const notifications = [
  {
    id: 1,
    title: "طلب جديد بانتظار المراجعة",
    time: "منذ 5 دقائق",
    type: "warning",
    icon: "bi-exclamation-circle",
  },
  {
    id: 2,
    title: "تم تحديث حالة شحنة بنجاح",
    time: "منذ 15 دقيقة",
    type: "info",
    icon: "bi-info-circle",
  },
  {
    id: 3,
    title: "يوجد إشعار يحتاج متابعة",
    time: "منذ 30 دقيقة",
    type: "error",
    icon: "bi-exclamation-octagon",
  },
];

const EMPLOYEE_CHAT_STORAGE_KEY = "phoenix_employee_chat_threads";

const getLocalSupportChatNotifications = () => {
  try {
    const stored = localStorage.getItem(EMPLOYEE_CHAT_STORAGE_KEY);
    const threads = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(threads)) return [];

    return threads
      .filter(
        (thread) =>
          thread.status !== "answered" &&
          !thread.employeeHiddenAt &&
          !thread.employeeHidden &&
          Array.isArray(thread.messages) &&
          thread.messages.some((message) => message.role === "customer" && message.text?.trim())
      )
      .map((thread) => ({
        id: `support-${thread.id}`,
        title: `رسالة جديدة من ${thread.customerName || "عميل"}`,
        time: "بانتظار الرد",
        type: "warning",
        icon: "bi-chat-dots",
      }));
  } catch {
    return [];
  }
};

const routeByKey = {
  dashboard: "/employee/home",
  orders: "/employee/orders",
  supportChats: "/employee/support-chats",
  newsletter: "/employee/newsletter",
  wallet: "/employee/payment",
  profile: "/employee/profile",
};

const keyByPath = {
  "/employee/home": "dashboard",
  "/employee/orders": "orders",
  "/employee/support-chats": "supportChats",
  "/employee/newsletter": "newsletter",
  "/employee/payment": "wallet",
  "/employee/profile": "profile",
};

const brand = {
  name: "Phoenix",
  subtitle: "لوحة الموظف",
  primaryColor: "#38B6FF",
  secondaryColor: "#FFFFFF",
  fontFamily: "Alarabiya, Segoe UI, Tahoma, sans-serif",
};

const getTodayLabel = () =>
  new Intl.DateTimeFormat("ar-PS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

const EmployeeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [supportNotifications, setSupportNotifications] = useState(() =>
    getLocalSupportChatNotifications()
  );
  const [newsletterNotification, setNewsletterNotification] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await getEmployeeSupportConversations();
        const threads = response.data || [];
        setSupportNotifications(
          threads
            .filter(
              (thread) =>
                thread.status !== "answered" &&
                !thread.employeeHiddenAt &&
                !thread.employeeHidden &&
                Array.isArray(thread.messages) &&
                thread.messages.some((message) => message.role === "customer" && message.text?.trim())
            )
            .map((thread) => ({
              id: `support-${thread.id}`,
              title: `رسالة جديدة من ${thread.customerName || "عميل"}`,
              time: "بانتظار الرد",
              type: "warning",
              icon: "bi-chat-dots",
            }))
        );
      } catch {
        setSupportNotifications(getLocalSupportChatNotifications());
      }
    };

    const intervalId = window.setInterval(loadNotifications, 1800);
    loadNotifications();

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadNewsletterStatus = async () => {
      try {
        const response = await getEmployeeNewsletterStatus();
        const data = response.data || {};

        if (data.isSendDue) {
          setNewsletterNotification({
            id: "newsletter-monthly-reminder",
            title: "تذكير إرسال النشرة الشهرية",
            time: "مستحقة الآن",
            type: "warning",
            icon: "bi-envelope-paper",
          });
        } else {
          setNewsletterNotification(null);
        }
      } catch {
        setNewsletterNotification(null);
      }
    };

    const intervalId = window.setInterval(loadNewsletterStatus, 60000);
    loadNewsletterStatus();

    return () => window.clearInterval(intervalId);
  }, []);

  const storedUser = useMemo(() => {
    try {
      const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }, []);

  const activeKey = keyByPath[location.pathname] || "dashboard";

  const user = {
    name: storedUser?.full_name || storedUser?.name || "الموظف",
    email: storedUser?.email || "employee@phoenix.com",
    avatarText:
      (storedUser?.full_name || storedUser?.name || "الموظف").trim().charAt(0) || "م",
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const combinedNotifications = [
    ...(newsletterNotification ? [newsletterNotification] : []),
    ...supportNotifications,
    ...notifications,
  ];

  return (
    <DashboardLayout
      layoutType="employee"
      brand={brand}
      navItems={employeeNav}
      activeKey={activeKey}
      onNavigate={(key) => navigate(routeByKey[key] || "/employee/home")}
      pageDate={getTodayLabel()}
      notificationCount={combinedNotifications.length}
      notifications={combinedNotifications}
      user={user}
      employeeName={user.name}
      onLogout={handleLogout}
    >
      <Outlet />
    </DashboardLayout>
  );
};

export default EmployeeLayout;

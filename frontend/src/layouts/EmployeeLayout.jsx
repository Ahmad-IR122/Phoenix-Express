import React, { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../Components/layout/DashboardLayout";
import employeeNav from "../data/employeeNav";
import useDashboardNotifications from "../hooks/useDashboardNotifications";

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

  const storedUser = useMemo(() => {
    try {
      const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }, []);

  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useDashboardNotifications({
    enabled: storedUser?.role === "employee",
    pollInterval: 5000,
  });

  const activeKey = keyByPath[location.pathname] || "dashboard";
  const resolvedEmployeeName =
    storedUser?.employee?.full_name ||
    storedUser?.full_name ||
    storedUser?.name ||
    "الموظف";

  const user = {
    name: resolvedEmployeeName,
    email: storedUser?.email || "employee@phoenix.com",
    avatarText: resolvedEmployeeName.trim().charAt(0) || "م",
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <DashboardLayout
      layoutType="employee"
      brand={brand}
      navItems={employeeNav}
      activeKey={activeKey}
      onNavigate={(key) => navigate(routeByKey[key] || "/employee/home")}
      pageDate={getTodayLabel()}
      notificationCount={unreadCount}
      notifications={notifications}
      onNotificationClick={(item) => markNotificationAsRead(item.id)}
      onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
      user={user}
      employeeName={user.name}
      onLogout={handleLogout}
    >
      <Outlet />
    </DashboardLayout>
  );
};

export default EmployeeLayout;

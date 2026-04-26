import React, { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../Components/layout/DashboardLayout";
import employeeNav from "../data/employeeNav";

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

const routeByKey = {
  dashboard: "/employee/home",
  orders: "/employee/orders",
  wallet: "/employee/payment",
  profile: "/employee/profile",
};

const keyByPath = {
  "/employee/home": "dashboard",
  "/employee/orders": "orders",
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
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const activeKey = keyByPath[location.pathname] || "dashboard";

  const user = {
    name: storedUser?.full_name || storedUser?.name || "الموظف",
    email: storedUser?.email || "employee@phoenix.com",
    avatarText:
      (storedUser?.full_name || storedUser?.name || "الموظف").trim().charAt(0) ||
      "م",
  };

  return (
    <DashboardLayout
      layoutType="employee"
      brand={brand}
      navItems={employeeNav}
      activeKey={activeKey}
      onNavigate={(key) => navigate(routeByKey[key] || "/employee/home")}
      pageDate={getTodayLabel()}
      notificationCount={notifications.length}
      notifications={notifications}
      user={user}
      employeeName={user.name}
    >
      <Outlet />
    </DashboardLayout>
  );
};

export default EmployeeLayout;

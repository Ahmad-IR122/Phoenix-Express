import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../Components/layout/DashboardLayout";
import adminNav from "../data/adminNav";

const adminNotifications = [
  {
    id: 1,
    title: "تم تسجيل طلب شحن جديد يحتاج مراجعة",
    time: "منذ 5 دقائق",
    type: "warning",
    icon: "bi-exclamation-circle",
  },
  {
    id: 2,
    title: "تمت إضافة مندوب جديد إلى النظام",
    time: "منذ 15 دقيقة",
    type: "info",
    icon: "bi-info-circle",
  },
  {
    id: 3,
    title: "يوجد تقرير يومي بانتظار الاعتماد",
    time: "منذ 30 دقيقة",
    type: "error",
    icon: "bi-exclamation-octagon",
  },
];

const adminRouteByKey = {
  dashboard: "/admin/dashboard",
  shipments: "/admin/parcel-distribution",
  returns: "/admin/returned-shipments",
  traders: "/admin/merchants",
  couriers: "/admin/delegates",
  handover: "/admin/handover-requests",
  reports: "/admin/reports",
  profile: "/admin/profile",
};

const adminNavItems = adminNav
  .filter((item) => adminRouteByKey[item.key])
  .map((item) => ({
    ...item,
    path: adminRouteByKey[item.key],
  }));

const getTodayLabel = () =>
  new Intl.DateTimeFormat("ar-PS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

export default function AdminLayout() {
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

  const activeItem =
    adminNavItems.find((item) => location.pathname.startsWith(item.path)) ||
    adminNavItems[0];

  const user = {
    name: storedUser?.full_name || storedUser?.name || "إدارة النظام",
    email: storedUser?.email || "admin@phoenix.com",
    avatarText:
      (storedUser?.full_name || storedUser?.name || "إدارة النظام").trim().charAt(0) || "إ",
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
      layoutType="admin"
      brand={{
        name: "Phoenix",
        subtitle: "لوحة التحكم",
        primaryColor: "#38B6FF",
        secondaryColor: "#FFFFFF",
        fontFamily: "Alarabiya, Segoe UI, Tahoma, sans-serif",
      }}
      navItems={adminNavItems}
      activeKey={activeItem.key}
      onNavigate={(key) => {
        const targetPath = adminRouteByKey[key];
        if (targetPath) {
          navigate(targetPath);
        }
      }}
      pageDate={getTodayLabel()}
      notificationCount={adminNotifications.length}
      notifications={adminNotifications}
      user={user}
      employeeName={user.name}
      onLogout={handleLogout}
    >
      <Outlet />
    </DashboardLayout>
  );
}

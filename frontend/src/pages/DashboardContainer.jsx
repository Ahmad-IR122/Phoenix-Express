import { useMemo, useState } from "react";
import DashboardLayout from "../Components/layout/DashboardLayout";

import AdminProfilePage from "../features/Admin/pages/AdminProfilePage";
import DashboardPage from "../features/Admin/pages/DashboardPage";
import DelegatesPage from "../features/Admin/pages/DelegatesPage";
import ReturnedShipmentsPage from "../features/Admin/pages/ReturnedShipmentsPage";
import HandoverRequestsPage from "../features/Admin/pages/HandoverRequestsPage";
import MerchantsPage from "../features/Admin/pages/MerchantsPage";
import ParcelDistributionPage from "../features/Admin/pages/ParcelDistributionPage";
import ReportsPage from "../features/Admin/pages/ReportsPage";

import HomePage from "../features/employee/pages/HomePage";
import OrdersPage from "../features/employee/pages/OrdersPage";
import PaymentPage from "../features/employee/pages/PaymentPage";
import ProfilePage from "../features/employee/pages/ProfilePage";

const notifications = [
  {
    id: 1,
    title: "طرد رقم #4521 متأخر في التوصيل",
    time: "منذ 5 دقائق",
    type: "warning",
    icon: "bi-exclamation-circle",
  },
  {
    id: 2,
    title: "مندوب جديد انضم للفريق",
    time: "منذ 15 دقيقة",
    type: "info",
    icon: "bi-info-circle",
  },
  {
    id: 3,
    title: "مرتجع جديد يحتاج معالجة",
    time: "منذ 30 دقيقة",
    type: "error",
    icon: "bi-exclamation-octagon",
  },
];

const adminNav = [
  { key: "dashboard", label: "لوحة التحكم", icon: "bi-grid-1x2" },
  { key: "shipments", label: "توزيع الطرود", icon: "bi-box-seam" },
  { key: "returns", label: "الشحنات المرتجعة", icon: "bi-arrow-return-right" },
  { key: "traders", label: "التجار", icon: "bi-shop" },
  { key: "couriers", label: "المناديب", icon: "bi-people" },
  { key: "handover", label: "تسليم المبالغ", icon: "bi-cash-coin" },
  { key: "reports", label: "التقارير", icon: "bi-file-earmark-text" },
  { key: "profile", label: "الملف الشخصي", icon: "bi-person" },
];

const employeeNav = [
  { key: "dashboard", label: "الرئيسية", icon: "bi-house-door" },
  { key: "orders", label: "الطلبات", icon: "bi-box-seam" },
  { key: "wallet", label: "المحفظة", icon: "bi-wallet2" },
  { key: "profile", label: "الملف الشخصي", icon: "bi-person" },
];

function DashboardContainer() {
  const [layoutType, setLayoutType] = useState("admin");
  const [activeKey, setActiveKey] = useState("dashboard");

  const navItems = layoutType === "admin" ? adminNav : employeeNav;

  const pageTitle = useMemo(() => {
    const current = navItems.find((item) => item.key === activeKey);
    return current ? current.label : "لوحة التحكم";
  }, [activeKey, navItems]);

  const brand =
    layoutType === "admin"
      ? {
          name: "Phoenix",
          subtitle: "لوحة التحكم",
          primaryColor: "#38B6FF",
          secondaryColor: "#FFFFFF",
          fontFamily: "Alarabiya, Segoe UI, Tahoma, sans-serif",
        }
      : {
          name: "Phoenix",
          subtitle: "لوحة الموظف",
          primaryColor: "#38B6FF",
          secondaryColor: "#FFFFFF",
          fontFamily: "Alarabiya, Segoe UI, Tahoma, sans-serif",
        };

  const user =
    layoutType === "admin"
      ? {
          name: "إدارة النظام",
          email: "admin@phoenix.com",
          avatarText: "P",
        }
      : {
          name: "رغد",
          email: "employee@phoenix.com",
          avatarText: "ر",
        };

  const renderAdminPage = () => {
    switch (activeKey) {
      case "dashboard":
        return <DashboardPage />;
      case "shipments":
        return <ParcelDistributionPage />;
      case "returns":
        return <ReturnedShipmentsPage />;
      case "traders":
        return <MerchantsPage />;
      case "couriers":
        return <DelegatesPage />;
      case "reports":
        return <ReportsPage />;
      case "handover":
        return <HandoverRequestsPage />;
      case "profile":
        return <AdminProfilePage />;
      default:
        return <DashboardPage />;
    }
  };

  const renderEmployeePage = () => {
    switch (activeKey) {
      case "dashboard":
        return <HomePage />;
      case "orders":
        return <OrdersPage />;
      case "wallet":
        return <PaymentPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div>
      <div className="phoenix-switcher">
        <button
          type="button"
          className={`phoenix-switch-btn ${
            layoutType === "admin" ? "active" : ""
          }`}
          onClick={() => {
            setLayoutType("admin");
            setActiveKey("dashboard");
          }}
        >
          Admin
        </button>

        <button
          type="button"
          className={`phoenix-switch-btn ${
            layoutType === "employee" ? "active" : ""
          }`}
          onClick={() => {
            setLayoutType("employee");
            setActiveKey("dashboard");
          }}
        >
          Employee
        </button>
      </div>

      <DashboardLayout
        layoutType={layoutType}
        brand={brand}
        navItems={navItems}
        activeKey={activeKey}
        onNavigate={setActiveKey}
        pageTitle={pageTitle}
        pageDate="الأحد، 5 أبريل 2026"
        notificationCount={3}
        notifications={notifications}
        user={user}
        employeeName={user.name}
      >
        {layoutType === "admin" ? renderAdminPage() : renderEmployeePage()}
      </DashboardLayout>
    </div>
  );
}

export default DashboardContainer;

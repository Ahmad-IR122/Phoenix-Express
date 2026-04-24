import { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";

function DashboardLayout({
  layoutType,
  brand,
  navItems,
  activeKey,
  onNavigate,
  pageDate,
  notificationCount,
  notifications,
  user,
  employeeName,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div dir="rtl" className={`phoenix-layout ${layoutType}`}>
      <aside className={`phoenix-sidebar d-none d-xl-flex ${layoutType}`}>
        <DashboardSidebar
          layoutType={layoutType}
          brand={brand}
          navItems={navItems}
          activeKey={activeKey}
          onNavigate={onNavigate}
          user={user}
        />
      </aside>

      <div dir="rtl" className="phoenix-main">
        <DashboardHeader
          layoutType={layoutType}
          notificationCount={notificationCount}
          notifications={notifications}
          customDate={pageDate}
          employeeName={employeeName}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="phoenix-page-content">{children}</main>
      </div>

      <div className={`phoenix-mobile-sidebar ${isSidebarOpen ? "show" : ""}`}>
        <div
          className="phoenix-mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <aside dir="rtl" className={`phoenix-mobile-panel ${layoutType}`}>
          <div className="d-flex justify-content-between align-items-center mb-3 text-end">
            <button
              type="button"
              className="phoenix-icon-btn"
              onClick={() => setIsSidebarOpen(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <strong dir="rtl">{brand.name}</strong>
          </div>

          <DashboardSidebar
            layoutType={layoutType}
            brand={brand}
            navItems={navItems}
            activeKey={activeKey}
            onNavigate={(key) => {
              onNavigate(key);
              setIsSidebarOpen(false);
            }}
            user={user}
          />
        </aside>
      </div>
    </div>
  );
}

export default DashboardLayout;

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
      <aside className={`phoenix-sidebar ${layoutType}`}>
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

      <div
        className={`phoenix-mobile-sidebar ${isSidebarOpen ? "show" : ""}`}
        aria-hidden={!isSidebarOpen}
      >
        <div
          className="phoenix-mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <aside
          dir="rtl"
          className={`phoenix-mobile-panel ${layoutType}`}
          aria-label="القائمة الجانبية"
        >
          <div className="phoenix-mobile-panel__header">
            <button
              type="button"
              className="phoenix-icon-btn"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة الجانبية"
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <strong dir="rtl" className="phoenix-mobile-panel__title">
              {brand.name}
            </strong>
          </div>

          <DashboardSidebar
            layoutType={layoutType}
            brand={brand}
            navItems={navItems}
            activeKey={activeKey}
            onNavigate={onNavigate}
            user={user}
            isMobile
            onClose={() => setIsSidebarOpen(false)}
          />
        </aside>
      </div>
    </div>
  );
}

export default DashboardLayout;

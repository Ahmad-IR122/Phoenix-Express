import { useEffect, useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import "../../styles/dashboard.css";

function DashboardLayout({
  layoutType,
  brand,
  navItems,
  activeKey,
  onNavigate,
  pageDate,
  notificationCount,
  notifications,
  onNotificationClick,
  onMarkAllNotificationsAsRead,
  user,
  employeeName,
  onLogout,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

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
          onNotificationClick={onNotificationClick}
          onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
          customDate={pageDate}
          employeeName={employeeName}
          onLogout={onLogout}
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

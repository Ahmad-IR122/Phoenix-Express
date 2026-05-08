import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboardHeader.css";

function DashboardHeader({
  layoutType = "admin",
  notificationCount = 0,
  notifications = [],
  onNotificationClick,
  onMarkAllNotificationsAsRead,
  customDate,
  employeeName,
  onLogout,
  onOpenSidebar,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const todayDate = useMemo(() => {
    if (customDate) return customDate;

    const now = new Date();
    const weekdays = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];

    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];

    return `${weekdays[now.getDay()]}، ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, [customDate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isEmployeeLayout = layoutType === "employee";
  const headerTitle = isEmployeeLayout
    ? `مرحبًا، ${employeeName || "الموظف"}`
    : "مرحبًا بك في لوحة التحكم";

  const handleItemClick = async (item) => {
    if (onNotificationClick) {
      await onNotificationClick(item);
    }

    if (item.actionUrl) {
      navigate(item.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAll = async () => {
    if (!onMarkAllNotificationsAsRead) return;
    await onMarkAllNotificationsAsRead();
  };

  return (
    <header dir="rtl" className="phoenix-header">
      <div className="phoenix-header-inner">
        <div dir="rtl" className="phoenix-header-copy">
          <h1 className="phoenix-header-title">{headerTitle}</h1>
          <p className="phoenix-header-date">{todayDate}</p>
        </div>

        <div className="phoenix-header-actions" ref={dropdownRef}>
          <button
            type="button"
            className="phoenix-menu-btn"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            <i className="bi bi-list"></i>
          </button>

          {onLogout ? (
            <button
              type="button"
              className="phoenix-bell-btn"
              onClick={onLogout}
              aria-label="Logout"
              title="تسجيل الخروج"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          ) : null}

          <div className="phoenix-header-notification">
            <button
              type="button"
              className="phoenix-bell-btn"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Notifications"
            >
              <i className="bi bi-bell"></i>

              {notificationCount > 0 && (
                <span className="phoenix-bell-badge">{notificationCount}</span>
              )}
            </button>

            {isOpen && (
              <div dir="rtl" className="phoenix-notification-dropdown">
                <div className="phoenix-notification-dropdown-header">
                  <h3>التنبيهات</h3>
                  {notifications.length > 0 && onMarkAllNotificationsAsRead ? (
                    <button
                      type="button"
                      className="phoenix-view-all-btn"
                      onClick={handleMarkAll}
                    >
                      تعليم الكل كمقروء
                    </button>
                  ) : null}
                </div>

                <div className="phoenix-notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="phoenix-notification-item"
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="phoenix-notification-item-text">
                          <div className="phoenix-notification-text">{item.title}</div>
                          <div className="phoenix-notification-time">{item.time}</div>
                        </div>

                        <div className={`phoenix-notification-icon ${item.type || "info"}`}>
                          <i className={`bi ${item.icon || "bi-bell"}`}></i>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="phoenix-notification-empty">لا يوجد تنبيهات حاليًا</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;

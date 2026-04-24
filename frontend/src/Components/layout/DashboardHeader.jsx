import { useMemo, useState, useRef, useEffect } from "react";
import "../../styles/dashboardHeader.css";

function DashboardHeader({
  layoutType = "admin",
  notificationCount = 0,
  notifications = [],
  customDate,
  employeeName,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isEmployeeLayout = layoutType === "employee";
  const headerTitle = isEmployeeLayout
    ? `مرحبًا، ${employeeName || "رغد"}`
    : "مرحبًا بك في لوحة التحكم";

  return (
    <header dir="rtl" className="phoenix-header">
      <div className="phoenix-header-inner">
        <div dir="rtl" className="phoenix-header-copy">
          <h1 className="phoenix-header-title">{headerTitle}</h1>
          <p className="phoenix-header-date">{todayDate}</p>
        </div>

        <div className="phoenix-header-notification" ref={dropdownRef}>
          <button
            type="button"
            className="phoenix-bell-btn"
            onClick={() => setIsOpen((prev) => !prev)}
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
              </div>

              <div className="phoenix-notification-list">
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <div key={item.id} className="phoenix-notification-item">
                      <div className="phoenix-notification-item-text">
                        <div className="phoenix-notification-text">
                          {item.title}
                        </div>
                        <div className="phoenix-notification-time">
                          {item.time}
                        </div>
                      </div>

                      <div
                        className={`phoenix-notification-icon ${
                          item.type || "info"
                        }`}
                      >
                        <i className={`bi ${item.icon || "bi-bell"}`}></i>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="phoenix-notification-empty">
                    لا يوجد تنبيهات حالياً
                  </div>
                )}
              </div>

              <button type="button" className="phoenix-view-all-btn">
                عرض جميع التنبيهات
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;

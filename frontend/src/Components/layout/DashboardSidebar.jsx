import "../../styles/sidebar.css";
import logo from "../../Images/Phonex_logo.jpeg";

function DashboardSidebar({
  layoutType = "admin",
  brand,
  navItems,
  activeKey,
  onNavigate,
  user,
  isMobile = false,
  onClose,
}) {
  return (
    <div
      dir="rtl"
      className={`phoenix-sidebar-shell ${layoutType} ${
        isMobile ? "is-mobile" : "is-desktop"
      }`}
    >
      <div className="phoenix-sidebar-top">
        <div className="phoenix-brand-block">
          <div className="phoenix-brand-avatar">
            <img src={logo} alt="Phoenix logo" className="phoenix-brand-logo" />
          </div>

          <div className="phoenix-brand-text text-end">
            <h2 className="phoenix-brand-title">{brand.name}</h2>
            <p className="phoenix-brand-subtitle">{brand.subtitle}</p>
          </div>
        </div>

        <nav
          dir="rtl"
          className="phoenix-nav-list"
          aria-label={layoutType === "admin" ? "التنقل الإداري" : "تنقل الموظف"}
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`phoenix-nav-item ${activeKey === item.key ? "active" : ""}`}
              onClick={() => {
                onNavigate(item.key);
                onClose?.();
              }}
              aria-current={activeKey === item.key ? "page" : undefined}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {user ? (
        <div className="phoenix-sidebar-user" dir="rtl">
          <div dir="rtl" className="phoenix-sidebar-user-text text-end">
            <div className="phoenix-user-name">{user.name}</div>
            <div className="phoenix-user-email">{user.email}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardSidebar;

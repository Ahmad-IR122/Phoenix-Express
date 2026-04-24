import "../../styles/sidebar.css";

function DashboardSidebar({
  layoutType = "admin",
  brand,
  navItems,
  activeKey,
  onNavigate,
  user,
}) {
  return (
    <aside dir="rtl" className={`phoenix-sidebar-shell ${layoutType}`}>
      <div className="phoenix-sidebar-top">
        <div className="phoenix-brand-block">
          <div className="phoenix-brand-avatar">
            {brand.avatarText || "P"}
          </div>

          <div className="phoenix-brand-text text-end">
            <h2 className="phoenix-brand-title">{brand.name}</h2>
            <p className="phoenix-brand-subtitle">{brand.subtitle}</p>
          </div>
        </div>

        <nav dir="rtl" className="phoenix-nav-list">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`phoenix-nav-item ${
                activeKey === item.key ? "active" : ""
              }`}
              onClick={() => onNavigate(item.key)}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {user && (
        <div className="phoenix-sidebar-user">
          <div dir="rtl" className="phoenix-sidebar-user-text text-end">
            <div className="phoenix-user-name">{user.name}</div>
            <div className="phoenix-user-email">{user.email}</div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default DashboardSidebar;

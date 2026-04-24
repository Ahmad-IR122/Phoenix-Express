function StatCard({ value, title, icon, gradientClass }) {
  return (
    <div className={`phoenix-stat-card ${gradientClass}`}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <i className={`bi ${icon} phoenix-stat-icon`}></i>
        <span className="phoenix-stat-value">{value}</span>
      </div>

      <div className="text-end">
        <p className="phoenix-stat-title mb-0">{title}</p>
      </div>
    </div>
  );
}

export default StatCard;
function EmptyStateCard({ title, subtitle, icon }) {
  return (
    <div className="phoenix-placeholder-card text-center">
      <div className="phoenix-placeholder-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

export default EmptyStateCard;
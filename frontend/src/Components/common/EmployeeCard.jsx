function EmployeeCard({ member }) {
  return (
    <article className="phoenix-employee-card">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="phoenix-avatar">{member.initials}</div>

        <div className="text-end flex-grow-1 me-3">
          <div className="d-flex justify-content-between align-items-start gap-2 flex-row-reverse">
            <div>
              <h3 className="phoenix-employee-name">{member.name}</h3>
              <span className="phoenix-role-chip">{member.role}</span>
            </div>

            {member.active && (
              <span className="phoenix-status-chip">نشط</span>
            )}
          </div>
        </div>
      </div>

      <ul className="phoenix-meta-list">
        <li>
          <i className="bi bi-envelope"></i>
          <span>{member.email}</span>
        </li>
        <li>
          <i className="bi bi-telephone"></i>
          <span>{member.phone}</span>
        </li>
        <li>
          <i className="bi bi-geo-alt"></i>
          <span>{member.city}</span>
        </li>
      </ul>

      <div className="phoenix-join-date text-end">
        تاريخ الانضمام: {member.joinedAt}
      </div>
    </article>
  );
}

export default EmployeeCard;
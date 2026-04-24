import React, { useState } from "react";
import "./AdminProfilePage.css";

const initialProfile = {
  fullName: "إدارة النظام",
  jobTitle: "مدير النظام",
  phone: "0599 555 120",
  email: "admin@phoenix.com",
  office: "رام الله - المقر الرئيسي",
  role: "Super Admin",
  lastLogin: "2026-04-24 09:30",
  avatarInitials: "PS",
};

const activityItems = [
  { id: 1, label: "اعتماد تقرير يومي", time: "منذ 15 دقيقة" },
  { id: 2, label: "مراجعة مرتجع جديد", time: "منذ 40 دقيقة" },
  { id: 3, label: "تحديث بيانات تاجر", time: "اليوم 08:10" },
];

function AdminProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const profileFields = [
    { key: "phone", label: "رقم الهاتف", icon: "bi-telephone" },
    { key: "email", label: "البريد الإلكتروني", icon: "bi-envelope" },
    { key: "office", label: "المكتب", icon: "bi-geo-alt" },
  ];

  const accountFields = [
    { key: "role", label: "الصلاحية", icon: "bi-shield-check" },
    { key: "lastLogin", label: "آخر تسجيل دخول", icon: "bi-clock-history" },
  ];

  const handleDraftChange = (key, value) => {
    setDraftProfile((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const startEdit = () => {
    setDraftProfile(profile);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  const saveEdit = () => {
    setProfile((current) => ({
      ...current,
      phone: draftProfile.phone,
      email: draftProfile.email,
      office: draftProfile.office,
    }));
    setIsEditing(false);
  };

  const handlePasswordChange = (key, value) => {
    setPasswordDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (
      !passwordDraft.currentPassword ||
      !passwordDraft.newPassword ||
      !passwordDraft.confirmPassword
    ) {
      setPasswordError("يرجى تعبئة جميع حقول كلمة المرور.");
      return;
    }

    if (passwordDraft.newPassword.length < 6) {
      setPasswordError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      setPasswordError("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setPasswordDraft({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordMessage("تم تحديث كلمة المرور بنجاح.");
    setIsPasswordOpen(false);
  };

  return (
    <div className="admin-profile-page" dir="rtl">
      <section className="admin-profile-page__hero">
        <div className="admin-profile-page__hero-main">
          <div className="admin-profile-page__avatar">
            <span>{profile.avatarInitials}</span>
          </div>

          <div className="admin-profile-page__hero-copy">
            <div className="admin-profile-page__identity">
              <h1 className="admin-profile-page__name">{profile.fullName}</h1>
              <p className="admin-profile-page__job">{profile.jobTitle}</p>
            </div>
          </div>
        </div>

        <div className="admin-profile-page__hero-actions">
          <button
            type="button"
            className="admin-profile-page__action-btn admin-profile-page__action-btn--secondary"
            onClick={() => setIsPasswordOpen((prev) => !prev)}
          >
            <i className="bi bi-shield-lock"></i>
            {isPasswordOpen ? "إغلاق كلمة المرور" : "تغيير كلمة المرور"}
          </button>

          {isEditing ? (
            <>
              <button
                type="button"
                className="admin-profile-page__action-btn admin-profile-page__action-btn--ghost"
                onClick={cancelEdit}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="admin-profile-page__action-btn"
                onClick={saveEdit}
              >
                حفظ
              </button>
            </>
          ) : (
            <button
              type="button"
              className="admin-profile-page__action-btn"
              onClick={startEdit}
            >
              <i className="bi bi-pencil-square"></i>
              تعديل
            </button>
          )}
        </div>
      </section>

      {isPasswordOpen && (
        <section className="admin-profile-page__card admin-profile-page__card--password">
          <div className="admin-profile-page__section-head">
            <h3 className="admin-profile-page__section-title">تغيير كلمة المرور</h3>
          </div>

          <form className="admin-profile-page__password-grid" onSubmit={handlePasswordSubmit}>
            <div className="admin-profile-page__field">
              <label className="admin-profile-page__info-label">كلمة المرور الحالية</label>
              <input
                type="password"
                className="admin-profile-page__input"
                value={passwordDraft.currentPassword}
                onChange={(event) => handlePasswordChange("currentPassword", event.target.value)}
              />
            </div>

            <div className="admin-profile-page__field">
              <label className="admin-profile-page__info-label">كلمة المرور الجديدة</label>
              <input
                type="password"
                className="admin-profile-page__input"
                value={passwordDraft.newPassword}
                onChange={(event) => handlePasswordChange("newPassword", event.target.value)}
              />
            </div>

            <div className="admin-profile-page__field admin-profile-page__field--wide">
              <label className="admin-profile-page__info-label">تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                className="admin-profile-page__input"
                value={passwordDraft.confirmPassword}
                onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
              />
            </div>

            <div className="admin-profile-page__password-actions">
              <button type="submit" className="admin-profile-page__action-btn">
                <i className="bi bi-shield-lock"></i>
                تحديث كلمة المرور
              </button>
            </div>

            {passwordError ? (
              <p className="admin-profile-page__password-message admin-profile-page__password-message--error">
                {passwordError}
              </p>
            ) : null}

            {passwordMessage ? (
              <p className="admin-profile-page__password-message">{passwordMessage}</p>
            ) : null}
          </form>
        </section>
      )}

      <section className="admin-profile-page__grid">
        <article className="admin-profile-page__card">
          <div className="admin-profile-page__section-head">
            <h3 className="admin-profile-page__section-title">المعلومات الشخصية</h3>
          </div>

          <div className="admin-profile-page__info-list">
            {profileFields.map((item) => (
              <div key={item.key} className="admin-profile-page__info-item">
                <div className="admin-profile-page__info-icon">
                  <i className={`bi ${item.icon}`}></i>
                </div>

                <div className="admin-profile-page__info-copy">
                  <p className="admin-profile-page__info-label">{item.label}</p>
                  {isEditing ? (
                    <input
                      type="text"
                      className="admin-profile-page__input"
                      value={draftProfile[item.key]}
                      onChange={(event) =>
                        handleDraftChange(item.key, event.target.value)
                      }
                    />
                  ) : (
                    <p className="admin-profile-page__info-value">
                      {profile[item.key]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-profile-page__card">
          <div className="admin-profile-page__section-head">
            <h3 className="admin-profile-page__section-title">معلومات الحساب</h3>
          </div>

          <div className="admin-profile-page__info-list">
            {accountFields.map((item) => (
              <div key={item.key} className="admin-profile-page__info-item">
                <div className="admin-profile-page__info-icon admin-profile-page__info-icon--accent">
                  <i className={`bi ${item.icon}`}></i>
                </div>

                <div className="admin-profile-page__info-copy">
                  <p className="admin-profile-page__info-label">{item.label}</p>
                  <p className="admin-profile-page__info-value">
                    {profile[item.key]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-profile-page__card">
        <div className="admin-profile-page__section-head">
          <h3 className="admin-profile-page__section-title">آخر النشاطات</h3>
        </div>

        <div className="admin-profile-page__activity-list">
          {activityItems.map((item) => (
            <div key={item.id} className="admin-profile-page__activity-item">
              <div className="admin-profile-page__activity-dot"></div>
              <div className="admin-profile-page__activity-copy">
                <p className="admin-profile-page__activity-label">{item.label}</p>
                <p className="admin-profile-page__activity-time">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminProfilePage;

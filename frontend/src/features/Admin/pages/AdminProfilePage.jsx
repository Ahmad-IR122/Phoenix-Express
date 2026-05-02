import React, { useEffect, useMemo, useState } from "react";
import {
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile,
} from "../services/adminService";
import "../../employee/pages/profilePage.css";

const mapProfileToForm = (data) => ({
  email: data?.user?.email || "",
  phone: data?.user?.phone || "",
});

function AdminProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(() => mapProfileToForm(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState({ message: "", type: "" });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminProfile();
      const nextProfile = response?.data || null;
      setProfile(nextProfile);
      setForm(mapProfileToForm(nextProfile));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "تعذر تحميل الملف الشخصي للإدارة.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (feedback.type !== "success" || !feedback.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback({ message: "", type: "" });
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (passwordFeedback.type !== "success" || !passwordFeedback.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsPasswordModalOpen(false);
      setPasswordFeedback({ message: "", type: "" });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [passwordFeedback]);

  const profileRows = useMemo(
    () => [
      { label: "البريد الإلكتروني", field: "email", value: profile?.user?.email || "-" },
      { label: "رقم الهاتف", field: "phone", value: profile?.user?.phone || "-" },
      { label: "الدور", value: profile?.user?.role || "admin", readOnly: true },
      { label: "الحالة", value: profile?.is_active ? "نشط" : "غير نشط", readOnly: true },
    ],
    [profile]
  );

  const startEditing = () => {
    setForm(mapProfileToForm(profile));
    setFeedback({ message: "", type: "" });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setForm(mapProfileToForm(profile));
    setFeedback({ message: "", type: "" });
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      setFeedback({ message: "", type: "" });
      const response = await updateAdminProfile(form);
      const nextProfile = response?.data || null;
      setProfile(nextProfile);
      setForm(mapProfileToForm(nextProfile));
      setIsEditing(false);
      setFeedback({
        message: response?.message || "تم تحديث بيانات الإدارة بنجاح.",
        type: "success",
      });
    } catch (requestError) {
      setFeedback({
        message: requestError?.response?.data?.message || "تعذر تحديث بيانات الإدارة.",
        type: "error",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordFeedback({ message: "", type: "" });
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (isSavingPassword) return;
    setIsPasswordModalOpen(false);
    setPasswordFeedback({ message: "", type: "" });
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSavingPassword(true);
      setPasswordFeedback({ message: "", type: "" });
      const response = await changeAdminPassword(passwordForm);
      setPasswordFeedback({
        message: response?.message || "تم تغيير كلمة المرور بنجاح.",
        type: "success",
      });
    } catch (requestError) {
      setPasswordFeedback({
        message: requestError?.response?.data?.message || "تعذر تغيير كلمة المرور.",
        type: "error",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-profile-page" dir="rtl">
        <section className="employee-profile-page__section-card employee-profile-page__state-card">
          <h2 className="employee-profile-page__empty-title">جاري تحميل الملف الشخصي</h2>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-profile-page" dir="rtl">
        <section className="employee-profile-page__section-card employee-profile-page__state-card">
          <h2 className="employee-profile-page__empty-title">تعذر تحميل الملف الشخصي</h2>
          <p className="employee-profile-page__empty-text">{error}</p>
          <button type="button" className="employee-profile-page__upload-btn" onClick={loadProfile}>
            إعادة المحاولة
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="employee-profile-page" dir="rtl">
      <section className="employee-profile-page__hero">
        <div className="employee-profile-page__hero-main">
          <div className="employee-profile-page__avatar">
            <span>إد</span>
          </div>
          <div className="employee-profile-page__hero-copy">
            <div className="employee-profile-page__identity">
              <h1 className="employee-profile-page__name">الملف الشخصي للإدارة</h1>
              <p className="employee-profile-page__job">عرض معلومات الحساب وتحديثها وإدارة كلمة المرور</p>
            </div>
          </div>
        </div>
        <div className="employee-profile-page__hero-actions">
          <button
            type="button"
            className="employee-profile-page__hero-secondary-btn"
            onClick={openPasswordModal}
          >
            <i className="bi bi-shield-lock"></i>
            <span>تغيير كلمة المرور</span>
          </button>
        </div>
      </section>

      {feedback.message ? (
        <p
          className={`employee-profile-page__upload-message ${
            feedback.type === "error" ? "employee-profile-page__password-message--error" : ""
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <section className="employee-profile-page__details-grid employee-profile-page__details-grid--single">
        <article className="employee-profile-page__section-card">
          <div className="employee-profile-page__section-head">
            <div>
              <h3 className="employee-profile-page__section-title">بيانات الحساب</h3>
            </div>
            <div className="employee-profile-page__section-actions">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    className="employee-profile-page__section-link"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? "جارٍ الحفظ..." : "حفظ"}
                  </button>
                  <button
                    type="button"
                    className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
                    onClick={cancelEditing}
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="employee-profile-page__section-link"
                  onClick={startEditing}
                >
                  تعديل
                </button>
              )}
              <div className="employee-profile-page__section-icon">
                <i className="bi bi-person-badge"></i>
              </div>
            </div>
          </div>

          <div className="employee-profile-page__info-list">
            {profileRows.map((row) => (
              <div key={row.label} className="employee-profile-page__info-item">
                <p className="employee-profile-page__info-label">{row.label}</p>
                {isEditing && row.field && !row.readOnly ? (
                  <input
                    className="employee-profile-page__input"
                    type={row.field === "email" ? "email" : "text"}
                    value={form[row.field] || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [row.field]: event.target.value,
                      }))
                    }
                  />
                ) : (
                  <p className="employee-profile-page__info-value">{row.value}</p>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

      {isPasswordModalOpen ? (
        <div className="employee-profile-page__modal-overlay" onClick={closePasswordModal}>
          <div className="employee-profile-page__modal" onClick={(event) => event.stopPropagation()}>
            <div className="employee-profile-page__modal-head">
              <div>
                <h3 className="employee-profile-page__section-title">تغيير كلمة المرور</h3>
                <p className="employee-profile-page__section-subtitle">
                  أدخل كلمة المرور الحالية ثم كلمة المرور الجديدة مع التأكيد.
                </p>
              </div>
              <button
                type="button"
                className="employee-profile-page__modal-close"
                onClick={closePasswordModal}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="employee-profile-page__form-grid" onSubmit={handlePasswordSubmit}>
              <input
                className="employee-profile-page__input"
                type="password"
                placeholder="كلمة المرور الحالية"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
              />
              <input
                className="employee-profile-page__input"
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                }
              />
              <input
                className="employee-profile-page__input employee-profile-page__field--wide"
                type="password"
                placeholder="تأكيد كلمة المرور الجديدة"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
              {passwordFeedback.message ? (
                <p
                  className={`employee-profile-page__password-message ${
                    passwordFeedback.type === "error"
                      ? "employee-profile-page__password-message--error"
                      : ""
                  }`}
                >
                  {passwordFeedback.message}
                </p>
              ) : null}
              <div className="employee-profile-page__password-actions">
                <button
                  type="submit"
                  className="employee-profile-page__upload-btn"
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button
                  type="button"
                  className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
                  onClick={closePasswordModal}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminProfilePage;

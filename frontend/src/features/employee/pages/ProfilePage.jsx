import React, { useState } from "react";
import "./profilePage.css";

const initialProfile = {
  fullName: "أحمد محمد",
  jobTitle: "موظف توصيل",
  phone: "0599 123 456",
  email: "ahmad.driver@phoenix.ps",
  address: "نابلس - رفيديا - شارع الجامعة",
  vehicleType: "دراجة نارية",
  licenseNumber: "DL-44291",
  plateNumber: "21-845-7",
  avatarInitials: "أم",
};

const initialDocuments = [
  {
    id: 1,
    name: "رخصة القيادة",
    expiryDate: "2026-12-18",
    status: "سارية",
    tone: "valid",
    fileName: "driving-license.pdf",
  },
  {
    id: 2,
    name: "تأمين المركبة",
    expiryDate: "2026-05-08",
    status: "تنتهي قريبًا",
    tone: "warning",
    fileName: "vehicle-insurance.pdf",
  },
  {
    id: 3,
    name: "الهوية الشخصية",
    expiryDate: "2025-11-02",
    status: "منتهية",
    tone: "expired",
    fileName: "national-id.pdf",
  },
];

const getDocumentStatus = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "منتهية", tone: "expired" };
  }

  if (diffDays <= 30) {
    return { status: "تنتهي قريبًا", tone: "warning" };
  }

  return { status: "سارية", tone: "valid" };
};

function EmployeeProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [documents, setDocuments] = useState(initialDocuments);
  const [isPersonalEditing, setIsPersonalEditing] = useState(false);
  const [isVehicleEditing, setIsVehicleEditing] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState(null);
  const [documentDraft, setDocumentDraft] = useState({
    name: "",
    expiryDate: "",
    file: null,
  });
  const [newDocumentDraft, setNewDocumentDraft] = useState({
    name: "",
    expiryDate: "",
    file: null,
  });
  const [documentMessage, setDocumentMessage] = useState("");
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const personalFields = [
    { key: "phone", label: "رقم الهاتف", icon: "bi-telephone" },
    { key: "email", label: "البريد الإلكتروني", icon: "bi-envelope" },
    { key: "address", label: "العنوان", icon: "bi-geo-alt" },
  ];

  const vehicleFields = [
    { key: "vehicleType", label: "نوع المركبة", icon: "bi-truck" },
    { key: "licenseNumber", label: "رقم الرخصة", icon: "bi-card-text" },
    { key: "plateNumber", label: "رقم اللوحة", icon: "bi-upc-scan" },
  ];

  const handleDraftChange = (key, value) => {
    setDraftProfile((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const startEdit = (section) => {
    setDraftProfile(profile);
    if (section === "personal") {
      setIsPersonalEditing(true);
    }
    if (section === "vehicle") {
      setIsVehicleEditing(true);
    }
  };

  const cancelEdit = (section) => {
    setDraftProfile(profile);
    if (section === "personal") {
      setIsPersonalEditing(false);
    }
    if (section === "vehicle") {
      setIsVehicleEditing(false);
    }
  };

  const saveEdit = (section, keys) => {
    setProfile((current) => {
      const nextProfile = { ...current };
      keys.forEach((key) => {
        nextProfile[key] = draftProfile[key];
      });
      return nextProfile;
    });

    if (section === "personal") {
      setIsPersonalEditing(false);
    }
    if (section === "vehicle") {
      setIsVehicleEditing(false);
    }
  };

  const startDocumentEdit = (document) => {
    setActiveDocumentId(document.id);
    setDocumentDraft({
      name: document.name,
      expiryDate: document.expiryDate,
      file: null,
    });
    setDocumentMessage("");
  };

  const cancelDocumentEdit = () => {
    setActiveDocumentId(null);
    setDocumentDraft({
      name: "",
      expiryDate: "",
      file: null,
    });
  };

  const saveDocumentEdit = (documentId) => {
    if (!documentDraft.name || !documentDraft.expiryDate || !documentDraft.file) {
      setDocumentMessage("لازم تعبئة اسم الوثيقة وتاريخ الانتهاء واختيار ملف للتحديث.");
      return;
    }

    const nextStatus = getDocumentStatus(documentDraft.expiryDate);

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              name: documentDraft.name,
              expiryDate: documentDraft.expiryDate,
              fileName: documentDraft.file.name,
              status: nextStatus.status,
              tone: nextStatus.tone,
            }
          : document
      )
    );

    setDocumentMessage("تم تحديث الوثيقة وبياناتها بنجاح.");
    cancelDocumentEdit();
  };

  const addNewDocument = () => {
    if (!newDocumentDraft.name || !newDocumentDraft.expiryDate || !newDocumentDraft.file) {
      setDocumentMessage("لرفع وثيقة جديدة يجب إدخال الاسم وتاريخ الانتهاء واختيار الملف.");
      return;
    }

    const nextStatus = getDocumentStatus(newDocumentDraft.expiryDate);

    setDocuments((current) => [
      {
        id: Date.now(),
        name: newDocumentDraft.name,
        expiryDate: newDocumentDraft.expiryDate,
        fileName: newDocumentDraft.file.name,
        status: nextStatus.status,
        tone: nextStatus.tone,
      },
      ...current,
    ]);

    setNewDocumentDraft({
      name: "",
      expiryDate: "",
      file: null,
    });
    setDocumentMessage("تم رفع الوثيقة الجديدة وإضافتها للقائمة.");
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
    <div className="employee-profile-page" dir="rtl">
      <section className="employee-profile-page__hero">
        <div className="employee-profile-page__hero-main">
          <div className="employee-profile-page__avatar">
            <span>{profile.avatarInitials}</span>
          </div>

          <div className="employee-profile-page__hero-copy">
            <div className="employee-profile-page__identity">
              <h1 className="employee-profile-page__name">{profile.fullName}</h1>
              <p className="employee-profile-page__job">{profile.jobTitle}</p>
            </div>
          </div>
        </div>

        <div className="employee-profile-page__hero-actions">
          <button
            type="button"
            className="employee-profile-page__hero-secondary-btn"
            onClick={() => setIsPasswordOpen((prev) => !prev)}
          >
            <i className="bi bi-shield-lock"></i>
            {isPasswordOpen ? "إغلاق كلمة المرور" : "تغيير كلمة المرور"}
          </button>

          <button
            type="button"
            className="employee-profile-page__edit-btn"
            onClick={() => startEdit("personal")}
          >
            <i className="bi bi-pencil-square"></i>
            تعديل
          </button>
        </div>
      </section>

      {isPasswordOpen && (
        <section className="employee-profile-page__section-card employee-profile-page__section-card--password">
          <div className="employee-profile-page__section-head">
            <div>
              <h3 className="employee-profile-page__section-title">تغيير كلمة المرور</h3>
              <p className="employee-profile-page__section-subtitle">
                حدّث كلمة المرور الخاصة بحسابك بشكل آمن.
              </p>
            </div>
          </div>

          <form className="employee-profile-page__form-grid" onSubmit={handlePasswordSubmit}>
            <div className="employee-profile-page__field">
              <label className="employee-profile-page__info-label">كلمة المرور الحالية</label>
              <input
                type="password"
                className="employee-profile-page__input"
                value={passwordDraft.currentPassword}
                onChange={(event) => handlePasswordChange("currentPassword", event.target.value)}
              />
            </div>

            <div className="employee-profile-page__field">
              <label className="employee-profile-page__info-label">كلمة المرور الجديدة</label>
              <input
                type="password"
                className="employee-profile-page__input"
                value={passwordDraft.newPassword}
                onChange={(event) => handlePasswordChange("newPassword", event.target.value)}
              />
            </div>

            <div className="employee-profile-page__field employee-profile-page__field--wide">
              <label className="employee-profile-page__info-label">تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                className="employee-profile-page__input"
                value={passwordDraft.confirmPassword}
                onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
              />
            </div>

            <div className="employee-profile-page__password-actions">
              <button type="submit" className="employee-profile-page__upload-btn">
                <i className="bi bi-shield-lock"></i>
                تحديث كلمة المرور
              </button>
            </div>

            {passwordError ? (
              <p className="employee-profile-page__password-message employee-profile-page__password-message--error">
                {passwordError}
              </p>
            ) : null}

            {passwordMessage ? (
              <p className="employee-profile-page__password-message">{passwordMessage}</p>
            ) : null}
          </form>
        </section>
      )}

      <section className="employee-profile-page__details-grid">
        <article className="employee-profile-page__section-card">
          <div className="employee-profile-page__section-head">
            <h3 className="employee-profile-page__section-title">المعلومات الشخصية</h3>

            {isPersonalEditing ? (
              <div className="employee-profile-page__section-actions">
                <button
                  type="button"
                  className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
                  onClick={() => cancelEdit("personal")}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="employee-profile-page__section-link"
                  onClick={() => saveEdit("personal", ["phone", "email", "address"])}
                >
                  حفظ
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="employee-profile-page__section-link"
                onClick={() => startEdit("personal")}
              >
                تعديل
              </button>
            )}
          </div>

          <div className="employee-profile-page__info-list">
            {personalFields.map((item) => (
              <div key={item.key} className="employee-profile-page__info-item">
                <div className="employee-profile-page__info-icon">
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <div className="employee-profile-page__info-copy">
                  <p className="employee-profile-page__info-label">{item.label}</p>
                  {isPersonalEditing ? (
                    <input
                      type="text"
                      className="employee-profile-page__input"
                      value={draftProfile[item.key]}
                      onChange={(event) => handleDraftChange(item.key, event.target.value)}
                    />
                  ) : (
                    <p className="employee-profile-page__info-value">{profile[item.key]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="employee-profile-page__section-card">
          <div className="employee-profile-page__section-head">
            <h3 className="employee-profile-page__section-title">معلومات المركبة</h3>

            {isVehicleEditing ? (
              <div className="employee-profile-page__section-actions">
                <button
                  type="button"
                  className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
                  onClick={() => cancelEdit("vehicle")}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="employee-profile-page__section-link"
                  onClick={() =>
                    saveEdit("vehicle", ["vehicleType", "licenseNumber", "plateNumber"])
                  }
                >
                  حفظ
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="employee-profile-page__section-link"
                onClick={() => startEdit("vehicle")}
              >
                تعديل
              </button>
            )}
          </div>

          <div className="employee-profile-page__info-list">
            {vehicleFields.map((item) => (
              <div key={item.key} className="employee-profile-page__info-item">
                <div className="employee-profile-page__info-icon employee-profile-page__info-icon--vehicle">
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <div className="employee-profile-page__info-copy">
                  <p className="employee-profile-page__info-label">{item.label}</p>
                  {isVehicleEditing ? (
                    <input
                      type="text"
                      className="employee-profile-page__input"
                      value={draftProfile[item.key]}
                      onChange={(event) => handleDraftChange(item.key, event.target.value)}
                    />
                  ) : (
                    <p className="employee-profile-page__info-value">{profile[item.key]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="employee-profile-page__section-card employee-profile-page__section-card--documents">
        <div className="employee-profile-page__section-head">
          <div>
            <h3 className="employee-profile-page__section-title">الوثائق الرسمية</h3>
            <p className="employee-profile-page__section-subtitle">
              لكل وثيقة اسم وملف وتاريخ انتهاء واضح، ويمكن تحديثها أو إضافة وثيقة جديدة بشكل منطقي.
            </p>
          </div>
        </div>

        <div className="employee-profile-page__documents-list">
          {documents.map((document) => (
            <div key={document.id} className="employee-profile-page__document-row employee-profile-page__document-row--stacked">
              <div className="employee-profile-page__document-main">
                <div className="employee-profile-page__document-icon">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <div className="employee-profile-page__document-copy">
                  <h4 className="employee-profile-page__document-name">{document.name}</h4>
                  <p className="employee-profile-page__document-date">تاريخ الانتهاء: {document.expiryDate}</p>
                  <p className="employee-profile-page__document-file">{document.fileName}</p>
                </div>
                <span
                  className={`employee-profile-page__document-status employee-profile-page__document-status--${document.tone}`}
                >
                  {document.status}
                </span>
              </div>

              {activeDocumentId === document.id ? (
                <div className="employee-profile-page__document-form">
                  <div className="employee-profile-page__form-grid">
                    <div className="employee-profile-page__field">
                      <label className="employee-profile-page__info-label">اسم الوثيقة</label>
                      <input
                        type="text"
                        className="employee-profile-page__input"
                        value={documentDraft.name}
                        onChange={(event) =>
                          setDocumentDraft((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </div>

                    <div className="employee-profile-page__field">
                      <label className="employee-profile-page__info-label">تاريخ الانتهاء</label>
                      <input
                        type="date"
                        className="employee-profile-page__input"
                        value={documentDraft.expiryDate}
                        onChange={(event) =>
                          setDocumentDraft((current) => ({ ...current, expiryDate: event.target.value }))
                        }
                      />
                    </div>

                    <div className="employee-profile-page__field employee-profile-page__field--wide">
                      <label className="employee-profile-page__info-label">ملف الوثيقة</label>
                      <input
                        type="file"
                        className="employee-profile-page__input employee-profile-page__input--file"
                        onChange={(event) =>
                          setDocumentDraft((current) => ({ ...current, file: event.target.files?.[0] || null }))
                        }
                      />
                    </div>
                  </div>

                  <div className="employee-profile-page__section-actions">
                    <button
                      type="button"
                      className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
                      onClick={cancelDocumentEdit}
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      className="employee-profile-page__section-link"
                      onClick={() => saveDocumentEdit(document.id)}
                    >
                      حفظ التحديث
                    </button>
                  </div>
                </div>
              ) : (
                <div className="employee-profile-page__document-actions">
                  <button
                    type="button"
                    className="employee-profile-page__update-btn"
                    onClick={() => startDocumentEdit(document)}
                  >
                    <i className="bi bi-pencil-square"></i>
                    تحديث الوثيقة
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="employee-profile-page__upload-box">
          <h4 className="employee-profile-page__upload-title">رفع وثيقة جديدة</h4>

          <div className="employee-profile-page__form-grid">
            <div className="employee-profile-page__field">
              <label className="employee-profile-page__info-label">اسم الوثيقة</label>
              <input
                type="text"
                className="employee-profile-page__input"
                placeholder="مثال: رخصة مهنة"
                value={newDocumentDraft.name}
                onChange={(event) =>
                  setNewDocumentDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>

            <div className="employee-profile-page__field">
              <label className="employee-profile-page__info-label">تاريخ الانتهاء</label>
              <input
                type="date"
                className="employee-profile-page__input"
                value={newDocumentDraft.expiryDate}
                onChange={(event) =>
                  setNewDocumentDraft((current) => ({ ...current, expiryDate: event.target.value }))
                }
              />
            </div>

            <div className="employee-profile-page__field employee-profile-page__field--wide">
              <label className="employee-profile-page__info-label">ملف الوثيقة</label>
              <input
                type="file"
                className="employee-profile-page__input employee-profile-page__input--file"
                onChange={(event) =>
                  setNewDocumentDraft((current) => ({ ...current, file: event.target.files?.[0] || null }))
                }
              />
            </div>
          </div>

          <button type="button" className="employee-profile-page__upload-btn" onClick={addNewDocument}>
            <i className="bi bi-cloud-arrow-up"></i>
            رفع الوثيقة
          </button>

          {documentMessage ? (
            <p className="employee-profile-page__upload-message">{documentMessage}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default EmployeeProfilePage;

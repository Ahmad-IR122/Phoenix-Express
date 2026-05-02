import React, { useEffect, useMemo, useRef, useState } from 'react';
import './profilePage.css';
import {
  changeAccountPassword,
  createEmployeeDocument,
  deleteEmployeeDocument,
  getEmployeeProfile,
  updateEmployeeDocument,
  updateEmployeeProfile,
  updateEmployeeVehicle,
} from '../services/employeeService';

const DOCUMENT_TONE_MAP = {
  valid: 'valid',
  expiring_soon: 'warning',
  expired: 'expired',
};

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'driving_license', label: 'رخصة قيادة' },
  { value: 'vehicle_license', label: 'رخصة مركبة' },
  { value: 'vehicle_insurance', label: 'تأمين المركبة' },
  { value: 'national_id', label: 'الهوية الوطنية' },
];

const DOCUMENT_TYPES_WITH_EXPIRY = [
  'driving_license',
  'vehicle_license',
  'vehicle_insurance',
];

const EMPTY_DOCUMENT_FORM = {
  document_type: 'driving_license',
  expiry_date: '',
  file: null,
  file_name: '',
  file_data: '',
};

const mapProfileToForms = (data) => ({
  personal: {
    full_name: data?.employee?.fullName || '',
    phone: data?.employee?.phone || '',
    email: data?.employee?.email || '',
    address: data?.employee?.address || '',
  },
  vehicle: {
    type: data?.vehicle?.type || '',
    brand: data?.vehicle?.brand || '',
    model: data?.vehicle?.model || '',
    color: data?.vehicle?.color || '',
    year: data?.vehicle?.year || '',
    plate_number: data?.vehicle?.plateNumber || '',
    vehicle_photo_url: data?.vehicle?.vehiclePhotoUrl || '',
  },
});

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('تعذر قراءة الملف المحدد.'));
    reader.readAsDataURL(file);
  });

function DocumentUploader({
  form,
  onChange,
  inputRef,
  title,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const shouldShowExpiry = DOCUMENT_TYPES_WITH_EXPIRY.includes(form.document_type);

  const handleFiles = async (files) => {
    const selectedFile = files?.[0];
    if (!selectedFile) return;

    const fileData = await readFileAsDataUrl(selectedFile);
    onChange({
      ...form,
      file: selectedFile,
      file_name: selectedFile.name,
      file_data: fileData,
    });
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    try {
      await handleFiles(event.dataTransfer.files);
    } catch {
      onChange({
        ...form,
        file: null,
        file_name: '',
        file_data: '',
      });
    }
  };

  const handleChooseFile = async (event) => {
    try {
      await handleFiles(event.target.files);
    } catch {
      onChange({
        ...form,
        file: null,
        file_name: '',
        file_data: '',
      });
    }
  };

  return (
    <form className="employee-profile-page__document-form" onSubmit={onSubmit}>
      <h4 className="employee-profile-page__upload-title">{title}</h4>

      <div className="employee-profile-page__form-grid">
        <div className="employee-profile-page__field">
          <p className="employee-profile-page__info-label">نوع الوثيقة</p>
          <select
            className="employee-profile-page__input"
            value={form.document_type}
            onChange={(event) =>
              onChange({
                ...form,
                document_type: event.target.value,
                expiry_date: DOCUMENT_TYPES_WITH_EXPIRY.includes(event.target.value)
                  ? form.expiry_date
                  : '',
              })
            }
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {shouldShowExpiry ? (
          <div className="employee-profile-page__field">
            <p className="employee-profile-page__info-label">تاريخ الانتهاء</p>
            <input
              type="date"
              className="employee-profile-page__input"
              value={form.expiry_date}
              onChange={(event) =>
                onChange({
                  ...form,
                  expiry_date: event.target.value,
                })
              }
            />
          </div>
        ) : null}

        <div className="employee-profile-page__field employee-profile-page__field--wide">
          <p className="employee-profile-page__info-label">ملف الوثيقة</p>
          <div
            className="employee-profile-page__upload-box"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              className="employee-profile-page__input employee-profile-page__input--file"
              style={{ display: 'none' }}
              onChange={handleChooseFile}
            />

            <div className="employee-profile-page__empty-card" style={{ minHeight: 'auto' }}>
              <i className="bi bi-cloud-arrow-up"></i>
              <strong>{form.file_name || 'اسحب الملف هنا أو اختره من جهازك'}</strong>
              <p>يمكنك رفع ملف جديد أو استبدال الملف الحالي مباشرة من هنا.</p>
              <button
                type="button"
                className="employee-profile-page__section-link"
                onClick={() => inputRef.current?.click()}
              >
                اختيار ملف
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="employee-profile-page__document-actions">
        <button type="submit" className="employee-profile-page__upload-btn" disabled={isSubmitting}>
          {isSubmitting ? 'جارٍ الحفظ...' : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
            onClick={onCancel}
          >
            إلغاء
          </button>
        ) : null}
      </div>
    </form>
  );
}

function EmployeeProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [forms, setForms] = useState(() => mapProfileToForms(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [showNewDocumentForm, setShowNewDocumentForm] = useState(false);
  const [newDocumentForm, setNewDocumentForm] = useState(EMPTY_DOCUMENT_FORM);
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [editingDocumentForm, setEditingDocumentForm] = useState(EMPTY_DOCUMENT_FORM);
  const [savingSection, setSavingSection] = useState('');
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState({ message: '', type: '' });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const newDocumentInputRef = useRef(null);
  const editDocumentInputRef = useRef(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getEmployeeProfile();
      const nextData = response?.data || null;
      setProfileData(nextData);
      setForms(mapProfileToForms(nextData));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'تعذر تحميل بيانات الملف الشخصي حالياً.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (feedback.type !== 'success' || !feedback.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback({ message: '', type: '' });
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (passwordFeedback.type !== 'success' || !passwordFeedback.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsPasswordModalOpen(false);
      setPasswordFeedback({ message: '', type: '' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [passwordFeedback]);

  const employee = useMemo(() => profileData?.employee || {}, [profileData?.employee]);
  const vehicle = useMemo(() => profileData?.vehicle || {}, [profileData?.vehicle]);
  const documents = profileData?.documents || [];

  const startPersonalEdit = () => {
    setForms(mapProfileToForms(profileData));
    setEditingPersonal(true);
    setFeedback({ message: '', type: '' });
  };

  const cancelPersonalEdit = () => {
    setForms(mapProfileToForms(profileData));
    setEditingPersonal(false);
  };

  const startVehicleEdit = () => {
    setForms(mapProfileToForms(profileData));
    setEditingVehicle(true);
    setFeedback({ message: '', type: '' });
  };

  const cancelVehicleEdit = () => {
    setForms(mapProfileToForms(profileData));
    setEditingVehicle(false);
  };

  const handleFormChange = (section, field, value) => {
    setForms((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const handleSavePersonal = async () => {
    try {
      setSavingSection('personal');
      setFeedback({ message: '', type: '' });
      const response = await updateEmployeeProfile({
        full_name: forms.personal.full_name,
        address: forms.personal.address,
        phone: forms.personal.phone,
        email: forms.personal.email,
      });
      const nextData = response?.data || null;
      setProfileData(nextData);
      setForms(mapProfileToForms(nextData));
      setEditingPersonal(false);
      setFeedback({ message: 'تم تحديث البيانات الشخصية بنجاح.', type: 'success' });
    } catch (requestError) {
      setFeedback({
        message:
          requestError?.response?.data?.message || 'تعذر تحديث البيانات الشخصية.',
        type: 'error',
      });
    } finally {
      setSavingSection('');
    }
  };

  const handleSaveVehicle = async () => {
    try {
      setSavingSection('vehicle');
      setFeedback({ message: '', type: '' });
      const response = await updateEmployeeVehicle(forms.vehicle);
      const nextData = response?.data || null;
      setProfileData(nextData);
      setForms(mapProfileToForms(nextData));
      setEditingVehicle(false);
      setFeedback({ message: 'تم تحديث بيانات المركبة بنجاح.', type: 'success' });
    } catch (requestError) {
      setFeedback({
        message:
          requestError?.response?.data?.message || 'تعذر تحديث بيانات المركبة.',
        type: 'error',
      });
    } finally {
      setSavingSection('');
    }
  };

  const handleCreateDocument = async (event) => {
    event.preventDefault();
    if (!newDocumentForm.file_data) {
      setFeedback({ message: 'يرجى اختيار ملف الوثيقة أولاً.', type: 'error' });
      return;
    }

    try {
      setSavingSection('new-document');
      setFeedback({ message: '', type: '' });
      const response = await createEmployeeDocument({
        document_type: newDocumentForm.document_type,
        expiry_date: DOCUMENT_TYPES_WITH_EXPIRY.includes(newDocumentForm.document_type)
          ? newDocumentForm.expiry_date
          : null,
        file_url: newDocumentForm.file_data,
      });
      setProfileData(response?.data || null);
      setNewDocumentForm(EMPTY_DOCUMENT_FORM);
      setShowNewDocumentForm(false);
      setFeedback({ message: 'تمت إضافة الوثيقة بنجاح.', type: 'success' });
    } catch (requestError) {
      setFeedback({
        message: requestError?.response?.data?.message || 'تعذر إضافة الوثيقة.',
        type: 'error',
      });
    } finally {
      setSavingSection('');
    }
  };

  const startEditingDocument = (document) => {
    setEditingDocumentId(document.id);
    setEditingDocumentForm({
      document_type: document.documentType || 'driving_license',
      expiry_date: document.expiryDate || '',
      file: null,
      file_name: '',
      file_data: document.fileUrl || '',
    });
    setFeedback({ message: '', type: '' });
  };

  const cancelEditingDocument = () => {
    setEditingDocumentId(null);
    setEditingDocumentForm(EMPTY_DOCUMENT_FORM);
  };

  const handleUpdateDocument = async (event) => {
    event.preventDefault();
    if (!editingDocumentId || !editingDocumentForm.file_data) {
      setFeedback({ message: 'يرجى اختيار ملف الوثيقة.', type: 'error' });
      return;
    }

    try {
      setSavingSection(`document-${editingDocumentId}`);
      setFeedback({ message: '', type: '' });
      const response = await updateEmployeeDocument(editingDocumentId, {
        document_type: editingDocumentForm.document_type,
        expiry_date: DOCUMENT_TYPES_WITH_EXPIRY.includes(editingDocumentForm.document_type)
          ? editingDocumentForm.expiry_date
          : null,
        file_url: editingDocumentForm.file_data,
      });
      setProfileData(response?.data || null);
      cancelEditingDocument();
      setFeedback({ message: 'تم تحديث الوثيقة بنجاح.', type: 'success' });
    } catch (requestError) {
      setFeedback({
        message: requestError?.response?.data?.message || 'تعذر تحديث الوثيقة.',
        type: 'error',
      });
    } finally {
      setSavingSection('');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      setDeletingDocumentId(documentId);
      setFeedback({ message: '', type: '' });
      const response = await deleteEmployeeDocument(documentId);
      setProfileData(response?.data || null);
      if (editingDocumentId === documentId) {
        cancelEditingDocument();
      }
      setFeedback({ message: 'تم حذف الوثيقة بنجاح.', type: 'success' });
    } catch (requestError) {
      setFeedback({
        message: requestError?.response?.data?.message || 'تعذر حذف الوثيقة.',
        type: 'error',
      });
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordFeedback({ message: 'يرجى تعبئة جميع حقول كلمة المرور.', type: 'error' });
      return;
    }

    try {
      setSavingSection('password');
      setPasswordFeedback({ message: '', type: '' });
      const response = await changeAccountPassword(passwordForm);
      setPasswordFeedback({
        message: response?.message || 'تم تغيير كلمة المرور بنجاح.',
        type: 'success',
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (requestError) {
      setPasswordFeedback({
        message:
          requestError?.response?.data?.message || 'تعذر تغيير كلمة المرور.',
        type: 'error',
      });
    } finally {
      setSavingSection('');
    }
  };

  const openPasswordModal = () => {
    setPasswordFeedback({ message: '', type: '' });
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (savingSection === 'password') return;
    setIsPasswordModalOpen(false);
    setPasswordFeedback({ message: '', type: '' });
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const employeeCards = useMemo(
    () => [
      {
        title: 'بيانات الموظف',
        icon: 'bi-person-badge',
        rows: [
          { label: 'الاسم', field: 'full_name', value: employee.fullName || '-' },
          { label: 'المسمى', value: employee.jobTitle || 'موظف توصيل', readOnly: true },
          { label: 'حالة التوفر', value: employee.availabilityStatusLabel || '-', readOnly: true },
        ],
      },
      {
        title: 'معلومات التواصل',
        icon: 'bi-telephone',
        rows: [
          { label: 'رقم الهاتف', field: 'phone', value: employee.phone || '-' },
          { label: 'البريد الإلكتروني', field: 'email', value: employee.email || '-' },
          { label: 'العنوان', field: 'address', value: employee.address || '-' },
        ],
      },
    ],
    [employee]
  );

  const vehicleRows = [
    { label: 'نوع المركبة', field: 'type', value: vehicle.type || '-' },
    { label: 'رقم الرخصة', field: 'plate_number', value: vehicle.plateNumber || '-' },
    { label: 'رقم اللوحة', field: 'plate_number', value: vehicle.plateNumber || '-' },
    { label: 'الماركة', field: 'brand', value: vehicle.brand || '-' },
    { label: 'الموديل', field: 'model', value: vehicle.model || '-' },
    {
      label: 'اللون / السنة',
      custom: true,
      value: [vehicle.color, vehicle.year].filter(Boolean).join(' - ') || '-',
    },
    { label: 'رابط صورة المركبة', field: 'vehicle_photo_url', value: vehicle.vehiclePhotoUrl || '-' },
  ];

  if (loading) {
    return (
      <div className="employee-profile-page" dir="rtl">
        <section className="employee-profile-page__hero">
          <div className="employee-profile-page__hero-main">
            <div className="employee-profile-page__avatar">
              <span>—</span>
            </div>
            <div className="employee-profile-page__hero-copy">
              <h1 className="employee-profile-page__name">جارٍ تحميل الملف الشخصي</h1>
              <p className="employee-profile-page__job">نجهز بياناتك الآن</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-profile-page" dir="rtl">
        <section className="employee-profile-page__section-card employee-profile-page__state-card">
          <div className="employee-profile-page__empty-icon">
            <i className="bi bi-wifi-off"></i>
          </div>
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
            <span>{employee.avatarInitials || 'مو'}</span>
          </div>

          <div className="employee-profile-page__hero-copy">
            <div className="employee-profile-page__identity">
              <h1 className="employee-profile-page__name">{employee.fullName || 'الموظف'}</h1>
              <p className="employee-profile-page__job">{employee.jobTitle || 'موظف توصيل'}</p>
            </div>
            <div className="employee-profile-page__availability-pill">
              <i className="bi bi-circle-fill"></i>
              <span>{employee.availabilityStatusLabel || 'غير محدد'}</span>
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
            feedback.type === 'error' ? 'employee-profile-page__password-message--error' : ''
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <section className="employee-profile-page__details-grid">
        {employeeCards.map((card, cardIndex) => (
          <article key={card.title} className="employee-profile-page__section-card">
            <div className="employee-profile-page__section-head">
              <div>
                <h3 className="employee-profile-page__section-title">{card.title}</h3>
              </div>
              <div className="employee-profile-page__section-actions">
                {cardIndex === 0 ? (
                  editingPersonal ? (
                    <>
                      <button
                        type="button"
                        className="employee-profile-page__section-link"
                        onClick={handleSavePersonal}
                        disabled={savingSection === 'personal'}
                      >
                        {savingSection === 'personal' ? 'جارٍ الحفظ...' : 'حفظ'}
                      </button>
                      <button
                        type="button"
                        className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
                        onClick={cancelPersonalEdit}
                      >
                        إلغاء
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="employee-profile-page__section-link"
                      onClick={startPersonalEdit}
                    >
                      تعديل
                    </button>
                  )
                ) : null}
                <div className="employee-profile-page__section-icon">
                  <i className={`bi ${card.icon}`}></i>
                </div>
              </div>
            </div>

            <div className="employee-profile-page__info-list">
              {card.rows.map((row) => (
                <div key={row.label} className="employee-profile-page__info-item">
                  <p className="employee-profile-page__info-label">{row.label}</p>
                  {editingPersonal && row.field && !row.readOnly ? (
                    <input
                      className="employee-profile-page__input"
                      value={forms.personal[row.field] || ''}
                      onChange={(event) => handleFormChange('personal', row.field, event.target.value)}
                    />
                  ) : (
                    <p className="employee-profile-page__info-value">{row.value}</p>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="employee-profile-page__details-grid">
        <article className="employee-profile-page__section-card">
          <div className="employee-profile-page__section-head">
            <div>
              <h3 className="employee-profile-page__section-title">بيانات المركبة</h3>
              <p className="employee-profile-page__section-subtitle">
                معلومات المركبة المستخدمة في التوصيل.
              </p>
            </div>
            <div className="employee-profile-page__section-actions">
              {editingVehicle ? (
                <>
                  <button
                    type="button"
                    className="employee-profile-page__section-link"
                    onClick={handleSaveVehicle}
                    disabled={savingSection === 'vehicle'}
                  >
                    {savingSection === 'vehicle' ? 'جارٍ الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    type="button"
                    className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
                    onClick={cancelVehicleEdit}
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="employee-profile-page__section-link"
                  onClick={startVehicleEdit}
                >
                  تعديل
                </button>
              )}
              <div className="employee-profile-page__section-icon employee-profile-page__section-icon--vehicle">
                <i className="bi bi-truck"></i>
              </div>
            </div>
          </div>

          {vehicle.type || vehicle.plateNumber || vehicle.brand || editingVehicle ? (
            <div className="employee-profile-page__info-list">
              {vehicleRows.map((row) => (
                <div key={row.label} className="employee-profile-page__info-item">
                  <p className="employee-profile-page__info-label">{row.label}</p>
                  {editingVehicle && !row.custom ? (
                    <input
                      className="employee-profile-page__input"
                      type={row.field === 'year' ? 'number' : 'text'}
                      value={forms.vehicle[row.field] || ''}
                      onChange={(event) => handleFormChange('vehicle', row.field, event.target.value)}
                    />
                  ) : editingVehicle && row.custom ? (
                    <div className="employee-profile-page__form-grid">
                      <input
                        className="employee-profile-page__input"
                        placeholder="اللون"
                        value={forms.vehicle.color || ''}
                        onChange={(event) => handleFormChange('vehicle', 'color', event.target.value)}
                      />
                      <input
                        className="employee-profile-page__input"
                        type="number"
                        placeholder="السنة"
                        value={forms.vehicle.year || ''}
                        onChange={(event) => handleFormChange('vehicle', 'year', event.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="employee-profile-page__info-value">{row.value}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="employee-profile-page__empty-card">
              <i className="bi bi-truck"></i>
              <strong>لا توجد بيانات مركبة حالياً</strong>
              <p>ستظهر بيانات المركبة هنا بمجرد إضافتها إلى ملف الموظف.</p>
            </div>
          )}
        </article>

        <article className="employee-profile-page__section-card">
          <div className="employee-profile-page__section-head">
            <div>
              <h3 className="employee-profile-page__section-title">الوثائق الرسمية</h3>
              <p className="employee-profile-page__section-subtitle">
                حالة الوثائق المرتبطة بالموظف والمركبة.
              </p>
            </div>
            <div className="employee-profile-page__section-actions">
              {!showNewDocumentForm ? (
                <button
                  type="button"
                  className="employee-profile-page__section-link"
                  onClick={() => {
                    setShowNewDocumentForm(true);
                    setNewDocumentForm(EMPTY_DOCUMENT_FORM);
                  }}
                >
                  إضافة وثيقة
                </button>
              ) : null}
              <div className="employee-profile-page__section-icon">
                <i className="bi bi-file-earmark-text"></i>
              </div>
            </div>
          </div>

          {documents.length > 0 ? (
            <div className="employee-profile-page__documents-list">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className={`employee-profile-page__document-row ${
                    editingDocumentId === document.id ? 'employee-profile-page__document-row--stacked' : ''
                  }`}
                >
                  <div className="employee-profile-page__document-main">
                    <div className="employee-profile-page__document-copy">
                      <h4 className="employee-profile-page__document-name">
                        {DOCUMENT_TYPE_OPTIONS.find((item) => item.value === document.documentType)?.label ||
                          document.name}
                      </h4>
                      <p className="employee-profile-page__document-date">
                        تاريخ الانتهاء: {document.expiryDate || '-'}
                      </p>
                      <p className="employee-profile-page__document-file">
                        {document.fileUrl ? 'ملف مرفق' : 'لا يوجد ملف'}
                      </p>
                    </div>
                    <span
                      className={`employee-profile-page__document-status employee-profile-page__document-status--${
                        DOCUMENT_TONE_MAP[document.status] || 'valid'
                      }`}
                    >
                      {document.statusLabel || document.status}
                    </span>
                  </div>

                  <div className="employee-profile-page__document-actions">
                    <button
                      type="button"
                      className="employee-profile-page__update-btn"
                      onClick={() => startEditingDocument(document)}
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      className="employee-profile-page__section-link employee-profile-page__section-link--ghost"
                      onClick={() => handleDeleteDocument(document.id)}
                      disabled={deletingDocumentId === document.id}
                    >
                      {deletingDocumentId === document.id ? 'جارٍ الحذف...' : 'حذف'}
                    </button>
                  </div>

                  {editingDocumentId === document.id ? (
                    <DocumentUploader
                      form={editingDocumentForm}
                      onChange={setEditingDocumentForm}
                      inputRef={editDocumentInputRef}
                      title="تحديث الوثيقة"
                      submitLabel="حفظ الوثيقة"
                      onSubmit={handleUpdateDocument}
                      onCancel={cancelEditingDocument}
                      isSubmitting={savingSection === `document-${document.id}`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="employee-profile-page__empty-card">
              <i className="bi bi-folder2-open"></i>
              <strong>لا توجد وثائق مرفقة</strong>
              <p>عند إضافة الوثائق الرسمية ستظهر هنا مع حالتها وتاريخ انتهائها.</p>
            </div>
          )}

          {showNewDocumentForm ? (
            <div className="employee-profile-page__upload-box">
              <DocumentUploader
                form={newDocumentForm}
                onChange={setNewDocumentForm}
                inputRef={newDocumentInputRef}
                title="إضافة وثيقة جديدة"
                submitLabel="إضافة الوثيقة"
                onSubmit={handleCreateDocument}
                onCancel={() => {
                  setShowNewDocumentForm(false);
                  setNewDocumentForm(EMPTY_DOCUMENT_FORM);
                }}
                isSubmitting={savingSection === 'new-document'}
              />
            </div>
          ) : null}
        </article>
      </section>

      {isPasswordModalOpen ? (
        <div className="employee-profile-page__modal-overlay" onClick={closePasswordModal}>
          <div className="employee-profile-page__modal" onClick={(event) => event.stopPropagation()}>
            <div className="employee-profile-page__modal-head">
              <div>
                <h3 className="employee-profile-page__section-title">تغيير كلمة المرور</h3>
                <p className="employee-profile-page__section-subtitle">
                  أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة وأكدها.
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

            <form className="employee-profile-page__form-grid" onSubmit={handlePasswordChange}>
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
                    passwordFeedback.type === 'error'
                      ? 'employee-profile-page__password-message--error'
                      : ''
                  }`}
                >
                  {passwordFeedback.message}
                </p>
              ) : null}
              <div className="employee-profile-page__password-actions">
                <button
                  type="submit"
                  className="employee-profile-page__upload-btn"
                  disabled={savingSection === 'password'}
                >
                  {savingSection === 'password' ? 'جارٍ الحفظ...' : 'حفظ'}
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

export default EmployeeProfilePage;

import { useMemo, useState } from "react";
import { useCouriers } from "../hooks/useCouriers";
import "./DelegatesPage.css";

const STATUS_LABELS = {
  available: "متاح",
  busy: "مشغول",
  offline: "غير متصل",
};

const STATUS_CLASS = {
  available: "phoenix-delegates__badge--available",
  busy: "phoenix-delegates__badge--busy",
  offline: "phoenix-delegates__badge--offline",
};

const ACTIVITY_LABELS = {
  active: "نشط",
  inactive: "غير نشط",
};

const ACTIVITY_CLASS = {
  active: "phoenix-delegates__activity-badge--active",
  inactive: "phoenix-delegates__activity-badge--inactive",
};

const emptyForm = {
  fullName: "",
  phone: "",
  area: "",
  city: "",
  vehicleType: "motorcycle",
  nationalId: "",
  licenseNumber: "",
  isActive: true,
};

const statusFilterOptions = [
  { value: "all", label: "كل الحالات" },
  { value: "available", label: "متاح" },
  { value: "busy", label: "مشغول" },
  { value: "offline", label: "غير متصل" },
];

const activityFilterOptions = [
  { value: "all", label: "كل الأنشطة" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function formatCurrency(value) {
  return `${formatNumber(value)} ₪`;
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMonthLabel(monthValue) {
  if (!monthValue) return "-";
  return new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(
    new Date(`${monthValue}-01T00:00:00`)
  );
}

function buildFormFromCourier(courier) {
  if (!courier) {
    return emptyForm;
  }

  return {
    fullName: courier.name,
    phone: courier.phone,
    area: courier.area,
    city: courier.city,
    vehicleType: courier.vehicleType,
    nationalId: courier.nationalId === "-" ? "" : courier.nationalId,
    licenseNumber: courier.licenseNumber === "-" ? "" : courier.licenseNumber,
    isActive: courier.isActive,
  };
}

function DelegatesPage() {
  const {
    filteredCouriers,
    filters,
    setFilters,
    summaryCards,
    areas,
    vehicleTypes,
    vehicleTypeLabels,
    isLoading,
    isMutating,
    submitCreateCourier,
    submitUpdateCourier,
    submitToggleCourierStatus,
    loadCourierDetails,
  } = useCouriers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedCourierDetails, setSelectedCourierDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === "area" || key === "status" || key === "vehicleType" || key === "activity") {
        return value !== "all" ? count + 1 : count;
      }

      return String(value || "").trim() ? count + 1 : count;
    }, 0);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      name: "",
      phone: "",
      area: "all",
      status: "all",
      vehicleType: "all",
      activity: "all",
    });
  };

  const openCreateModal = () => {
    setEditingCourier(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEditModal = (courier) => {
    setEditingCourier(courier);
    setFormData(buildFormFromCourier(courier));
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingCourier(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitForm = async (event) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.area.trim() || !formData.city.trim()) {
      window.alert("الرجاء تعبئة الاسم ورقم الهاتف والمنطقة والمدينة");
      return;
    }

    const payload = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      area: formData.area.trim(),
      city: formData.city.trim(),
      vehicleType: formData.vehicleType,
      nationalId: formData.nationalId.trim(),
      licenseNumber: formData.licenseNumber.trim(),
      isActive: Boolean(formData.isActive),
    };

    if (editingCourier) {
      await submitUpdateCourier(editingCourier.id, payload);
    } else {
      await submitCreateCourier(payload);
    }

    closeFormModal();
  };

  const handleToggleCourierStatus = async (courier) => {
    await submitToggleCourierStatus(courier.id);

    if (selectedCourierDetails?.id === courier.id) {
      const details = await loadCourierDetails(courier.id);
      setSelectedCourierDetails(details);
    }
  };

  const openDetailsView = async (courierId) => {
    setIsDetailsLoading(true);
    setIsDetailsOpen(true);

    try {
      const details = await loadCourierDetails(courierId);
      setSelectedCourierDetails(details);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeDetailsView = () => {
    setIsDetailsOpen(false);
    setSelectedCourierDetails(null);
  };

  return (
    <section dir="rtl" className="phoenix-delegates">
      <div className="phoenix-delegates__hero">
        <div className="phoenix-delegates__hero-copy">
          <span className="phoenix-delegates__eyebrow">Phoenix Admin</span>
          <h1 className="phoenix-delegates__title">إدارة المناديب</h1>
        </div>
      </div>

      <div className="phoenix-delegates__summary-grid">
        {summaryCards.map((card) => (
          <article key={card.id} className="phoenix-delegates__summary-card">
            <div className={`phoenix-delegates__summary-icon ${card.iconClass}`}>
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="phoenix-delegates__summary-content">
              <span className="phoenix-delegates__summary-label">{card.label}</span>
              <strong className="phoenix-delegates__summary-value">{card.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <article className="phoenix-delegates__action-bar">
        <div className="phoenix-delegates__action-copy">
          <h2 > إجراءات الإدارة</h2>
        </div>

        <button
          type="button"
          className="phoenix-delegates__primary-btn"
          onClick={openCreateModal}
        >
          <i className="bi bi-plus-lg"></i>
          إضافة مندوب
        </button>
      </article>

      <article className="phoenix-delegates__panel">
        <div className="phoenix-delegates__panel-head">
          <div>
            <h2 className="phoenix-delegates__panel-title">الفلاتر المتقدمة</h2>
          </div>

          <div className="phoenix-delegates__panel-badges">
            <span className="phoenix-delegates__mini-badge">
              {formatNumber(filteredCouriers.length)} نتيجة
            </span>
            <span className="phoenix-delegates__mini-badge phoenix-delegates__mini-badge--soft">
              {activeFiltersCount} فلتر نشط
            </span>
          </div>
        </div>

        <div className="phoenix-delegates__filters-grid">
          <label className="phoenix-delegates__field">
            <span>البحث باسم المندوب</span>
            <input
              type="text"
              value={filters.name}
              placeholder="مثال: أحمد محمد"
              onChange={(event) => handleFilterChange("name", event.target.value)}
            />
          </label>

          <label className="phoenix-delegates__field">
            <span>البحث برقم الهاتف</span>
            <input
              type="text"
              value={filters.phone}
              placeholder="05xxxxxxxx"
              onChange={(event) => handleFilterChange("phone", event.target.value)}
            />
          </label>

          <label className="phoenix-delegates__field">
            <span>المنطقة</span>
            <select value={filters.area} onChange={(event) => handleFilterChange("area", event.target.value)}>
              <option value="all">كل المناطق</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label className="phoenix-delegates__field">
            <span>الحالة</span>
            <select value={filters.status} onChange={(event) => handleFilterChange("status", event.target.value)}>
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="phoenix-delegates__field">
            <span>نوع المركبة</span>
            <select
              value={filters.vehicleType}
              onChange={(event) => handleFilterChange("vehicleType", event.target.value)}
            >
              <option value="all">كل المركبات</option>
              {vehicleTypes.map((vehicleType) => (
                <option key={vehicleType} value={vehicleType}>
                  {vehicleTypeLabels[vehicleType] || vehicleType}
                </option>
              ))}
            </select>
          </label>

          <label className="phoenix-delegates__field">
            <span>النشاط الإداري</span>
            <select
              value={filters.activity}
              onChange={(event) => handleFilterChange("activity", event.target.value)}
            >
              {activityFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="phoenix-delegates__filters-actions">
          <button
            type="button"
            className="phoenix-delegates__secondary-btn"
            onClick={resetFilters}
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      </article>

      <article className="phoenix-delegates__panel">
        <div className="phoenix-delegates__panel-head">
          <div>
            <h2 className="phoenix-delegates__panel-title">جدول المناديب</h2>
          </div>
          <span className="phoenix-delegates__mini-badge phoenix-delegates__mini-badge--soft">
            جدول الإدارة الرئيسي
          </span>
        </div>

        <div className="phoenix-delegates__table-wrap">
          <table className="phoenix-delegates__table">
            <thead>
              <tr>
                <th>اسم المندوب</th>
                <th>رقم الهاتف</th>
                <th>المنطقة</th>
                <th>الحالة</th>
                <th>الطلبات النشطة</th>
                <th>إجمالي التوصيلات</th>
                <th>المرتجعات</th>
                <th>المبالغ المحصلة</th>
                <th>إجراءات</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading && filteredCouriers.length > 0 ? (
                filteredCouriers.map((courier) => (
                  <tr key={courier.id}>
                    <td>
                      <div className="phoenix-delegates__identity">
                        <div className="phoenix-delegates__avatar">{courier.name.charAt(0)}</div>
                        <div className="phoenix-delegates__identity-copy">
                          <strong>{courier.name}</strong>
                          <span>
                            {courier.city} · {vehicleTypeLabels[courier.vehicleType] || courier.vehicleType}
                          </span>
                          <span
                            className={`phoenix-delegates__activity-badge ${ACTIVITY_CLASS[courier.activityState]}`}
                          >
                            {ACTIVITY_LABELS[courier.activityState]}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td dir="ltr" className="phoenix-delegates__ltr-cell">
                      {courier.phone}
                    </td>
                    <td>{courier.area}</td>
                    <td>
                      <span className={`phoenix-delegates__badge ${STATUS_CLASS[courier.status]}`}>
                        {STATUS_LABELS[courier.status]}
                      </span>
                    </td>
                    <td>{courier.activeOrdersCount}</td>
                    <td>{formatNumber(courier.totalDeliveries)}</td>
                    <td className="phoenix-delegates__metric phoenix-delegates__metric--danger">
                      {formatNumber(courier.returnedOrders)}
                    </td>
                    <td className="phoenix-delegates__metric phoenix-delegates__metric--accent">
                      {formatCurrency(courier.collectedAmount)}
                    </td>
                    <td>
                      <div className="phoenix-delegates__actions">
                        <button
                          type="button"
                          className="phoenix-delegates__link-btn"
                          onClick={() => openDetailsView(courier.id)}
                        >
                          تفاصيل
                        </button>
                        <button
                          type="button"
                          className="phoenix-delegates__ghost-btn"
                          onClick={() => openEditModal(courier)}
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          className="phoenix-delegates__secondary-btn phoenix-delegates__secondary-btn--compact"
                          onClick={() => handleToggleCourierStatus(courier)}
                          disabled={isMutating}
                        >
                          {courier.isActive ? "تعطيل" : "تفعيل"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="phoenix-delegates__empty">
                    {isLoading ? "جارٍ تحميل بيانات المناديب..." : "لا توجد نتائج مطابقة للفلاتر الحالية."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="phoenix-delegates__mobile-list">
          {!isLoading && filteredCouriers.length > 0 ? (
            filteredCouriers.map((courier) => (
              <article key={courier.id} className="phoenix-delegates__mobile-card">
                <div className="phoenix-delegates__mobile-head">
                  <div className="phoenix-delegates__identity">
                    <div className="phoenix-delegates__avatar">{courier.name.charAt(0)}</div>
                    <div className="phoenix-delegates__identity-copy">
                      <strong>{courier.name}</strong>
                      <span dir="ltr">{courier.phone}</span>
                    </div>
                  </div>

                  <span className={`phoenix-delegates__badge ${STATUS_CLASS[courier.status]}`}>
                    {STATUS_LABELS[courier.status]}
                  </span>
                </div>

                <div className="phoenix-delegates__mobile-grid">
                  <div>
                    <span>المنطقة</span>
                    <strong>{courier.area}</strong>
                  </div>
                  <div>
                    <span>نوع المركبة</span>
                    <strong>{vehicleTypeLabels[courier.vehicleType] || courier.vehicleType}</strong>
                  </div>
                  <div>
                    <span>الطلبات النشطة</span>
                    <strong>{courier.activeOrdersCount}</strong>
                  </div>
                  <div>
                    <span>إجمالي التوصيلات</span>
                    <strong>{formatNumber(courier.totalDeliveries)}</strong>
                  </div>
                  <div>
                    <span>المرتجعات</span>
                    <strong>{formatNumber(courier.returnedOrders)}</strong>
                  </div>
                  <div>
                    <span>المبالغ المحصلة</span>
                    <strong>{formatCurrency(courier.collectedAmount)}</strong>
                  </div>
                </div>

                <div className="phoenix-delegates__actions phoenix-delegates__actions--stacked">
                  <button
                    type="button"
                    className="phoenix-delegates__link-btn"
                    onClick={() => openDetailsView(courier.id)}
                  >
                    تفاصيل
                  </button>
                  <button
                    type="button"
                    className="phoenix-delegates__ghost-btn"
                    onClick={() => openEditModal(courier)}
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="phoenix-delegates__secondary-btn phoenix-delegates__secondary-btn--compact"
                    onClick={() => handleToggleCourierStatus(courier)}
                    disabled={isMutating}>
                    {courier.isActive ? "تعطيل" : "تفعيل"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="phoenix-delegates__empty phoenix-delegates__empty--mobile">
              {isLoading ? "جارٍ تحميل بيانات المناديب..." : "لا توجد نتائج مطابقة للفلاتر الحالية."}
            </div>
          )}
        </div>
      </article>

      {isFormOpen && (
        <div className="phoenix-delegates__modal-backdrop" onClick={closeFormModal}>
          <div className="phoenix-delegates__modal" onClick={(event) => event.stopPropagation()}>
            <div className="phoenix-delegates__modal-head">
              <div>
                <h3>{editingCourier ? "تعديل بيانات المندوب" : "إضافة مندوب جديد"}</h3>
              </div>
              <button type="button" onClick={closeFormModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="phoenix-delegates__form-grid" onSubmit={handleSubmitForm}>
              <label className="phoenix-delegates__field">
                <span>الاسم الكامل</span>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  placeholder="مثال: أحمد محمد"
                />
              </label>

              <label className="phoenix-delegates__field">
                <span>رقم الهاتف</span>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="05xxxxxxxx"
                />
              </label>

              <label className="phoenix-delegates__field">
                <span>المنطقة</span>
                <input
                  name="area"
                  value={formData.area}
                  onChange={handleFormChange}
                  placeholder="حي الطيرة"
                />
              </label>

              <label className="phoenix-delegates__field">
                <span>المدينة</span>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  placeholder="رام الله"
                />
              </label>

              <label className="phoenix-delegates__field">
                <span>نوع المركبة</span>
                <select name="vehicleType" value={formData.vehicleType} onChange={handleFormChange}>
                  {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="phoenix-delegates__field">
                <span>رقم الهوية</span>
                <input
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleFormChange}
                  placeholder="اختياري"
                />
              </label>

              <label className="phoenix-delegates__field">
                <span>رقم الرخصة</span>
                <input
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleFormChange}
                  placeholder="اختياري"
                />
              </label>

              <label className="phoenix-delegates__field phoenix-delegates__field--checkbox">
                <span>حالة النشاط</span>
                <div className="phoenix-delegates__checkbox-row">
                  <input
                    id="courier-active"
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                  />
                  <label htmlFor="courier-active">
                    {formData.isActive ? "Active / نشط" : "Inactive / غير نشط"}
                  </label>
                </div>
              </label>

              <div className="phoenix-delegates__form-actions">
                <button type="button" className="phoenix-delegates__secondary-btn" onClick={closeFormModal}>
                  إلغاء
                </button>
                <button type="submit" className="phoenix-delegates__primary-btn" disabled={isMutating}>
                  {editingCourier ? "حفظ التعديلات" : "إضافة المندوب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsOpen && (
        <div className="phoenix-delegates__details-overlay" onClick={closeDetailsView}>
          <div className="phoenix-delegates__details-panel" onClick={(event) => event.stopPropagation()}>
            {isDetailsLoading || !selectedCourierDetails ? (
              <div className="phoenix-delegates__loading-state">جارٍ تحميل تفاصيل المندوب...</div>
            ) : (
              <>
                <div className="phoenix-delegates__details-head">
                  <div className="phoenix-delegates__details-identity">
                    <div className="phoenix-delegates__details-avatar">
                      {selectedCourierDetails.name.charAt(0)}
                    </div>
                    <div>
                      <span className="phoenix-delegates__eyebrow">ملف المندوب</span>
                      <h2>{selectedCourierDetails.name}</h2>
                      <p>
                        {selectedCourierDetails.city} - {selectedCourierDetails.area}
                      </p>
                    </div>
                  </div>

                  <div className="phoenix-delegates__details-actions">
                    <button
                      type="button"
                      className="phoenix-delegates__ghost-btn"
                      onClick={() => openEditModal(selectedCourierDetails)}
                    >
                      تعديل البيانات
                    </button>
                    <button type="button" className="phoenix-delegates__secondary-btn" onClick={closeDetailsView}>
                      إغلاق
                    </button>
                  </div>
                </div>

                <div className="phoenix-delegates__details-overview">
                  <article className="phoenix-delegates__details-card">
                    <h3>بيانات المندوب</h3>
                    <div className="phoenix-delegates__details-list">
                      <div>
                        <span>رقم الهاتف</span>
                        <strong dir="ltr">{selectedCourierDetails.phone}</strong>
                      </div>
                      <div>
                        <span>نوع المركبة</span>
                        <strong>
                          {vehicleTypeLabels[selectedCourierDetails.vehicleType] ||
                            selectedCourierDetails.vehicleType}
                        </strong>
                      </div>
                      <div>
                        <span>رقم الهوية</span>
                        <strong>{selectedCourierDetails.nationalId}</strong>
                      </div>
                      <div>
                        <span>رقم الرخصة</span>
                        <strong>{selectedCourierDetails.licenseNumber}</strong>
                      </div>
                      <div>
                        <span>الحالة التشغيلية</span>
                        <strong>{STATUS_LABELS[selectedCourierDetails.status]}</strong>
                      </div>
                      <div>
                        <span>النشاط الإداري</span>
                        <strong>{ACTIVITY_LABELS[selectedCourierDetails.activityState]}</strong>
                      </div>
                    </div>
                  </article>

                  <article className="phoenix-delegates__details-card">
                    <h3>مؤشرات الأداء الحالية</h3>
                    <div className="phoenix-delegates__details-kpis">
                      <div>
                        <span>الطلبات الحالية</span>
                        <strong>{selectedCourierDetails.activeOrdersCount}</strong>
                      </div>
                      <div>
                        <span>إجمالي التوصيلات</span>
                        <strong>{formatNumber(selectedCourierDetails.totalDeliveries)}</strong>
                      </div>
                      <div>
                        <span>المرتجعات</span>
                        <strong>{formatNumber(selectedCourierDetails.returnedOrders)}</strong>
                      </div>
                      <div>
                        <span>المبالغ المحصلة</span>
                        <strong>{formatCurrency(selectedCourierDetails.collectedAmount)}</strong>
                      </div>
                      <div>
                        <span>الرصيد المالي</span>
                        <strong>{formatCurrency(selectedCourierDetails.finance.walletBalance)}</strong>
                      </div>
                      <div>
                        <span>التقييم العام</span>
                        <strong>{selectedCourierDetails.overallRating} / 5</strong>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="phoenix-delegates__details-grid">
                  <article className="phoenix-delegates__details-section">
                    <div className="phoenix-delegates__section-head">
                      <h3>الطلبات الحالية</h3>
                      <span>{selectedCourierDetails.currentOrders.length}</span>
                    </div>
                    <div className="phoenix-delegates__detail-items">
                      {selectedCourierDetails.currentOrders.length > 0 ? (
                        selectedCourierDetails.currentOrders.map((order) => (
                          <div key={order.shipmentId} className="phoenix-delegates__detail-item">
                            <div>
                              <strong>{order.orderNumber}</strong>
                              <p>{order.customerName}</p>
                              <span>{order.city} - {order.area}</span>
                            </div>
                            <div className="phoenix-delegates__detail-meta">
                              <span>{order.status}</span>
                              <strong>{formatCurrency(order.amount)}</strong>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="phoenix-delegates__sub-empty">لا توجد طلبات نشطة حاليًا.</div>
                      )}
                    </div>
                  </article>

                  <article className="phoenix-delegates__details-section">
                    <div className="phoenix-delegates__section-head">
                      <h3>سجل آخر التوصيلات</h3>
                      <span>{selectedCourierDetails.recentDeliveries.length}</span>
                    </div>
                    <div className="phoenix-delegates__detail-items">
                      {selectedCourierDetails.recentDeliveries.length > 0 ? (
                        selectedCourierDetails.recentDeliveries.map((delivery) => (
                          <div key={delivery.shipmentId} className="phoenix-delegates__detail-item">
                            <div>
                              <strong>{delivery.orderNumber}</strong>
                              <p>{delivery.customerName}</p>
                              <span>{formatDateTime(delivery.updatedAt)}</span>
                            </div>
                            <div className="phoenix-delegates__detail-meta">
                              <span>{delivery.paymentMethod}</span>
                              <strong>{formatCurrency(delivery.amount)}</strong>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="phoenix-delegates__sub-empty">لا يوجد سجل توصيلات حديث.</div>
                      )}
                    </div>
                  </article>

                  <article className="phoenix-delegates__details-section">
                    <div className="phoenix-delegates__section-head">
                      <h3>المرتجعات السابقة</h3>
                      <span>{selectedCourierDetails.returnedOrders.length}</span>
                    </div>
                    <div className="phoenix-delegates__detail-items">
                      {selectedCourierDetails.returnedOrders.length > 0 ? (
                        selectedCourierDetails.returnedOrders.map((returnedOrder) => (
                          <div key={returnedOrder.shipmentId} className="phoenix-delegates__detail-item">
                            <div>
                              <strong>{returnedOrder.orderNumber}</strong>
                              <p>{returnedOrder.customerName}</p>
                              <span>{returnedOrder.returnedReason}</span>
                            </div>
                            <div className="phoenix-delegates__detail-meta">
                              <span>{formatDateTime(returnedOrder.updatedAt)}</span>
                              <strong>{formatCurrency(returnedOrder.amount)}</strong>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="phoenix-delegates__sub-empty">لا يوجد سجل مرتجعات سابق.</div>
                      )}
                    </div>
                  </article>

                  <article className="phoenix-delegates__details-section">
                    <div className="phoenix-delegates__section-head">
                      <h3>الأداء الشهري</h3>
                      <span>آخر 4 أشهر</span>
                    </div>
                    <div className="phoenix-delegates__monthly-grid">
                      {selectedCourierDetails.monthlyPerformance.map((month) => (
                        <div key={month.month} className="phoenix-delegates__month-card">
                          <h4>{formatMonthLabel(month.month)}</h4>
                          <p>التوصيلات: {month.delivered}</p>
                          <p>المرتجعات: {month.returned}</p>
                          <p>الطلبات النشطة: {month.active}</p>
                          <p>التحصيل: {formatCurrency(month.collections)}</p>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="phoenix-delegates__details-section phoenix-delegates__details-section--finance">
                    <div className="phoenix-delegates__section-head">
                      <h3>الرصيد والإنجاز المالي</h3>
                      <span>ملخص مالي</span>
                    </div>
                    <div className="phoenix-delegates__finance-grid">
                      <div>
                        <span>الرصيد الحالي</span>
                        <strong>{formatCurrency(selectedCourierDetails.finance.walletBalance)}</strong>
                      </div>
                      <div>
                        <span>إجمالي التحصيل</span>
                        <strong>{formatCurrency(selectedCourierDetails.finance.collectionsTotal)}</strong>
                      </div>
                      <div>
                        <span>إجمالي أرباح المندوب</span>
                        <strong>{formatCurrency(selectedCourierDetails.finance.earningCredits)}</strong>
                      </div>
                      <div>
                        <span>إجمالي السحوبات</span>
                        <strong>{formatCurrency(selectedCourierDetails.finance.withdrawals)}</strong>
                      </div>
                    </div>
                  </article>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default DelegatesPage;

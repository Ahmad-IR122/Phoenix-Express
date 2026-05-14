import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import API from "../../../apis/api";
import "./ParcelDistributionPage.css";

const FALLBACK_DATA = {
  newParcels: [],
  assignedParcels: [],
  availableDrivers: [],
  allDrivers: [],
  summary: {
    newParcelsCount: 0,
    assignedParcelsCount: 0,
    totalActiveParcels: 0,
    availableDriversCount: 0,
    busyDriversCount: 0,
  },
};

const DRIVER_STATUS_CLASS = {
  متاح: "admin-distribution__driver-badge--available",
  مشغول: "admin-distribution__driver-badge--busy",
  "غير متصل": "admin-distribution__driver-badge--offline",
};

const SUMMARY_ITEMS = [
  {
    id: "new",
    label: "الطرود المعلقة",
    key: "newParcelsCount",
    icon: "bi-box-seam",
    tone: "admin-distribution__summary-card--blue",
  },
  {
    id: "assigned",
    label: "الشحنات المسندة",
    key: "assignedParcelsCount",
    icon: "bi-truck",
    tone: "admin-distribution__summary-card--sky",
  },
  {
    id: "available",
    label: "المندوبون المتاحون",
    key: "availableDriversCount",
    icon: "bi-person-check",
    tone: "admin-distribution__summary-card--green",
  },
  {
    id: "busy",
    label: "المندوبون المشغولون",
    key: "busyDriversCount",
    icon: "bi-person-fill-lock",
    tone: "admin-distribution__summary-card--red",
  },
];

const STATUS_FILTERS = [
  { value: "all", label: "كل حالات الشحنات" },
  { value: "accepted", label: "مسند" },
  { value: "picked_up", label: "تم الاستلام" },
  { value: "in_transit", label: "جارية" },
  { value: "arrived_to_destination_city", label: "وصلت للمدينة" },
  { value: "out_for_delivery", label: "قيد التوصيل" },
];

const moneyFormatter = new Intl.NumberFormat("en-US");

const formatMoney = (value) => `${moneyFormatter.format(Number(value || 0))} ₪`;
const ORDER_STATUS_LABELS = {
  pending: "جديد",
  confirmed: "مؤكد",
  accepted: "مقبول",
  picked_up: "تم الاستلام",
  in_transit: "قيد التوصيل",
  arrived_to_destination_city: "وصلت للمدينة",
  out_for_delivery: "خارج للتسليم",
  delivered: "تم التسليم",
  returned: "مرتجعة",
  cancelled: "ملغاة",
};
const getOrderStatusLabel = (status) => ORDER_STATUS_LABELS[status] || status || "جديد";

const REGION_NAME_ALIASES = {
  "west bank": "الضفة الغربية",
  west_bank: "الضفة الغربية",
  "الضفه الغربيه": "الضفة الغربية",
  "الضفة": "الضفة الغربية",

  jerusalem: "القدس",
  "al quds": "القدس",
  quds: "القدس",
  "القدس الشريف": "القدس",

  inside: "الداخل",
  interior: "الداخل",
  "48": "الداخل",
  "الداخل الفلسطيني": "الداخل",
};

function normalizeRegionName(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "-";
  }

  const aliasMatch = REGION_NAME_ALIASES[rawValue.toLowerCase()];
  if (aliasMatch) {
    return aliasMatch;
  }

  if (rawValue.includes("-")) {
    return rawValue
      .split("-")
      .map((part) => normalizeRegionName(part))
      .join(" - ");
  }

  return rawValue;
}

const buildParams = (filters) => {
  const params = {};

  if (filters.search.trim()) {
    params.search = filters.search.trim();
  }

  if (filters.regionId) {
    params.regionId = filters.regionId;
  }

  if (filters.shipmentStatus !== "all") {
    params.shipmentStatus = filters.shipmentStatus;
  }

  if (filters.driverId) {
    params.driverId = filters.driverId;
  }

  return params;
};

function ParcelDistributionPage() {
  const [distributionData, setDistributionData] = useState(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingDriverId, setSubmittingDriverId] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    regionId: "",
    shipmentStatus: "all",
    driverId: "",
  });
  const deferredSearch = useDeferredValue(filters.search);
  const requestFilters = useMemo(
    () => ({
      ...filters,
      search: deferredSearch,
    }),
    [deferredSearch, filters],
  );

  const loadDistributionData = async (nextFilters) => {
    try {
      setIsLoading(true);
      setPageError("");

      const response = await API.get("/admin/parcel-distribution", {
        params: buildParams(nextFilters),
      });
      setDistributionData(response.data?.data || FALLBACK_DATA);
    } catch (error) {
      setDistributionData(FALLBACK_DATA);
      setPageError("تعذر تحميل بيانات توزيع الطرود حالياً.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDistributionData(requestFilters);
  }, [requestFilters]);

  const summary = distributionData.summary || FALLBACK_DATA.summary;
  const newParcels = useMemo(
    () => distributionData.newParcels || [],
    [distributionData.newParcels],
  );
  const assignedParcels = useMemo(
    () => distributionData.assignedParcels || [],
    [distributionData.assignedParcels],
  );
  const allDrivers = distributionData.allDrivers || [];
  const drivers = distributionData.availableDrivers || [];

  const regions = useMemo(() => {
    const regionsMap = new Map();

    [...newParcels, ...assignedParcels].forEach((parcel) => {
      if (parcel.region?.id) {
        regionsMap.set(
          parcel.region.id,
          normalizeRegionName(parcel.region.name || parcel.regionName || "-"),
        );
      }
    });

    return Array.from(regionsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [assignedParcels, newParcels]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      regionId: "",
      shipmentStatus: "all",
      driverId: "",
    });
  };

  const refreshData = () =>
    loadDistributionData(requestFilters);

  const openAssignModal = (parcel) => {
    setSelectedParcel(parcel);
    setActionError("");
    setIsModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsModalOpen(false);
    setSelectedParcel(null);
    setSubmittingDriverId(null);
  };

  const handleAssignParcel = async (driver) => {
    if (!selectedParcel || !driver?.canReceiveOrders) {
      return;
    }

    try {
      setSubmittingDriverId(driver.id);
      setActionError("");

      await API.post("/admin/parcel-distribution/assign", {
        orderId: selectedParcel.orderId,
        driverId: driver.id,
      });

      closeAssignModal();
      await refreshData();
    } catch (error) {
      setActionError(
        error.response?.data?.message || "تعذر تخصيص الطرد للمندوب في الوقت الحالي.",
      );
    } finally {
      setSubmittingDriverId(null);
    }
  };

  return (
    <section className="admin-distribution" dir="rtl">
      <div className="admin-distribution__hero">
        <div className="admin-distribution__hero-copy">
          <span className="admin-distribution__eyebrow">لوحة التوزيع</span>
          <h1 className="admin-distribution__title">توزيع الشحنات على المندوبين</h1>
          <p className="admin-distribution__subtitle">
            راجع الطرود المعلقة، الشحنات المسندة، والمندوبين المتاحين من نفس الصفحة.
          </p>
        </div>
        <button
          type="button"
          className="admin-distribution__action-btn admin-distribution__action-btn--secondary"
          onClick={refreshData}
        >
          تحديث البيانات
        </button>
      </div>

      <article className="admin-distribution__card admin-distribution__toolbar">
        <label className="admin-distribution__search">
          <i className="bi bi-search"></i>
          <input
            type="text"
            value={filters.search}
            onChange={(event) => handleFilterChange("search", event.target.value)}
            placeholder="ابحث برقم الشحنة أو الطلب أو اسم التاجر أو المستلم"
          />
        </label>

        <select
          className="admin-distribution__select"
          value={filters.regionId}
          onChange={(event) => handleFilterChange("regionId", event.target.value)}
        >
          <option value="">كل المناطق</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>

        <select
          className="admin-distribution__select"
          value={filters.shipmentStatus}
          onChange={(event) => handleFilterChange("shipmentStatus", event.target.value)}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <select
          className="admin-distribution__select"
          value={filters.driverId}
          onChange={(event) => handleFilterChange("driverId", event.target.value)}
        >
          <option value="">كل المندوبين</option>
          {allDrivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.fullName}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="admin-distribution__action-btn admin-distribution__action-btn--ghost"
          onClick={resetFilters}
        >
          إعادة ضبط
        </button>
      </article>

      <div className="admin-distribution__summary-grid">
        {SUMMARY_ITEMS.map((item) => (
          <article
            key={item.id}
            className={`admin-distribution__summary-card ${item.tone}`}
          >
            <div className="admin-distribution__summary-icon">
              <i className={`bi ${item.icon}`}></i>
            </div>
            <div className="admin-distribution__summary-content">
              <span>{item.label}</span>
              <strong>{summary[item.key] || 0}</strong>
            </div>
          </article>
        ))}
      </div>

      {pageError ? (
        <article className="admin-distribution__card admin-distribution__state-card">
          <i className="bi bi-exclamation-circle"></i>
          <h2>تعذر تحميل البيانات</h2>
          <p>{pageError}</p>
          <button
            type="button"
            className="admin-distribution__action-btn admin-distribution__action-btn--primary"
            onClick={refreshData}
          >
            إعادة المحاولة
          </button>
        </article>
      ) : isLoading ? (
        <article className="admin-distribution__card admin-distribution__state-card">
          <i className="bi bi-arrow-repeat"></i>
          <h2>جارٍ تحميل بيانات التوزيع</h2>
          <p>نجهز لك حالة الطرود والمناديب الآن.</p>
        </article>
      ) : (
        <>
          <div className="admin-distribution__layout">
            <article className="admin-distribution__card admin-distribution__delegates-card">
              <div className="admin-distribution__section-head">
                <div>
                  <h2 className="admin-distribution__section-title">المندوبون المتاحون</h2>
                  <p className="admin-distribution__section-subtitle">
                    يمكن الإسناد فقط للمندوب النشط الذي حالته الحالية متاح.
                  </p>
                </div>
              </div>

              {drivers.length === 0 ? (
                <div className="admin-distribution__empty">
                  <i className="bi bi-person-x"></i>
                  <span>لا يوجد مندوب متاح حالياً للاستلام.</span>
                </div>
              ) : (
                <div className="admin-distribution__drivers">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="admin-distribution__driver-row">
                      <div className="admin-distribution__driver-copy">
                        <h3>{driver.fullName}</h3>
                        <p>{driver.phone}</p>
                        <p>{driver.address}</p>
                        <p>{driver.activeParcels} طرود نشطة</p>
                      </div>
                      <span
                        className={`admin-distribution__driver-badge ${
                          DRIVER_STATUS_CLASS[driver.availabilityStatus] ||
                          "admin-distribution__driver-badge--available"
                        }`}
                      >
                        {driver.availabilityStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <section className="admin-distribution__main">
              <article className="admin-distribution__card">
                <div className="admin-distribution__section-head">
                  <div>
                    <h2 className="admin-distribution__section-title">الطرود المعلقة</h2>
                    <p className="admin-distribution__section-subtitle">
                      الطرود التي ما زالت في الشركة ولم تُسند بعد إلى أي مندوب.
                    </p>
                  </div>
                  <span className="admin-distribution__count">{summary.newParcelsCount}</span>
                </div>

                {newParcels.length === 0 ? (
                  <div className="admin-distribution__empty">
                    <i className="bi bi-inbox"></i>
                    <span>لا توجد طرود معلقة مطابقة للفلاتر الحالية.</span>
                  </div>
                ) : (
                  <div className="admin-distribution__parcel-list">
                    {newParcels.map((parcel) => (
                      <article key={parcel.orderId} className="admin-distribution__parcel-card">
                        <div className="admin-distribution__parcel-top">
                          <div>
                            <h3 className="admin-distribution__parcel-id">طلب #{parcel.orderId}</h3>
                            <p className="admin-distribution__parcel-merchant">{parcel.merchant}</p>
                          </div>
                          <div className="admin-distribution__parcel-badges">
                            <span className="admin-distribution__priority">{parcel.priority}</span>
                            <span className="admin-distribution__status-chip admin-distribution__status-chip--muted">
                              {getOrderStatusLabel(parcel.orderStatus)}
                            </span>
                          </div>
                        </div>

                        <div className="admin-distribution__parcel-grid">
                          <div>
                            <span className="admin-distribution__label">رقم الشحنة</span>
                            <p>{parcel.shipmentNumber}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">المنطقة</span>
                            <p>{parcel.regionName}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">المستلم</span>
                            <p>{parcel.receiverName}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">الهاتف</span>
                            <p>{parcel.receiverPhone}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">من</span>
                            <p>{parcel.originCity}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">إلى</span>
                            <p>{parcel.destinationCity}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">الحجم</span>
                            <p>{parcel.packageSize}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">رسوم التوصيل</span>
                            <p>{formatMoney(parcel.deliveryFee)}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">سعر المنتج</span>
                            <p>{formatMoney(parcel.productPrice)}</p>
                          </div>
                          <div className="admin-distribution__parcel-grid-wide">
                            <span className="admin-distribution__label">العنوان</span>
                            <p>{parcel.receiverAddress}</p>
                          </div>
                          <div className="admin-distribution__parcel-grid-wide">
                            <span className="admin-distribution__label">وصف الطرد</span>
                            <p>{parcel.packageDescription}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="admin-distribution__action-btn admin-distribution__action-btn--primary"
                          onClick={() => openAssignModal(parcel)}
                          disabled={drivers.length === 0}
                        >
                          {drivers.length === 0 ? "لا يوجد مندوب متاح" : "تخصيص لمندوب متاح"}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </section>
            
            <section className="admin-distribution__main">
              <article className="admin-distribution__card">
                <div className="admin-distribution__section-head">
                  <div>
                    <h2 className="admin-distribution__section-title">الشحنات المسندة النشطة</h2>
                    <p className="admin-distribution__section-subtitle">
                      الشحنات المرتبطة بمندوب وما زالت ضمن الحالات التشغيلية النشطة.
                    </p>
                  </div>
                  <span className="admin-distribution__count">
                    {summary.assignedParcelsCount}
                  </span>
                </div>

                {assignedParcels.length === 0 ? (
                  <div className="admin-distribution__empty">
                    <i className="bi bi-truck"></i>
                    <span>لا توجد شحنات مسندة مطابقة للفلاتر الحالية.</span>
                  </div>
                ) : (
                  <div className="admin-distribution__assigned-list">
                    {assignedParcels.map((parcel) => (
                      <article
                        key={parcel.shipmentId || parcel.orderId}
                        className="admin-distribution__assigned-card"
                      >
                        <div className="admin-distribution__assigned-top">
                          <div>
                            <h3 className="admin-distribution__parcel-id">طلب #{parcel.orderId}</h3>
                            <p className="admin-distribution__parcel-merchant">{parcel.merchant}</p>
                          </div>
                          <span className="admin-distribution__status-chip">
                            {parcel.statusLabel}
                          </span>
                        </div>

                        <div className="admin-distribution__assigned-grid">
                          <div>
                            <span className="admin-distribution__label">رقم التتبع</span>
                            <p>{parcel.trackingNumber}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">المنطقة</span>
                            <p>{parcel.regionName}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">المندوب</span>
                            <p>{parcel.driverName}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">هاتف المندوب</span>
                            <p>{parcel.driverPhone}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">المستلم</span>
                            <p>{parcel.receiverName}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">هاتف المستلم</span>
                            <p>{parcel.receiverPhone}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">من</span>
                            <p>{parcel.originCity}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">إلى</span>
                            <p>{parcel.destinationCity}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">رسوم التوصيل</span>
                            <p>{formatMoney(parcel.deliveryFee)}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">سعر المنتج</span>
                            <p>{formatMoney(parcel.productPrice)}</p>
                          </div>
                          <div className="admin-distribution__parcel-grid-wide">
                            <span className="admin-distribution__label">العنوان</span>
                            <p>{parcel.receiverAddress}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </section>
          </div>

          {isModalOpen && selectedParcel ? (
            <div className="admin-distribution__modal" onClick={closeAssignModal}>
              <div
                className="admin-distribution__modal-dialog"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="admin-distribution__modal-head">
                  <div>
                    <h2>تخصيص الطرد #{selectedParcel.orderId}</h2>
                    <p>راجع تفاصيل الشحنة ثم اختر مندوبًا متاحًا فقط لإتمام الإسناد.</p>
                  </div>
                  <button
                    type="button"
                    className="admin-distribution__close-btn"
                    onClick={closeAssignModal}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                {actionError ? (
                  <p className="admin-distribution__modal-error">{actionError}</p>
                ) : null}

                <div className="admin-distribution__modal-summary">
                  <div>
                    <span className="admin-distribution__label">التاجر</span>
                    <p>{selectedParcel.merchant}</p>
                  </div>
                  <div>
                    <span className="admin-distribution__label">المستلم</span>
                    <p>{selectedParcel.receiverName}</p>
                  </div>
                  <div>
                    <span className="admin-distribution__label">الهاتف</span>
                    <p>{selectedParcel.receiverPhone}</p>
                  </div>
                  <div>
                    <span className="admin-distribution__label">المنطقة</span>
                    <p>{selectedParcel.regionName}</p>
                  </div>
                  <div>
                    <span className="admin-distribution__label">رسوم التوصيل</span>
                    <p>{formatMoney(selectedParcel.deliveryFee)}</p>
                  </div>
                  <div>
                    <span className="admin-distribution__label">سعر المنتج</span>
                    <p>{formatMoney(selectedParcel.productPrice)}</p>
                  </div>
                </div>

                {drivers.length === 0 ? (
                  <div className="admin-distribution__empty">
                    <i className="bi bi-person-x"></i>
                    <span>لا يوجد مندوبون متاحون الآن لاستلام هذا الطلب.</span>
                  </div>
                ) : (
                  <div className="admin-distribution__modal-list">
                    {drivers.map((driver) => (
                      <button
                        key={driver.id}
                        type="button"
                        className="admin-distribution__modal-driver"
                        onClick={() => handleAssignParcel(driver)}
                        disabled={submittingDriverId === driver.id || !driver.canReceiveOrders}
                      >
                        <div className="admin-distribution__modal-driver-copy">
                          <h3>{driver.fullName}</h3>
                          <p>{driver.phone}</p>
                          <p>{driver.address}</p>
                          <p>{driver.activeParcels} طرود نشطة</p>
                        </div>
                        <div className="admin-distribution__modal-driver-meta">
                          <span
                            className={`admin-distribution__driver-badge ${
                              DRIVER_STATUS_CLASS[driver.availabilityStatus] ||
                              "admin-distribution__driver-badge--available"
                            }`}
                          >
                            {driver.availabilityStatus}
                          </span>
                          <span>
                            {submittingDriverId === driver.id
                              ? "جارٍ التخصيص..."
                              : driver.canReceiveOrders
                                ? "تأكيد التخصيص"
                                : "غير متاح"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="admin-distribution__modal-actions">
                  <button
                    type="button"
                    className="admin-distribution__action-btn admin-distribution__action-btn--secondary"
                    onClick={closeAssignModal}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export default ParcelDistributionPage;

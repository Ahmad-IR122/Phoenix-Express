import React, { useEffect, useMemo, useState } from "react";
import API from "../../../apis/api";
import "./ParcelDistributionPage.css";

const FALLBACK_DATA = {
  newParcels: [],
  assignedParcels: [],
  availableDrivers: [],
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
    label: "الطرود المسندة",
    key: "assignedParcelsCount",
    icon: "bi-truck",
    tone: "admin-distribution__summary-card--sky",
  },
  {
    id: "available",
    label: "المناديب المتاحين",
    key: "availableDriversCount",
    icon: "bi-person-check",
    tone: "admin-distribution__summary-card--green",
  },
  {
    id: "busy",
    label: "المناديب المشغولين",
    key: "busyDriversCount",
    icon: "bi-person-fill-lock",
    tone: "admin-distribution__summary-card--red",
  },
];

function ParcelDistributionPage() {
  const [distributionData, setDistributionData] = useState(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingDriverId, setSubmittingDriverId] = useState(null);

  const loadDistributionData = async () => {
    try {
      setIsLoading(true);
      setPageError("");

      const response = await API.get("/admin/parcel-distribution");
      setDistributionData(response.data?.data || FALLBACK_DATA);
    } catch (error) {
      setDistributionData(FALLBACK_DATA);
      setPageError("تعذر تحميل بيانات توزيع الطرود حاليًا.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDistributionData();
  }, []);

  const summary = distributionData.summary || FALLBACK_DATA.summary;
  const newParcels = distributionData.newParcels || [];
  const assignedParcels = distributionData.assignedParcels || [];
  const drivers = useMemo(
    () => distributionData.availableDrivers || [],
    [distributionData.availableDrivers],
  );

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
      await loadDistributionData();
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
          <h1 className="admin-distribution__title">نظام توزيع الطرود الذكي</h1>
          <p className="admin-distribution__subtitle">
            إدارة وتوزيع الطرود على المناديب
          </p>
        </div>
      </div>

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
            onClick={loadDistributionData}
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
            <section className="admin-distribution__main">
              <article className="admin-distribution__card">
                <div className="admin-distribution__section-head">
                  <div>
                    <h2 className="admin-distribution__section-title">
                      الطرود المعلقة
                    </h2>
                    <p className="admin-distribution__section-subtitle">
                      الطرود التي لم تُخصص بعد إلى أي مندوب.
                    </p>
                  </div>
                  <span className="admin-distribution__count">{summary.newParcelsCount}</span>
                </div>

                {newParcels.length === 0 ? (
                  <div className="admin-distribution__empty">
                    لا توجد طرود جديدة تحتاج تخصيصًا الآن.
                  </div>
                ) : (
                  <div className="admin-distribution__parcel-list">
                    {newParcels.map((parcel) => (
                      <article key={parcel.orderId} className="admin-distribution__parcel-card">
                        <div className="admin-distribution__parcel-top">
                          <div>
                            <h3 className="admin-distribution__parcel-id">#{parcel.orderId}</h3>
                            <p className="admin-distribution__parcel-merchant">{parcel.merchant}</p>
                          </div>
                          <span className="admin-distribution__priority">{parcel.priority}</span>
                        </div>

                        <div className="admin-distribution__parcel-grid">
                          <div>
                            <span className="admin-distribution__label">المستلم</span>
                            <p>{parcel.receiverName}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">الهاتف</span>
                            <p>{parcel.receiverPhone}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">المدينة</span>
                            <p>{parcel.destinationCity}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">الحجم</span>
                            <p>{parcel.packageSize}</p>
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
                        >
                          تخصيص لمندوب
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </article>

              <article className="admin-distribution__card">
                <div className="admin-distribution__section-head">
                  <div>
                    <h2 className="admin-distribution__section-title">الطرود المسندة النشطة</h2>
                    <p className="admin-distribution__section-subtitle">
                      الشحنات المرتبطة بمندوب وما زالت ضمن الحالات التشغيلية النشطة.
                    </p>
                  </div>
                  <span className="admin-distribution__count">
                    {summary.assignedParcelsCount}
                  </span>
                </div>

                {assignedParcels.length === 0 ? (
                  <div className="admin-distribution__empty">لا توجد طرود مسندة حاليًا.</div>
                ) : (
                  <div className="admin-distribution__assigned-list">
                    {assignedParcels.map((parcel) => (
                      <article
                        key={parcel.shipmentId || parcel.orderId}
                        className="admin-distribution__assigned-card"
                      >
                        <div className="admin-distribution__assigned-top">
                          <div>
                            <h3 className="admin-distribution__parcel-id">#{parcel.orderId}</h3>
                            <p className="admin-distribution__parcel-merchant">{parcel.merchant}</p>
                          </div>
                          <span className="admin-distribution__status-chip">
                            {parcel.statusLabel}
                          </span>
                        </div>

                        <div className="admin-distribution__assigned-grid">
                          <div>
                            <span className="admin-distribution__label">المندوب</span>
                            <p>{parcel.driverName}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">رقم التتبع</span>
                            <p>{parcel.trackingNumber}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">المستلم</span>
                            <p>{parcel.receiverName}</p>
                          </div>
                          <div>
                            <span className="admin-distribution__label">الهاتف</span>
                            <p>{parcel.receiverPhone}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <aside className="admin-distribution__side">
              <article className="admin-distribution__card">
                <div className="admin-distribution__section-head">
                  <div>
                    <h2 className="admin-distribution__section-title">المندوبون المتاحون</h2>
                    <p className="admin-distribution__section-subtitle">
                      نعرض الحمل الحالي لكل مندوب مع حالة التوفر وفق قاعدة أقل من 5 طرود نشطة.
                    </p>
                  </div>
                </div>

                <div className="admin-distribution__drivers">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="admin-distribution__driver-row">
                      <div className="admin-distribution__driver-copy">
                        <h3>{driver.fullName}</h3>
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
              </article>

              <article className="admin-distribution__card admin-distribution__insight-card">
                <div className="admin-distribution__insight-head">
                  <i className="bi bi-activity"></i>
                  <div>
                    <h3>الحمل التشغيلي الحالي</h3>
                    <p>إجمالي الطرود النشطة يساوي الطرود المعلقة مضافًا إليها الطرود المسندة النشطة.</p>
                  </div>
                </div>

                <div className="admin-distribution__insight-metrics">
                  <div>
                    <span>إجمالي الطرود النشطة</span>
                    <strong>{summary.totalActiveParcels}</strong>
                  </div>
                  <div>
                    <span>الطرود المسندة النشطة</span>
                    <strong>{summary.assignedParcelsCount}</strong>
                  </div>
                </div>
              </article>
            </aside>
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
                    <p>اختر مندوبًا متاحًا أو راجع الحمولة الحالية قبل الإسناد.</p>
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

                {drivers.length === 0 ? (
                  <div className="admin-distribution__empty">
                    لا يوجد مندوبون متاحون الآن لاستلام هذا الطلب.
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
                                ? "تخصيص"
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

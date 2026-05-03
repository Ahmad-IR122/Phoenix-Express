import React, { useEffect, useMemo, useState } from "react";
import API from "../../../apis/api";
import "./ReturnedShipmentsPage.css";

const formatCurrency = (value) =>
  `₪${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const FALLBACK_DATA = {
  items: [],
  availableDrivers: [],
};

function ReturnedShipmentsPage() {
  const [pageData, setPageData] = useState(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingKey, setSubmittingKey] = useState("");

  const loadReturnedShipments = async () => {
    try {
      setIsLoading(true);
      setPageError("");

      const response = await API.get("/admin/returned-shipments");
      setPageData(response.data?.data || FALLBACK_DATA);
    } catch (error) {
      setPageData(FALLBACK_DATA);
      setPageError("تعذر تحميل الشحنات المرتجعة حاليًا.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReturnedShipments();
  }, []);

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage("");
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

  const items = pageData.items ?? FALLBACK_DATA.items;
  const availableDrivers = pageData.availableDrivers ?? FALLBACK_DATA.availableDrivers;

  const summary = useMemo(
    () => ({
      returnedCount: items.length,
      totalProductPrice: items.reduce((sum, item) => sum + Number(item.productPrice || 0), 0),
      totalDeliveryFees: items.reduce((sum, item) => sum + Number(item.deliveryFee || 0), 0),
      availableDriversCount: availableDrivers.length,
    }),
    [items, availableDrivers],
  );

  const openReassignModal = (shipment) => {
    setSelectedShipment(shipment);
    setActionError("");
    setIsModalOpen(true);
  };

  const closeReassignModal = () => {
    setSelectedShipment(null);
    setIsModalOpen(false);
    setSubmittingKey("");
  };

  const handleReassign = async (driverId) => {
    if (!selectedShipment) {
      return;
    }

    try {
      setSubmittingKey(`reassign-${driverId}`);
      setActionError("");
      setFeedbackMessage("");

      await API.post(`/admin/returned-shipments/${selectedShipment.shipmentId}/reassign`, {
        driverId,
      });

      closeReassignModal();
      await loadReturnedShipments();
      setFeedbackMessage("تمت إعادة تخصيص الشحنة المرتجعة بنجاح.");
    } catch (error) {
      setActionError(
        error.response?.data?.message || "تعذر إعادة تخصيص الشحنة المرتجعة حاليًا.",
      );
    } finally {
      setSubmittingKey("");
    }
  };

  const handleCancel = async (shipmentId) => {
    try {
      setSubmittingKey(`cancel-${shipmentId}`);
      setActionError("");
      setFeedbackMessage("");

      await API.patch(`/admin/returned-shipments/${shipmentId}/cancel`);

      await loadReturnedShipments();
      setFeedbackMessage("تم إلغاء الشحنة المرتجعة بنجاح.");
    } catch (error) {
      setActionError(error.response?.data?.message || "تعذر إلغاء الشحنة المرتجعة حاليًا.");
    } finally {
      setSubmittingKey("");
    }
  };

  return (
    <section className="admin-returns" dir="rtl">
      <div className="admin-returns__hero">
        <div className="admin-returns__hero-copy">
          <span className="admin-returns__eyebrow">إدارة المرتجعات</span>
          <h1 className="admin-returns__title">الشحنات المرتجعة</h1>
          <p className="admin-returns__subtitle">
            راجع الشحنات التي تعذر تسليمها، ثم أعد تخصيصها لمندوب متاح أو قم بإلغائها من
            الإدارة.
          </p>
        </div>
      </div>

      <div className="admin-returns__summary-grid">
        <article className="admin-returns__summary-card admin-returns__summary-card--blue">
          <div className="admin-returns__summary-icon">
            <i className="bi bi-arrow-return-right"></i>
          </div>
          <div className="admin-returns__summary-copy">
            <span>إجمالي المرتجعات</span>
            <strong>{summary.returnedCount}</strong>
          </div>
        </article>

        <article className="admin-returns__summary-card admin-returns__summary-card--amber">
          <div className="admin-returns__summary-icon">
            <i className="bi bi-box2-heart"></i>
          </div>
          <div className="admin-returns__summary-copy">
            <span>إجمالي قيمة الطرود</span>
            <strong>{formatCurrency(summary.totalProductPrice)}</strong>
          </div>
        </article>

        <article className="admin-returns__summary-card admin-returns__summary-card--sky">
          <div className="admin-returns__summary-icon">
            <i className="bi bi-truck"></i>
          </div>
          <div className="admin-returns__summary-copy">
            <span>إجمالي رسوم التوصيل</span>
            <strong>{formatCurrency(summary.totalDeliveryFees)}</strong>
          </div>
        </article>

        <article className="admin-returns__summary-card admin-returns__summary-card--green">
          <div className="admin-returns__summary-icon">
            <i className="bi bi-person-check"></i>
          </div>
          <div className="admin-returns__summary-copy">
            <span>المندوبون المتاحون</span>
            <strong>{summary.availableDriversCount}</strong>
          </div>
        </article>
      </div>

      <article className="admin-returns__panel">
        {feedbackMessage ? <p className="admin-returns__feedback">{feedbackMessage}</p> : null}
        {actionError ? (
          <p className="admin-returns__feedback admin-returns__feedback--error">{actionError}</p>
        ) : null}

        {pageError ? (
          <div className="admin-returns__state">
            <i className="bi bi-exclamation-circle"></i>
            <p>{pageError}</p>
          </div>
        ) : isLoading ? (
          <div className="admin-returns__state">
            <i className="bi bi-arrow-repeat"></i>
            <p>جارٍ تحميل الشحنات المرتجعة...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="admin-returns__state">
            <i className="bi bi-inbox"></i>
            <p>لا توجد شحنات مرتجعة حاليًا.</p>
          </div>
        ) : (
          <>
            <div className="admin-returns__table-wrap">
              <table className="admin-returns__table">
                <thead>
                  <tr>
                    <th>رقم الشحنة/الطلب</th>
                    <th>التاجر</th>
                    <th>المستلم</th>
                    <th>الجوال</th>
                    <th>العنوان</th>
                    <th>المندوب</th>
                    <th>تاريخ الإرجاع</th>
                    <th>سعر الطرد</th>
                    <th>رسوم التوصيل</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.shipmentId}>
                      <td>
                        <div className="admin-returns__id-cell">
                          <strong>{item.shipmentNumber}</strong>
                          <span>طلب #{item.orderId}</span>
                        </div>
                      </td>
                      <td>{item.merchantName}</td>
                      <td>{item.receiverName}</td>
                      <td>{item.receiverPhone}</td>
                      <td>{item.receiverAddress}</td>
                      <td>{item.employeeName}</td>
                      <td>{formatDate(item.returnedAt)}</td>
                      <td>{formatCurrency(item.productPrice)}</td>
                      <td>{formatCurrency(item.deliveryFee)}</td>
                      <td>
                        <span className="admin-returns__status">{item.statusLabel}</span>
                      </td>
                      <td>
                        <div className="admin-returns__actions">
                          <button
                            type="button"
                            className="admin-returns__action-btn admin-returns__action-btn--primary"
                            onClick={() => openReassignModal(item)}
                          >
                            إعادة التخصيص
                          </button>
                          <button
                            type="button"
                            className="admin-returns__action-btn admin-returns__action-btn--danger"
                            onClick={() => handleCancel(item.shipmentId)}
                            disabled={submittingKey === `cancel-${item.shipmentId}`}
                          >
                            {submittingKey === `cancel-${item.shipmentId}` ? "جارٍ الإلغاء..." : "إلغاء"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-returns__cards">
              {items.map((item) => (
                <article key={item.shipmentId} className="admin-returns__card">
                  <div className="admin-returns__card-top">
                    <div>
                      <h3>{item.shipmentNumber}</h3>
                      <p>طلب #{item.orderId}</p>
                    </div>
                    <span className="admin-returns__status">{item.statusLabel}</span>
                  </div>
                  <div className="admin-returns__card-grid">
                    <div><span>التاجر</span><strong>{item.merchantName}</strong></div>
                    <div><span>المستلم</span><strong>{item.receiverName}</strong></div>
                    <div><span>الجوال</span><strong>{item.receiverPhone}</strong></div>
                    <div><span>المندوب</span><strong>{item.employeeName}</strong></div>
                    <div><span>سعر الطرد</span><strong>{formatCurrency(item.productPrice)}</strong></div>
                    <div><span>رسوم التوصيل</span><strong>{formatCurrency(item.deliveryFee)}</strong></div>
                  </div>
                  <p className="admin-returns__address">{item.receiverAddress}</p>
                  <p className="admin-returns__date">{formatDate(item.returnedAt)}</p>
                  <div className="admin-returns__actions">
                    <button
                      type="button"
                      className="admin-returns__action-btn admin-returns__action-btn--primary"
                      onClick={() => openReassignModal(item)}
                    >
                      إعادة التخصيص
                    </button>
                    <button
                      type="button"
                      className="admin-returns__action-btn admin-returns__action-btn--danger"
                      onClick={() => handleCancel(item.shipmentId)}
                      disabled={submittingKey === `cancel-${item.shipmentId}`}
                    >
                      {submittingKey === `cancel-${item.shipmentId}` ? "جارٍ الإلغاء..." : "إلغاء"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </article>

      {isModalOpen && selectedShipment ? (
        <div className="admin-returns__modal" onClick={closeReassignModal}>
          <div className="admin-returns__modal-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="admin-returns__modal-head">
              <div>
                <h2>إعادة تخصيص {selectedShipment.shipmentNumber}</h2>
                <p>اختر مندوبًا متاحًا لإعادة الشحنة إلى دورة التوصيل من جديد.</p>
              </div>
              <button type="button" className="admin-returns__close-btn" onClick={closeReassignModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {availableDrivers.length === 0 ? (
              <div className="admin-returns__state">
                <i className="bi bi-person-x"></i>
                <p>لا يوجد مندوبون متاحون الآن لإعادة التخصيص.</p>
              </div>
            ) : (
              <div className="admin-returns__driver-list">
                {availableDrivers.map((driver) => (
                  <button
                    key={driver.id}
                    type="button"
                    className="admin-returns__driver-card"
                    onClick={() => handleReassign(driver.id)}
                    disabled={submittingKey === `reassign-${driver.id}`}
                  >
                    <div>
                      <strong>{driver.fullName}</strong>
                      <p>{driver.address}</p>
                    </div>
                    <span>
                      {submittingKey === `reassign-${driver.id}` ? "جارٍ التخصيص..." : "تخصيص"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ReturnedShipmentsPage;

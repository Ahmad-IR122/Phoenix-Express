import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../../apis/api";
import "./OrderConfirmation.css";

const DELIVERY_REGION_PRICES = {
  "west-bank": 20,
  jerusalem: 30,
  inside: 70,
};

const DELIVERY_REGION_LABELS = {
  "west-bank": "الضفة الغربية",
  jerusalem: "القدس",
  inside: "الداخل",
};

const ORDER_SIZE_LABELS = {
  small: "صغير",
  medium: "متوسط",
  large: "كبير",
};

const ORDER_STATUS_LABELS = {
  normal: "عادي",
  urgent: "عاجل",
  immediate: "فوري",
};

const FALLBACK_ORDER = {
  originalCity: "-",
  destinationCity: "-",
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  receiverName: "-",
  receiverPhone: "",
  receiverAddress: "",
  orderSize: "",
  orderStatus: "",
  isFragile: false,
  orderPrice: "",
  selectedRegion: "",
  deliveryAmount: 0,
  orderDescription: "",
};

const formatAmount = (amount) => `${amount || 0} شيكل`;

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const orderData = useMemo(() => {
    const state = location.state || {};
    const deliveryAmount =
      state.deliveryAmount ?? DELIVERY_REGION_PRICES[state.selectedRegion] ?? 0;

    return {
      ...FALLBACK_ORDER,
      ...state,
      deliveryRegionLabel:
        state.deliveryRegionLabel ||
        DELIVERY_REGION_LABELS[state.selectedRegion] ||
        "-",
      orderSizeLabel:
        ORDER_SIZE_LABELS[state.orderSize] || state.orderSize || "-",
      orderStatusLabel:
        ORDER_STATUS_LABELS[state.orderStatus] || state.orderStatus || "-",
      deliveryAmount,
      collectionAmount:
        state.orderPrice !== "" && state.orderPrice !== undefined
          ? Number(state.orderPrice) || 0
          : deliveryAmount,
    };
  }, [location.state]);

  const hasOrderState = Boolean(location.state);

  useEffect(() => {
    if (!isConfirmed || !confirmedOrder) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate("/tracking", {
        replace: true,
        state: {
          orderConfirmed: true,
          orderData: confirmedOrder.order,
          orderId: confirmedOrder.id,
          trackingNumber: confirmedOrder.trackingNumber,
        },
      });
    }, 1700);

    return () => window.clearTimeout(redirectTimer);
  }, [confirmedOrder, isConfirmed, navigate]);

  const handleConfirmOrder = async () => {
    if (!hasOrderState || isSaving || isConfirmed) {
      return;
    }

    setIsSaving(true);
    setSubmitError("");

    try {
      const response = await API.post("/orders", orderData);
      const createdOrder = response.data?.data;
      const trackingNumber =
        response.data?.trackingNumber ||
        createdOrder?.shipment?.tracking_number ||
        "";

      setConfirmedOrder({
        id: createdOrder?.id,
        order: createdOrder,
        trackingNumber,
      });
      setIsConfirmed(true);
    } catch (error) {
      const message =
        error.response?.data?.errors?.join(" - ") ||
        error.response?.data?.message ||
        "تعذر حفظ الطلب حالياً، حاول مرة أخرى.";

      setSubmitError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="phoenix-order-confirmation min-vh-100 py-5" dir="rtl">
      <main className="container">
        <section className="phoenix-order-confirmation__shell mx-auto">
          <header className="text-center mb-4 mb-lg-5">
            <h1 className="phoenix-order-confirmation__title fw-bold mb-3">
              إتمام الطلب
            </h1>
            <p className="phoenix-order-confirmation__subtitle mb-0">
              تأكيد طلب التوصيل
            </p>
          </header>

          {!hasOrderState ? (
            <div
              className="alert alert-warning text-center phoenix-order-confirmation__fallback-alert mb-4"
              role="alert"
            >
              لا توجد بيانات طلب حالياً. يمكنك الرجوع إلى صفحة طلب التوصيل
              وإدخال البيانات أولاً.
            </div>
          ) : null}

          {submitError ? (
            <div className="alert alert-danger text-center mb-4" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="row g-4 align-items-stretch">
            <div className="col-12 col-lg-8">
              <article className="card border-0 h-100 phoenix-order-confirmation__card">
                <div className="card-body p-4 p-lg-5 d-flex flex-column">
                  <div className="phoenix-order-confirmation__info-box mb-4 mb-lg-5">
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                      <h2 className="phoenix-order-confirmation__card-title mb-0">
                        الدفع عند الاستلام
                      </h2>
                      <i className="bi bi-wallet2 phoenix-order-confirmation__info-icon" />
                    </div>
                    <p className="phoenix-order-confirmation__info-text mb-0">
                      سيقوم مندوب التوصيل بتحصيل المبلغ (
                      {formatAmount(
                        Number(orderData.deliveryAmount) +
                          Number(orderData.orderPrice)
                      )}
                      ) عند تسليمك الطرد. يرجى التأكد من وجود المبلغ المطلوب
                      نقداً.
                      <br />
                      (مبلغ التوصيل: {formatAmount(orderData.deliveryAmount)} +
                      سعر الطرد: {formatAmount(orderData.orderPrice)})
                    </p>
                  </div>

                  <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-auto">
                    <button
                      type="button"
                      className="btn phoenix-order-confirmation__button phoenix-order-confirmation__button--primary"
                      onClick={handleConfirmOrder}
                      disabled={!hasOrderState || isSaving || isConfirmed}
                    >
                      <i className="bi bi-check2-circle ms-2" />
                      {isSaving ? "جارٍ حفظ الطلب..." : "تأكيد الطلب"}
                    </button>
                    <button
                      type="button"
                      className="btn phoenix-order-confirmation__button phoenix-order-confirmation__button--secondary"
                      onClick={() => navigate(-1)}
                      disabled={isSaving || isConfirmed}
                    >
                      رجوع
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <div className="col-12 col-lg-4">
              <article className="card border-0 h-100 phoenix-order-confirmation__summary-card">
                <div className="card-body p-4">
                  <h2 className="phoenix-order-confirmation__summary-title text-center mb-4">
                    ملخص الطلب
                  </h2>

                  <div className="phoenix-order-confirmation__summary-grid">
                    <span className="phoenix-order-confirmation__summary-label">
                      من:
                    </span>
                    <strong className="phoenix-order-confirmation__summary-value">
                      {orderData.originalCity}
                    </strong>

                    <span className="phoenix-order-confirmation__summary-label">
                      إلى:
                    </span>
                    <strong className="phoenix-order-confirmation__summary-value">
                      {orderData.destinationCity}
                    </strong>

                    <span className="phoenix-order-confirmation__summary-label">
                      المستلم:
                    </span>
                    <strong className="phoenix-order-confirmation__summary-value">
                      {orderData.receiverName}
                    </strong>

                    <span className="phoenix-order-confirmation__summary-label">
                      حجم الطرد:
                    </span>
                    <strong className="phoenix-order-confirmation__summary-value">
                      {orderData.orderSizeLabel}
                    </strong>

                    <span className="phoenix-order-confirmation__summary-label">
                      حالة الطرد:
                    </span>
                    <strong className="phoenix-order-confirmation__summary-value">
                      {orderData.orderStatusLabel}
                    </strong>

                    {orderData.isFragile ? (
                      <>
                        <span className="phoenix-order-confirmation__summary-label">
                          <span className="phoenix-order-confirmation__fragile">
                            <i className="bi bi-exclamation-triangle-fill ms-2" />
                            قابل للكسر
                          </span>
                        </span>
                        <strong className="phoenix-order-confirmation__summary-value phoenix-order-confirmation__summary-value--danger">
                          نعم
                        </strong>
                      </>
                    ) : null}

                    {orderData.orderDescription ? (
                      <>
                        <span className="phoenix-order-confirmation__summary-label">
                          وصف إضافي:
                        </span>
                        <strong className="phoenix-order-confirmation__summary-value">
                          {orderData.orderDescription}
                        </strong>
                      </>
                    ) : null}
                  </div>

                  <hr className="phoenix-order-confirmation__divider" />

                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="phoenix-order-confirmation__summary-label phoenix-order-confirmation__summary-label--large">
                      مبلغ التوصيل
                    </span>
                    <strong className="phoenix-order-confirmation__summary-amount">
                      {formatAmount(orderData.deliveryAmount)}
                    </strong>
                  </div>

                  {orderData.orderPrice !== "" &&
                  orderData.orderPrice !== undefined ? (
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="phoenix-order-confirmation__summary-label phoenix-order-confirmation__summary-label--large">
                        سعر الطرد:
                      </span>
                      <strong className="phoenix-order-confirmation__summary-amount">
                        {formatAmount(orderData.orderPrice)}
                      </strong>
                    </div>
                  ) : (
                    ""
                  )}

                  <hr className="phoenix-order-confirmation__divider" />

                  <div className="d-flex align-items-center justify-content-between">
                    <span className="phoenix-order-confirmation__collection-label">
                      المبلغ المحصل:
                    </span>
                    <strong className="phoenix-order-confirmation__collection-amount">
                      {formatAmount(
                        Number(orderData.deliveryAmount) +
                          Number(orderData.orderPrice)
                      )}
                    </strong>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      {isConfirmed ? (
        <div
          className="phoenix-order-confirmation__modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-confirmation-success-title"
        >
          <div className="phoenix-order-confirmation__modal-card text-center">
            <div className="phoenix-order-confirmation__success-icon mx-auto mb-4">
              <i className="bi bi-check2 phoenix-order-confirmation__success-check" />
            </div>
            <h2
              id="order-confirmation-success-title"
              className="phoenix-order-confirmation__success-title mb-3"
            >
              تم تأكيد الطلب!
            </h2>
            <p className="phoenix-order-confirmation__success-text mb-2">
              جاري تحويلك لصفحة التتبع...
            </p>
            {confirmedOrder?.trackingNumber ? (
              <p className="phoenix-order-confirmation__success-tracking mb-0">
                رقم التتبع: <span dir="ltr">{confirmedOrder.trackingNumber}</span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OrderConfirmation;

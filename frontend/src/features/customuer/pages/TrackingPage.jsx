import React, { useEffect, useMemo, useState } from "react";
import {
  BsBoxSeam,
  BsCheck2Circle,
  BsClockHistory,
  BsTruck,
} from "react-icons/bs";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getTrackingByNumber } from "../services/customerService";
import "../../../styles/TrackingPage.css";

const searchIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.398 1.398h-.001l3.85 3.85a1 1 0 0 0 1.414-1.414l-3.85-3.85h-.015Zm-5.242.656a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
  </svg>
);

const packageIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="92"
    height="92"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      d="M12 2.75 4.75 7 12 11.25 19.25 7 12 2.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M4.75 7v10L12 21.25m0-10L19.25 7v10L12 21.25m0-10v10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="m8.75 4.625 7.25 4.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const progressSteps = [
  { key: "accepted", label: "في الشركة", icon: BsBoxSeam },
  { key: "processing", label: "قيد المعالجة", icon: BsClockHistory },
  { key: "transit", label: "في الطريق", icon: BsTruck },
  { key: "delivered", label: "تم التسليم", icon: BsCheck2Circle },
];

const statusToProgressIndex = {
  accepted: 0,
  picked_up: 1,
  in_transit: 2,
  arrived_to_destination_city: 2,
  out_for_delivery: 2,
  delivered: 3,
};

const formatArabicDate = (value) => {
  if (!value) {
    return "غير متوفر";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "غير متوفر";
  }

  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsedDate);
};

const fallbackValue = (value) => value || "غير متوفر";

const isAuthenticated = () =>
  Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"));

const hasLiveLocation = (shipment) =>
  Number.isFinite(Number(shipment?.current_latitude)) &&
  Number.isFinite(Number(shipment?.current_longitude));

const buildOpenStreetMapUrl = (shipment) => {
  const latitude = Number(shipment.current_latitude);
  const longitude = Number(shipment.current_longitude);
  const latitudePadding = 0.018;
  const longitudePadding = 0.028;
  const bbox = [
    longitude - longitudePadding,
    latitude - latitudePadding,
    longitude + longitudePadding,
    latitude + latitudePadding,
  ].join("%2C");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
};

const formatLocationUpdatedAt = (value) => {
  if (!value) return "\u0644\u0645 \u064a\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u0639\u062f";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "\u0644\u0645 \u064a\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u0639\u062f";
  }

  return new Intl.DateTimeFormat("ar-PS", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "long",
  }).format(parsedDate);
};

const TrackingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const trackingNumberFromState = location.state?.trackingNumber || "";
  const [trackingNumber, setTrackingNumber] = useState(trackingNumberFromState);
  const [shipment, setShipment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(Boolean(trackingNumberFromState));
  const [showSupportOptions, setShowSupportOptions] = useState(false);
  const supportPhoneDisplay = "+972 59-252-0083";
  const supportWhatsappUrl = `https://web.whatsapp.com/send?phone=972592520083&text=${encodeURIComponent(
    `مرحباً فينوكس، أحتاج مساعدة بخصوص تتبع الشحنة${
      trackingNumber ? ` رقم ${trackingNumber}` : ""
    }.`
  )}`;

  const confirmationMessage = useMemo(() => {
    if (!location.state?.orderConfirmed || !trackingNumberFromState) {
      return null;
    }

    return `تم إنشاء الطلب بنجاح. رقم التتبع الخاص بك هو ${trackingNumberFromState}`;
  }, [location.state, trackingNumberFromState]);

  const activeStepIndex =
    statusToProgressIndex[shipment?.status] !== undefined
      ? statusToProgressIndex[shipment.status]
      : 0;

  const performSearch = React.useCallback(async (requestedTrackingNumber) => {
    const normalizedTrackingNumber = requestedTrackingNumber.trim();

    setHasSearched(true);
    setShipment(null);

    if (!normalizedTrackingNumber) {
      setErrorMessage("الرجاء إدخال رقم التتبع.");
      return;
    }

    if (!isAuthenticated()) {
      setErrorMessage("يرجى تسجيل الدخول قبل تتبع الشحنة.");
      Swal.fire({
        icon: "info",
        title: "تسجيل الدخول مطلوب",
        text: "يرجى تسجيل الدخول أولاً حتى تتمكن من تتبع الشحنات المرتبطة بحسابك.",
        confirmButtonText: "تسجيل الدخول",
        confirmButtonColor: "#38b6ff",
        showCancelButton: true,
        cancelButtonText: "لاحقاً",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", {
            state: { from: "/tracking", trackingNumber: normalizedTrackingNumber },
          });
        }
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getTrackingByNumber(normalizedTrackingNumber);
      setShipment(response?.data || null);
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorMessage("يرجى تسجيل الدخول قبل تتبع الشحنة.");
      } else if (error.response?.status === 404) {
        setErrorMessage("رقم الشحنة غير صحيح أو غير مرتبط بحسابك.");
      } else {
        setErrorMessage("حدث خطأ أثناء جلب بيانات الشحنة. حاول مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const refreshTrackingLocation = React.useCallback(async () => {
    if (!shipment?.tracking_number || !isAuthenticated()) {
      return;
    }

    try {
      const response = await getTrackingByNumber(shipment.tracking_number);
      setShipment(response?.data || null);
    } catch {
      // Keep the latest visible shipment data when background refresh fails.
    }
  }, [shipment?.tracking_number]);

  useEffect(() => {
    if (trackingNumberFromState) {
      performSearch(trackingNumberFromState);
    }
  }, [performSearch, trackingNumberFromState]);

  useEffect(() => {
    if (!shipment?.tracking_number) {
      return undefined;
    }

    const intervalId = window.setInterval(refreshTrackingLocation, 10000);

    return () => window.clearInterval(intervalId);
  }, [refreshTrackingLocation, shipment?.tracking_number]);

  const handleSubmit = (event) => {
    event.preventDefault();
    performSearch(trackingNumber);
  };

  return (
    <div className="tracking-page bg-light min-vh-100" dir="rtl">
      <main className="container py-5">
        <section className="mx-auto text-center tracking-shell">
          <header className="mb-4 mb-md-5">
            <h1 className="fw-bold tracking-title mb-3">تتبع الشحنة</h1>
            <p className="tracking-subtitle mb-0">
              تتبع موقع طردك في الوقت الفعلي
            </p>
          </header>

          {confirmationMessage ? (
            <div className="alert alert-success text-center mb-4" role="alert">
              {confirmationMessage}
            </div>
          ) : null}

          <div className="card border-0 tracking-search-card mx-auto">
            <div className="card-body p-3 p-md-4">
              <form
                className="d-flex flex-column flex-md-row gap-3 align-items-stretch"
                onSubmit={handleSubmit}
              >
                <input
                  type="text"
                  className="form-control form-control-lg tracking-input flex-grow-1"
                  placeholder="أدخل رقم التتبع"
                  aria-label="رقم التتبع"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  dir="ltr"
                />
                <button
                  type="submit"
                  className="btn btn-primary tracking-search-btn d-inline-flex align-items-center justify-content-center gap-2 px-4"
                  disabled={isLoading}
                >
                  <span>{isLoading ? "جاري البحث..." : "بحث"}</span>
                  {searchIcon}
                </button>
              </form>
            </div>
          </div>

          {isLoading ? (
            <div className="card border-0 tracking-feedback-card mx-auto mt-4">
              <div className="card-body py-5">
                <div
                  className="spinner-border text-primary tracking-spinner mb-3"
                  role="status"
                  aria-hidden="true"
                />
                <p className="tracking-feedback-text mb-0">
                  جاري تحميل بيانات الشحنة...
                </p>
              </div>
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="card border-0 tracking-feedback-card mx-auto mt-4">
              <div className="card-body py-5">
                <p className="tracking-feedback-text mb-0">{errorMessage}</p>
              </div>
            </div>
          ) : null}

          {!isLoading && shipment ? (
            <div className="tracking-results mt-4 mt-md-5 text-end">
              <div className="card border-0 tracking-result-card tracking-progress-card mb-4">
                <div className="card-body p-4 p-md-5">
                  <div className="row g-4 align-items-start">
                    <div className="col-lg-6 text-center text-lg-end">
                      <p className="tracking-meta-label mb-2">رقم التتبع</p>
                      <h2 className="tracking-meta-value tracking-number-text mb-4" dir="ltr">
                        {fallbackValue(shipment.tracking_number)}
                      </h2>

                      <p className="tracking-meta-label mb-2">وقت التسليم المتوقع</p>
                      <h3 className="tracking-meta-value mb-0">
                        {formatArabicDate(shipment.expected_delivery_date)}
                      </h3>
                    </div>

                    <div className="col-lg-6 text-center">
                      <p className="tracking-meta-label mb-2">الموقع الحالي</p>
                      <h2 className="tracking-location-value mb-4">
                        {fallbackValue(shipment.current_location)}
                      </h2>

                      <p className="tracking-meta-label mb-2">المسار</p>
                      <h3 className="tracking-route-value mb-0">
                        {fallbackValue(shipment.origin_city)}
                        <span className="tracking-route-arrow"> ← </span>
                        {fallbackValue(shipment.destination_city)}
                      </h3>
                    </div>

                    <div className="col-12 text-center mt-4 mt-md-5">
                      <h2 className="tracking-section-title mb-0">مراحل الشحنة</h2>
                    </div>
                  </div>

                  <div className="tracking-progress-line position-relative mt-4 mt-md-5">
                    
                    <div className="tracking-progress-track" />
                    <div
                      className="tracking-progress-fill"
                      style={{
                        width: `${(activeStepIndex / (progressSteps.length - 1)) * 100}%`,
                      }}
                    />

                    <div className="row g-3 justify-content-between position-relative">
                      {progressSteps.map((step, index) => {
                        const isCompleted = index < activeStepIndex;
                        const isActive = index === activeStepIndex;
                        const StepIcon = step.icon;

                        return (
                          <div className="col-6 col-md-3" key={step.key}>
                            <div className="tracking-step text-center">
                              <div
                                className={`tracking-step-icon mx-auto mb-3 ${
                                  isCompleted || isActive ? "is-active" : ""
                                } ${isCompleted ? "is-completed" : ""}`}
                              >
                                <StepIcon aria-hidden="true" />
                              </div>
                              <h4
                                className={`tracking-step-label mb-2 ${
                                  isCompleted || isActive ? "is-active" : ""
                                }`}
                              >
                                {step.label}
                              </h4>
                              {isActive ? (
                                <span className="badge rounded-pill tracking-current-badge">
                                  الحالة الحالية
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 tracking-result-card tracking-live-map-card mb-4">
                <div className="card-body p-4 p-md-5">
                  <div className="tracking-live-map-header">
                    <div>
                      <h2 className="tracking-details-title mb-2">
                        {"\u062a\u062a\u0628\u0639 \u0627\u0644\u0645\u0646\u062f\u0648\u0628 \u0639\u0644\u0649 \u0627\u0644\u062e\u0631\u064a\u0637\u0629"}
                      </h2>
                      <p className="tracking-live-map-subtitle mb-0">
                        {hasLiveLocation(shipment)
                          ? `\u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b: ${formatLocationUpdatedAt(shipment.location_updated_at)}`
                          : "\u0644\u0645 \u064a\u062d\u062f\u062b \u0627\u0644\u0645\u0646\u062f\u0648\u0628 \u0645\u0648\u0642\u0639\u0647 \u0628\u0639\u062f."}
                      </p>
                    </div>
                    <span className="tracking-live-map-badge">
                      {"Live"}
                    </span>
                  </div>

                  {hasLiveLocation(shipment) ? (
                    <div className="tracking-live-map-frame mt-4">
                      <iframe
                        title="Live shipment location"
                        src={buildOpenStreetMapUrl(shipment)}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  ) : (
                    <div className="tracking-live-map-empty mt-4">
                      <BsTruck aria-hidden="true" />
                      <p className="mb-0">
                        {"\u0633\u062a\u0638\u0647\u0631 \u0627\u0644\u062e\u0631\u064a\u0637\u0629 \u0647\u0646\u0627 \u0628\u0645\u062c\u0631\u062f \u0623\u0646 \u064a\u062d\u062f\u062b \u0627\u0644\u0645\u0646\u062f\u0648\u0628 \u0645\u0648\u0642\u0639 \u0627\u0644\u0634\u062d\u0646\u0629."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card border-0 tracking-result-card mb-4">
                <div className="card-body p-4 p-md-5">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                    <h2 className="tracking-details-title mb-0">تفاصيل الشحنة</h2>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="tracking-person-block h-100">
                        <h3 className="tracking-person-title mb-3">معلومات المرسل</h3>
                        <p className="tracking-person-item mb-2">
                          <strong>الاسم:</strong> {fallbackValue(shipment.sender_name)}
                        </p>
                        <p className="tracking-person-item mb-0">
                          <strong>المدينة:</strong> {fallbackValue(shipment.origin_city)}
                        </p>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="tracking-person-block h-100">
                        <h3 className="tracking-person-title mb-3">معلومات المستلم</h3>
                        <p className="tracking-person-item mb-2">
                          <strong>الاسم:</strong> {fallbackValue(shipment.receiver_name)}
                        </p>
                        <p className="tracking-person-item mb-0">
                          <strong>المدينة:</strong> {fallbackValue(shipment.destination_city)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 tracking-result-card tracking-support-card">
                <div className="card-body p-4 p-md-5 text-center">
                  <h2 className="tracking-support-title mb-3">هل تحتاج مساعدة؟</h2>
                  <p className="tracking-support-text mb-4">
                    يمكنك التواصل مع فريق الدعم للحصول على مزيد من المعلومات
                  </p>
                  <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                    <div className="tracking-support-dropdown">
                      <button
                        type="button"
                        className="btn tracking-support-btn tracking-call-btn"
                        onClick={() => setShowSupportOptions((current) => !current)}
                        aria-expanded={showSupportOptions}
                      >
                        اتصل بنا
                      </button>

                      {showSupportOptions ? (
                        <div className="tracking-support-menu">
                          <p className="tracking-support-menu-label mb-2">
                            رقم الشركة
                          </p>
                          <a
                            href={supportWhatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="tracking-support-phone"
                          >
                            {supportPhoneDisplay}
                          </a>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="btn tracking-support-btn tracking-whatsapp-btn"
                      onClick={() => window.open(supportWhatsappUrl, "_blank", "noopener,noreferrer")}
                    >
                      واتساب
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!isLoading && !shipment && !errorMessage && !hasSearched ? (
            <div className="tracking-empty-state text-center mx-auto">
              <div className="tracking-empty-icon mb-3">{packageIcon}</div>
              <p className="tracking-empty-text mb-0">
                أدخل رقم التتبع للبحث عن شحنتك
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default TrackingPage;

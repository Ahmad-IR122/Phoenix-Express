import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style/HeroSection.css";
import logo from "../../../Images/Phonex_logo.jpeg";
import Swal from "sweetalert2";

const HeroSection = () => {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState("");
  const showError = (title,message) => {
    Swal.fire({
      icon: "error",
      title: title,
      text: message,
      confirmButtonText: "حسناً",
      confirmButtonColor: "#38b6ff",
    });
    
  };
  const handleTrackingSubmit = (event) => {
    event.preventDefault();
    const emptyRegex = /^\s*$/;
    const trackingNumberRegex = /^[A-Z0-9]{8,30}$/;


    if (emptyRegex.test(trackingNumber)) {
      showError("خطأ في الإدخال", "يرجى إدخال رقم التتبع .");
      return;
    } else if (!trackingNumberRegex.test(trackingNumber)) {
      showError("خطأ في الإدخال", "رقم التتبع غير صالح. يجب أن يكون بين 8 و30 حرفًا أو رقمًا.");
      return;
    }

    const normalizedTrackingNumber = trackingNumber.trim();
    if (!normalizedTrackingNumber) {
      return;
    }

    navigate("/tracking", {
      state: {
        trackingNumber: normalizedTrackingNumber,
      },
    });
  };
  return (
    <section className="hero-section py-5 py-lg-6" dir="rtl">
      <div className="container hero-container">
        <div className="row align-items-center g-4 g-xl-5">
          <div className="col-12 col-lg-6 order-1 order-lg-2">
            <div className="hero-visual-card mx-auto">
              <div className="hero-visual-brand d-inline-flex align-items-center gap-2">
                <span className="hero-visual-brand-text">فونكس  إكسبرس</span>
                <img
                  src={logo}
                  alt="فونكس  إكسبرس"
                  className="hero-visual-logo rounded-circle"
                />
              </div>

              <div className="hero-visual-frame">
                <div className="hero-delivery-window">
                  <div className="hero-map-dot hero-map-dot-primary" />
                  <div className="hero-map-dot hero-map-dot-secondary" />
                  <div className="hero-map-path" />
                </div>

                <div className="hero-info-panel">
                  <div className="hero-pill-badge">توصيل سريع</div>
                  <h3 className="hero-info-title">حلول شحن مصممة لنمو متجرك</h3>
                  <p className="hero-info-text mb-0">
                    تغطية يومية، متابعة واضحة، وتسليم احترافي يليق بعملائك.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6 order-2 order-lg-1">
            <div className="text-lg-end text-center text-white hero-content">
              <h1 className="hero-title fw-bold mb-4">
                <span>خدمات توصيل موثوقة</span>
                <span>تغطي الضفة والقدس</span>
                <span>والداخل</span>
              </h1>

              <p className="hero-description mb-4 mx-auto mx-lg-0">
                نوصل طرودك بسرعة وأمان إلى كل مكان في فلسطين، نحن شركاؤك الموثوق
                لإنجاح مشروعك.
              </p>

              <div className="home-hero-tracking-card bg-white text-dark text-lg-end text-center ms-lg-auto">
                <h2 className="home-hero-tracking-card-title fw-bold">تتبع شحنتك الآن</h2>

                <form
                  className="row g-3 align-items-center home-hero-tracking-form"
                  onSubmit={handleTrackingSubmit}
                >
                  <div className="col-12 col-md-8">
                    <input
                      type="text"
                      className="form-control form-control-lg home-hero-tracking-input"
                      value={trackingNumber}
                      onChange={(event) => setTrackingNumber(event.target.value)}
                      dir="ltr"
                      placeholder="أدخل رقم التتبع"
                      aria-label="أدخل رقم التتبع"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 home-hero-tracking-button d-inline-flex align-items-center justify-content-center gap-2"
                    >
                      <span>تتبع الآن</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                      >
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.398 1.398h-.001l3.85 3.85.707-.707-3.85-3.85zm-5.242.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

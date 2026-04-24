import React from "react";
import Navbar from "../../../Components/Navbar";
import "./TrackingPage.css";

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

const TrackingPage = () => {
  return (
    <div className="tracking-page bg-light min-vh-100" dir="rtl">
      <Navbar />

      <main className="container py-5">
        <section className="mx-auto text-center tracking-shell">
          <header className="mb-4 mb-md-5">
            <h1 className="fw-bold tracking-title mb-3">تتبع الشحنة</h1>
            <p className="tracking-subtitle mb-0">تتبع موقع طردك في الوقت الفعلي</p>
          </header>

          <div className="card border-0 tracking-search-card mx-auto">
            <div className="card-body p-3 p-md-4">
              <form className="d-flex flex-column flex-md-row gap-3 align-items-stretch">
                <input
                  type="text"
                  className="form-control form-control-lg tracking-input flex-grow-1"
                  placeholder="أدخل رقم التتبع مثال: PH12345ABC"
                  aria-label="رقم التتبع"
                />
                <button
                  type="submit"
                  className="btn btn-primary tracking-search-btn d-inline-flex align-items-center justify-content-center gap-2 px-4"
                >
                  <span>بحث</span>
                  {searchIcon}
                </button>
              </form>
            </div>
          </div>

          <div className="tracking-empty-state text-center mx-auto">
            <div className="tracking-empty-icon mb-3">{packageIcon}</div>
            <p className="tracking-empty-text mb-0">أدخل رقم التتبع للبحث عن شحنتك</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TrackingPage;

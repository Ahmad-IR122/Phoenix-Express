import React from "react";
import "./PricingSection.css";

const pricingItems = [
  {
    title: "الداخل",
    price: "70 شيكل",
    description: "توصيل لمناطق الداخل المحتل",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="34"
        height="34"
        fill="currentColor"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
      </svg>
    ),
  },
  {
    title: "القدس",
    price: "30 شيكل",
    description: "توصيل لمدينة القدس وضواحيها",
    badge: "الأكثر طلباً",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="34"
        height="34"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="11" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "الضفة الغربية",
    price: "20 شيكل",
    description: "توصيل سريع لجميع مدن الضفة الغربية",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="34"
        height="34"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M4 17.5h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7 14.5 12 5l5 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 10h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const PricingSection = () => {
  return (
    <section className="pricing-section py-5" dir="rtl">
      <div className="container py-lg-4">
        <div className="text-center pricing-header mx-auto mb-5">
          <h2 className="pricing-section-title mb-2">أسعار الخدمات</h2>
          <p className="pricing-section-subtitle mb-0">
            أسعار تنافسية وشفافة لجميع المناطق
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {pricingItems.map((item) => (
            <div className="col-12 col-md-6 col-lg-4" key={item.title}>
              <article className="pricing-card h-100 text-center position-relative">
                {item.badge ? (
                  <span className="pricing-badge">{item.badge}</span>
                ) : null}

                <div className="pricing-icon mx-auto mb-4">{item.icon}</div>
                <h3 className="pricing-card-title mb-2">{item.title}</h3>
                <div className="pricing-amount mb-3">{item.price}</div>
                <p className="pricing-description mb-4">{item.description}</p>
                <button type="button" className="btn pricing-button">
                  طلب الخدمة
                </button>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

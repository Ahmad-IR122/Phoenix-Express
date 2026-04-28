import React from "react";
import "./style/PricingSection.css";
import { Link } from "react-router-dom";

const pricingItems = [
  {
    title: "الضفة الغربية",
    price: "20 شيكل",
    description: "توصيل سريع لجميع مدن الضفة الغربية",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="38"
        height="38"
        fill="currentColor"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z" />
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
                <Link to="/request-delivery" className="btn pricing-button">
                  طلب الخدمة
                </Link>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

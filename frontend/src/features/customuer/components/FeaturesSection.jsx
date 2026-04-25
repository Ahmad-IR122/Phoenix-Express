import React from "react";
import "./FeaturesSection.css";
const features = [
  {
    title: "توصيل سريع",
    description: "نوصل طرودك في أسرع وقت ممكن",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="38"
        height="38"
        fill="currentColor"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
      </svg>
    ),
  },
  {
    title: "تغليف آمن",
    description: "نحافظ على سلامة منتجاتك",
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
    title: "تغطية شاملة",
    description: "نصل إلى جميع المناطق",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="38"
        height="38"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M19.5 10.5c0 5.25-7.5 10.5-7.5 10.5S4.5 15.75 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "خدمة موثوقة",
    description: "ثقة آلاف الزبائن",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="38"
        height="38"
        fill="currentColor"
        className="bi bi-check2-circle"
        viewBox="0 0 16 16"
      >
        <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0" />
        <path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z" />
      </svg>
    ),
  },
];

const FeaturesSection = () => {
  return (
    <section className="features-section py-5" dir="rtl">
      <div className="container py-lg-4">
        <div className="row g-4 justify-content-center">
          {features.map((feature) => (
            <div className="col-12 col-sm-6 col-lg-3" key={feature.title}>
              <article className="feature-card text-center h-100">
                <div className="feature-icon mx-auto mb-4">{feature.icon}</div>
                <h3 className="feature-title mb-2">{feature.title}</h3>
                <p className="feature-description mb-0">
                  {feature.description}
                </p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

import React from "react";
import "./style/CTASection.css";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="home-cta-section" dir="rtl">
      <div className="container-fluid px-0">
        <div className="cta-section__surface text-center d-flex align-items-center justify-content-center">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-8 col-xl-7">
                <div className="px-3 px-md-4">
                  <h2 className="cta-section__title text-white fw-bold mb-3">
                    جاهز لإرسال طردك؟
                  </h2>
                  <p className="cta-section__subtitle mb-4 mb-md-5 mx-auto">
                    انضم إلى آلاف الزبائن الراضين عن خدماتنا
                  </p>
                  <Link to="/request-delivery"
                    className="btn cta-section__button rounded-pill fw-bold px-4 px-md-5"
                  >
                    اطلب خدمة التوصيل الآن
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

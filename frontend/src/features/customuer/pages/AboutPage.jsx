import React from "react";
import Navbar from "../../../Components/Navbar";
import "./AboutPage.css";

const AboutPage = () => {
  return (
    <div className="about-page" dir="rtl">
      <Navbar />
      <main className="about-page__section py-5">
        <div className="container py-lg-5">
          <div className="row justify-content-center text-center">
            <div className="col-12 col-lg-10 col-xl-9">
              <h1 className="about-page__title fw-bold mb-3">من نحن</h1>
              <p
                className="about-page__subtitle mb-0 mx-auto"
                style={{ fontSize: "18px" }}
              >
                نحن شركة فلسطينية رائدة في مجال خدمات توصيل الطرود، نعمل بروح
                طائر الفونيكس الذي يرمز <br /> للتجدد والانبعاث من جديد
              </p>
            </div>
          </div>
          <div className="row justify-content-center mt-5">
            <div className="col-12 col-xl-10 m-4">
              <section className="about-page__story-card rounded-5 shadow-sm p-4 p-md-5">
                <h2 className="about-page__story-title fw-bold text-end mb-4">
                  قصتنا
                </h2>
                <div className="about-page__story-text text-end">
                  <p className="mb-4" style={{ fontSize: "18px" }}>
                    بدأت رحلتنا من حلم بسيط: تقديم خدمة توصيل موثوقة وسريعة تدعم
                    المشاريع الصغيرة والمتوسطة في فلسطين.
                    <br />
                    اخترنا طائر الفونيكس رمزاً لشركتنا لأنه يمثل القوة والتجدد
                    والقدرة على النهوض من جديد تماماً كما نساعد أصحاب المشاريع
                    على النمو والازدهار. نحن نؤمن بأن كل طرد نوصله هو جزء من حلم
                    رائد أعمال، وكل زبون نخدمه هو شريك في نجاحنا المشترك.
                  </p>
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-10">
              <section className="about-page__story-card rounded-5 shadow-sm p-4 p-md-5">
                <h2 className="about-page__story-title fw-bold text-end mb-4">
                  رؤيتنا{" "}
                </h2>

                <div className="about-page__story-text text-end">
                  <p className="mb-4" style={{ fontSize: "18px" }}>
                    نطمح لأن نكون الخيار الأول لخدمات التوصيل في فلسطين، من خلال
                    تقديم خدمة متميزة تجمع بين السرعة，
                    <br />
                    الموثوقية، والأسعار المناسبة. نسعى لتمكين رواد الأعمال
                    والمشاريع الصغيرة من الوصول إلى زبائنهم في كل مكان، وبناء
                    جسر من الثقة بين البائع والمشتري.
                  </p>
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-10 mt-4">
              <section className="about-page__values-card rounded-5 shadow-sm p-4 p-md-5">
                <h2 className="about-page__story-title fw-bold text-end mb-4 mb-md-5">
                  قيمنا
                </h2>

                <div className="row g-4 g-lg-5">
                  <div className="col-12 col-lg-6">
                    <div className="about-page__value-item d-flex align-items-start gap-3 gap-md-4">
                      <span className="about-page__value-badge flex-shrink-0">
                        1
                      </span>
                      <div
                        className="about-page__value-copy flex-grow-1 text-end"
                        style={{ fontSize: "18px" }}
                      >
                        <h3 className="about-page__value-title fw-bold mb-2">
                          الموثوقية
                        </h3>
                        <p
                          className="about-page__value-text mb-0"
                          style={{ fontSize: "18px" }}
                        >
                          نلتزم بمواعيدنا ونحافظ على أماناتكم
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="about-page__value-item d-flex align-items-start gap-3 gap-md-4">
                      <span className="about-page__value-badge flex-shrink-0">
                        2
                      </span>
                      <div
                        className="about-page__value-copy flex-grow-1 text-end"
                        style={{ fontSize: "18px" }}
                      >
                        <h3 className="about-page__value-title fw-bold mb-2">
                          السرعة
                        </h3>
                        <p
                          className="about-page__value-text mb-0"
                          style={{ fontSize: "18px" }}
                        >
                          نوصل طرودكم في أسرع وقت ممكن
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="about-page__value-item d-flex align-items-start gap-3 gap-md-4">
                      <span className="about-page__value-badge flex-shrink-0">
                        3
                      </span>
                      <div
                        className="about-page__value-copy flex-grow-1 text-end"
                        style={{ fontSize: "18px" }}
                      >
                        <h3 className="about-page__value-title fw-bold mb-2">
                          الشفافية
                        </h3>
                        <p
                          className="about-page__value-text mb-0"
                          style={{ fontSize: "18px" }}
                        >
                          أسعار واضحة بدون أي رسوم خفية
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="about-page__value-item d-flex align-items-start gap-3 gap-md-4">
                      <span className="about-page__value-badge flex-shrink-0">
                        4
                      </span>
                      <div
                        className="about-page__value-copy flex-grow-1 text-end"
                        style={{ fontSize: "18px" }}
                      >
                        <h3 className="about-page__value-title fw-bold mb-2">
                          الدعم
                        </h3>
                        <p
                          className="about-page__value-text mb-0"
                          style={{ fontSize: "18px" }}
                        >
                          نساند المشاريع الصغيرة في رحلة نجاحها
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-10 mt-5">
              <section className="about-page__story-card rounded-5 shadow-sm p-4 p-md-5">
                <h2 className="about-page__story-title fw-bold text-end mb-4">
                  لماذا طائر الفونيكس؟
                </h2>

                <div className="about-page__story-text text-end">
                  <p className="mb-4" style={{ fontSize: "18px" }}>
                    طائر الفونيكس هو رمز أسطوري للبعث والتجدد. ينهض من رماده
                    أقوى وأجمل مما كان. اخترنا هذا الرمز لأننا نؤمن بقوة الشعب
                    الفلسطيني وقدرته على الصمود والنهوض مهما كانت التحديات.  <br/> كل
                    مشروع صغير ندعمه، وكل رائد أعمال نخدمه، هو جزء من النهضة
                    الاقتصادية التي نسعى لبنائها معاً. نحن لا نوصل طرودًا فقط،
                    بل نوصل الأمل والطموح والنجاح.
                  </p>
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-10 mt-5">
              <section className="about-page__stats-section">
                <div className="row g-4">
                  <div className="col-12 col-md-6 col-lg-4">
                    <article className="about-page__stat-card rounded-5 text-center p-4 p-md-5 h-100">
                      <div className="about-page__stat-number fw-bold mb-3">
                        100%
                      </div>
                      <p className="about-page__stat-label mb-0">التزام بالجودة</p>
                    </article>
                  </div>

                  <div className="col-12 col-md-6 col-lg-4">
                    <article className="about-page__stat-card rounded-5 text-center p-4 p-md-5 h-100">
                      <div className="about-page__stat-number fw-bold mb-3">
                        +500
                      </div>
                      <p className="about-page__stat-label mb-0">زبون راض</p>
                    </article>
                  </div>

                  <div className="col-12 col-md-6 col-lg-4">
                    <article className="about-page__stat-card rounded-5 text-center p-4 p-md-5 h-100">
                      <div className="about-page__stat-number fw-bold mb-3">
                        +10,000
                      </div>
                      <p className="about-page__stat-label mb-0">طرد تم توصيله</p>
                    </article>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;

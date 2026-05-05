import React from "react";
import { Link } from "react-router-dom";
import { BsBoxSeam, BsTruck } from "react-icons/bs";
import { FiSearch, FiMail } from "react-icons/fi";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#F3F3F3",
    fontFamily: '"Cairo", "Segoe UI", sans-serif',
  },
  shell: {
    maxWidth: "960px",
  },
  code: {
    color: "#38B6FF",
    fontSize: "clamp(3.75rem, 9vw, 6.5rem)",
    lineHeight: 1,
    letterSpacing: "0.04em",
  },
  title: {
    color: "#0A0A0A",
    fontSize: "clamp(1.9rem, 4vw, 3rem)",
    lineHeight: 1.3,
  },
  subtitle: {
    maxWidth: "720px",
    color: "#6F7D90",
    fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
    lineHeight: 1.9,
  },
  card: {
    borderRadius: "2rem",
    border: "1px solid rgba(56, 182, 255, 0.08)",
    boxShadow: "0 18px 45px rgba(38, 56, 88, 0.1)",
    background: "linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)",
  },
  visualWrap: {
    width: "170px",
    height: "170px",
    backgroundColor: "#EEF8FF",
    color: "#38B6FF",
  },
  iconBadge: {
    width: "56px",
    height: "56px",
    backgroundColor: "#FFFFFF",
    color: "#38B6FF",
    boxShadow: "0 10px 24px rgba(56, 182, 255, 0.14)",
  },
  helper: {
    maxWidth: "620px",
    color: "#5F6D82",
    fontSize: "1rem",
    lineHeight: 1.9,
  },
  primaryButton: {
    minWidth: "190px",
    minHeight: "56px",
    borderRadius: "999px",
    backgroundColor: "#38B6FF",
    borderColor: "#38B6FF",
    fontWeight: 700,
  },
  secondaryButton: {
    minWidth: "190px",
    minHeight: "56px",
    borderRadius: "999px",
    border: "1px solid #D7DEEA",
    backgroundColor: "#FFFFFF",
    color: "#5F6D82",
    fontWeight: 700,
  },
  textLink: {
    color: "#38B6FF",
    fontWeight: 700,
    textDecoration: "none",
  },
};

const PageNotFound = () => {
  return (
    <div style={styles.page} dir="rtl" className="d-flex align-items-center">
      <main className="container py-5">
        <section
          className="mx-auto text-center d-flex flex-column align-items-center"
          style={styles.shell}
        >
          <header className="mb-4 mb-md-5">
            <p className="fw-bold mb-3" style={styles.code}>
              404
            </p>
            <h1 className="fw-bold mb-3" style={styles.title}>
              الصفحة غير موجودة
            </h1>
            <p className="mb-0 mx-auto" style={styles.subtitle}>
              عذراً، الصفحة التي تحاول الوصول إليها غير متوفرة أو ربما تم نقلها
            </p>
          </header>

          <div
            className="card border-0 w-100 mx-auto"
            style={styles.card}
          >
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-center mb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center position-relative"
                  style={styles.visualWrap}
                  aria-hidden="true"
                >
                  <BsBoxSeam size={64} />

                  <span
                    className="position-absolute top-0 start-0 translate-middle rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={styles.iconBadge}
                  >
                    <FiSearch size={24} />
                  </span>

                  <span
                    className="position-absolute bottom-0 end-0 translate-middle rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={styles.iconBadge}
                  >
                    <BsTruck size={24} />
                  </span>
                </div>
              </div>

              <p className="mx-auto mb-4" style={styles.helper}>
                يمكنك العودة إلى الصفحة الرئيسية أو استخدام تتبع الشحنة للوصول إلى ما تحتاجه
              </p>

              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <Link
                  to="/"
                  className="btn btn-primary d-inline-flex align-items-center justify-content-center"
                  style={styles.primaryButton}
                >
                  العودة إلى الرئيسية
                </Link>

                <Link
                  to="/tracking"
                  className="btn d-inline-flex align-items-center justify-content-center"
                  style={styles.secondaryButton}
                >
                  تتبع شحنة
                </Link>
              </div>

              <div className="mt-4">
                <a
                  href="mailto:info@phoenix-delivery.ps"
                  className="d-inline-flex align-items-center gap-2"
                  style={styles.textLink}
                >
                  <FiMail aria-hidden="true" />
                  <span>تواصل معنا</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PageNotFound;

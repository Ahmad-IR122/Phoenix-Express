import React from "react";
import { Link } from "react-router-dom";
import { BsBoxSeam, BsTruck } from "react-icons/bs";
import { FiHome, FiMail, FiSearch } from "react-icons/fi";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(56, 182, 255, 0.16), transparent 34%), #f4f8fc",
    fontFamily: '"Cairo", "Segoe UI", Tahoma, sans-serif',
  },
  shell: {
    maxWidth: "980px",
  },
  code: {
    color: "#38b6ff",
    fontSize: "clamp(4rem, 10vw, 7rem)",
    lineHeight: 1,
    letterSpacing: "0",
  },
  title: {
    color: "#0f172a",
    fontSize: "clamp(2rem, 4vw, 3.1rem)",
    lineHeight: 1.3,
  },
  subtitle: {
    maxWidth: "720px",
    color: "#64748b",
    fontSize: "clamp(1rem, 1.8vw, 1.16rem)",
    lineHeight: 1.9,
  },
  card: {
    borderRadius: "24px",
    border: "1px solid #dbeafe",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.1)",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  },
  visualWrap: {
    width: "172px",
    height: "172px",
    backgroundColor: "#eef8ff",
    color: "#38b6ff",
  },
  iconBadge: {
    width: "56px",
    height: "56px",
    backgroundColor: "#ffffff",
    color: "#087fc4",
    boxShadow: "0 10px 24px rgba(56, 182, 255, 0.16)",
  },
  helper: {
    maxWidth: "650px",
    color: "#475569",
    fontSize: "1rem",
    lineHeight: 1.9,
  },
  primaryButton: {
    minWidth: "190px",
    minHeight: "54px",
    borderRadius: "999px",
    backgroundColor: "#38b6ff",
    borderColor: "#38b6ff",
    fontWeight: 800,
  },
  secondaryButton: {
    minWidth: "190px",
    minHeight: "54px",
    borderRadius: "999px",
    border: "1px solid #d7deea",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontWeight: 800,
  },
  textLink: {
    color: "#087fc4",
    fontWeight: 800,
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
              عذراً، الرابط الذي تحاول الوصول إليه غير متوفر حالياً، أو ربما تم نقله إلى مسار آخر.
            </p>
          </header>

          <div className="card border-0 w-100 mx-auto" style={styles.card}>
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
                يمكنك العودة إلى الصفحة الرئيسية أو استخدام صفحة تتبع الشحنة للوصول إلى الخدمة التي تحتاجها بسرعة.
              </p>

              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <Link
                  to="/"
                  className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"
                  style={styles.primaryButton}
                >
                  <FiHome aria-hidden="true" />
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
                  <span>تواصل معنا للمساعدة</span>
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

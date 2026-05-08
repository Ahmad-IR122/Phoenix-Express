import React from "react";
import { Link } from "react-router-dom";
import { BsBoxSeam, BsTruck } from "react-icons/bs";
import { FiHome, FiMail, FiSearch } from "react-icons/fi";
import "./pageNotFound.css";

const supportEmailDisplay = "info@phoenix-delivery.ps";
const supportMailTo = "nora.aqad@gmail.com";

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
    textDecoration: "none",
  },
  secondaryButton: {
    minWidth: "190px",
    minHeight: "54px",
    borderRadius: "999px",
    border: "1px solid #d7deea",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontWeight: 800,
    textDecoration: "none",
  },
  textLink: {
    color: "#087fc4",
    fontWeight: 800,
    textDecoration: "none",
  },
};

const PageNotFound = () => {
  return (
    <div
      style={styles.page}
      dir="rtl"
      className="page-not-found d-flex align-items-center"
    >
      <main className="container py-5">
        <section
          className="page-not-found__shell mx-auto text-center d-flex flex-column align-items-center"
          style={styles.shell}
        >
          <header className="page-not-found__hero mb-4 mb-md-5">
            <p className="fw-bold mb-3" style={styles.code}>
              404
            </p>
            <h1 className="fw-bold mb-3" style={styles.title}>
              {"\u0627\u0644\u0635\u0641\u062d\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629"}
            </h1>
            <p className="mb-0 mx-auto" style={styles.subtitle}>
              {"\u0639\u0630\u0631\u0627\u064b\u060c \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0630\u064a \u062a\u062d\u0627\u0648\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u064a\u0647 \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631 \u062d\u0627\u0644\u064a\u0627\u064b\u060c \u0623\u0648 \u0631\u0628\u0645\u0627 \u062a\u0645 \u0646\u0642\u0644\u0647 \u0625\u0644\u0649 \u0645\u0633\u0627\u0631 \u0622\u062e\u0631."}
            </p>
          </header>

          <div
            className="page-not-found__card card border-0 w-100 mx-auto"
            style={styles.card}
          >
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-center mb-4">
                <div
                  className="page-not-found__visual rounded-circle d-flex align-items-center justify-content-center position-relative"
                  style={styles.visualWrap}
                  aria-hidden="true"
                >
                  <BsBoxSeam size={64} />

                  <span
                    className="page-not-found__floating-badge page-not-found__floating-badge--search position-absolute top-0 start-0 translate-middle rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={styles.iconBadge}
                  >
                    <FiSearch size={24} />
                  </span>

                  <span
                    className="page-not-found__floating-badge page-not-found__floating-badge--truck position-absolute bottom-0 end-0 translate-middle rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={styles.iconBadge}
                  >
                    <BsTruck size={24} />
                  </span>
                </div>
              </div>

              <p className="mx-auto mb-4" style={styles.helper}>
                {"\u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629 \u0623\u0648 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0635\u0641\u062d\u0629 \u062a\u062a\u0628\u0639 \u0627\u0644\u0634\u062d\u0646\u0629 \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u062e\u062f\u0645\u0629 \u0627\u0644\u062a\u064a \u062a\u062d\u062a\u0627\u062c\u0647\u0627 \u0628\u0633\u0631\u0639\u0629."}
              </p>

              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <Link
                  to="/"
                  className="page-not-found__link btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"
                  style={styles.primaryButton}
                >
                  <FiHome aria-hidden="true" />
                  {"\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629"}
                </Link>

                <Link
                  to="/tracking"
                  className="page-not-found__link btn d-inline-flex align-items-center justify-content-center"
                  style={styles.secondaryButton}
                >
                  {"\u062a\u062a\u0628\u0639 \u0634\u062d\u0646\u0629"}
                </Link>
              </div>

              <div className="mt-4">
                <a
                  href={`mailto:${supportMailTo}`}
                  className="page-not-found__support-link d-inline-flex align-items-center gap-2"
                  style={styles.textLink}
                >
                  <FiMail aria-hidden="true" />
                  <span dir="ltr">{supportEmailDisplay}</span>
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

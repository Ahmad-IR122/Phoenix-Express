import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import "../styles/TopBar.css";

const TopBar = () => {
  return (
    <div className="topbar-header" dir="rtl">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap topbar-header-inner">
          <div className="d-flex align-items-center gap-2 gap-md-4 flex-wrap text-white topbar-contact">
            <a
              href="tel:+970123456789"
              className="topbar-link d-inline-flex align-items-center gap-2 text-decoration-none text-white"
            >
              <FaPhoneAlt className="topbar-icon" aria-hidden="true" />
              <span dir="ltr">+970 123 456 789</span>
            </a>

            <a
              href="mailto:info@phoenix-delivery.ps"
              className="topbar-link d-inline-flex align-items-center gap-2 text-decoration-none text-white"
            >
              <FaEnvelope className="topbar-icon" aria-hidden="true" />
              <span dir="ltr">info@phoenix-delivery.ps</span>
            </a>

            <div className="d-inline-flex align-items-center gap-2 text-white">
              <FaMapMarkerAlt className="topbar-icon" aria-hidden="true" />
              <span>نابلس، المخفية، شارع جامعة النجاح</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 flex-row-reverse topbar-social">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="topbar-link text-white"
            >
              <FaFacebookF className="topbar-icon" aria-hidden="true" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="topbar-link text-white"
            >
              <FaInstagram className="topbar-icon" aria-hidden="true" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="topbar-link text-white"
            >
              <FaTwitter className="topbar-icon" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

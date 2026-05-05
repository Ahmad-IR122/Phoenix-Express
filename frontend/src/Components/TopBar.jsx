import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import "../styles/TopBar.css";

const TopBar = () => {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("فونيكس للخدمات اللوجستية والنقل")}`;
  const whatsappMessage = "مرحباً فينوكس، أود الاستفسار عن خدمات التوصيل لديكم.";
  const whatsappUrl = `https://web.whatsapp.com/send?phone=972592520083&text=${encodeURIComponent(whatsappMessage)}`;
  const emailAddress = "info@phoenix-delivery.ps";
  const mailToAddress = "nora.aqad@gmail.com";

  const openMap = () => {
    window.open(mapUrl, "_blank", "noopener,noreferrer");
  };

  const openWhatsapp = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const openEmail = () => {
    window.location.href = `mailto:${mailToAddress}`;
  };

  return (
    <div className="topbar-header" dir="rtl">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap topbar-header-inner">
          <div className="d-flex align-items-center gap-2 gap-md-4 flex-wrap text-white topbar-contact">
            <button
              type="button"
              className="topbar-link topbar-action d-inline-flex align-items-center gap-2 text-white"
              onClick={openWhatsapp}
              aria-label="تواصل معنا عبر واتساب"
            >
              <FaPhoneAlt className="topbar-icon" aria-hidden="true" />
              <span dir="ltr">+972 59-252-0083</span>
            </button>

            <button
              type="button"
              className="topbar-link topbar-action d-inline-flex align-items-center gap-2 text-white"
              onClick={openEmail}
              aria-label="راسلنا عبر البريد الإلكتروني"
            >
              <FaEnvelope className="topbar-icon" aria-hidden="true" />
              <span dir="ltr">{emailAddress}</span>
            </button>

            <button
              type="button"
              className="topbar-link topbar-action d-inline-flex align-items-center gap-2 text-white"
              onClick={openMap}
              aria-label="افتح الموقع على الخريطة"
            >
              <FaMapMarkerAlt className="topbar-icon" aria-hidden="true" />
              <span>نابلس، المخفية، شارع جامعة النجاح</span>
            </button>
          </div>

          <div className="d-flex align-items-center gap-3 flex-row-reverse topbar-social">
            <a
              href="https://www.facebook.com/Phoenix.Deliver/?locale=ar_AR"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="topbar-link text-white"
            >
              <FaFacebookF className="topbar-icon" aria-hidden="true" />
            </a>
            <a
              href="https://www.instagram.com/phoenix_express1/"
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

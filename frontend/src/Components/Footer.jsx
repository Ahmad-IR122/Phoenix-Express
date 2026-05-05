import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import "../styles/Footer.css"
import { HiOutlineMapPin, HiOutlinePhone, HiOutlineEnvelope } from "react-icons/hi2";
import { AiOutlineTwitter, AiOutlineInstagram, AiOutlineFacebook } from "react-icons/ai";
import logo from "../Images/Phonex_logo.jpeg";

const Footer = () => {
  const navigate = useNavigate();
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("فونيكس للخدمات اللوجستية والنقل")}`;
  const whatsappMessage = "مرحباً فينوكس، أود الاستفسار عن خدمات التوصيل لديكم.";
  const whatsappUrl = `https://web.whatsapp.com/send?phone=972592520083&text=${encodeURIComponent(whatsappMessage)}`;
  const emailAddress = "info@phoenix-delivery.ps";
  const mailToAddress = "nora.aqad@gmail.com";

  const goTo = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <footer className="footer-container" dir="rtl">
      <div className="container py-5">
        <div className="row gy-4">
          <div className="col-lg-3 col-md-6 text-center text-md-end">
            <div className="footer-logo mb-3">
              <img src={logo} alt="Phonex Express" className="footer-logo-img" />
            </div>
            <p className="footer-about-text">
              شركة فلسطينية رائدة في مجال خدمات توصيل الطرود، نعمل على دعم المشاريع
              الصغيرة والمتوسطة.
            </p>
          </div>

          <div className="col-lg-3 col-md-6 text-center text-md-end">
            <h5 className="footer-heading mb-4">روابط سريعة</h5>
            <ul className="list-unstyled footer-links p-0">
              <li><button type="button" className="footer-link" onClick={() => goTo("/")}>الرئيسية</button></li>
              <li><button type="button" className="footer-link" onClick={() => goTo("/about")}>من نحن</button></li>
              <li><button type="button" className="footer-link" onClick={() => goTo("/tracking")}>تتبع الشحنة</button></li>
              <li><button type="button" className="footer-link" onClick={() => goTo("/blog")}>المدونة</button></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6 text-center text-md-end">
            <h5 className="footer-heading mb-4">خدماتنا</h5>
            <ul className="list-unstyled footer-links p-0">
              <li><button type="button" className="footer-link" onClick={() => goTo("/gallery")}>معرض الصور</button></li>
              <li><button type="button" className="footer-link" onClick={() => goTo("/reviews")}>آراء الزبائن</button></li>
              <li><button type="button" className="footer-link" onClick={() => goTo("/request-delivery")}>طلب خدمة توصيل</button></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6 text-center text-md-end">
            <h5 className="footer-heading mb-4">تواصل معنا</h5>
            <ul className="list-unstyled contact-list p-0">
              <li className="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                <HiOutlineMapPin className="contact-icon ms-2" />
                <button
                  type="button"
                  className="contact-text contact-map-link"
                  onClick={openMap}
                  aria-label="افتح الموقع على الخريطة"
                >
                  نابلس - الضاحية
                  <br />
                  شارع جامعة النجاح
                </button>
              </li>
              <li className="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                <HiOutlinePhone className="contact-icon ms-2" />
                <button
                  type="button"
                  className="contact-text contact-action-link"
                  dir="ltr"
                  onClick={openWhatsapp}
                  aria-label="تواصل معنا عبر واتساب"
                >
                  +972 59-252-0083
                </button>
              </li>
              <li className="d-flex align-items-center justify-content-center justify-content-md-start mb-4">
                <HiOutlineEnvelope className="contact-icon ms-2" />
                <button
                  type="button"
                  className="contact-text contact-action-link"
                  onClick={openEmail}
                  aria-label="راسلنا عبر البريد الإلكتروني"
                >
                  {emailAddress}
                </button>
              </li>
            </ul>

            <div className="social-box d-flex justify-content-center justify-content-md-start gap-3">
              <a href="https://twitter.com" className="social-circle" target="_blank" rel="noreferrer" aria-label="Twitter">
                <AiOutlineTwitter />
              </a>
              <a href="https://www.instagram.com/phoenix_express1/" className="social-circle" target="_blank" rel="noreferrer" aria-label="Instagram">
                <AiOutlineInstagram />
              </a>
              <a href="https://www.facebook.com/Phoenix.Deliver/?locale=ar_AR" className="social-circle" target="_blank" rel="noreferrer" aria-label="Facebook">
                <AiOutlineFacebook />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-divider"></div>

      <div className="container py-4">
        <div className="text-center copyright-text">
          جميع الحقوق محفوظة © 2026 شركة فينوكس للتوصيل
        </div>
      </div>
    </footer>
  );
};

export default Footer;

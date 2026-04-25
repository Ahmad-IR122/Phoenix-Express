import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Footer.css';
import {
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope
} from "react-icons/hi2";
import {
  AiOutlineTwitter,
  AiOutlineInstagram,
  AiOutlineFacebook
} from "react-icons/ai";
import logo from "../Images/Phonex_logo.jpeg";

const Footer = () => {
  return (
    <footer className="footer-container" dir="rtl">
      <div className="container py-5">
        <div className="row gy-4">

          <div className="col-lg-3 col-md-6 text-center text-md-end">
            <div className="footer-logo mb-3">
              <img src={logo} alt="Phonex Express" className="footer-logo-img" />
            </div>
            <p className="footer-about-text">
              شركة فلسطينية رائدة في مجال خدمات توصيل الطرود، نعمل على دعم المشاريع الصغيرة والمتوسطة.
            </p>
          </div>

          <div className="col-lg-3 col-md-6 text-center text-md-end">
            <h5 className="footer-heading mb-4">روابط سريعة</h5>
            <ul className="list-unstyled footer-links p-0">
              <li><a href="/">الرئيسية</a></li>
              <li><a href="/about">من نحن</a></li>
              <li><a href="/track">تتبع الشحنة</a></li>
              <li><a href="/blog">المدونة</a></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6 text-center text-md-end">
            <h5 className="footer-heading mb-4">خدماتنا</h5>
            <ul className="list-unstyled footer-links p-0">
              <li><a href="/gallery">معرض الصور</a></li>
              <li><a href="/reviews">آراء الزبائن</a></li>
              <li><a href="/request-service">طلب خدمة توصيل</a></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6 text-center text-md-end">
            <h5 className="footer-heading mb-4">تواصل معنا</h5>
            <ul className="list-unstyled contact-list p-0">
              <li className="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                <HiOutlineMapPin className="contact-icon ms-2" />
                <div className="contact-text">
                  نابلس - الضاحية <br />
                  شارع جامعة النجاح
                </div>
              </li>
              <li className="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                <HiOutlinePhone className="contact-icon ms-2" />
                <span className="contact-text" dir="ltr">+970 123 456 789</span>
              </li>
              <li className="d-flex align-items-center justify-content-center justify-content-md-start mb-4">
                <HiOutlineEnvelope className="contact-icon ms-2" />
                <span className="contact-text">info@phoenix-delivery.ps</span>
              </li>
            </ul>

            <div className="social-box d-flex justify-content-center justify-content-md-start gap-3">
              <a href="#" className="social-circle"><AiOutlineTwitter /></a>
              <a href="#" className="social-circle"><AiOutlineInstagram /></a>
              <a href="#" className="social-circle"><AiOutlineFacebook /></a>
            </div>
          </div>

        </div>
      </div>

      <div className="footer-divider"></div>

      <div className="container py-4">
        <div className="text-center copyright-text">
          جميع الحقوق محفوظة © 2026 شركة فينكس للتوصيل
        </div>
      </div>
    </footer>
  );
};

export default Footer;
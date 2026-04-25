import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ForgotPasswordPage.css';
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineArrowRight
} from "react-icons/hi2";
import logo from "../../../Images/Phonex_logo.jpeg";

const ForgotPasswordPage = () => {
  return (
    <div className="forgot-password-wrapper d-flex align-items-center justify-content-center">
      <div className="container d-flex flex-column align-items-center">

        <div className="logo-box-fixed mb-4 shadow-sm d-flex align-items-center justify-content-center">
          <img src={logo} alt="فينكس لوجو" className="img-fluid logo-img-contained" />
        </div>

        <div className="forgot-password-card shadow-sm">

          <div className="text-center mb-4">
            <h2 className="main-title mb-2">نسيت كلمة المرور؟</h2>
            <p className="sub-title text-muted">
              أدخل رقم هاتفك وسنرسل لك رمز التحقق
            </p>
          </div>

          <form dir="rtl">
            <div className="mb-4">
              <label className="form-label d-flex align-items-center">
                <HiOutlinePhone className="icon-blue-outline me-2" />
                <span>رقم الهاتف</span>
              </label>
              <input
                type="tel"
                className="form-control custom-input"
                placeholder="05xxxxxxxx"
              />
            </div>

            <button type="submit" className="btn btn-primary-forgot w-100 mb-3 d-flex align-items-center justify-content-center">
              <HiOutlineEnvelope className="me-2 fs-5" />
              <span>إرسال رمز التحقق</span>
            </button>

            <div className="modern-divider my-4">
              <span>أو</span>
            </div>

            <button type="button" className="btn btn-secondary-login w-100 d-flex align-items-center justify-content-center">
              <span>العودة لتسجيل الدخول</span>
              <HiOutlineArrowRight className="ms-2 fs-5" />
            </button>
          </form>
        </div>

        <div className="support-footer text-center mt-4 text-white">
          <p className="mb-0 small-help">هل تحتاج مساعدة؟</p>
          <p className="phone-num-small">+970 123 456 789</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
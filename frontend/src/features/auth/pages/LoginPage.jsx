import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginPage.css';
import { LuPhone } from "react-icons/lu";
import { IoLockClosedOutline } from "react-icons/io5";
import { FiLogIn } from "react-icons/fi";
import logo from "../../../Images/Phonex_logo.jpeg";
import { loginUser } from "../services/authService";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser({ phone, password });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      alert("تم تسجيل الدخول بنجاح");
      console.log(response.data);
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("فشل تسجيل الدخول");
    }
  };

  return (
    <div className="login-screen">
      <div className="logo-top-wrapper">
        <div className="white-logo-box">
          <img src={logo} alt="Phonex Logo" className="main-logo-img" />
        </div>
      </div>

      <div className="main-card-container">
        <div className="login-card shadow-sm">
          <div className="tab-switcher">
            <button type="button" className="tab-btn active">تسجيل الدخول</button>
            <button type="button" className="tab-btn">إنشاء حساب</button>
          </div>

          <div className="header-text text-center">
            <h2 className="main-title-blue">تسجيل الدخول</h2>
            <p className="sub-title">مرحباً بك في فينكس إكسبريس</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-field-wrapper phone-field-spacing">
              <label className="field-label d-flex align-items-center">
                <LuPhone className="icon-blue ms-2" />
                <span>رقم الهاتف</span>
              </label>
              <input
                type="text"
                className="form-control custom-input text-start"
                placeholder="05xxxxxxxxx"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="input-field-wrapper">
              <label className="field-label d-flex align-items-center">
                <IoLockClosedOutline className="icon-blue ms-2" />
                <span>كلمة المرور</span>
              </label>
              <input
                type="password"
                className="form-control custom-input text-end gray-dots-placeholder"
                placeholder="▪▪▪▪▪▪▪▪"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="actions-bar d-flex justify-content-between align-items-center mb-4">
              <div className="remember-me-group d-flex align-items-center">
                <input type="checkbox" className="black-custom-checkbox" id="remember" defaultChecked />
                <label htmlFor="remember" className="remember-text-style">تذكرني</label>
              </div>

              <a href="#" className="forgot-password-link">نسيت كلمة المرور؟</a>
            </div>

            <button type="submit" className="btn-primary-blue-action w-100">
              تسجيل الدخول <FiLogIn className="ms-2" />
            </button>

            <div className="custom-divider">
              <span>أو</span>
            </div>

            <button type="button" className="btn-light-gray-home w-100">
              العودة للصفحة الرئيسية
            </button>
          </form>
        </div>
      </div>

      <div className="footer-support-info text-center mt-4 text-white">
        <p className="mb-0">هل تحتاج مساعدة؟</p>
        <p className="phone-number-bold" dir="ltr">789 456 123 970+</p>
      </div>
    </div>
  );
};

export default LoginPage;
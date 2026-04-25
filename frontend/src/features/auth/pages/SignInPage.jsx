import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SignInPage.css';
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin
} from "react-icons/hi2";
import logo from "../../../Images/Phonex_logo.jpeg";
import { registerUser } from "../services/authService";

const SignInPage = () => {
  const [accountType, setAccountType] = useState('individual');

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        email,
        phone,
        password,
        role: accountType === "company" ? "company" : "customer",
      };

      const response = await registerUser(payload);

      console.log("Register success:", response.data);
      alert("تم إنشاء الحساب بنجاح");

      setFullName("");
      setCompanyName("");
      setCompanyLocation("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch (error) {
      console.log("Register error:", error.response?.data || error.message);
      alert("فشل إنشاء الحساب");
    }
  };

  return (
    <div className="signin-wrapper d-flex align-items-center justify-content-center">
      <div className="container d-flex flex-column align-items-center">

        <div className="logo-box-fixed mb-4 shadow-sm d-flex align-items-center justify-content-center">
          <img src={logo} alt="فينكس لوجو" className="img-fluid logo-img-contained" />
        </div>

        <div className="signin-card shadow-sm">

          <div className="auth-tabs d-flex p-1 mb-4">
            <button type="button" className="tab-btn inactive w-50">تسجيل الدخول</button>
            <button type="button" className="tab-btn active w-50">إنشاء حساب</button>
          </div>

          <div className="text-center mb-4">
            <h2 className="main-title mb-1">إنشاء حساب جديد</h2>
            <p className="sub-title">انضم إلى عائلة فينكس إكسبريس</p>
          </div>

          <div className="account-switcher d-flex p-1 mb-4">
            <button
              type="button"
              className={`switch-btn ${accountType === 'individual' ? 'active' : ''}`}
              onClick={() => setAccountType('individual')}
            >
              زبون عادي
            </button>

            <button
              type="button"
              className={`switch-btn ${accountType === 'company' ? 'active' : ''}`}
              onClick={() => setAccountType('company')}
            >
              شركات
            </button>
          </div>

          <form dir="rtl" onSubmit={handleSubmit}>
            {accountType === 'individual' ? (
              <>
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <HiOutlineUser className="icon-blue-outline me-2" />
                    <span>الاسم</span>
                  </label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="الاسم الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <HiOutlineEnvelope className="icon-blue-outline me-2" />
                    <span>البريد الإلكتروني</span>
                  </label>
                  <input
                    type="email"
                    className="form-control custom-input"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <HiOutlinePhone className="icon-blue-outline me-2" />
                    <span>رقم الهاتف</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control custom-input"
                    placeholder="05xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <HiOutlineBuildingOffice2 className="icon-blue-outline me-2" />
                    <span>اسم الشركة</span>
                  </label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="اسم الشركة"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <HiOutlineEnvelope className="icon-blue-outline me-2" />
                    <span>البريد الإلكتروني</span>
                  </label>
                  <input
                    type="email"
                    className="form-control custom-input"
                    placeholder="email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <HiOutlinePhone className="icon-blue-outline me-2" />
                    <span>رقم هاتف الشركة</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control custom-input"
                    placeholder="02xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <HiOutlineMapPin className="icon-blue-outline me-2" />
                    <span>موقع الشركة الحالي</span>
                  </label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="المدينة والعنوان"
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="form-label d-flex align-items-center">
                <HiOutlineLockClosed className="icon-blue-outline me-2" />
                <span>كلمة السر</span>
              </label>
              <input
                type="password"
                className="form-control custom-input password-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary-signup w-100">
              إنشاء الحساب
            </button>

            <div className="modern-divider my-4">
              <span>أو</span>
            </div>

            <button type="button" className="btn btn-secondary-home w-100">
              العودة للصفحة الرئيسية
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

export default SignInPage;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import "./UnifiedAuth.css";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
} from "react-icons/hi2";
import logo from "../../../Images/Phonex_logo.jpeg";
import { registerUser } from "../services/authService";
import {
  hasMinPasswordLength,
  isValidAuthPhone,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
} from "../../../utils/validators";

const SignInPage = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("individual");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const supportWhatsappMessage = "مرحباً فينوكس، أحتاج مساعدة بخصوص إنشاء حساب.";
  const supportWhatsappUrl = `https://web.whatsapp.com/send?phone=972592520083&text=${encodeURIComponent(supportWhatsappMessage)}`;
  const openSupportWhatsapp = () => {
    window.open(supportWhatsappUrl, "_blank", "noopener,noreferrer");
  };

  const showError = (title, message) => {
    Swal.fire({
      icon: "error",
      title,
      text: message,
      confirmButtonText: "حسنًا",
      confirmButtonColor: "#38B6FF",
      customClass: {
        popup: "swal-rtl",
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidAuthPhone(phone)) {
      showError("رقم الهاتف غير صالح", "يرجى إدخال رقم هاتف يبدأ بـ 056 أو 059 ويتكون من 10 أرقام.");
      return;
    }

    if (!isValidEmail(email)) {
      showError("البريد الإلكتروني غير صالح", "يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    if (!hasMinPasswordLength(password)) {
      showError("كلمة المرور غير صالحة", `يرجى إدخال كلمة مرور مكونة من ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`);
      return;
    }

    try {
      const payload = {
        email,
        phone,
        password,
        role: accountType === "company" ? "company" : "customer",
        fullName: accountType === "individual" ? fullName : companyName,
        address: companyLocation,
      };

      await registerUser(payload);

      setFullName("");
      setCompanyName("");
      setCompanyLocation("");
      setEmail("");
      setPhone("");
      setPassword("");

      await Swal.fire({
        icon: "success",
        title: "تم إنشاء الحساب",
        text: "يمكنك الآن تسجيل الدخول إلى حسابك",
        confirmButtonText: "تسجيل الدخول",
        confirmButtonColor: "#38B6FF",
        customClass: {
          popup: "swal-rtl",
        },
      });

      navigate("/login");
    } catch (error) {
      const message =
        error.response?.data?.errors?.join(" - ") ||
        error.response?.data?.message ||
        "تأكد من البيانات المدخلة وحاول مرة أخرى";

      showError("فشل إنشاء الحساب", message);
    }
  };

  return (
    <div className="auth-screen">
      <div className="logo-top-wrapper">
        <div className="white-logo-box">
          <img src={logo} alt="فينوكس لوجو" className="main-logo-img" />
        </div>
      </div>

      <div className="main-card-container">
        <div className="auth-card shadow-sm">
          <div className="tab-switcher">
            <button
              type="button"
              className="tab-btn d-flex align-items-center justify-content-center"
              onClick={() => navigate("/login")}
            >
              تسجيل الدخول
            </button>
            <button type="button" className="tab-btn active">
              إنشاء حساب
            </button>
          </div>

          <div className="header-text text-center">
            <h2 className="main-title-blue">إنشاء حساب جديد</h2>
            <p className="sub-title">انضم إلى عائلة فينوكس إكسبرس</p>
          </div>

          <div className="account-switcher d-flex mb-4">
            <button
              type="button"
              className={`switch-btn ${accountType === "individual" ? "active" : ""}`}
              onClick={() => setAccountType("individual")}
            >
              زبون عادي
            </button>
            <button
              type="button"
              className={`switch-btn ${accountType === "company" ? "active" : ""}`}
              onClick={() => setAccountType("company")}
            >
              شركات
            </button>
          </div>

          <form dir="rtl" onSubmit={handleSubmit}>
            {accountType === "individual" ? (
              <div className="input-field-wrapper">
                <label className="field-label d-flex align-items-center">
                  <HiOutlineUser className="icon-blue ms-2" />
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
            ) : (
              <div className="input-field-wrapper">
                <label className="field-label d-flex align-items-center">
                  <HiOutlineBuildingOffice2 className="icon-blue ms-2" />
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
            )}

            <div className="input-field-wrapper">
              <label className="field-label d-flex align-items-center">
                <HiOutlineEnvelope className="icon-blue ms-2" />
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

            <div className="input-field-wrapper">
              <label className="field-label d-flex align-items-center">
                <HiOutlinePhone className="icon-blue ms-2" />
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

            {accountType === "company" && (
              <div className="input-field-wrapper">
                <label className="field-label d-flex align-items-center">
                  <HiOutlineMapPin className="icon-blue ms-2" />
                  <span>موقع الشركة</span>
                </label>
                <input
                  type="text"
                  className="form-control custom-input"
                  placeholder="المدينة والعنوان"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                />
              </div>
            )}

            <div className="input-field-wrapper mb-4">
              <label className="field-label d-flex align-items-center">
                <HiOutlineLockClosed className="icon-blue ms-2" />
                <span>كلمة السر</span>
              </label>
              <input
                type="password"
                className="form-control custom-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary-blue-action w-100">
              إنشاء الحساب
            </button>

            <div className="custom-divider">
              <span>أو</span>
            </div>

            <button
              type="button"
              className="btn-light-gray-home w-100 d-flex align-items-center justify-content-center"
              onClick={() => navigate("/")}
            >
              العودة للصفحة الرئيسية
            </button>
          </form>
        </div>
      </div>

      <div className="footer-support-info text-center mt-4 text-white">
        <p className="mb-0">هل تحتاج مساعدة؟</p>
        <button
          type="button"
          className="phone-number-bold auth-support-phone"
          dir="ltr"
          onClick={openSupportWhatsapp}
        >
          +972 59-252-0083
        </button>
      </div>
    </div>
  );
};

export default SignInPage;

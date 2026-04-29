import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./UnifiedAuth.css";
import { LuPhone } from "react-icons/lu";
import { IoLockClosedOutline } from "react-icons/io5";
import { FiLogIn } from "react-icons/fi";
import logo from "../../../Images/Phonex_logo.jpeg";
import { loginUser } from "../services/authService";

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
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

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser({ phone, password });
      const { token, user } = response.data;

      const storage = rememberMe ? localStorage : sessionStorage;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      storage.setItem("token", token);
      storage.setItem("user", JSON.stringify(user));

      await Swal.fire({
        icon: "success",
        title: "تم تسجيل الدخول",
        text: "مرحبًا بك في فينكس إكسبرس",
        confirmButtonText: "متابعة",
        confirmButtonColor: "#38B6FF",
        timer: 1500,
        timerProgressBar: true,
        customClass: {
          popup: "swal-rtl",
        },
      });

      if (user?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (user?.role === "employee") {
        navigate("/employee/home", { replace: true });
        return;
      }

      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.errors?.join(" - ") ||
        error.response?.data?.message ||
        "تأكد من رقم الهاتف وكلمة المرور";

      showError("فشل تسجيل الدخول", message);
    }
  };

  return (
    <div className="auth-screen">
      <div className="logo-top-wrapper">
        <div className="white-logo-box">
          <img src={logo} alt="Phonex Logo" className="main-logo-img" />
        </div>
      </div>

      <div className="main-card-container">
        <div className="auth-card shadow-sm">
          <div className="tab-switcher">
            <button type="button" className="tab-btn active">
              تسجيل الدخول
            </button>
            <Link
              to="/signin"
              className="tab-btn text-decoration-none d-flex align-items-center justify-content-center"
            >
              إنشاء حساب
            </Link>
          </div>

          <div className="header-text text-center">
            <h2 className="main-title-blue">تسجيل الدخول</h2>
            <p className="sub-title">مرحباً بك في فينكس إكسبرس</p>
          </div>

          <form onSubmit={handleLogin} dir="rtl">
            <div className="input-field-wrapper">
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
                className="form-control custom-input text-end"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="actions-bar d-flex justify-content-between align-items-center mb-4">
              <div className="remember-me-group d-flex align-items-center">
                <input
                  type="checkbox"
                  className="black-custom-checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="remember-text-style">
                  تذكرني
                </label>
              </div>

              <Link to="/forgot-password" className="forgot-password-link">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button type="submit" className="btn-primary-blue-action w-100">
              تسجيل الدخول <FiLogIn className="ms-2" />
            </button>

            <div className="custom-divider">
              <span>أو</span>
            </div>

            <Link
              to="/"
              className="btn-light-gray-home w-100 d-flex align-items-center justify-content-center text-decoration-none"
            >
              العودة للصفحة الرئيسية
            </Link>
          </form>
        </div>
      </div>

      <div className="footer-support-info text-center mt-4 text-white">
        <p className="mb-0">هل تحتاج مساعدة؟</p>
        <p className="phone-number-bold" dir="ltr">
          +970 123 456 789
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
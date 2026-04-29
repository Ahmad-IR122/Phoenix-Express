import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./ForgotPasswordPage.css";
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineArrowRight,
  HiOutlineKey,
  HiOutlineLockClosed
} from "react-icons/hi2";
import logo from "../../../Images/Phonex_logo.jpeg";
import { forgotPassword, resetPassword } from "../services/authService";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();

    try {
      const response = await forgotPassword({ phone });
      const mockCode = response.data.mockCode;

      await Swal.fire({
        icon: "success",
        title: "تم إرسال رمز التحقق",
        text: `رمز التحقق التجريبي هو: ${mockCode}`,
        confirmButtonText: "متابعة",
        confirmButtonColor: "#38B6FF",
        customClass: { popup: "swal-rtl" },
      });

      setStep(2);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: error.response?.data?.message || "فشل إرسال رمز التحقق",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#38B6FF",
        customClass: { popup: "swal-rtl" },
      });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      await resetPassword({ phone, code, newPassword });

      await Swal.fire({
        icon: "success",
        title: "تم تغيير كلمة المرور",
        text: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة",
        confirmButtonText: "تسجيل الدخول",
        confirmButtonColor: "#38B6FF",
        customClass: { popup: "swal-rtl" },
      });

      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text:
          error.response?.data?.errors?.join(" - ") ||
          error.response?.data?.message ||
          "فشل تغيير كلمة المرور",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#38B6FF",
        customClass: { popup: "swal-rtl" },
      });
    }
  };

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-content">
        <div className="logo-box-fixed shadow-sm">
          <img src={logo} alt="فينكس لوجو" className="logo-img-contained" />
        </div>

        <div className="forgot-password-card shadow-sm">
          <div className="text-center mb-4">
            <h2 className="main-title mb-2">
              {step === 1 ? "نسيت كلمة المرور؟" : "رمز التحقق"}
            </h2>
            <p className="sub-title text-muted">
              {step === 1
                ? "أدخل رقم هاتفك وسنرسل لك رمز التحقق"
                : `أدخل الرمز المرسل إلى ${phone}`}
            </p>
          </div>

          {step === 1 ? (
            <form dir="rtl" onSubmit={handleSendCode}>
              <div className="mb-4">
                <label className="form-label d-flex align-items-center">
                  <HiOutlinePhone className="icon-blue-outline ms-2" />
                  <span>رقم الهاتف</span>
                </label>

                <input
                  type="tel"
                  className="form-control custom-input text-start"
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary-forgot w-100">
                <HiOutlineEnvelope className="ms-2 fs-5" />
                إرسال رمز التحقق
              </button>
            </form>
          ) : (
            <form dir="rtl" onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="form-label d-flex align-items-center">
                  <HiOutlineKey className="icon-blue-outline ms-2" />
                  <span>رمز التحقق (6 أرقام)</span>
                </label>

                <input
                  type="text"
                  className="form-control custom-input text-center code-input"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength="6"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label d-flex align-items-center">
                  <HiOutlineLockClosed className="icon-blue-outline ms-2" />
                  <span>كلمة المرور الجديدة</span>
                </label>

                <input
                  type="password"
                  className="form-control custom-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="d-flex gap-3">
                <button type="submit" className="btn btn-primary-forgot flex-fill">
                  تحقق
                </button>

                <button
                  type="button"
                  className="btn btn-secondary-login flex-fill"
                  onClick={() => setStep(1)}
                >
                  رجوع
                </button>
              </div>

              <button
                type="button"
                className="resend-btn"
                onClick={handleSendCode}
              >
                إعادة إرسال الرمز
              </button>
            </form>
          )}

          <div className="modern-divider my-4">
            <span>أو</span>
          </div>

          <Link
            to="/login"
            className="btn btn-secondary-login w-100 d-flex align-items-center justify-content-center text-decoration-none"
          >
            <span>العودة لتسجيل الدخول</span>
            <HiOutlineArrowRight className="me-2 fs-5" />
          </Link>
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
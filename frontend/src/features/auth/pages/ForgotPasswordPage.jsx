import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./ForgotPasswordPage.css";
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineArrowRight,
  HiOutlineKey,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import logo from "../../../Images/Phonex_logo.jpeg";
import { forgotPassword, resetPassword } from "../services/authService";

const SUPPORT_PHONE = "972592520083";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const openSupportWhatsapp = () => {
    const message = `مرحباً فينوكس، أحتاج مساعدة بخصوص استعادة كلمة المرور لحسابي المرتبط بالرقم: ${phone}`;
    window.open(
      `https://web.whatsapp.com/send?phone=${SUPPORT_PHONE}&text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleSendCode = async (event) => {
    event.preventDefault();

    try {
      await forgotPassword({ phone });

      await Swal.fire({
        icon: "success",
        title: "تم إرسال رمز التحقق",
        text: "تم إرسال رمز التحقق إلى البريد الإلكتروني المرتبط بهذا الرقم.",
        confirmButtonText: "متابعة",
        confirmButtonColor: "#38B6FF",
        customClass: { popup: "swal-rtl" },
      });

      setStep(2);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذر إرسال الرمز",
        text:
          error.response?.data?.message ||
          "لم نتمكن من إرسال رمز التحقق. تواصل مع الدعم للمساعدة.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38B6FF",
        customClass: { popup: "swal-rtl" },
      });
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    try {
      await resetPassword({ phone, code, newPassword });

      await Swal.fire({
        icon: "success",
        title: "تم تغيير كلمة المرور",
        text: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
        confirmButtonText: "تسجيل الدخول",
        confirmButtonColor: "#38B6FF",
        customClass: { popup: "swal-rtl" },
      });

      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذر تغيير كلمة المرور",
        text:
          error.response?.data?.errors?.join(" - ") ||
          error.response?.data?.message ||
          "تأكد من رمز التحقق وحاول مرة أخرى.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38B6FF",
        customClass: { popup: "swal-rtl" },
      });
    }
  };

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-content">
        <div className="logo-box-fixed shadow-sm">
          <img src={logo} alt="فينوكس لوجو" className="logo-img-contained" />
        </div>

        <div className="forgot-password-card shadow-sm">
          <div className="text-center mb-4">
            <h2 className="forgot-password-main-title mb-2">
              {step === 1 ? "نسيت كلمة المرور؟" : "رمز التحقق"}
            </h2>
            <p className="forgot-password-subtitle text-muted">
              {step === 1
                ? "أدخل رقم هاتفك وسنرسل رمز تحقق إلى البريد الإلكتروني المرتبط بالحساب."
                : `أدخل الرمز المرسل إلى بريد الحساب المرتبط بالرقم ${phone} ثم اختر كلمة مرور جديدة.`}
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
                  className="form-control forgot-password-input text-start"
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
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
                  <span>رمز التحقق</span>
                </label>

                <input
                  type="text"
                  className="form-control forgot-password-input text-center code-input"
                  placeholder="123456"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
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
                  className="form-control forgot-password-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </div>

              <div className="d-flex gap-3">
                <button type="submit" className="btn btn-primary-forgot flex-fill">
                  تغيير كلمة المرور
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

          <div className="forgot-password-divider my-4">
            <span>أو</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary-login w-100 d-flex align-items-center justify-content-center"
            onClick={() => navigate("/login")}
          >
            <span>العودة لتسجيل الدخول</span>
            <HiOutlineArrowRight className="me-2 fs-5" />
          </button>
        </div>

        <div className="support-footer text-center mt-4 text-white">
          <p className="mb-0 forgot-password-help">هل تحتاج مساعدة؟</p>
          <button
            type="button"
            className="phone-num-small auth-support-phone"
            dir="ltr"
            onClick={openSupportWhatsapp}
          >
            +972 59-252-0083
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

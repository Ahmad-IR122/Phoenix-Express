import React from "react";
import "../styles/Navbar.css";
import logo from "../Images/Phonex_logo.jpeg"; // Assuming you have a logo image in the assets folder

const navItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "من نحن" },
  { href: "/tracking", label: "تتبع الشحنة" },
  { href: "/gallery", label: "معرض الصور" },
  { href: "/reviews", label: "آراء الزبائن" },
  { href: "/blog", label: "المدونة" },
];

const Navbar = () => {
  return (
    <nav
      className="navbar navbar-expand-lg bg-white py-3 mobix-navbar"
      dir="rtl"
      aria-label="شريط التنقل الرئيسي"
    >
      <div className="container">
        <a
          className="navbar-brand d-inline-flex align-items-center gap-2 fw-bold text-decoration-none text-black m-0"
          href="/"
        >
          <img src={logo} className="rounded-circle" alt="موبيكس لوجو" width="90" height="90" />
        </a>

        <button
          className="navbar-toggler border-0 shadow-none p-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mobixNavbar"
          aria-controls="mobixNavbar"
          aria-expanded="false"
          aria-label="فتح القائمة"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mobixNavbar">
          <ul className="navbar-nav mx-auto mb-3 mb-lg-0 align-items-lg-center gap-lg-3 text-center">
            {navItems.map((item) => (
              <li className="nav-item" key={item.href}>
                <a
                  className="nav-link px-2 px-xl-3 py-2 fw-bold text-black mobix-nav-link"
                  href={item.href}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-lg-end gap-2 gap-lg-3 mobix-nav-actions">
            <a
              className="btn rounded-pill px-4 px-xl-5 py-2 fw-bold text-white border-0 mobix-btn mobix-btn-primary"
              href="/request-delivery"
            >
              اطلب خدمة التوصيل
            </a>
            <a
              className="btn rounded-pill px-4 py-2 fw-bold text-white border-0 mobix-btn mobix-btn-dark"
              href="/login"
            >
              تسجيل الدخول
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

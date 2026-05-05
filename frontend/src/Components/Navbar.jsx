import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import "../styles/Navbar.css";
import logo from "../Images/Phonex_logo.jpeg";

const navItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "من نحن" },
  { href: "/tracking", label: "تتبع الشحنة" },
  { href: "/gallery", label: "معرض الصور" },
  { href: "/reviews", label: "آراء الزبائن" },
  { href: "/blog", label: "المدونة" },
];

const Navbar = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = React.useState(
    Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"))
  );

  React.useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("token") || sessionStorage.getItem("token")));
  }, [location.pathname]);

  return (
    <nav className="mobix-navbar" dir="rtl" aria-label="شريط التنقل الرئيسي">
      <div className="container mobix-navbar-container">
        <Link className="mobix-navbar-brand" to="/">
          <img
            src={logo}
            className="mobix-navbar-logo"
            alt="فينوكس لوجو"
            width="90"
            height="90"
          />
        </Link>

        <button
          className="navbar-toggler mobix-navbar-toggler border-0 shadow-none p-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mobixNavbar"
          aria-controls="mobixNavbar"
          aria-expanded="false"
          aria-label="فتح القائمة"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse mobix-navbar-collapse" id="mobixNavbar">
          <ul className="mobix-navbar-nav">
            {navItems.map((item) => (
              <li className="mobix-navbar-item" key={item.href}>
                <Link className="mobix-nav-link" to={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mobix-nav-actions">
            <Link className="mobix-btn mobix-btn-primary" to="/request-delivery">
              اطلب خدمة التوصيل
            </Link>
            {isLoggedIn ? (
              <Link className="mobix-btn mobix-btn-dark mobix-btn-profile" to="/profile">
                الملف الشخصي
                <FiUser className="mobix-btn-icon" aria-hidden="true" />
              </Link>
            ) : (
              <Link className="mobix-btn mobix-btn-dark" to="/login">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

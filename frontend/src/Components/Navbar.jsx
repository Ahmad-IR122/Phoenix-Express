import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(
    Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"))
  );
  const [userRole, setUserRole] = React.useState("");

  React.useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("token") || sessionStorage.getItem("token")));

    try {
      const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setUserRole(parsedUser?.role || "");
    } catch {
      setUserRole("");
    }
  }, [location.pathname]);

  const goTo = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getProfilePath = () => {
    if (userRole === "employee") return "/employee/profile";
    if (userRole === "admin") return "/admin/profile";
    return "/profile";
  };

  return (
    <nav className="mobix-navbar" dir="rtl" aria-label="شريط التنقل الرئيسي">
      <div className="container mobix-navbar-container">
        <button
          type="button"
          className="mobix-navbar-brand"
          onClick={() => goTo("/")}
          aria-label="العودة إلى الصفحة الرئيسية"
        >
          <img
            src={logo}
            className="mobix-navbar-logo"
            alt="فينوكس لوجو"
            width="90"
            height="90"
          />
        </button>

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
                <button
                  type="button"
                  className="mobix-nav-link"
                  onClick={() => goTo(item.href)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="mobix-nav-actions">
            <button
              type="button"
              className="mobix-btn mobix-btn-primary"
              onClick={() => goTo("/request-delivery")}
            >
              اطلب خدمة التوصيل
            </button>
            {isLoggedIn ? (
              <button
                type="button"
                className="mobix-btn mobix-btn-dark mobix-btn-profile"
                onClick={() => goTo(getProfilePath())}
              >
                الملف الشخصي
                <FiUser className="mobix-btn-icon" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="mobix-btn mobix-btn-dark"
                onClick={() => goTo("/login")}
              >
                تسجيل الدخول
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import { useEffect, useState } from "react";
import "../../styles/ScrollTopButton.css";

const SCROLL_THRESHOLD = 240;

export default function ScrollTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      className={`btn phoenix-scroll-top ${isVisible ? "is-visible" : ""}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <span className="phoenix-scroll-top__arrow" aria-hidden="true"></span>
    </button>
  );
}

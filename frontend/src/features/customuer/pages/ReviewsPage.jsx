import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { FiUser } from "react-icons/fi";
import API from "../../../apis/api";
import "./ReviewsPage.css";

const defaultStats = {
  averageRating: 0,
  total: 0,
  satisfactionRate: 0,
};

const features = [
  { icon: "★", title: "جودة عالية", text: "نقيس جودة الخدمة من تجارب العملاء الحقيقية" },
  { icon: "✓", title: "تجربة موثوقة", text: "نعرض آخر المشاركات كما وصلت من مستخدمي فينوكس" },
  { icon: "↗", title: "تحسين مستمر", text: "كل تقييم يساعدنا على تطوير سرعة ودقة التوصيل" },
];

// eslint-disable-next-line no-unused-vars
const locationOptions = [
  "نابلس",
  "رام الله",
  "القدس",
  "الخليل",
  "جنين",
  "طولكرم",
  "قلقيلية",
  "بيت لحم",
  "أريحا",
  "الداخل",
  "أخرى",
];

const reviewLocationOptions = [
  "\u0646\u0627\u0628\u0644\u0633",
  "\u0631\u0627\u0645 \u0627\u0644\u0644\u0647",
  "\u0627\u0644\u0642\u062f\u0633",
  "\u0627\u0644\u062e\u0644\u064a\u0644",
  "\u062c\u0646\u064a\u0646",
  "\u0637\u0648\u0644\u0643\u0631\u0645",
  "\u0642\u0644\u0642\u064a\u0644\u064a\u0629",
  "\u0628\u064a\u062a \u0644\u062d\u0645",
  "\u0623\u0631\u064a\u062d\u0627",
  "\u0627\u0644\u062f\u0627\u062e\u0644",
  "\u0623\u062e\u0631\u0649",
];

const isAuthenticated = () =>
  Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"));

const formatReviewDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
};

const normalizeReview = (review) => ({
  id: review.id,
  name: review.customer?.name || "عميل فينوكس",
  city: review.customer?.city || "فلسطين",
  rating: Number(review.rating || 0),
  date: formatReviewDate(review.created_at || review.createdAt),
  text: review.comment || "تجربة موفقة مع فينوكس إكسبرس.",
});

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roundedAverage = useMemo(
    () => Number(stats.averageRating || 0).toFixed(1),
    [stats.averageRating]
  );

  const loadReviews = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await API.get("/feedbacks/summary");
      const payload = response.data?.data || {};

      setReviews((payload.reviews || []).map(normalizeReview));
      setStats({
        averageRating: payload.stats?.averageRating || 0,
        total: payload.stats?.total || 0,
        satisfactionRate: payload.stats?.satisfactionRate || 0,
      });
    } catch (error) {
      setLoadError("تعذر تحميل آراء الزبائن حالياً.");
      setReviews([]);
      setStats(defaultStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const renderStars = (rating) =>
    [...Array(5)].map((_, index) => (
      <span key={index} className={index < Math.round(rating) ? "star-filled" : "star-empty"}>
        ★
      </span>
    ));

  const resetReviewModal = () => {
    setShowReviewModal(false);
    setSelectedRating(0);
    setHoverRating(0);
    setSelectedLocation("");
    setReviewText("");
  };

  const openReviewModal = () => {
    if (!isAuthenticated()) {
      Swal.fire({
        icon: "info",
        title: "تسجيل الدخول مطلوب",
        text: "يرجى تسجيل الدخول حتى يتم ربط التقييم بحسابك الحقيقي.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedRating || isSubmitting) return;

    if (!selectedLocation) {
      Swal.fire({
        icon: "warning",
        title: "اختيار المنطقة مطلوب",
        text: "يرجى اختيار منطقتك حتى يظهر التقييم بمعلومات أوضح.",
        confirmButtonText: "تمام",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await API.post("/feedbacks/me", {
        rating: selectedRating,
        customer_location: selectedLocation,
        comment: reviewText.trim(),
      });

      resetReviewModal();
      await loadReviews();

      Swal.fire({
        icon: "success",
        title: "تم إرسال تقييمك",
        text: "شكراً لمشاركتك تجربتك مع فينوكس إكسبرس.",
        confirmButtonText: "تمام",
        confirmButtonColor: "#38b6ff",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذر إرسال التقييم",
        text: "يرجى المحاولة مرة أخرى.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38b6ff",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reviews-page-wrapper" dir="rtl">
      <header className="reviews-header text-center">
        <Container>
          <h1 className="reviews-title">آراء الزبائن</h1>
          <p className="reviews-subtitle">آخر تجارب العملاء الحقيقية مع خدمات فينوكس</p>
        </Container>
      </header>

      <Container>
        <section className="stats-section mb-5">
          <div className="stats-card shadow-sm text-center">
            <Row className="align-items-center">
              <Col md={4} className="reviews-stat-item">
                <div className="reviews-stat-number">{roundedAverage}</div>
                <div className="stat-stars">{renderStars(stats.averageRating)}</div>
                <div className="reviews-stat-label">متوسط التقييم</div>
              </Col>
              <Col md={4} className="reviews-stat-item border-start-end">
                <div className="reviews-stat-number">{stats.total}</div>
                <div className="reviews-stat-label">تقييم</div>
              </Col>
              <Col md={4} className="reviews-stat-item">
                <div className="reviews-stat-number">{stats.satisfactionRate}%</div>
                <div className="reviews-stat-label">نسبة الرضا</div>
              </Col>
            </Row>
          </div>
        </section>

        <section className="reviews-grid mb-5">
          {isLoading ? (
            <div className="reviews-state-message">جاري تحميل آراء الزبائن...</div>
          ) : loadError ? (
            <div className="reviews-state-message reviews-state-message--error">{loadError}</div>
          ) : reviews.length === 0 ? (
            <div className="reviews-state-message">لا توجد تقييمات منشورة حتى الآن.</div>
          ) : (
            <Row className="g-4">
              {reviews.map((review) => (
                <Col key={review.id} lg={4} md={6}>
                  <div className="review-card h-100 shadow-sm">
                    <div className="review-header d-flex align-items-center mb-3">
                      <div className="user-avatar-circle">
                        <FiUser />
                      </div>
                      <div className="user-info">
                        <h6 className="customer-name">{review.name}</h6>
                        <span className="customer-city">{review.city}</span>
                        <div className="review-stars">{renderStars(review.rating)}</div>
                      </div>
                    </div>

                    <p className="review-text">{review.text}</p>
                    <div className="review-date text-muted">{review.date}</div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </section>

        <section className="reviews-cta-section mb-5">
          <div className="reviews-cta-box text-center p-5 shadow">
            <h2 className="reviews-cta-title mb-3">شارك رأيك معنا</h2>
            <p className="reviews-cta-subtitle mb-4">
              يتم عرض تقييمات المستخدمين المسجلين حتى تبقى الآراء حقيقية وموثوقة.
            </p>
            <Button className="reviews-btn-leave rounded-pill px-5" onClick={openReviewModal}>
              اترك تقييمك
            </Button>
          </div>
        </section>

        <section className="reviews-features-section pb-5">
          <Row className="g-4">
            {features.map((feature) => (
              <Col key={feature.title} md={4}>
                <div className="feature-small-card text-center shadow-sm p-4 h-100">
                  <div className="feat-icon mb-3">{feature.icon}</div>
                  <h5 className="feat-title">{feature.title}</h5>
                  <p className="feat-text text-muted mb-0">{feature.text}</p>
                </div>
              </Col>
            ))}
          </Row>
        </section>
      </Container>

      {showReviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal-box" dir="rtl">
            <button type="button" className="review-modal-close" onClick={resetReviewModal}>
              ×
            </button>
            <h2 className="review-modal-title">اترك تقييمك</h2>
            <h4 className="review-modal-question">كيف كانت تجربتك معنا؟</h4>

            <div className="review-modal-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`modal-star ${star <= (hoverRating || selectedRating) ? "active" : ""}`}
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="review-modal-label">اكتب رأيك هنا... (اختياري)</label>

            <label className="review-modal-label">اختر منطقتك</label>
            <label className="review-modal-label">{"\u0627\u062e\u062a\u0631 \u0645\u0646\u0637\u0642\u062a\u0643"}</label>
            <select
              className="review-modal-select"
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
            >
              <option value="">اختيار المنطقة</option>
              {reviewLocationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <label className="review-modal-label">
              {"\u0627\u0643\u062a\u0628 \u0631\u0623\u064a\u0643 \u0647\u0646\u0627... (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)"}
            </label>

            <textarea
              className="review-modal-textarea"
              placeholder="شاركنا تجربتك مع فينوكس إكسبرس..."
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
            />

            <div className="review-modal-actions">
              <button type="button" className="review-modal-cancel" onClick={resetReviewModal}>
                إلغاء
              </button>

              <button
                type="button"
                className="review-modal-submit"
                disabled={selectedRating === 0 || isSubmitting}
                onClick={submitReview}
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;

import { Container, Row, Col, Button } from 'react-bootstrap';
import './ReviewsPage.css';
import { FiUser } from "react-icons/fi";
import React, { useState } from 'react';

const ReviewsPage = () => {
  const reviews = [
    { name: "محمد أحمد", city: "نابلس", rating: 5, date: "25 مارس 2026", text: "خدمة ممتازة وسريعة! وصل الطرد في نفس اليوم. أنصح بالتعامل مع شركة فينكس للجميع." },
    { name: "سارة خالد", city: "رام الله", rating: 5, date: "22 مارس 2026", text: "التعامل احترافي جداً والأسعار مناسبة. استخدمت الخدمة أكثر من مرة ودائماً راضية عن النتيجة." },
    { name: "أحمد حسن", city: "القدس", rating: 5, date: "20 مارس 2026", text: "أفضل شركة توصيل تعاملت معها. الطرد وصل بسرعة وبحالة ممتازة. شكراً لكم!" },
    { name: "ليلى محمود", city: "الخليل", rating: 4, date: "18 مارس 2026", text: "خدمة جيدة وموثوقة. التتبع اللحظي مفيد جداً لمعرفة موقع الطرد." },
    { name: "يوسف عمر", city: "جنين", rating: 5, date: "15 مارس 2026", text: "توصيل سريع لداخل المحتل. السعر معقول مقارنة بالشركات الأخرى والخدمة ممتازة." },
    { name: "نور عبدالله", city: "جنين", rating: 5, date: "12 مارس 2026", text: "شركة موثوقة ومحترفة. التزموا بالموعد وكان التواصل معهم سهل جداً." },
  ];
  const [hoverRating, setHoverRating] = useState(0);
  const features = [
    { icon: "🏆", title: "جودة عالية", text: "نلتزم بأعلى معايير الجودة" },
    { icon: "⚡", title: "توصيل سريع", text: "نوصل طرودكم في أقصر وقت" },
    { icon: "🤝", title: "خدمة موثوقة", text: "آلاف الزبائن يثقون بنا" },
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? "star-filled" : "star-empty"}>★</span>
    ));
  };
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);
  return (
    <div className="reviews-page-wrapper" dir="rtl">
      {/* Header Section */}
      <header className="reviews-header text-center">
        <Container>
          <h1 className="reviews-title">آراء الزبائن</h1>
          <p className="reviews-subtitle">ماذا يقول زبائننا عن خدماتنا</p>
        </Container>
      </header>

      <Container>
        {/* Statistics Card */}
        <section className="stats-section mb-5">
          <div className="stats-card shadow-sm text-center">
            <Row className="align-items-center">
              <Col md={4} className="reviews-stat-item">
                <div className="reviews-stat-number">4.8</div>
                <div className="stat-stars">{renderStars(5)}</div>
                <div className="reviews-stat-label">متوسط التقييم</div>
              </Col>
              <Col md={4} className="reviews-stat-item border-start-end">
                <div className="reviews-stat-number">6</div>
                <div className="reviews-stat-label">تقييم</div>
              </Col>
              <Col md={4} className="reviews-stat-item">
                <div className="reviews-stat-number">98%</div>
                <div className="reviews-stat-label">نسبة الرضا</div>
              </Col>
            </Row>
          </div>
        </section>

        {/* Reviews Grid */}
        <section className="reviews-grid mb-5">
          <Row className="g-4">
            {reviews.map((rev, idx) => (
              <Col key={idx} lg={4} md={6}>
                <div className="review-card h-100 shadow-sm">
                  <div className="review-header d-flex align-items-center mb-3">
                    <div className="user-avatar-circle">
                      <FiUser />
                    </div>
                    <div className="user-info">
                      <h6 className="customer-name">{rev.name}</h6>
                      <span className="customer-city">{rev.city}</span>
                      <div className="review-stars">{renderStars(rev.rating)}</div>
                    </div>
                  </div>


                  <p className="review-text">{rev.text}</p>
                  <div className="review-date text-muted">{rev.date}</div>
                </div>
              </Col>
            ))}
          </Row>
        </section>

        {/* CTA Section */}
        <section className="reviews-cta-section mb-5">
          <div className="reviews-cta-box text-center p-5 shadow">
            <h2 className="reviews-cta-title mb-3">شارك رأيك معنا!</h2>
            <p className="reviews-cta-subtitle mb-4">هل استخدمت خدماتنا؟ نحب أن نسمع رأيك وتجربتك معنا</p>
            <Button
              className="reviews-btn-leave rounded-pill px-5"
              onClick={() => setShowReviewModal(true)}
            >
              اترك تقييمك
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="reviews-features-section pb-5">
          <Row className="g-4">
            {features.map((feat, idx) => (
              <Col key={idx} md={4}>
                <div className="feature-small-card text-center shadow-sm p-4 h-100">
                  <div className="feat-icon mb-3">{feat.icon}</div>
                  <h5 className="feat-title">{feat.title}</h5>
                  <p className="feat-text text-muted mb-0">{feat.text}</p>
                </div>
              </Col>
            ))}
          </Row>
        </section>
      </Container>
      {showReviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal-box" dir="rtl">
            <button
              type="button"
              className="review-modal-close"
              onClick={() => {
                setShowReviewModal(false);
                setSelectedRating(0);
                setHoverRating(0);
                setReviewText("");
                setSuccessMessage(false);
              }}
            >
              ×
            </button>
            {successMessage && (
              <div className="success-box">
                ✅ تم إرسال تقييمك بنجاح
              </div>
            )}
            <h2 className="review-modal-title">اترك تقييمك</h2>
            <h4 className="review-modal-question">كيف كانت تجربتك معنا؟</h4>

            <div className="review-modal-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`modal-star ${star <= (hoverRating || selectedRating) ? "active" : ""
                    }`}
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="review-modal-label">اكتب رأيك هنا... (اختياري)</label>

            <textarea
              className="review-modal-textarea"
              placeholder="شاركنا تجربتك مع فينكس إكسبرس..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <div className="review-modal-actions">
              <button
                type="button"
                className="review-modal-cancel"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRating(0);
                  setReviewText("");
                }}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="review-modal-submit"
                disabled={selectedRating === 0}
                onClick={() => {
                  setSuccessMessage(true);

                  setTimeout(() => {
                    setShowReviewModal(false);
                    setSelectedRating(0);
                    setHoverRating(0);
                    setReviewText("");
                    setSuccessMessage(false);
                  }, 1800);
                }}
              >
                إرسال التقييم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;

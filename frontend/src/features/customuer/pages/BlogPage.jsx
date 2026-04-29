import React from "react";
import { Container, Row, Col, Badge, Button, Form } from "react-bootstrap";
import "./BlogPage.css";
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
const BlogPage = () => {
  const articles = [
    {
      category: "تقنية",
      title: "أهمية التتبع اللحظي للشحنات",
      description: "التتبع اللحظي أصبح ضرورة وليس رفاهية. تعرف على الفوائد التي يقدمها نظام التتبع لك ولعملائك...",
      date: "25 مارس 2026",
      readTime: "4 دقائق",
    },
    {
      category: "إرشادات",
      title: "التغليف الآمن: دليلك الشامل",
      description: "التغليف الجيد يحمي منتجاتك ويعكس احترافية مشروعك. إليك أفضل الطرق لتغليف منتجاتك قبل الشحن...",
      date: "22 مارس 2026",
      readTime: "6 دقائق",
    },
    {
      category: "قصص نجاح",
      title: "قصص نجاح: كيف ساعدنا المشاريع الصغيرة على النمو",
      description: "نشارككم قصص ملهمة لرواد أعمال فلسطينيين نجحوا في توسيع مشاريعهم بفضل خدمات التوصيل الموثوقة...",
      date: "20 مارس 2026",
      readTime: "7 دقائق",
    },
    {
      category: "خلف الكواليس",
      title: "التوصيل السريع: ما الذي يجعله ممكنًا؟",
      description: "خلف كل عملية توصيل سريعة منظومة متكاملة من التخطيط والتنسيق. تعرف على كيفية عملنا...",
      date: "18 مارس 2026",
      readTime: "5 دقائق",
    },
    {
      category: "نصائح",
      title: "الدفع عند الاستلام: مزايا وعيوب",
      description: "الدفع عند الاستلام هو الخيار المفضل للكثيرين. نستعرض إيجابياته وسلبياته وكيفية استخدامه بفعالية...",
      date: "15 مارس 2026",
      readTime: "4 دقائق",
    },
  ];

  const categories = ["نصائح", "تقنية", "إرشادات", "قصص نجاح", "خلف الكواليس", "أخبار"];

  return (
    <div className="blog-page-wrapper" dir="rtl">
      <header className="blog-header text-center">
        <Container>
          <h1 className="blog-main-title">المدونة</h1>
          <p className="blog-subtitle">مقالات ونصائح حول التوصيل والتجارة الإلكترونية</p>
        </Container>
      </header>

      <Container>
        <section className="featured-section">
          <div className="featured-card text-white">
            <Badge className="featured-badge">مقال مميز</Badge>

            <h2>كيف تختار شركة التوصيل المناسبة لمشروعك؟</h2>

            <p className="featured-desc">
              اختيار شركة التوصيل المناسبة هو قرار مهم لنجاح مشروعك. في هذا المقال نشارككم أهم المعايير التي يجب مراعاتها...
            </p>

            <div className="featured-meta">
              <span><FiCalendar /> 28 مارس 2026</span>
              <span><FiUser /> فريق فينيق</span>
              <span><FiClock /> 5 دقائق</span>
            </div>

            <Button className="btn-featured-more">
              اقرأ المزيد <span>←</span>
            </Button>
          </div>
        </section>

        <section className="articles-grid">
          <Row className="g-4 justify-content-start">
            {articles.map((article, index) => (
              <Col key={index} lg={4} md={6} xs={12}>
                <div className="blog-card h-100">
                  <div className="card-image-area">
                    <span className="emoji-icon">📝</span>
                  </div>

                  <div className="blog-card-body">
                    <Badge className="category-badge">{article.category}</Badge>

                    <h5>{article.title}</h5>

                    <p>{article.description}</p>

                    <div className="card-meta">
                      <span className="date-icon">
                        <FiCalendar /> {article.date}
                      </span>
                      <span className="read-time-icon">
                        <FiClock /> {article.readTime}
                      </span>
                    </div>

                    <Button className="btn-read-more">
                      اقرأ المقال <span>←</span>
                    </Button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </section>

        <section className="newsletter-section">
          <div className="newsletter-box">
            <h3>اشترك في نشرتنا البريدية</h3>
            <p>احصل على آخر المقالات والنصائح مباشرة في بريدك الإلكتروني</p>

            <Form className="newsletter-form">
              <Form.Control type="email" placeholder="بريدك الإلكتروني" />
              <Button className="btn-subscribe">اشترك</Button>
            </Form>
          </div>
        </section>

        <section className="category-section text-center">
          <h4>تصفح حسب الفئة</h4>

          <div className="category-list">
            {categories.map((cat, index) => (
              <Button key={index} className="category-pill">
                {cat}
              </Button>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
};

export default BlogPage;
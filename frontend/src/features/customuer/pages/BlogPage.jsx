import React from "react";
import { Container, Row, Col, Badge, Button, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import Swal from "sweetalert2";
import { subscribeToNewsletter } from "../../../services/newsletterService";
import API from "../../../apis/api";
import "./BlogPage.css";

const ALL_CATEGORY = "\u0627\u0644\u0643\u0644";
const ORIGINAL_ARTICLE_TITLES = [
  "\u0623\u0647\u0645\u064a\u0629 \u0627\u0644\u062a\u062a\u0628\u0639 \u0627\u0644\u0644\u062d\u0638\u064a \u0644\u0644\u0634\u062d\u0646\u0627\u062a",
  "\u0627\u0644\u062a\u063a\u0644\u064a\u0641 \u0627\u0644\u0622\u0645\u0646: \u062f\u0644\u064a\u0644 \u0633\u0631\u064a\u0639 \u0642\u0628\u0644 \u0627\u0644\u0634\u062d\u0646",
  "\u0643\u064a\u0641 \u064a\u0633\u0627\u0639\u062f \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0627\u0644\u0645\u0646\u0638\u0645 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0627\u0644\u0635\u063a\u064a\u0631\u0629",
  "\u0645\u0627 \u0627\u0644\u0630\u064a \u064a\u062c\u0639\u0644 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0627\u0644\u0633\u0631\u064a\u0639 \u0645\u0645\u0643\u0646\u0627\u064b\u061f",
  "\u0627\u0644\u062f\u0641\u0639 \u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645: \u0645\u062a\u0649 \u064a\u0643\u0648\u0646 \u0627\u0644\u062e\u064a\u0627\u0631 \u0627\u0644\u0623\u0641\u0636\u0644\u061f",
];

const articles = [
  {
    icon: "📍",
    category: "تقنية",
    title: "أهمية التتبع اللحظي للشحنات",
    description:
      "التتبع اللحظي أصبح جزءاً أساسياً من تجربة التوصيل الحديثة. تعرف على كيف يساعد العملاء والتجار على متابعة الطلبات بثقة ووضوح.",
    date: "25 مارس 2026",
    readTime: "4 دقائق",
    content: [
      {
        heading: "العميل لا ينتظر الطرد فقط",
        body:
          "في التجارة الإلكترونية، العميل ينتظر الاطمئنان أيضاً. عندما يستطيع معرفة حالة طلبه بوضوح، تقل الأسئلة والقلق وتصبح تجربة الشراء أكثر راحة.",
      },
      {
        heading: "التتبع يقلل ضغط خدمة العملاء",
        body:
          "كل تحديث واضح على الشحنة يعني رسالة أقل لفريق الدعم. بدل أن يسأل العميل أين وصل الطلب، يجد الإجابة أمامه مباشرة.",
      },
      {
        heading: "ثقة أكبر بين التاجر والعميل",
        body:
          "التاجر الذي يوفر تتبعاً منظماً يظهر بصورة أكثر احترافية. هذا لا يحسن تجربة الطلب الحالي فقط، بل يزيد فرصة عودة العميل للشراء مرة أخرى.",
      },
      {
        heading: "الخلاصة",
        body:
          "التتبع اللحظي ليس ميزة إضافية، بل جزء أساسي من جودة خدمة التوصيل، خصوصاً للمشاريع التي تريد بناء علاقة طويلة مع عملائها.",
      },
    ],
  },
  {
    icon: "📦",
    category: "إرشادات",
    title: "التغليف الآمن: دليل سريع قبل الشحن",
    description:
      "التغليف الجيد يحمي المنتجات ويقلل المرتجعات. هذه خطوات عملية تساعدك على تجهيز الطرود بطريقة أكثر أماناً واحترافية.",
    date: "22 مارس 2026",
    readTime: "6 دقائق",
    content: [
      {
        heading: "ابدأ من طبيعة المنتج",
        body:
          "المنتجات القابلة للكسر تحتاج طبقات حماية إضافية، بينما الملابس والإكسسوارات تحتاج تغليفاً يحافظ على الشكل والترتيب. لا يوجد تغليف واحد يناسب كل شيء.",
      },
      {
        heading: "املأ الفراغ داخل الطرد",
        body:
          "الفراغ الداخلي يسمح للمنتج بالحركة أثناء النقل. استخدم ورقاً أو مواد حماية خفيفة لتثبيت المنتج وتقليل احتمالية التلف.",
      },
      {
        heading: "اكتب البيانات بوضوح",
        body:
          "رقم الهاتف، اسم المستلم، المدينة، والعنوان يجب أن تكون واضحة. خطأ صغير في البيانات قد يؤخر الطلب أو يعيده للمرسل.",
      },
      {
        heading: "الخلاصة",
        body:
          "التغليف الجيد يحمي المنتج ويحمي سمعة المتجر. كل طرد يصل مرتباً هو رسالة صامتة تقول للعميل إنك تهتم بالتفاصيل.",
      },
    ],
  },
  {
    icon: "🚀",
    category: "قصص نجاح",
    title: "كيف يساعد التوصيل المنظم المشاريع الصغيرة",
    description:
      "خدمة التوصيل الموثوقة تمنح المتاجر الصغيرة فرصة للنمو والوصول إلى مدن جديدة دون تعقيد تشغيلي أو تكلفة عالية.",
    date: "20 مارس 2026",
    readTime: "7 دقائق",
    content: [
      {
        heading: "النمو يبدأ من القدرة على الوصول",
        body:
          "قد يملك المشروع منتجاً رائعاً، لكنه يحتاج طريقة مضمونة لإيصاله. التوصيل المنظم يفتح أبواب مدن ومناطق جديدة دون الحاجة لفرع جديد.",
      },
      {
        heading: "وقت صاحب المشروع أهم من المشاوير",
        body:
          "عندما يتولى شريك التوصيل عمليات الاستلام والتسليم والمتابعة، يستطيع صاحب المشروع التركيز على التسويق، تطوير المنتجات، وخدمة العملاء.",
      },
      {
        heading: "التجربة الجيدة تبيع مرة ثانية",
        body:
          "العميل قد يحب المنتج، لكن تجربة التوصيل السيئة قد تمنعه من العودة. لذلك، التوصيل جزء من المنتج وليس خطوة منفصلة عنه.",
      },
      {
        heading: "الخلاصة",
        body:
          "المشاريع الصغيرة لا تحتاج حلولاً معقدة، بل تحتاج شريكاً يعرف كيف يحول كل طلب إلى تجربة مريحة وواضحة.",
      },
    ],
  },
  {
    icon: "🛵",
    category: "خلف الكواليس",
    title: "ما الذي يجعل التوصيل السريع ممكناً؟",
    description:
      "خلف كل عملية توصيل ناجحة يوجد تخطيط، توزيع ذكي، وتواصل مستمر بين فريق العمليات والمندوبين والعملاء.",
    date: "18 مارس 2026",
    readTime: "5 دقائق",
    content: [
      {
        heading: "السرعة لا تعني العشوائية",
        body:
          "التوصيل السريع يبدأ قبل خروج المندوب. ترتيب الطلبات، تحديد المناطق، وتوزيع المسارات كلها خطوات تصنع الفرق بين السرعة والفوضى.",
      },
      {
        heading: "المندوب يحتاج معلومات دقيقة",
        body:
          "كلما كانت بيانات الطلب أوضح، كان التسليم أسرع. رقم هاتف صحيح، عنوان واضح، وملاحظات مختصرة تساعد المندوب على إنجاز المهمة من أول محاولة.",
      },
      {
        heading: "التواصل يحل نصف المشاكل",
        body:
          "تأخير بسيط مع تحديث واضح أفضل من صمت كامل. التواصل الجيد يحافظ على ثقة العميل حتى عندما تحدث ظروف خارجة عن السيطرة.",
      },
      {
        heading: "الخلاصة",
        body:
          "التوصيل السريع نتيجة نظام متكامل، وليس مجرد مندوب يتحرك بسرعة. النجاح الحقيقي يحدث عندما تعمل التفاصيل الصغيرة معاً.",
      },
    ],
  },
  {
    icon: "💳",
    category: "نصائح",
    title: "الدفع عند الاستلام: متى يكون الخيار الأفضل؟",
    description:
      "الدفع عند الاستلام مناسب لكثير من العملاء، لكنه يحتاج إلى متابعة مالية دقيقة وسياسات واضحة مع التجار والمندوبين.",
    date: "15 مارس 2026",
    readTime: "4 دقائق",
    content: [
      {
        heading: "لماذا يفضله العملاء؟",
        body:
          "كثير من العملاء يشعرون براحة أكبر عندما يدفعون بعد استلام الطلب. هذا الخيار يقلل التردد عند الشراء، خصوصاً من المتاجر الجديدة.",
      },
      {
        heading: "متى يصبح تحدياً؟",
        body:
          "الدفع عند الاستلام يحتاج متابعة دقيقة للمبالغ، الطلبات الراجعة، وحالات عدم الاستلام. بدون نظام واضح قد يصبح عبئاً مالياً وتشغيلياً.",
      },
      {
        heading: "كيف تستخدمه بذكاء؟",
        body:
          "حدد سياسات واضحة للتأكيد قبل الشحن، راقب الطلبات الراجعة، وتعامل مع شركة توصيل توفر سجلاً واضحاً للمبالغ والتحصيل.",
      },
      {
        heading: "الخلاصة",
        body:
          "الدفع عند الاستلام أداة قوية لزيادة المبيعات، لكنه يحتاج تنظيماً. عندما يكون التحصيل واضحاً، يصبح الخيار مفيداً للتاجر والعميل معاً.",
      },
    ],
  },
];

const categories = ["الكل", "نصائح", "تقنية", "إرشادات", "قصص نجاح", "خلف الكواليس", "أخبار"];
void categories;
const BlogPage = () => {
  const navigate = useNavigate();
  const articlesSectionRef = React.useRef(null);

  const [showFeaturedArticle, setShowFeaturedArticle] = React.useState(false);
  const [selectedArticle, setSelectedArticle] = React.useState(null);
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState(ALL_CATEGORY);
  const [cmsArticles, setCmsArticles] = React.useState([]);
  const visibleArticles = React.useMemo(
    () =>
      cmsArticles.length
        ? cmsArticles.filter((article) => ORIGINAL_ARTICLE_TITLES.includes(article.title))
        : articles,
    [cmsArticles]
  );
  const visibleCategories = React.useMemo(
    () => [
      ALL_CATEGORY,
      ...Array.from(new Set(visibleArticles.map((article) => article.category).filter(Boolean))),
    ],
    [visibleArticles]
  );
  const filteredArticles = activeCategory === ALL_CATEGORY
    ? visibleArticles
    : visibleArticles.filter((article) => article.category === activeCategory);

  React.useEffect(() => {
    if (!visibleCategories.includes(activeCategory)) {
      setActiveCategory(ALL_CATEGORY);
    }
  }, [activeCategory, visibleCategories]);

  React.useEffect(() => {
    API.get("/articles")
      .then((response) => {
        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        setCmsArticles(
          items.map((article) => ({
            icon: "📝",
            category: article.category || "أخبار",
            title: article.title,
            description: article.description || "",
            date: article.published_date
              ? new Date(article.published_date).toLocaleDateString("ar-PS")
              : "",
            readTime: "5 دقائق",
            content: (article.content || article.description || "")
              .split(/\n{2,}/)
              .map((section, index) => ({
                heading: index === 0 ? article.title : `فقرة ${index + 1}`,
                body: section.trim(),
              }))
              .filter((section) => section.body),
          }))
        );
      })
      .catch(() => {});
  }, []);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      Swal.fire({
        icon: "info",
        title: "تسجيل الدخول مطلوب",
        text: "سجّل دخولك أولاً حتى تتمكن من الاشتراك في نشرة فينوكس للتجار.",
        confirmButtonText: "تسجيل الدخول",
        showCancelButton: true,
        cancelButtonText: "لاحقاً",
        confirmButtonColor: "#38B6FF",
        customClass: {
          popup: "swal-rtl",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });

      return;
    }

    try {
      await subscribeToNewsletter(newsletterEmail);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذر الاشتراك",
        text: "راجعي البريد الإلكتروني وحاولي مرة أخرى.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38B6FF",
        customClass: {
          popup: "swal-rtl",
        },
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "تم الاشتراك بنجاح",
      text: "سنرسل لك نصائح شهرية عن تحسين التوصيل وتقليل المرتجعات وزيادة رضا العملاء.",
      confirmButtonText: "رائع",
      confirmButtonColor: "#38B6FF",
      customClass: {
        popup: "swal-rtl",
      },
    });

    setNewsletterEmail("");
  };
  return (
    <Container>


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
                اختيار شركة التوصيل المناسبة قرار مهم يؤثر على رضا العملاء وسمعة المتجر.
                في هذا المقال نستعرض أهم المعايير التي تساعدك على اختيار شريك توصيل موثوق.
              </p>

              <div className="featured-meta">
                <span><FiCalendar /> 28 مارس 2026</span>
                <span><FiUser /> فريق فينوكس</span>
                <span><FiClock /> 5 دقائق</span>
              </div>

              <Button
                className="btn-featured-more"
                type="button"
                onClick={() => setShowFeaturedArticle(true)}
              >
                اقرأ المزيد <span>←</span>
              </Button>
            </div>
          </section>

          <section className="articles-grid" ref={articlesSectionRef}>
          </section>
          <section className="articles-grid">
            <Row className="g-4 justify-content-start">
              {filteredArticles.map((article) => (
                <Col key={article.title} lg={4} md={6} xs={12}>
                  <article className="blog-card h-100">
                    <div className="card-image-area">
                      <span className="emoji-icon" aria-hidden="true">{article.icon}</span>
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

                      <Button
                        className="btn-read-more"
                        type="button"
                        onClick={() => setSelectedArticle(article)}
                      >
                        اقرأ المقال <span>←</span>
                      </Button>
                    </div>
                  </article>
                </Col>
              ))}
            </Row>
          </section>

          <section className="newsletter-section">
            <div className="newsletter-box">
              <Badge className="newsletter-badge">نشرة فينوكس للتجار</Badge>
              <h3>أفكار تساعد مشروعك يوصل أبعد</h3>
              <p>
                اشترك لتصلك نصائح شهرية عن التغليف، تقليل المرتجعات، تحسين تجربة
                العميل، وإدارة التوصيل بذكاء.
              </p>

              <Form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <Form.Control
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  required
                />
                <Button className="btn-subscribe" type="submit">اشترك</Button>
              </Form>

              <small className="newsletter-note">
                بدون إزعاج، فقط محتوى عملي ومفيد لأصحاب المشاريع.
              </small>
            </div>
          </section>

          <section className="category-section text-center">
            <h4>تصفح حسب الفئة</h4>

            <div className="category-list">
              {visibleCategories.map((category) => (
                <Button
                  key={category}
                  className={`category-pill ${activeCategory === category ? "active" : ""}`}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category);
                    articlesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </section>
        </Container>

        <Modal
          show={showFeaturedArticle}
          onHide={() => setShowFeaturedArticle(false)}
          centered
          size="lg"
          dir="rtl"
          contentClassName="blog-article-modal"
        >
          <Modal.Header closeButton className="blog-article-modal__header">
            <div>
              <Badge className="featured-badge blog-article-modal__badge">مقال مميز</Badge>
              <Modal.Title className="blog-article-modal__title">
                كيف تختار شركة التوصيل المناسبة لمشروعك؟
              </Modal.Title>
              <div className="blog-article-modal__meta">
                <span><FiCalendar /> 28 مارس 2026</span>
                <span><FiUser /> فريق فينوكس</span>
                <span><FiClock /> 5 دقائق</span>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="blog-article-modal__body">
            <p>
              اختيار شركة التوصيل المناسبة لا يعتمد فقط على السعر. الشريك الجيد
              يساعدك على حماية سمعة متجرك، تقليل الشكاوى، وتسليم الطلبات بطريقة
              تجعل العميل يثق بك ويرجع للشراء مرة أخرى.
            </p>

            <h4>1. سرعة التوصيل ووضوح المواعيد</h4>
            <p>
              اسأل عن متوسط وقت التسليم داخل المدن وبين المحافظات. الأهم من السرعة
              هو الالتزام بموعد واضح، لأن العميل يفضل معرفة وقت وصول طلبه بدل
              الانتظار بدون تحديثات.
            </p>

            <h4>2. التتبع والتواصل مع العميل</h4>
            <p>
              وجود رقم تتبع وتحديثات لحالة الشحنة يقلل الضغط على فريقك. عندما يعرف
              العميل أين وصل طلبه، تقل الرسائل والاستفسارات وتصبح التجربة أكثر
              احترافية.
            </p>

            <h4>3. التعامل مع المرتجعات والتحصيل</h4>
            <p>
              إذا كان متجرك يعتمد على الدفع عند الاستلام، تأكد من آلية تسليم
              المبالغ، مواعيد التحويل، وطريقة إدارة الطلبات الراجعة أو غير
              المستلمة.
            </p>

            <h4>4. تغطية المناطق</h4>
            <p>
              اختر شركة قادرة على تغطية المناطق التي يطلب منها عملاؤك فعلاً. لا
              تحتاج أوسع تغطية فقط، بل تحتاج تغطية مستقرة وسريعة في مناطق البيع
              الأساسية.
            </p>

            <h4>الخلاصة</h4>
            <p>
              شركة التوصيل ليست مجرد طرف ينقل الطرد، بل جزء من تجربة العميل مع
              علامتك التجارية. اختر شريكاً واضحاً في التواصل، ملتزماً بالمواعيد،
              وقادراً على إدارة الشحنات والمرتجعات والتحصيل بثقة.
            </p>
          </Modal.Body>
        </Modal>

        <Modal
          show={Boolean(selectedArticle)}
          onHide={() => setSelectedArticle(null)}
          centered
          size="lg"
          dir="rtl"
          contentClassName="blog-article-modal"
        >
          {selectedArticle && (
            <>
              <Modal.Header closeButton className="blog-article-modal__header">
                <div>
                  <Badge className="featured-badge blog-article-modal__badge">
                    {selectedArticle.category}
                  </Badge>
                  <Modal.Title className="blog-article-modal__title">
                    {selectedArticle.title}
                  </Modal.Title>
                  <div className="blog-article-modal__meta">
                    <span><FiCalendar /> {selectedArticle.date}</span>
                    <span><FiUser /> فريق فينوكس</span>
                    <span><FiClock /> {selectedArticle.readTime}</span>
                  </div>
                </div>
              </Modal.Header>

              <Modal.Body className="blog-article-modal__body">
                <p>{selectedArticle.description}</p>
                {(selectedArticle.content?.length
                  ? selectedArticle.content
                  : [{ heading: selectedArticle.title, body: selectedArticle.description }]
                ).map((section) => (
                  <React.Fragment key={section.heading}>
                    <h4>{section.heading}</h4>
                    <p>{section.body}</p>
                  </React.Fragment>
                ))}
              </Modal.Body>
            </>
          )}
        </Modal>
      </div>
    </Container>

  );
};


export default BlogPage;

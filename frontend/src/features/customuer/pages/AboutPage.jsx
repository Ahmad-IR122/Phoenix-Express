import React from "react";
import API from "../../../apis/api";
import "../../../styles/AboutPage.css";

export const defaultAboutContent = {
  title: "من نحن",
  subtitle:
    "نحن شركة فلسطينية رائدة في مجال خدمات توصيل الطرود، نعمل بروح طائر الفونيكس الذي يرمز للتجدد والانبعاث من جديد",
  storyTitle: "قصتنا",
  storyText:
    "بدأت رحلتنا من حلم بسيط: تقديم خدمة توصيل موثوقة وسريعة تدعم المشاريع الصغيرة والمتوسطة في فلسطين.\n\nاخترنا طائر الفونيكس رمزاً لشركتنا لأنه يمثل القوة والتجدد والقدرة على النهوض من جديد تماماً كما نساعد أصحاب المشاريع على النمو والازدهار. نحن نؤمن بأن كل طرد نوصله هو جزء من حلم رائد أعمال، وكل زبون نخدمه هو شريك في نجاحنا المشترك.",
  visionTitle: "رؤيتنا",
  visionText:
    "نطمح لأن نكون الخيار الأول لخدمات التوصيل في فلسطين، من خلال تقديم خدمة متميزة تجمع بين السرعة، الموثوقية، والأسعار المناسبة.\n\nنسعى لتمكين رواد الأعمال والمشاريع الصغيرة من الوصول إلى زبائنهم في كل مكان، وبناء جسر من الثقة بين البائع والمشتري.",
  valuesTitle: "قيمنا",
  values: [
    {
      title: "الموثوقية",
      text: "نلتزم بمواعيدنا ونحافظ على أماناتكم",
    },
    {
      title: "السرعة",
      text: "نوصل طرودكم في أسرع وقت ممكن",
    },
    {
      title: "الشفافية",
      text: "أسعار واضحة بدون أي رسوم خفية",
    },
    {
      title: "الدعم",
      text: "نساند المشاريع الصغيرة في رحلة نجاحها",
    },
  ],
  phoenixTitle: "لماذا طائر الفونيكس؟",
  phoenixText:
    "طائر الفونيكس هو رمز أسطوري للبعث والتجدد. ينهض من رماده أقوى وأجمل مما كان. اخترنا هذا الرمز لأننا نؤمن بقوة الشعب الفلسطيني وقدرته على الصمود والنهوض مهما كانت التحديات.\n\nكل مشروع صغير ندعمه، وكل رائد أعمال نخدمه، هو جزء من النهضة الاقتصادية التي نسعى لبنائها معاً. نحن لا نوصل طروداً فقط، بل نوصل الأمل والطموح والنجاح.",
  stats: [
    { number: "100%", label: "التزام بالجودة" },
    { number: "+500", label: "زبون راض" },
    { number: "+10,000", label: "طرد تم توصيله" },
  ],
};

const splitText = (text) =>
  String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const AboutPage = () => {
  const [content, setContent] = React.useState(defaultAboutContent);

  React.useEffect(() => {
    API.get("/site-content/about")
      .then((response) => {
        const savedContent = response.data?.data?.content;
        if (savedContent && typeof savedContent === "object") {
          setContent({
            ...defaultAboutContent,
            ...savedContent,
            values: savedContent.values?.length
              ? savedContent.values
              : defaultAboutContent.values,
            stats: savedContent.stats?.length
              ? savedContent.stats
              : defaultAboutContent.stats,
          });
        }
      })
      .catch(() => {
        setContent(defaultAboutContent);
      });
  }, []);

  return (
    <div className="about-page" dir="rtl">
      <main className="about-page__section py-5">
        <div className="container py-lg-5">
          <div className="row justify-content-center text-center">
            <div className="col-12 col-lg-10 col-xl-9">
              <h1 className="about-page__title fw-bold mb-3">{content.title}</h1>
              <p className="about-page__subtitle mb-0 mx-auto" style={{ fontSize: "18px" }}>
                {content.subtitle}
              </p>
            </div>
          </div>

          <div className="row justify-content-center mt-5">
            <div className="col-12 col-xl-10 m-4">
              <section className="about-page__story-card rounded-5 shadow-sm p-4 p-md-5">
                <h2 className="about-page__story-title fw-bold text-end mb-4">
                  {content.storyTitle}
                </h2>
                <div className="about-page__story-text text-end">
                  {splitText(content.storyText).map((paragraph) => (
                    <p key={paragraph} className="mb-4" style={{ fontSize: "18px" }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-10">
              <section className="about-page__story-card rounded-5 shadow-sm p-4 p-md-5">
                <h2 className="about-page__story-title fw-bold text-end mb-4">
                  {content.visionTitle}
                </h2>
                <div className="about-page__story-text text-end">
                  {splitText(content.visionText).map((paragraph) => (
                    <p key={paragraph} className="mb-4" style={{ fontSize: "18px" }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-10 mt-4">
              <section className="about-page__values-card rounded-5 shadow-sm p-4 p-md-5">
                <h2 className="about-page__story-title fw-bold text-end mb-4 mb-md-5">
                  {content.valuesTitle}
                </h2>
                <div className="row g-4 g-lg-5">
                  {content.values.map((value, index) => (
                    <div className="col-12 col-lg-6" key={`${value.title}-${index}`}>
                      <div className="about-page__value-item d-flex align-items-start gap-3 gap-md-4">
                        <span className="about-page__value-badge flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="about-page__value-copy flex-grow-1 text-end" style={{ fontSize: "18px" }}>
                          <h3 className="about-page__value-title fw-bold mb-2">
                            {value.title}
                          </h3>
                          <p className="about-page__value-text mb-0" style={{ fontSize: "18px" }}>
                            {value.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-10 mt-5">
              <section className="about-page__story-card rounded-5 shadow-sm p-4 p-md-5">
                <h2 className="about-page__story-title fw-bold text-end mb-4">
                  {content.phoenixTitle}
                </h2>
                <div className="about-page__story-text text-end">
                  {splitText(content.phoenixText).map((paragraph) => (
                    <p key={paragraph} className="mb-4" style={{ fontSize: "18px" }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-10 mt-5">
              <section className="about-page__stats-section">
                <div className="row g-4">
                  {content.stats.map((stat) => (
                    <div className="col-12 col-md-6 col-lg-4" key={stat.label}>
                      <article className="about-page__stat-card rounded-5 text-center p-4 p-md-5 h-100">
                        <div className="about-page__stat-number fw-bold mb-3">
                          {stat.number}
                        </div>
                        <p className="about-page__stat-label mb-0">{stat.label}</p>
                      </article>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;

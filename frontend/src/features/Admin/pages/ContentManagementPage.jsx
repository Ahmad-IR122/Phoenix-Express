import React from "react";
import API from "../../../apis/api";
import deliveryImg from "../../../Images/delivery.png";
import fleetImg from "../../../Images/fleet.png";
import customersImg from "../../../Images/customers.png";
import { defaultAboutContent } from "../../customuer/pages/AboutPage";
import "./ContentManagementPage.css";

const emptyArticle = {
  title: "",
  category: "",
  customCategory: "",
  description: "",
  content: "",
  published_date: "",
};

const defaultArticleCategories = [
  "\u0646\u0635\u0627\u0626\u062d",
  "\u062a\u0642\u0646\u064a\u0629",
  "\u0625\u0631\u0634\u0627\u062f\u0627\u062a",
  "\u0642\u0635\u0635 \u0646\u062c\u0627\u062d",
  "\u062e\u0644\u0641 \u0627\u0644\u0643\u0648\u0627\u0644\u064a\u0633",
  "\u0623\u062e\u0628\u0627\u0631",
];

const legacyArticleSeeds = [
  {
    title: "\u0623\u0647\u0645\u064a\u0629 \u0627\u0644\u062a\u062a\u0628\u0639 \u0627\u0644\u0644\u062d\u0638\u064a \u0644\u0644\u0634\u062d\u0646\u0627\u062a",
    category: "\u062a\u0642\u0646\u064a\u0629",
    description:
      "\u0627\u0644\u062a\u062a\u0628\u0639 \u0627\u0644\u0644\u062d\u0638\u064a \u0623\u0635\u0628\u062d \u062c\u0632\u0621\u0627\u064b \u0623\u0633\u0627\u0633\u064a\u0627\u064b \u0645\u0646 \u062a\u062c\u0631\u0628\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0627\u0644\u062d\u062f\u064a\u062b\u0629\u060c \u0644\u0623\u0646\u0647 \u064a\u0645\u0646\u062d \u0627\u0644\u0639\u0645\u064a\u0644 \u0648\u0627\u0644\u062a\u0627\u062c\u0631 \u0648\u0636\u0648\u062d\u0627\u064b \u0648\u062b\u0642\u0629 \u0623\u0643\u0628\u0631 \u062e\u0644\u0627\u0644 \u0631\u062d\u0644\u0629 \u0627\u0644\u0637\u0631\u062f.",
  },
  {
    title: "\u0627\u0644\u062a\u063a\u0644\u064a\u0641 \u0627\u0644\u0622\u0645\u0646: \u062f\u0644\u064a\u0644 \u0633\u0631\u064a\u0639 \u0642\u0628\u0644 \u0627\u0644\u0634\u062d\u0646",
    category: "\u0625\u0631\u0634\u0627\u062f\u0627\u062a",
    description:
      "\u0627\u0644\u062a\u063a\u0644\u064a\u0641 \u0627\u0644\u062c\u064a\u062f \u064a\u062d\u0645\u064a \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0648\u064a\u0642\u0644\u0644 \u0627\u0644\u0645\u0631\u062a\u062c\u0639\u0627\u062a. \u0627\u0644\u0645\u0642\u0627\u0644 \u064a\u0639\u0631\u0636 \u062e\u0637\u0648\u0627\u062a \u0639\u0645\u0644\u064a\u0629 \u0644\u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0637\u0631\u0648\u062f \u0628\u0634\u0643\u0644 \u0623\u0643\u062b\u0631 \u0623\u0645\u0627\u0646\u0627\u064b \u0648\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629.",
  },
  {
    title: "\u0643\u064a\u0641 \u064a\u0633\u0627\u0639\u062f \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0627\u0644\u0645\u0646\u0638\u0645 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0627\u0644\u0635\u063a\u064a\u0631\u0629",
    category: "\u0642\u0635\u0635 \u0646\u062c\u0627\u062d",
    description:
      "\u062e\u062f\u0645\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0627\u0644\u0645\u0648\u062b\u0648\u0642\u0629 \u062a\u0645\u0646\u062d \u0627\u0644\u0645\u062a\u0627\u062c\u0631 \u0627\u0644\u0635\u063a\u064a\u0631\u0629 \u0641\u0631\u0635\u0629 \u0644\u0644\u0646\u0645\u0648 \u0648\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0645\u062f\u0646 \u062c\u062f\u064a\u062f\u0629 \u062f\u0648\u0646 \u062a\u0639\u0642\u064a\u062f \u062a\u0634\u063a\u064a\u0644\u064a \u0639\u0627\u0644\u064a.",
  },
  {
    title: "\u0645\u0627 \u0627\u0644\u0630\u064a \u064a\u062c\u0639\u0644 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0627\u0644\u0633\u0631\u064a\u0639 \u0645\u0645\u0643\u0646\u0627\u064b\u061f",
    category: "\u062e\u0644\u0641 \u0627\u0644\u0643\u0648\u0627\u0644\u064a\u0633",
    description:
      "\u062e\u0644\u0641 \u0643\u0644 \u0639\u0645\u0644\u064a\u0629 \u062a\u0648\u0635\u064a\u0644 \u0646\u0627\u062c\u062d\u0629 \u064a\u0648\u062c\u062f \u062a\u062e\u0637\u064a\u0637\u060c \u062a\u0648\u0632\u064a\u0639 \u0630\u0643\u064a\u060c \u0648\u062a\u0648\u0627\u0635\u0644 \u0645\u0633\u062a\u0645\u0631 \u0628\u064a\u0646 \u0641\u0631\u064a\u0642 \u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u0645\u0646\u062f\u0648\u0628\u064a\u0646.",
  },
  {
    title: "\u0627\u0644\u062f\u0641\u0639 \u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645: \u0645\u062a\u0649 \u064a\u0643\u0648\u0646 \u0627\u0644\u062e\u064a\u0627\u0631 \u0627\u0644\u0623\u0641\u0636\u0644\u061f",
    category: "\u0646\u0635\u0627\u0626\u062d",
    description:
      "\u0627\u0644\u062f\u0641\u0639 \u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645 \u0645\u0646\u0627\u0633\u0628 \u0644\u0643\u062b\u064a\u0631 \u0645\u0646 \u0627\u0644\u0639\u0645\u0644\u0627\u0621\u060c \u0644\u0643\u0646\u0647 \u064a\u062d\u062a\u0627\u062c \u0645\u062a\u0627\u0628\u0639\u0629 \u0645\u0627\u0644\u064a\u0629 \u062f\u0642\u064a\u0642\u0629 \u0648\u0633\u064a\u0627\u0633\u0627\u062a \u0648\u0627\u0636\u062d\u0629.",
  },
];

const legacyArticleContents = [
  `العميل لا ينتظر الطرد فقط
في التجارة الإلكترونية، العميل ينتظر الاطمئنان أيضًا. عندما يستطيع معرفة حالة طلبه بوضوح، تقل الأسئلة والقلق وتصبح تجربة الشراء أكثر راحة.

التتبع يقلل ضغط خدمة العملاء
كل تحديث واضح على الشحنة يعني رسالة أقل لفريق الدعم. بدل أن يسأل العميل أين وصل الطلب، يجد الإجابة أمامه مباشرة.

ثقة أكبر بين التاجر والعميل
التاجر الذي يوفر تتبعًا منظمًا يظهر بصورة أكثر احترافية. هذا لا يحسن تجربة الطلب الحالي فقط، بل يزيد فرصة عودة العميل للشراء مرة أخرى.

الخلاصة
التتبع اللحظي ليس ميزة إضافية، بل جزء أساسي من جودة خدمة التوصيل، خصوصًا للمشاريع التي تريد بناء علاقة طويلة مع عملائها.`,
  `ابدأ من طبيعة المنتج
المنتجات القابلة للكسر تحتاج طبقات حماية إضافية، بينما الملابس والإكسسوارات تحتاج تغليفًا يحافظ على الشكل والترتيب. لا يوجد تغليف واحد يناسب كل شيء.

املأ الفراغ داخل الطرد
الفراغ الداخلي يسمح للمنتج بالحركة أثناء النقل. استخدم ورقًا أو مواد حماية خفيفة لتثبيت المنتج وتقليل احتمالية التلف.

اكتب البيانات بوضوح
رقم الهاتف، اسم المستلم، المدينة، والعنوان يجب أن تكون واضحة. خطأ صغير في البيانات قد يؤخر الطلب أو يعيده للمرسل.

الخلاصة
التغليف الجيد يحمي المنتج ويحمي سمعة المتجر. كل طرد يصل مرتبًا هو رسالة صامتة تقول للعميل إنك تهتم بالتفاصيل.`,
  `النمو يبدأ من القدرة على الوصول
قد يملك المشروع منتجًا رائعًا، لكنه يحتاج طريقة مضمونة لإيصاله. التوصيل المنظم يفتح أبواب مدن ومناطق جديدة دون الحاجة لفرع جديد.

وقت صاحب المشروع أهم من المشاوير
عندما يتولى شريك التوصيل عمليات الاستلام والتسليم والمتابعة، يستطيع صاحب المشروع التركيز على التسويق، تطوير المنتجات، وخدمة العملاء.

التجربة الجيدة تبيع مرة ثانية
العميل قد يحب المنتج، لكن تجربة التوصيل السيئة قد تمنعه من العودة. لذلك، التوصيل جزء من المنتج وليس خطوة منفصلة عنه.

الخلاصة
المشاريع الصغيرة لا تحتاج حلولًا معقدة، بل تحتاج شريكًا يعرف كيف يحول كل طلب إلى تجربة مريحة وواضحة.`,
  `السرعة لا تعني العشوائية
التوصيل السريع يبدأ قبل خروج المندوب. ترتيب الطلبات، تحديد المناطق، وتوزيع المسارات كلها خطوات تصنع الفرق بين السرعة والفوضى.

المندوب يحتاج معلومات دقيقة
كلما كانت بيانات الطلب أوضح، كان التسليم أسرع. رقم هاتف صحيح، عنوان واضح، وملاحظات مختصرة تساعد المندوب على إنجاز المهمة من أول محاولة.

التواصل يحل نصف المشاكل
تأخير بسيط مع تحديث واضح أفضل من صمت كامل. التواصل الجيد يحافظ على ثقة العميل حتى عندما تحدث ظروف خارجة عن السيطرة.

الخلاصة
التوصيل السريع نتيجة نظام متكامل، وليس مجرد مندوب يتحرك بسرعة. النجاح الحقيقي يحدث عندما تعمل التفاصيل الصغيرة معًا.`,
  `لماذا يفضله العملاء؟
كثير من العملاء يشعرون براحة أكبر عندما يدفعون بعد استلام الطلب. هذا الخيار يقلل التردد عند الشراء، خصوصًا من المتاجر الجديدة.

متى يصبح تحديًا؟
الدفع عند الاستلام يحتاج متابعة دقيقة للمبالغ، الطلبات الراجعة، وحالات عدم الاستلام. بدون نظام واضح قد يصبح عبئًا ماليًا وتشغيليًا.

كيف تستخدمه بذكاء؟
حدد سياسات واضحة للتأكيد قبل الشحن، راقب الطلبات الراجعة، وتعامل مع شركة توصيل توفر سجلًا واضحًا للمبالغ والتحصيل.

الخلاصة
الدفع عند الاستلام أداة قوية لزيادة المبيعات، لكنه يحتاج تنظيمًا. عندما يكون التحصيل واضحًا، يصبح الخيار مفيدًا للتاجر والعميل معًا.`,
];

const legacyArticlesWithContent = legacyArticleSeeds.map((article, index) => ({
  ...article,
  content: legacyArticleContents[index] || article.description,
}));

const emptyPhoto = {
  name: "",
  image_url: "",
  description: "",
  display_order: 0,
  is_visible: true,
};

const legacyPhotoSeeds = [
  {
    name: "\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629",
    description: "\u0646\u0648\u0635\u0644 \u0637\u0631\u0648\u062f\u0643\u0645 \u0628\u0623\u0645\u0627\u0646 \u0648\u0633\u0631\u0639\u0629",
    image_url: deliveryImg,
  },
  {
    name: "\u0623\u0633\u0637\u0648\u0644 \u0645\u062a\u0643\u0627\u0645\u0644",
    description: "\u0646\u0645\u062a\u0644\u0643 \u0623\u0633\u0637\u0648\u0644\u0627\u064b \u062d\u062f\u064a\u062b\u0627\u064b \u0645\u0646 \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a",
    image_url: fleetImg,
  },
  {
    name: "\u0639\u0645\u0644\u0627\u0621 \u0633\u0639\u062f\u0627\u0621",
    description: "\u0631\u0636\u0627 \u0639\u0645\u0644\u0627\u0626\u0646\u0627 \u0647\u0648 \u0647\u062f\u0641\u0646\u0627 \u0627\u0644\u0623\u0648\u0644",
    image_url: customersImg,
  },
];

const tabs = [
  { key: "about", label: "من نحن" },
  { key: "articles", label: "المدونة" },
  { key: "gallery", label: "معرض الصور" },
  { key: "reviews", label: "آراء الزبائن" },
];

const formatDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = React.useState("articles");
  const [articles, setArticles] = React.useState([]);
  const [photos, setPhotos] = React.useState([]);
  const [reviews, setReviews] = React.useState([]);
  const [aboutForm, setAboutForm] = React.useState(defaultAboutContent);
  const [articleForm, setArticleForm] = React.useState(emptyArticle);
  const [photoForm, setPhotoForm] = React.useState(emptyPhoto);
  const [editingArticleId, setEditingArticleId] = React.useState(null);
  const [editingPhotoId, setEditingPhotoId] = React.useState(null);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const articleCategories = React.useMemo(() => {
    const cmsCategories = articles
      .map((article) => article.category)
      .filter(Boolean);

    return Array.from(new Set([...defaultArticleCategories, ...cmsCategories]));
  }, [articles]);
  const legacyArticlesToImport = React.useMemo(
    () =>
      legacyArticlesWithContent.filter(
        (legacyArticle) =>
          !articles.some((article) => article.title === legacyArticle.title)
      ),
    [articles]
  );
  const legacyPhotosToImport = React.useMemo(
    () =>
      legacyPhotoSeeds.filter(
        (legacyPhoto) =>
          !photos.some((photo) => photo.name === legacyPhoto.name)
      ),
    [photos]
  );

  const showMessage = (text) => {
    setMessage(text);
    setError("");
    window.setTimeout(() => setMessage(""), 2500);
  };

  const showError = (text) => {
    setError(text);
    setMessage("");
  };

  const loadContent = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [articlesResponse, photosResponse, reviewsResponse, aboutResponse] = await Promise.all([
        API.get("/articles"),
        API.get("/photogalleries?includeHidden=true"),
        API.get("/feedbacks"),
        API.get("/site-content/about"),
      ]);

      const loadedArticles = Array.isArray(articlesResponse.data?.data)
        ? articlesResponse.data.data
        : [];
      setArticles(loadedArticles);
      setPhotos(Array.isArray(photosResponse.data?.data) ? photosResponse.data.data : []);
      setReviews(Array.isArray(reviewsResponse.data?.data) ? reviewsResponse.data.data : []);
      if (aboutResponse.data?.data?.content) {
        setAboutForm({
          ...defaultAboutContent,
          ...aboutResponse.data.data.content,
          values: aboutResponse.data.data.content.values?.length
            ? aboutResponse.data.data.content.values
            : defaultAboutContent.values,
          stats: aboutResponse.data.data.content.stats?.length
            ? aboutResponse.data.data.content.stats
            : defaultAboutContent.stats,
        });
      }
    } catch (requestError) {
      showError(
        requestError.response?.data?.message ||
          "تعذر تحميل محتوى الموقع حالياً. تأكد من تشغيل الخادم."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleArticleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...articleForm,
      category:
        articleForm.category === "__new__"
          ? articleForm.customCategory.trim()
          : articleForm.category,
      content: articleForm.content.trim() || articleForm.description,
      published_date: articleForm.published_date || new Date().toISOString(),
    };

    delete payload.customCategory;

    if (!payload.category) {
      showError("اختاري نوع المقال أو اكتبي نوعاً جديداً.");
      return;
    }

    try {
      if (editingArticleId) {
        await API.put(`/articles/${editingArticleId}`, payload);
        showMessage("تم تعديل المقال بنجاح.");
      } else {
        await API.post("/articles", payload);
        showMessage("تمت إضافة المقال بنجاح.");
      }

      setArticleForm(emptyArticle);
      setEditingArticleId(null);
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر حفظ المقال.");
    }
  };

  const handleAboutSubmit = async (event) => {
    event.preventDefault();

    try {
      await API.put("/site-content/about", { content: aboutForm });
      showMessage("تم حفظ محتوى صفحة من نحن بنجاح.");
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر حفظ صفحة من نحن.");
    }
  };

  const updateAboutField = (field, value) => {
    setAboutForm((current) => ({ ...current, [field]: value }));
  };

  const updateAboutValue = (index, field, value) => {
    setAboutForm((current) => ({
      ...current,
      values: current.values.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateAboutStat = (index, field, value) => {
    setAboutForm((current) => ({
      ...current,
      stats: current.stats.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleEditArticle = (article) => {
    if (article.isLegacy) {
      setEditingArticleId(null);
      setArticleForm({
        title: article.title || "",
        category: article.category || "",
        customCategory: "",
        description: article.description || "",
        content: article.content || article.description || "",
        published_date: formatDateInput(article.published_date),
      });
      showMessage("تم نسخ المقال القديم للنموذج. احفظيه ليصبح مقالة في قاعدة البيانات.");
      setActiveTab("articles");
      return;
    }

    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title || "",
      category: article.category || "",
      customCategory: "",
      description: article.description || "",
      content: article.content || article.description || "",
      published_date: formatDateInput(article.published_date),
    });
    setActiveTab("articles");
  };

  const handleDeleteArticle = async (articleId) => {
    if (String(articleId).startsWith("legacy-")) {
      setArticles((current) => current.filter((article) => article.id !== articleId));
      showMessage("تم حذف المقال من العرض الحالي.");
      return;
    }

    try {
      await API.delete(`/articles/${articleId}`);
      showMessage("تم حذف المقال بنجاح.");
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر حذف المقال.");
    }
  };

  const importLegacyArticles = async () => {
    try {
      for (const article of legacyArticlesToImport) {
        await API.post("/articles", {
          ...article,
          content: article.content || article.description,
          published_date: new Date().toISOString(),
        });
      }

      showMessage("تم استيراد المقالات القديمة إلى قاعدة البيانات.");
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر استيراد المقالات القديمة.");
    }
  };

  const importLegacyArticle = async (article) => {
    try {
      await API.post("/articles", {
        ...article,
        content: article.content || article.description,
        published_date: new Date().toISOString(),
      });

      showMessage("تمت إضافة المقال القديم إلى قاعدة البيانات.");
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر استيراد المقال القديم.");
    }
  };

  const handlePhotoSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...photoForm,
      display_order: Number(photoForm.display_order) || photos.length + 1,
    };

    if (!payload.image_url) {
      showError("يرجى اختيار صورة من الجهاز قبل الحفظ.");
      return;
    }

    try {
      if (editingPhotoId) {
        await API.put(`/photogalleries/${editingPhotoId}`, payload);
        showMessage("تم تعديل الصورة بنجاح.");
      } else {
        await API.post("/photogalleries", payload);
        showMessage("تمت إضافة الصورة بنجاح.");
      }

      setPhotoForm(emptyPhoto);
      setEditingPhotoId(null);
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر حفظ الصورة.");
    }
  };

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("يرجى اختيار ملف صورة فقط.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoForm((current) => ({
        ...current,
        image_url: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const importLegacyPhoto = async (photo) => {
    try {
      await API.post("/photogalleries", {
        ...photo,
        display_order: photos.length + 1,
        is_visible: true,
      });

      showMessage("تمت إضافة الصورة القديمة إلى قاعدة البيانات.");
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر استيراد الصورة القديمة.");
    }
  };

  const importLegacyPhotos = async () => {
    try {
      for (const [index, photo] of legacyPhotosToImport.entries()) {
        await API.post("/photogalleries", {
          ...photo,
          display_order: photos.length + index + 1,
          is_visible: true,
        });
      }

      showMessage("تم استيراد الصور القديمة إلى قاعدة البيانات.");
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر استيراد الصور القديمة.");
    }
  };

  const handleEditPhoto = (photo) => {
    setEditingPhotoId(photo.id);
    setPhotoForm({
      name: photo.name || "",
      image_url: photo.image_url || "",
      description: photo.description || "",
      display_order: photo.display_order || 0,
      is_visible: photo.is_visible !== false,
    });
    setActiveTab("gallery");
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await API.delete(`/photogalleries/${photoId}`);
      showMessage("تم حذف الصورة بنجاح.");
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر حذف الصورة.");
    }
  };

  const toggleReviewVisibility = async (review) => {
    try {
      await API.put(`/feedbacks/${review.id}`, {
        customer_id: review.customer_id,
        rating: review.rating,
        comment: review.comment,
        customer_location: review.customer_location,
        is_visible: !review.is_visible,
      });
      showMessage(review.is_visible ? "تم إخفاء الرأي." : "تم إظهار الرأي.");
      await loadContent();
    } catch (requestError) {
      showError(requestError.response?.data?.message || "تعذر تحديث حالة الرأي.");
    }
  };

  return (
    <main className="admin-content-page" dir="rtl">
      <section className="admin-content-hero">
        <span>CMS</span>
        <h1>إدارة محتوى الموقع</h1>
        <p>تحكم سريع بالمحتوى الذي يظهر للزبائن في المدونة، معرض الصور، وآراء الزبائن.</p>
      </section>

      <div className="admin-content-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? "is-active" : ""}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message ? <p className="admin-content-alert success">{message}</p> : null}
      {error ? <p className="admin-content-alert error">{error}</p> : null}

      {isLoading ? (
        <section className="admin-content-panel">جاري تحميل المحتوى...</section>
      ) : null}

      {!isLoading && activeTab === "about" ? (
        <section className="admin-content-panel">
          <form className="admin-content-form" onSubmit={handleAboutSubmit}>
            <h2>تعديل صفحة من نحن</h2>
            <p className="admin-content-note">
              المفتاح ثابت: <strong>about</strong>. عدلي المحتوى فقط، وإذا لم تحفظي أي تعديل ستبقى الصفحة بالنص الأصلي.
            </p>
            <input
              value={aboutForm.title}
              onChange={(event) => updateAboutField("title", event.target.value)}
              placeholder="عنوان الصفحة"
              required
            />
            <textarea
              rows="3"
              value={aboutForm.subtitle}
              onChange={(event) => updateAboutField("subtitle", event.target.value)}
              placeholder="النص التعريفي أعلى الصفحة"
            />
            <input
              value={aboutForm.storyTitle}
              onChange={(event) => updateAboutField("storyTitle", event.target.value)}
              placeholder="عنوان القصة"
            />
            <textarea
              rows="6"
              value={aboutForm.storyText}
              onChange={(event) => updateAboutField("storyText", event.target.value)}
              placeholder="نص القصة"
            />
            <input
              value={aboutForm.visionTitle}
              onChange={(event) => updateAboutField("visionTitle", event.target.value)}
              placeholder="عنوان الرؤية"
            />
            <textarea
              rows="5"
              value={aboutForm.visionText}
              onChange={(event) => updateAboutField("visionText", event.target.value)}
              placeholder="نص الرؤية"
            />
            <input
              value={aboutForm.valuesTitle}
              onChange={(event) => updateAboutField("valuesTitle", event.target.value)}
              placeholder="عنوان القيم"
            />
            <div className="admin-content-nested-list">
              {aboutForm.values.map((value, index) => (
                <div className="admin-content-nested-item" key={`value-${index}`}>
                  <input
                    value={value.title}
                    onChange={(event) => updateAboutValue(index, "title", event.target.value)}
                    placeholder={`عنوان القيمة ${index + 1}`}
                  />
                  <textarea
                    rows="2"
                    value={value.text}
                    onChange={(event) => updateAboutValue(index, "text", event.target.value)}
                    placeholder={`نص القيمة ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <input
              value={aboutForm.phoenixTitle}
              onChange={(event) => updateAboutField("phoenixTitle", event.target.value)}
              placeholder="عنوان فقرة الفونيكس"
            />
            <textarea
              rows="6"
              value={aboutForm.phoenixText}
              onChange={(event) => updateAboutField("phoenixText", event.target.value)}
              placeholder="نص فقرة الفونيكس"
            />
            <div className="admin-content-nested-list">
              {aboutForm.stats.map((stat, index) => (
                <div className="admin-content-nested-item" key={`stat-${index}`}>
                  <input
                    value={stat.number}
                    onChange={(event) => updateAboutStat(index, "number", event.target.value)}
                    placeholder={`رقم الإحصائية ${index + 1}`}
                  />
                  <input
                    value={stat.label}
                    onChange={(event) => updateAboutStat(index, "label", event.target.value)}
                    placeholder={`عنوان الإحصائية ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <div className="admin-content-actions">
              <button type="submit">حفظ صفحة من نحن</button>
              <button
                type="button"
                className="ghost"
                onClick={() => setAboutForm(defaultAboutContent)}
              >
                استرجاع النص الأصلي
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!isLoading && activeTab === "articles" ? (
        <section className="admin-content-panel">
          <form className="admin-content-form" onSubmit={handleArticleSubmit}>
            <h2>{editingArticleId ? "تعديل مقال" : "إضافة مقال جديد"}</h2>
            <input
              value={articleForm.title}
              onChange={(event) => setArticleForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="عنوان المقال"
              required
            />
            <input type="hidden" value={articleForm.category} required />
            <div className="admin-content-category-picker" aria-label="اختيار نوع المقال">
              {articleCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={articleForm.category === category ? "is-selected" : ""}
                  onClick={() =>
                    setArticleForm((current) => ({
                      ...current,
                      category,
                      customCategory: "",
                    }))
                  }
                >
                  {category}
                </button>
              ))}
              <button
                type="button"
                className={articleForm.category === "__new__" ? "is-selected" : ""}
                onClick={() =>
                  setArticleForm((current) => ({
                    ...current,
                    category: "__new__",
                  }))
                }
              >
                نوع جديد...
              </button>
            </div>
            {articleForm.category === "__new__" ? (
              <input
                value={articleForm.customCategory}
                onChange={(event) =>
                  setArticleForm((current) => ({
                    ...current,
                    customCategory: event.target.value,
                  }))
                }
                placeholder="اكتبي النوع الجديد"
                required
              />
            ) : null}
            <input
              type="date"
              value={articleForm.published_date}
              onChange={(event) =>
                setArticleForm((current) => ({ ...current, published_date: event.target.value }))
              }
            />
            <textarea
              rows="5"
              value={articleForm.description}
              onChange={(event) =>
                setArticleForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="محتوى المقال أو ملخصه"
            />
            <textarea
              rows="8"
              value={articleForm.content}
              onChange={(event) =>
                setArticleForm((current) => ({ ...current, content: event.target.value }))
              }
              placeholder="محتوى المقال الكامل الذي يظهر عند الضغط على اقرأ المقال"
            />
            <div className="admin-content-actions">
              <button type="submit">{editingArticleId ? "حفظ التعديل" : "إضافة المقال"}</button>
              {legacyArticlesToImport.length ? (
                <button type="button" className="ghost" onClick={importLegacyArticles}>
                  استيراد المقالات القديمة
                </button>
              ) : null}
              {editingArticleId ? (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setEditingArticleId(null);
                    setArticleForm(emptyArticle);
                  }}
                >
                  إلغاء
                </button>
              ) : null}
            </div>
          </form>

          <div className="admin-content-list">
            {articles.map((article) => (
              <article key={article.id} className="admin-content-item">
                <div>
                  <strong>{article.title}</strong>
                  <span>{article.category || "بدون فئة"}</span>
                  {article.isLegacy ? <em>مقال قديم غير محفوظ في قاعدة البيانات</em> : null}
                  <p>{article.description || "لا يوجد وصف."}</p>
                </div>
                <div className="admin-content-item-actions">
                  <button type="button" onClick={() => handleEditArticle(article)}>تعديل</button>
                  <button type="button" className="danger" onClick={() => handleDeleteArticle(article.id)}>حذف</button>
                </div>
              </article>
            ))}
          </div>

          {legacyArticlesToImport.length ? (
            <section className="admin-content-legacy">
              <div className="admin-content-legacy__header">
                <h3>المقالات القديمة الجاهزة للإضافة</h3>
                <p>اختاري أي مقال لإضافته إلى قاعدة البيانات، وبعدها سيظهر مباشرة في المدونة.</p>
              </div>
              <div className="admin-content-list">
                {legacyArticlesToImport.map((article) => (
                  <article key={article.title} className="admin-content-item admin-content-item--legacy">
                    <div>
                      <strong>{article.title}</strong>
                      <span>{article.category}</span>
                      <p>{article.description}</p>
                    </div>
                    <div className="admin-content-item-actions">
                      <button type="button" onClick={() => importLegacyArticle(article)}>
                        إضافة للداتا بيس
                      </button>
                      <button type="button" className="ghost" onClick={() => handleEditArticle({ ...article, isLegacy: true })}>
                        تعديل قبل الإضافة
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      {!isLoading && activeTab === "gallery" ? (
        <section className="admin-content-panel">
          <form className="admin-content-form" onSubmit={handlePhotoSubmit}>
            <h2>{editingPhotoId ? "تعديل صورة" : "إضافة صورة"}</h2>
            <input
              value={photoForm.name}
              onChange={(event) => setPhotoForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="عنوان الصورة"
              required
            />
            <label className="admin-content-upload-box">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoFileChange}
              />
              <span>اختيار صورة من الجهاز</span>
              <small>يفتح مجلدات الجهاز لاختيار صورة المعرض</small>
            </label>
            {photoForm.image_url ? (
              <div className="admin-content-photo-preview">
                <img src={photoForm.image_url} alt="معاينة الصورة" />
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    setPhotoForm((current) => ({ ...current, image_url: "" }))
                  }
                >
                  إزالة الصورة
                </button>
              </div>
            ) : null}
            <input
              type="number"
              min="0"
              value={photoForm.display_order}
              onChange={(event) =>
                setPhotoForm((current) => ({
                  ...current,
                  display_order: event.target.value,
                }))
              }
              placeholder="ترتيب الصورة"
              required
            />
            <textarea
              rows="3"
              value={photoForm.description}
              onChange={(event) =>
                setPhotoForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="وصف الصورة"
            />
            <label className="admin-content-check">
              <input
                type="checkbox"
                checked={photoForm.is_visible}
                onChange={(event) =>
                  setPhotoForm((current) => ({ ...current, is_visible: event.target.checked }))
                }
              />
              إظهار الصورة في الموقع
            </label>
            <div className="admin-content-actions">
              <button type="submit">{editingPhotoId ? "حفظ التعديل" : "إضافة الصورة"}</button>
              {legacyPhotosToImport.length ? (
                <button type="button" className="ghost" onClick={importLegacyPhotos}>
                  استيراد الصور القديمة
                </button>
              ) : null}
              {editingPhotoId ? (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setEditingPhotoId(null);
                    setPhotoForm(emptyPhoto);
                  }}
                >
                  إلغاء
                </button>
              ) : null}
            </div>
          </form>

          <div className="admin-content-gallery">
            {photos.map((photo) => (
              <article key={photo.id} className="admin-content-photo">
                <img src={photo.image_url} alt={photo.name} />
                <strong>{photo.name}</strong>
                <span>{photo.is_visible ? "ظاهرة" : "مخفية"}</span>
                <p>{photo.description || "بدون وصف"}</p>
                <div className="admin-content-item-actions">
                  <button type="button" onClick={() => handleEditPhoto(photo)}>تعديل</button>
                  <button type="button" className="danger" onClick={() => handleDeletePhoto(photo.id)}>حذف</button>
                </div>
              </article>
            ))}
          </div>

          {legacyPhotosToImport.length ? (
            <section className="admin-content-legacy">
              <div className="admin-content-legacy__header">
                <h3>الصور القديمة الجاهزة للإضافة</h3>
                <p>أضيفي الصور القديمة إلى قاعدة البيانات لتظهر ضمن ترتيب المعرض.</p>
              </div>
              <div className="admin-content-gallery">
                {legacyPhotosToImport.map((photo) => (
                  <article key={photo.name} className="admin-content-photo">
                    <img src={photo.image_url} alt={photo.name} />
                    <strong>{photo.name}</strong>
                    <p>{photo.description}</p>
                    <div className="admin-content-item-actions">
                      <button type="button" onClick={() => importLegacyPhoto(photo)}>
                        إضافة للداتا بيس
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      {!isLoading && activeTab === "reviews" ? (
        <section className="admin-content-panel">
          <div className="admin-content-list">
            {reviews.map((review) => (
              <article key={review.id} className="admin-content-item">
                <div>
                  <strong>{review.customer?.individual_profile?.full_name || review.customer?.company_profile?.company_name || "عميل فينوكس"}</strong>
                  <span>{review.rating} / 5 - {review.is_visible ? "ظاهر" : "مخفي"}</span>
                  <p>{review.comment || "بدون تعليق"}</p>
                </div>
                <div className="admin-content-item-actions">
                  <button type="button" onClick={() => toggleReviewVisibility(review)}>
                    {review.is_visible ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

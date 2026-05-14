import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  getEmployeeNewsletter,
  getEmployeeNewsletterSendStatus,
  sendEmployeeNewsletter,
} from "../../../services/newsletterService";
import "./NewsletterPage.css";

const formatDate = (value) => {
  if (!value) return "لم يتم الإرسال بعد";

  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
};

const defaultBody =
  "مرحباً،\n\nنشارككم في نشرة فينوكس لهذا الشهر مجموعة نصائح عملية لتحسين تجربة التوصيل، تقليل المرتجعات، وتجهيز الطرود بطريقة أكثر احترافية.\n\nفريق فينوكس إكسبرس";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isFinalSendStatus = (status) =>
  ["completed", "partial", "failed"].includes(status);

const NewsletterPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    subject: "نشرة فينوكس الشهرية",
    body: defaultBody,
  });

  const deliverableSubscribersCount = status?.deliverableSubscribersCount ?? subscribers.length;
  const skippedSubscribersCount = status?.skippedSubscribersCount ?? 0;

  const loadNewsletter = async () => {
    setIsLoading(true);

    try {
      const response = await getEmployeeNewsletter();
      const data = response.data || {};
      setSubscribers(data.subscribers || []);
      setStatus(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذر تحميل النشرة",
        text: "حاولي تحديث الصفحة أو التأكد من تشغيل الخادم.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38B6FF",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNewsletter();
  }, []);

  const reminderText = useMemo(() => {
    if (!status?.lastSentAt) {
      return "لم يتم إرسال أي نشرة بعد. يفضل إرسال أول نشرة للمشتركين.";
    }

    if (status.isSendDue) {
      return `مر أكثر من شهر على آخر إرسال. آخر نشرة كانت بتاريخ ${formatDate(status.lastSentAt)}.`;
    }

    return `آخر إرسال كان بتاريخ ${formatDate(status.lastSentAt)}. موعد التذكير القادم: ${formatDate(status.nextDueAt)}.`;
  }, [status]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const waitForSendJob = async (jobId) => {
    let job = null;

    do {
      await wait(1500);
      const response = await getEmployeeNewsletterSendStatus(jobId);
      job = response.data;

      Swal.update({
        title: "جاري إرسال النشرة",
        html: `تم إرسال ${job.sentCount || 0} من ${job.totalCount || deliverableSubscribersCount} بريد. الفاشل: ${job.failedCount || 0}`,
      });
    } while (job && !isFinalSendStatus(job.status));

    return job;
  };

  const handleSend = async (event) => {
    event.preventDefault();

    if (!form.subject.trim() || !form.body.trim()) {
      Swal.fire({
        icon: "warning",
        title: "بيانات النشرة غير مكتملة",
        text: "يرجى تعبئة عنوان النشرة ومحتواها قبل الإرسال.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38B6FF",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "إرسال النشرة",
      text: `سيتم إرسال النشرة إلى ${deliverableSubscribersCount} بريد قابل للإرسال. سيتم تجاهل ${skippedSubscribersCount} عنوان اختبار أو غير صالح. هل تريد المتابعة؟`,
      confirmButtonText: "إرسال",
      cancelButtonText: "إلغاء",
      showCancelButton: true,
      confirmButtonColor: "#38B6FF",
    });

    if (!result.isConfirmed) return;

    setIsSending(true);

    try {
      const response = await sendEmployeeNewsletter(form);
      const jobId = response.data?.id;

      if (!jobId) {
        throw new Error("لم يتم إنشاء متابعة للإرسال.");
      }

      Swal.fire({
        title: "جاري إرسال النشرة",
        html: `بدأ الإرسال إلى ${response.data?.totalCount || deliverableSubscribersCount} بريد...`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const sendJob = await waitForSendJob(jobId);
      await loadNewsletter();

      if (sendJob.status === "failed") {
        throw new Error(sendJob.error || "تعذر إرسال النشرة.");
      }

      Swal.fire({
        icon: "success",
        title: sendJob.status === "partial" ? "تم الإرسال مع بعض الإخفاقات" : "تم إرسال النشرة",
        text: `تم إرسالها إلى ${sendJob.sentCount || 0} مشترك. الفاشل: ${sendJob.failedCount || 0}.`,
        confirmButtonText: "تمام",
        confirmButtonColor: "#38B6FF",
      });
      return;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذر إرسال النشرة",
        text: error.response?.data?.message || error.message || "تأكدي من إعدادات البريد والمحاولة مرة أخرى.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38B6FF",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="employee-newsletter-page" dir="rtl">
      <section className="employee-newsletter-page__hero">
        <div>
          <span className="employee-newsletter-page__eyebrow">النشرة البريدية</span>
          <h1>إدارة نشرة فينوكس الشهرية</h1>
          <p>تابعي المشتركين، اكتبي محتوى النشرة، وأرسليها لجميع العناوين المسجلة من المدونة.</p>
        </div>
        <div className="employee-newsletter-page__hero-stat">
          <strong>{subscribers.length}</strong>
          <span>مشترك نشط</span>
        </div>
      </section>

      {skippedSubscribersCount > 0 && (
        <section className="employee-newsletter-page__reminder employee-newsletter-page__reminder--due">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          <div>
            <h2>تنبيه على عناوين النشرة</h2>
            <p>
              يوجد {skippedSubscribersCount} عنوان اختبار أو غير صالح لن يتم الإرسال إليه. الإرسال الفعلي سيكون إلى {deliverableSubscribersCount} بريد.
            </p>
          </div>
        </section>
      )}

      <section
        className={`employee-newsletter-page__reminder ${
          status?.isSendDue ? "employee-newsletter-page__reminder--due" : ""
        }`}
      >
        <i className="bi bi-bell" aria-hidden="true" />
        <div>
          <h2>تذكير الإرسال الشهري</h2>
          <p>{isLoading ? "جاري تحميل حالة النشرة..." : reminderText}</p>
        </div>
      </section>

      <div className="employee-newsletter-page__grid">
        <section className="employee-newsletter-page__card">
          <div className="employee-newsletter-page__card-header">
            <h2>إرسال نشرة جديدة</h2>
            <span>{formatDate(new Date())}</span>
          </div>

          <form className="employee-newsletter-page__form" onSubmit={handleSend}>
            <label>
              عنوان النشرة
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="مثال: نشرة فينوكس الشهرية"
              />
            </label>

            <label>
              محتوى الرسالة
              <textarea
                name="body"
                value={form.body}
                onChange={handleChange}
                rows={10}
                placeholder="اكتبي محتوى النشرة هنا..."
              />
            </label>

            <button type="submit" disabled={isSending || isLoading || deliverableSubscribersCount === 0}>
              {isSending ? "جاري الإرسال..." : "إرسال لجميع المشتركين"}
            </button>
          </form>
        </section>

        <section className="employee-newsletter-page__card">
          <div className="employee-newsletter-page__card-header">
            <h2>قائمة المشتركين</h2>
            <span>{subscribers.length} بريد</span>
          </div>

          <div className="employee-newsletter-page__subscribers">
            {isLoading ? (
              <p className="employee-newsletter-page__empty">جاري تحميل المشتركين...</p>
            ) : subscribers.length ? (
              subscribers.map((subscriber) => (
                <article key={subscriber.id} className="employee-newsletter-page__subscriber">
                  <div>
                    <strong>{subscriber.email}</strong>
                    <span>اشترك بتاريخ {formatDate(subscriber.subscribed_at || subscriber.subscribedAt)}</span>
                  </div>
                  <i className="bi bi-envelope-check" aria-hidden="true" />
                </article>
              ))
            ) : (
              <p className="employee-newsletter-page__empty">لا يوجد مشتركون حتى الآن.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default NewsletterPage;

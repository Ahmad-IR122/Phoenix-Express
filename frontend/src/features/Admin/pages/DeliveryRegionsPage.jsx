import { useEffect, useMemo, useState } from "react";
import { getAdminRegions, updateAdminRegionPrice } from "../services/regionService";
import "./DeliveryRegionsPage.css";

const formatCurrency = (value) =>
  `${new Intl.NumberFormat("ar").format(Number(value) || 0)} ₪`;

function DeliveryRegionsPage() {
  const [regions, setRegions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingRegionId, setSavingRegionId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    let isMounted = true;

    const loadRegions = async () => {
      try {
        setIsLoading(true);
        setFeedback({ type: "", message: "" });
        const response = await getAdminRegions();
        const items = Array.isArray(response?.data) ? response.data : [];

        if (!isMounted) return;

        setRegions(items);
        setDrafts(
          items.reduce((accumulator, item) => {
            accumulator[item.id] = String(Number(item.price) || 0);
            return accumulator;
          }, {})
        );
      } catch (requestError) {
        if (!isMounted) return;
        setFeedback({
          type: "error",
          message:
            requestError?.response?.data?.message || "تعذر تحميل أسعار المناطق حاليًا.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRegions();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalRegions = regions.length;
    const averagePrice =
      totalRegions > 0
        ? regions.reduce((sum, region) => sum + (Number(region.price) || 0), 0) / totalRegions
        : 0;
    const highestPrice = regions.reduce(
      (max, region) => Math.max(max, Number(region.price) || 0),
      0
    );

    return { totalRegions, averagePrice, highestPrice };
  }, [regions]);

  const handleDraftChange = (regionId, value) => {
    setDrafts((current) => ({
      ...current,
      [regionId]: value,
    }));
  };

  const handleSave = async (regionId) => {
    const rawValue = drafts[regionId];
    const nextPrice = Number(rawValue);

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      setFeedback({
        type: "error",
        message: "الرجاء إدخال سعر عمولة صالح أكبر من أو يساوي صفر.",
      });
      return;
    }

    try {
      setSavingRegionId(regionId);
      setFeedback({ type: "", message: "" });
      const response = await updateAdminRegionPrice(regionId, { price: nextPrice });
      const updatedRegion = response?.data;

      setRegions((current) =>
        current.map((region) => (region.id === regionId ? { ...region, ...updatedRegion } : region))
      );
      setDrafts((current) => ({
        ...current,
        [regionId]: String(Number(updatedRegion?.price) || 0),
      }));
      setFeedback({
        type: "success",
        message: "تم تحديث سعر المنطقة بنجاح.",
      });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message:
          requestError?.response?.data?.message || "تعذر حفظ سعر المنطقة حاليًا.",
      });
    } finally {
      setSavingRegionId(null);
    }
  };

  return (
    <section dir="rtl" className="phoenix-regions">
      <div className="phoenix-regions__hero">
        <div className="phoenix-regions__hero-copy">
          <span className="phoenix-regions__eyebrow">Phoenix Admin</span>
          <h1 className="phoenix-regions__title">إدارة أسعار مناطق التوصيل</h1>
          <p className="phoenix-regions__subtitle">
            عدّل عمولة التوصيل لمناطق الضفة الغربية والقدس والداخل من مكان واحد.
          </p>
        </div>
      </div>

      <div className="phoenix-regions__summary-grid">
        <article className="phoenix-regions__summary-card">
          <div className="phoenix-regions__summary-icon phoenix-regions__summary-icon--blue">
            <i className="bi bi-geo-alt-fill"></i>
          </div>
          <div className="phoenix-regions__summary-content">
            <span className="phoenix-regions__summary-value">{summary.totalRegions}</span>
            <span className="phoenix-regions__summary-label">عدد المناطق</span>
          </div>
        </article>

        <article className="phoenix-regions__summary-card">
          <div className="phoenix-regions__summary-icon phoenix-regions__summary-icon--gold">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="phoenix-regions__summary-content">
            <span className="phoenix-regions__summary-value">
              {formatCurrency(summary.averagePrice)}
            </span>
            <span className="phoenix-regions__summary-label">متوسط العمولة</span>
          </div>
        </article>

        <article className="phoenix-regions__summary-card">
          <div className="phoenix-regions__summary-icon phoenix-regions__summary-icon--orange">
            <i className="bi bi-graph-up-arrow"></i>
          </div>
          <div className="phoenix-regions__summary-content">
            <span className="phoenix-regions__summary-value">
              {formatCurrency(summary.highestPrice)}
            </span>
            <span className="phoenix-regions__summary-label">أعلى عمولة</span>
          </div>
        </article>
      </div>

      <article className="phoenix-regions__panel">
        <div className="phoenix-regions__panel-head">
          <div>
            <h2 className="phoenix-regions__panel-title">جدول الأسعار</h2>
            <p className="phoenix-regions__panel-subtitle">
              كل تعديل ينعكس على رسوم التوصيل المستخدمة في الطلبات الجديدة.
            </p>
          </div>
        </div>

        {feedback.message ? (
          <div
            className={`phoenix-regions__feedback ${
              feedback.type === "error" ? "phoenix-regions__feedback--error" : ""
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="phoenix-regions__cards">
          {isLoading ? (
            <div className="phoenix-regions__empty">جاري تحميل المناطق...</div>
          ) : regions.length === 0 ? (
            <div className="phoenix-regions__empty">لا توجد مناطق مسجلة حاليًا.</div>
          ) : (
            regions.map((region) => (
              <article key={region.id} className="phoenix-regions__region-card">
                <div className="phoenix-regions__region-head">
                  <div>
                    <h3 className="phoenix-regions__region-title">{region.label}</h3>
                    <p className="phoenix-regions__region-key">{region.name}</p>
                  </div>
                  <span className="phoenix-regions__region-badge">
                    الحالي: {formatCurrency(region.price)}
                  </span>
                </div>

                <label className="phoenix-regions__field">
                  <span>سعر العمولة</span>
                  <div className="phoenix-regions__input-wrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={drafts[region.id] ?? ""}
                      onChange={(event) => handleDraftChange(region.id, event.target.value)}
                    />
                    <span>₪</span>
                  </div>
                </label>

                <button
                  type="button"
                  className="phoenix-regions__save-btn"
                  onClick={() => handleSave(region.id)}
                  disabled={savingRegionId === region.id}
                >
                  {savingRegionId === region.id ? "جاري الحفظ..." : "حفظ التعديل"}
                </button>
              </article>
            ))
          )}
        </div>
      </article>
    </section>
  );
}

export default DeliveryRegionsPage;

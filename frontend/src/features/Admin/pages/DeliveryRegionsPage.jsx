import { useEffect, useMemo, useState } from "react";
import {
  createAdminRegion,
  getAdminRegions,
  toggleAdminRegionStatus,
  updateAdminRegionPrice,
} from "../services/regionService";
import "./DeliveryRegionsPage.css";

const TEXT = {
  title: "إدارة المناطق",
  subtitle: "عدّل العمولة، أضف منطقة جديدة، وفعّل أو عطّل المناطق من نفس الصفحة.",
  totalRegions: "عدد المناطق",
  averageFee: "متوسط العمولة",
  highestFee: "أعلى عمولة",
  addRegion: "إضافة منطقة جديدة",
  addRegionSubtitle: "أدخل اسم المنطقة وسعر العمولة فقط.",
  regionName: "اسم المنطقة",
  regionNamePlaceholder: "مثال: رام الله - الطيرة",
  feePrice: "سعر العمولة",
  adding: "جاري الإضافة...",
  addButton: "إضافة المنطقة",
  pricesTable: "جدول المناطق",
  pricesSubtitle: "يمكنك تحديث السعر أو تعطيل المنطقة من نفس البطاقة.",
  loading: "جاري تحميل المناطق...",
  noRegions: "لا توجد مناطق مسجلة حاليًا.",
  active: "مفعلة",
  inactive: "معطلة",
  saving: "جاري الحفظ...",
  save: "حفظ التعديل",
  toggling: "جاري التحديث...",
  disable: "تعطيل",
  enable: "تفعيل",
  currentPrice: "السعر الحالي",
  loadError: "تعذر تحميل أسعار المناطق حاليًا.",
  invalidPrice: "الرجاء إدخال سعر عمولة صالح أكبر من أو يساوي صفر.",
  saveSuccess: "تم تحديث سعر المنطقة بنجاح.",
  saveError: "تعذر حفظ سعر المنطقة حاليًا.",
  regionRequired: "اسم المنطقة مطلوب.",
  regionTextOnly: "اسم المنطقة يجب ألا يكون أرقامًا فقط.",
  startPriceRequired: "الرجاء إدخال سعر بداية صحيح.",
  createSuccess: "تمت إضافة المنطقة بنجاح.",
  createError: "تعذر إضافة المنطقة حاليًا.",
  enableSuccess: "تم تفعيل المنطقة بنجاح.",
  disableSuccess: "تم تعطيل المنطقة بنجاح.",
  toggleError: "تعذر تحديث حالة المنطقة حاليًا.",
  unsupportedCreate: "إضافة منطقة جديدة غير مدعومة من الخادم حاليًا.",
  unsupportedToggle: "تعطيل أو تفعيل المنطقة غير مدعوم من الخادم حاليًا.",
};

const formatCurrency = (value) =>
  `${new Intl.NumberFormat("ar").format(Number(value) || 0)} \u20aa`;

const emptyRegionForm = {
  label: "",
  price: "",
};

function normalizeRegion(item) {
  return {
    ...item,
    id: item?.id,
    name: item?.name || item?.slug || "-",
    label: item?.label || item?.name || item?.slug || "-",
    price: Number(item?.price) || 0,
    isActive: Boolean(item?.is_active ?? item?.isActive ?? true),
  };
}

function isEndpointMissing(error) {
  return error?.response?.status === 404;
}

function isNumericOnlyLabel(value) {
  return /^\d+$/.test(String(value || "").replace(/[\s_-]+/g, ""));
}

function DeliveryRegionsPage() {
  const [regions, setRegions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [newRegion, setNewRegion] = useState(emptyRegionForm);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRegionId, setSavingRegionId] = useState(null);
  const [togglingRegionId, setTogglingRegionId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    let isMounted = true;

    const loadRegions = async () => {
      try {
        setIsLoading(true);
        setFeedback({ type: "", message: "" });
        const response = await getAdminRegions();
        const items = Array.isArray(response?.data) ? response.data.map(normalizeRegion) : [];

        if (!isMounted) return;

        setRegions(items);
        setDrafts(
          items.reduce((accumulator, item) => {
            accumulator[item.id] = String(item.price);
            return accumulator;
          }, {}),
        );
      } catch (requestError) {
        if (!isMounted) return;

        setFeedback({
          type: "error",
          message: requestError?.response?.data?.message || TEXT.loadError,
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
      0,
    );

    return { totalRegions, averagePrice, highestPrice };
  }, [regions]);

  const handleDraftChange = (regionId, value) => {
    setDrafts((current) => ({
      ...current,
      [regionId]: value,
    }));
  };

  const handleNewRegionChange = (key, value) => {
    setNewRegion((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async (regionId) => {
    const nextPrice = Number(drafts[regionId]);

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      setFeedback({
        type: "error",
        message: TEXT.invalidPrice,
      });
      return;
    }

    try {
      setSavingRegionId(regionId);
      setFeedback({ type: "", message: "" });

      const response = await updateAdminRegionPrice(regionId, { price: nextPrice });
      const updated = normalizeRegion(response?.data || response || {});

      setRegions((current) =>
        current.map((region) =>
          region.id === regionId ? { ...region, ...updated, price: nextPrice } : region,
        ),
      );
      setDrafts((current) => ({
        ...current,
        [regionId]: String(nextPrice),
      }));
      setFeedback({
        type: "success",
        message: TEXT.saveSuccess,
      });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message: requestError?.response?.data?.message || TEXT.saveError,
      });
    } finally {
      setSavingRegionId(null);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const payload = {
      label: newRegion.label.trim(),
      price: Number(newRegion.price),
    };

    if (!payload.label) {
      setFeedback({
        type: "error",
        message: TEXT.regionRequired,
      });
      return;
    }

    if (isNumericOnlyLabel(payload.label)) {
      setFeedback({
        type: "error",
        message: TEXT.regionTextOnly,
      });
      return;
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setFeedback({
        type: "error",
        message: TEXT.startPriceRequired,
      });
      return;
    }

    try {
      setIsCreating(true);
      setFeedback({ type: "", message: "" });

      const response = await createAdminRegion(payload);
      const created = normalizeRegion(response?.data || response || payload);

      if (created.id) {
        setRegions((current) => [created, ...current]);
        setDrafts((current) => ({
          ...current,
          [created.id]: String(created.price),
        }));
      }

      setNewRegion(emptyRegionForm);
      setFeedback({
        type: "success",
        message: TEXT.createSuccess,
      });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message: isEndpointMissing(requestError)
          ? TEXT.unsupportedCreate
          : requestError?.response?.data?.message || TEXT.createError,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (region) => {
    try {
      setTogglingRegionId(region.id);
      setFeedback({ type: "", message: "" });

      const response = await toggleAdminRegionStatus(region.id, !region.isActive);
      const updated = normalizeRegion(response?.data || { ...region, isActive: !region.isActive });

      setRegions((current) =>
        current.map((item) => (item.id === region.id ? { ...item, ...updated } : item)),
      );
      setFeedback({
        type: "success",
        message: updated.isActive ? TEXT.enableSuccess : TEXT.disableSuccess,
      });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message: isEndpointMissing(requestError)
          ? TEXT.unsupportedToggle
          : requestError?.response?.data?.message || TEXT.toggleError,
      });
    } finally {
      setTogglingRegionId(null);
    }
  };

  return (
    <section dir="rtl" className="phoenix-regions">
      <div className="phoenix-regions__hero">
        <div className="phoenix-regions__hero-copy">
          <span className="phoenix-regions__eyebrow">Phoenix Admin</span>
          <h1 className="phoenix-regions__title">{TEXT.title}</h1>
          <p className="phoenix-regions__subtitle">{TEXT.subtitle}</p>
        </div>
      </div>

      <div className="phoenix-regions__summary-grid">
        <article className="phoenix-regions__summary-card">
          <div className="phoenix-regions__summary-icon phoenix-regions__summary-icon--blue">
            <i className="bi bi-geo-alt-fill"></i>
          </div>
          <div className="phoenix-regions__summary-content">
            <span className="phoenix-regions__summary-value">{summary.totalRegions}</span>
            <span className="phoenix-regions__summary-label">{TEXT.totalRegions}</span>
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
            <span className="phoenix-regions__summary-label">{TEXT.averageFee}</span>
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
            <span className="phoenix-regions__summary-label">{TEXT.highestFee}</span>
          </div>
        </article>
      </div>

      <article className="phoenix-regions__panel phoenix-regions__panel--form">
        <div className="phoenix-regions__panel-head">
          <div>
            <h2 className="phoenix-regions__panel-title">{TEXT.addRegion}</h2>
            <p className="phoenix-regions__panel-subtitle">{TEXT.addRegionSubtitle}</p>
          </div>
        </div>

        <form className="phoenix-regions__create-form" onSubmit={handleCreate}>
          <label className="phoenix-regions__field">
            <span>{TEXT.regionName}</span>
            <input
              type="text"
              value={newRegion.label}
              onChange={(event) => handleNewRegionChange("label", event.target.value)}
              placeholder={TEXT.regionNamePlaceholder}
            />
          </label>

          <label className="phoenix-regions__field">
            <span>{TEXT.feePrice}</span>
            <div className="phoenix-regions__input-wrap">
              <input
                type="number"
                min="0"
                step="0.01"
                value={newRegion.price}
                onChange={(event) => handleNewRegionChange("price", event.target.value)}
                placeholder="0"
              />
              <span>{"\u20aa"}</span>
            </div>
          </label>

          <button type="submit" className="phoenix-regions__save-btn" disabled={isCreating}>
            {isCreating ? TEXT.adding : TEXT.addButton}
          </button>
        </form>
      </article>

      <article className="phoenix-regions__panel">
        <div className="phoenix-regions__panel-head">
          <div>
            <h2 className="phoenix-regions__panel-title">{TEXT.pricesTable}</h2>
            <p className="phoenix-regions__panel-subtitle">{TEXT.pricesSubtitle}</p>
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
            <div className="phoenix-regions__empty">{TEXT.loading}</div>
          ) : regions.length === 0 ? (
            <div className="phoenix-regions__empty">{TEXT.noRegions}</div>
          ) : (
            regions.map((region) => (
              <article
                key={region.id}
                className={`phoenix-regions__region-card ${
                  region.isActive ? "" : "phoenix-regions__region-card--disabled"
                }`}
              >
                <div className="phoenix-regions__region-head">
                  <div>
                    <h3 className="phoenix-regions__region-title">{region.label}</h3>
                  </div>
                  <span className="phoenix-regions__region-badge">
                    {region.isActive ? TEXT.active : TEXT.inactive}
                  </span>
                </div>

                <label className="phoenix-regions__field">
                  <span>{TEXT.feePrice}</span>
                  <div className="phoenix-regions__input-wrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={drafts[region.id] ?? ""}
                      onChange={(event) => handleDraftChange(region.id, event.target.value)}
                    />
                    <span>{"\u20aa"}</span>
                  </div>
                </label>

                <div className="phoenix-regions__actions">
                  <button
                    type="button"
                    className="phoenix-regions__save-btn"
                    onClick={() => handleSave(region.id)}
                    disabled={savingRegionId === region.id}
                  >
                    {savingRegionId === region.id ? TEXT.saving : TEXT.save}
                  </button>

                  <button
                    type="button"
                    className="phoenix-regions__toggle-btn"
                    onClick={() => handleToggle(region)}
                    disabled={togglingRegionId === region.id}
                  >
                    {togglingRegionId === region.id
                      ? TEXT.toggling
                      : region.isActive
                        ? TEXT.disable
                        : TEXT.enable}
                  </button>
                </div>

                <p className="phoenix-regions__region-key">
                  {TEXT.currentPrice}: {formatCurrency(region.price)}
                </p>
              </article>
            ))
          )}
        </div>
      </article>
    </section>
  );
}

export default DeliveryRegionsPage;

import React, { useEffect, useMemo, useState } from "react";
import API from "../../../apis/api";
import { markMerchantSettlementSent, settleMerchant } from "../services/adminService";
import "./MerchantsPage.css";

const STATUS_LABELS = {
  settled: "تمت التسوية",
  requested: "تم إرسال الطلب للتاجر",
  pending: "بانتظار التسوية",
  inactive: "غير نشط",
};

const STATUS_CLASS = {
  settled: "phoenix-merchants__badge--active",
  requested: "phoenix-merchants__badge--pending",
  pending: "phoenix-merchants__badge--pending",
  inactive: "phoenix-merchants__badge--inactive",
};

const FILTER_OPTIONS = [
  { key: "all", label: "الكل" },
  { key: "settled", label: "تمت التسوية" },
  { key: "requested", label: "تم إرسال الطلب" },
  { key: "pending", label: "بانتظار التسوية" },
  { key: "inactive", label: "غير نشط" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "نقداً" },
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "ewallet", label: "محفظة إلكترونية" },
];

const formatCurrency = (value) =>
  `${new Intl.NumberFormat("ar").format(Number(value) || 0)} ₪`;

const normalizeMerchant = (merchant) => ({
  id: merchant.id,
  name: merchant.merchant_name || "-",
  phone: merchant.phone || "-",
  email: merchant.email || "-",
  location: merchant.location || "-",
  totalOrders: Number(merchant.total_parcels) || 0,
  deliveredOrders: Number(merchant.delivered_count) || 0,
  processingOrders: Number(merchant.pending_count) || 0,
  cancelledOrders: Number(merchant.returned_count) || 0,
  totalCollected: Number(merchant.total_collected) || 0,
  phoenixCommission: Number(merchant.phoenix_commission) || 0,
  merchantDue: Number(merchant.merchant_due) || 0,
  totalSettledAmount: Number(merchant.total_settled_amount) || 0,
  pendingSettlementAmount: Number(merchant.pending_settlement_amount) || 0,
  outstandingRevenue:
    Number(merchant.remaining_settlement_amount ?? merchant.outstanding_revenue) || 0,
  availableSettlementRequestAmount:
    Number(
      merchant.available_settlement_request_amount ??
        merchant.remaining_settlement_amount ??
        merchant.outstanding_revenue
    ) || 0,
  status: merchant.settlement_status || "inactive",
  statusLabel:
    merchant.settlement_status_label ||
    STATUS_LABELS[merchant.settlement_status] ||
    "غير نشط",
  settlements: Array.isArray(merchant.settlements)
    ? merchant.settlements.map((settlement) => ({
        ...settlement,
        amount: Number(settlement.amount) || 0,
        bank_name: settlement.bank_name || "",
        bank_account_holder: settlement.bank_account_holder || "",
        bank_account_number: settlement.bank_account_number || "",
        bank_iban: settlement.bank_iban || "",
      }))
    : [],
});

function MerchantsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [markingSettlementId, setMarkingSettlementId] = useState(null);
  const [error, setError] = useState("");
  const [settlementFeedback, setSettlementFeedback] = useState({ message: "", type: "" });
  const [settlementForm, setSettlementForm] = useState({
    amount: "",
    notes: "",
    paymentMethod: "cash",
  });

  const loadMerchants = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await API.get("/admin/merchants");
      const items = Array.isArray(response?.data?.data) ? response.data.data : [];
      setMerchants(items.map(normalizeMerchant));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "تعذر تحميل بيانات التجار حالياً.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMerchantDetails = async (merchantId, merchantSummary) => {
    setIsLoadingDetails(true);
    setSettlementFeedback({ message: "", type: "" });

    try {
      const response = await API.get(`/admin/merchants/${merchantId}`);
      const data = response?.data?.data;
      const normalizedMerchant = normalizeMerchant({
        ...(merchantSummary || {}),
        ...(data || {}),
      });

      setSelectedMerchant(normalizedMerchant);
      setSettlementForm({
        amount:
          normalizedMerchant.availableSettlementRequestAmount > 0
            ? String(normalizedMerchant.availableSettlementRequestAmount)
            : "",
        notes: "",
        paymentMethod: "cash",
      });
    } catch (requestError) {
      setSelectedMerchant({
        ...merchantSummary,
        settlements: [],
        detailsError: requestError?.response?.data?.message || "تعذر تحميل تفاصيل التاجر.",
      });
      setSettlementForm({
        amount:
          merchantSummary?.availableSettlementRequestAmount > 0
            ? String(merchantSummary.availableSettlementRequestAmount)
            : "",
        notes: "",
        paymentMethod: "cash",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const summary = useMemo(() => {
    const totalRevenue = merchants.reduce(
      (sum, item) => sum + Math.max(item.totalCollected - item.totalSettledAmount, 0),
      0
    );
    const pendingSettlements = merchants.reduce(
      (sum, item) => sum + Math.max(item.merchantDue - item.totalSettledAmount, 0),
      0
    );
    const phoenixCommission = Math.max(totalRevenue - pendingSettlements, 0);
    const totalMerchants = merchants.length;
    const totalParcels = merchants.reduce((sum, item) => sum + item.totalOrders, 0);
    const pendingSettlement = merchants.filter((item) =>
      ["pending", "requested"].includes(item.status)
    ).length;

    return {
      totalRevenue,
      phoenixCommission,
      pendingSettlements,
      totalMerchants,
      totalParcels,
      pendingSettlement,
    };
  }, [merchants]);

  const filteredMerchants = useMemo(() => {
    return merchants.filter((merchant) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        merchant.name.toLowerCase().includes(searchLower) ||
        merchant.phone.toLowerCase().includes(searchLower) ||
        merchant.email.toLowerCase().includes(searchLower);

      const matchesFilter = activeFilter === "all" || merchant.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, merchants]);

  const handleOpenModal = async (merchant) => {
    setIsModalOpen(true);
    setSelectedMerchant(merchant);
    await loadMerchantDetails(merchant.id, merchant);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMerchant(null);
    setSettlementFeedback({ message: "", type: "" });
  };

  const handleSettlementSubmit = async (event) => {
    event.preventDefault();
    if (!selectedMerchant) return;

    try {
      setIsSettling(true);
      setSettlementFeedback({ message: "", type: "" });

      const payload = {
        amount: settlementForm.amount ? Number(settlementForm.amount) : undefined,
        notes: settlementForm.notes.trim(),
        payment_method: settlementForm.paymentMethod,
      };

      const response = await settleMerchant(selectedMerchant.id, payload);
      const updatedMerchant = normalizeMerchant(response?.data?.merchant || selectedMerchant);

      setSettlementFeedback({
        message: response?.message || "تم تسجيل طلب التسوية بانتظار موافقة التاجر.",
        type: "success",
      });

      setMerchants((current) =>
        current.map((merchant) => (merchant.id === updatedMerchant.id ? updatedMerchant : merchant))
      );

      await loadMerchants();
      await loadMerchantDetails(updatedMerchant.id, updatedMerchant);
    } catch (requestError) {
      setSettlementFeedback({
        message: requestError?.response?.data?.message || "تعذر تسجيل طلب التسوية حالياً.",
        type: "error",
      });
    } finally {
      setIsSettling(false);
    }
  };

  const handleMarkSettlementSent = async (settlementId) => {
    if (!selectedMerchant) return;

    try {
      setMarkingSettlementId(settlementId);
      setSettlementFeedback({ message: "", type: "" });

      const response = await markMerchantSettlementSent(settlementId);
      const updatedMerchant = normalizeMerchant(response?.data?.merchant || selectedMerchant);

      setSettlementFeedback({
        message: response?.message || "\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0629 \u0628\u0646\u062c\u0627\u062d.",
        type: "success",
      });

      setMerchants((current) =>
        current.map((merchant) => (merchant.id === updatedMerchant.id ? updatedMerchant : merchant))
      );

      await loadMerchants();
      await loadMerchantDetails(updatedMerchant.id, updatedMerchant);
    } catch (requestError) {
      setSettlementFeedback({
        message:
          requestError?.response?.data?.message ||
          "\u062a\u0639\u0630\u0631 \u062a\u0633\u062c\u064a\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0629 \u062d\u0627\u0644\u064a\u0627\u064b.",
        type: "error",
      });
    } finally {
      setMarkingSettlementId(null);
    }
  };

  return (
    <div className="phoenix-merchants">
      <div className="phoenix-merchants__hero">
        <div className="phoenix-merchants__hero-copy">
          <span className="phoenix-merchants__eyebrow">ركن التجار والشركاء</span>
          <h1 className="phoenix-merchants__title">إدارة التجار ومتابعة نشاطاتهم المالية والتشغيلية</h1>
          <p className="phoenix-merchants__subtitle">
            تابع أداء التجار وإدارة الطرود والعمولات وطلبات التسوية المالية من مكان واحد.
          </p>
        </div>
      </div>

      <div className="phoenix-merchants__summary-grid">
        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--blue">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">{formatCurrency(summary.totalRevenue)}</span>
            <span className="phoenix-merchants__summary-label">إجمالي الإيرادات</span>
          </div>
        </div>

        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--purple">
            <i className="bi bi-percent"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">{formatCurrency(summary.phoenixCommission)}</span>
            <span className="phoenix-merchants__summary-label">Phoenix عمولة</span>
          </div>
        </div>

        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--orange">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">
              {formatCurrency(summary.pendingSettlements)}
            </span>
            <span className="phoenix-merchants__summary-label">تسويات معلقة</span>
          </div>
        </div>
      </div>

      <div className="phoenix-merchants__summary-grid phoenix-merchants__summary-grid--secondary">
        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--blue">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">{summary.totalMerchants}</span>
            <span className="phoenix-merchants__summary-label">إجمالي التجار</span>
          </div>
        </div>

        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--purple">
            <i className="bi bi-box-seam-fill"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">{summary.totalParcels}</span>
            <span className="phoenix-merchants__summary-label">إجمالي الطرود</span>
          </div>
        </div>

        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--orange">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">{summary.pendingSettlement}</span>
            <span className="phoenix-merchants__summary-label">تجار بانتظار التسوية</span>
          </div>
        </div>
      </div>

      <div className="phoenix-merchants__controls">
        <div className="phoenix-merchants__search-wrapper">
          <i className="bi bi-search phoenix-merchants__search-icon"></i>
          <input
            type="text"
            className="phoenix-merchants__search-input"
            placeholder="ابحث عن تاجر بالاسم أو الهاتف أو البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="phoenix-merchants__filters">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.key}
              className={`phoenix-merchants__filter-chip ${
                activeFilter === filter.key ? "phoenix-merchants__filter-chip--active" : ""
              }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="phoenix-merchants__table-wrapper">
        <table className="phoenix-merchants__table">
          <thead>
            <tr>
              <th>التاجر</th>
              <th>الموقع</th>
              <th>إجمالي الطرود</th>
              <th>تم التسليم</th>
              <th>قيد المعالجة</th>
              <th>ملغاة</th>
              <th>مستحق التاجر</th>
              <th>حالة التسوية</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="9" className="phoenix-merchants__empty">جاري تحميل البيانات...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="9" className="phoenix-merchants__empty">{error}</td>
              </tr>
            ) : filteredMerchants.length > 0 ? (
              filteredMerchants.map((merchant) => (
                <tr key={merchant.id}>
                  <td>
                    <div className="phoenix-merchants__merchant-cell">
                      <div className="phoenix-merchants__merchant-avatar">
                        <i className="bi bi-shop"></i>
                      </div>
                      <div className="phoenix-merchants__merchant-info">
                        <span className="phoenix-merchants__merchant-name">{merchant.name}</span>
                        <span className="phoenix-merchants__merchant-phone">{merchant.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="phoenix-merchants__location">{merchant.location}</span></td>
                  <td><span className="phoenix-merchants__stat">{merchant.totalOrders}</span></td>
                  <td>
                    <span className="phoenix-merchants__stat phoenix-merchants__stat--success">
                      {merchant.deliveredOrders}
                    </span>
                  </td>
                  <td>
                    <span className="phoenix-merchants__stat phoenix-merchants__stat--warning">
                      {merchant.processingOrders}
                    </span>
                  </td>
                  <td>
                    <span className="phoenix-merchants__stat phoenix-merchants__stat--danger">
                      {merchant.cancelledOrders}
                    </span>
                  </td>
                  <td><span className="phoenix-merchants__stat">{formatCurrency(merchant.outstandingRevenue)}</span></td>
                  <td>
                    <span className={`phoenix-merchants__badge ${STATUS_CLASS[merchant.status]}`}>
                      {merchant.statusLabel}
                    </span>
                  </td>
                  <td>
                    <button
                      className="phoenix-merchants__details-btn"
                      onClick={() => handleOpenModal(merchant)}
                    >
                      التفاصيل
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="phoenix-merchants__empty">لا توجد نتائج مطابقة للبحث</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedMerchant && (
        <div className="phoenix-merchants__modal-overlay" onClick={handleCloseModal}>
          <div className="phoenix-merchants__modal" onClick={(e) => e.stopPropagation()}>
            <div className="phoenix-merchants__modal-header">
              <h2 className="phoenix-merchants__modal-title">تفاصيل التاجر</h2>
              <button className="phoenix-merchants__modal-close" onClick={handleCloseModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="phoenix-merchants__modal-body">
              {isLoadingDetails ? (
                <p className="phoenix-merchants__modal-financial-note">جاري تحميل التفاصيل...</p>
              ) : (
                <>
                  <div className="phoenix-merchants__modal-section">
                    <h3 className="phoenix-merchants__modal-section-title">المعلومات الأساسية</h3>
                    <div className="phoenix-merchants__modal-grid">
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">اسم التاجر</span>
                        <span className="phoenix-merchants__modal-value">{selectedMerchant.name}</span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">رقم الهاتف</span>
                        <span className="phoenix-merchants__modal-value">{selectedMerchant.phone}</span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">البريد الإلكتروني</span>
                        <span className="phoenix-merchants__modal-value">{selectedMerchant.email}</span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">الموقع</span>
                        <span className="phoenix-merchants__modal-value">{selectedMerchant.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="phoenix-merchants__modal-section">
                    <h3 className="phoenix-merchants__modal-section-title">إحصائيات الطرود</h3>
                    <div className="phoenix-merchants__modal-grid">
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">إجمالي الطرود</span>
                        <span className="phoenix-merchants__modal-value">{selectedMerchant.totalOrders}</span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">الطرود المسلّمة</span>
                        <span className="phoenix-merchants__modal-value phoenix-merchants__modal-value--success">
                          {selectedMerchant.deliveredOrders}
                        </span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">قيد المعالجة</span>
                        <span className="phoenix-merchants__modal-value phoenix-merchants__modal-value--warning">
                          {selectedMerchant.processingOrders}
                        </span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">ملغاة</span>
                        <span className="phoenix-merchants__modal-value phoenix-merchants__modal-value--danger">
                          {selectedMerchant.cancelledOrders}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="phoenix-merchants__modal-section">
                    <h3 className="phoenix-merchants__modal-section-title">الحالة التشغيلية</h3>
                    <div className="phoenix-merchants__modal-status">
                      <span className={`phoenix-merchants__badge ${STATUS_CLASS[selectedMerchant.status]}`}>
                        {selectedMerchant.statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="phoenix-merchants__modal-section phoenix-merchants__modal-section--financial">
                    <h3 className="phoenix-merchants__modal-section-title">الملخص المالي</h3>
                    <div className="phoenix-merchants__modal-grid">
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">إجمالي المبلغ المحصل</span>
                        <span className="phoenix-merchants__modal-value">
                          {formatCurrency(selectedMerchant.totalCollected)}
                        </span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">عمولة Phoenix</span>
                        <span className="phoenix-merchants__modal-value">
                          {formatCurrency(selectedMerchant.phoenixCommission)}
                        </span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">مستحق التاجر</span>
                        <span className="phoenix-merchants__modal-value">
                          {formatCurrency(selectedMerchant.merchantDue)}
                        </span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">المبلغ المسوّى فعلياً</span>
                        <span className="phoenix-merchants__modal-value">
                          {formatCurrency(selectedMerchant.totalSettledAmount)}
                        </span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">طلبات تسوية معلقة</span>
                        <span className="phoenix-merchants__modal-value">
                          {formatCurrency(selectedMerchant.pendingSettlementAmount)}
                        </span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">المتبقي للتسوية</span>
                        <span className="phoenix-merchants__modal-value phoenix-merchants__modal-value--warning">
                          {formatCurrency(selectedMerchant.outstandingRevenue)}
                        </span>
                      </div>
                      <div className="phoenix-merchants__modal-item">
                        <span className="phoenix-merchants__modal-label">المتاح لطلب تسوية جديد</span>
                        <span className="phoenix-merchants__modal-value phoenix-merchants__modal-value--warning">
                          {formatCurrency(selectedMerchant.availableSettlementRequestAmount)}
                        </span>
                      </div>
                    </div>
                    {selectedMerchant.detailsError ? (
                      <p className="phoenix-merchants__modal-financial-note">{selectedMerchant.detailsError}</p>
                    ) : null}
                  </div>

                  <div className="phoenix-merchants__modal-section phoenix-merchants__modal-section--financial">
                    <div className="phoenix-merchants__settlement-head">
                      <div>
                        <h3 className="phoenix-merchants__modal-section-title">تسوية مستحقات التاجر</h3>
                        <p className="phoenix-merchants__modal-financial-note">
                          يتم تسجيل الطلب من جهة الإدارة أولاً، ولن تُحتسب التسوية نهائياً حتى يوافق عليها التاجر.
                        </p>
                      </div>
                    </div>

                    <form className="phoenix-merchants__settlement-form" onSubmit={handleSettlementSubmit}>
                      <div className="phoenix-merchants__modal-grid">
                        <div className="phoenix-merchants__modal-item">
                          <span className="phoenix-merchants__modal-label">قيمة طلب التسوية</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            max={selectedMerchant.availableSettlementRequestAmount || 0}
                            className="phoenix-merchants__input"
                            value={settlementForm.amount}
                            onChange={(event) =>
                              setSettlementForm((current) => ({
                                ...current,
                                amount: event.target.value,
                              }))
                            }
                            placeholder="أدخل قيمة طلب التسوية"
                          />
                        </div>
                        <div className="phoenix-merchants__modal-item">
                          <span className="phoenix-merchants__modal-label">طريقة الدفع</span>
                          <select
                            className="phoenix-merchants__input"
                            value={settlementForm.paymentMethod}
                            onChange={(event) =>
                              setSettlementForm((current) => ({
                                ...current,
                                paymentMethod: event.target.value,
                              }))
                            }
                          >
                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="phoenix-merchants__modal-item phoenix-merchants__modal-item--wide">
                          <span className="phoenix-merchants__modal-label">ملاحظات</span>
                          <textarea
                            className="phoenix-merchants__textarea"
                            rows="3"
                            value={settlementForm.notes}
                            onChange={(event) =>
                              setSettlementForm((current) => ({
                                ...current,
                                notes: event.target.value,
                              }))
                            }
                            placeholder="ملاحظات اختيارية حول الطلب"
                          />
                        </div>
                      </div>

                      {settlementFeedback.message ? (
                        <p
                          className={`phoenix-merchants__feedback ${
                            settlementFeedback.type === "error"
                              ? "phoenix-merchants__feedback--error"
                              : ""
                          }`}
                        >
                          {settlementFeedback.message}
                        </p>
                      ) : null}

                      <div className="phoenix-merchants__settlement-actions">
                        <button
                          type="submit"
                          className="phoenix-merchants__settle-btn"
                          disabled={isSettling || isLoadingDetails}
                        >
                          {isSettling ? "جاري الحفظ..." : "تسجيل التسوية"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="phoenix-merchants__modal-section">
                    <h3 className="phoenix-merchants__modal-section-title">سجل التسويات</h3>
                    {selectedMerchant.settlements?.length ? (
                      <div className="phoenix-merchants__settlement-history">
                        {selectedMerchant.settlements.map((settlement) => (
                          <div key={settlement.id} className="phoenix-merchants__settlement-record">
                            <div>
                              <strong>{formatCurrency(settlement.amount)}</strong>
                              <span className={`phoenix-merchants__badge ${STATUS_CLASS[settlement.status]}`}>
                                {STATUS_LABELS[settlement.status] || settlement.status}
                              </span>
                            </div>
                            <p>
                              طريقة الدفع:{" "}
                              {PAYMENT_METHOD_OPTIONS.find(
                                (option) => option.value === settlement.payment_method
                              )?.label || "نقداً"}
                            </p>
                            <p>{settlement.notes || "بدون ملاحظات"}</p>
                            <small>
                              {settlement.status === "settled" && settlement.settled_at
                                ? `تمت الموافقة في ${new Date(settlement.settled_at).toLocaleString("ar-PS")}`
                                : "بانتظار موافقة التاجر"}
                            </small>
                            {settlement.payment_method === "bank_transfer" ? (
                              <div className="phoenix-merchants__settlement-bank">
                                <span>{`\u0627\u0644\u0628\u0646\u0643: ${settlement.bank_name || "-"}`}</span>
                                <span>{`\u0635\u0627\u062d\u0628 \u0627\u0644\u062d\u0633\u0627\u0628: ${settlement.bank_account_holder || "-"}`}</span>
                                <span>{`\u0631\u0642\u0645 \u0627\u0644\u062d\u0633\u0627\u0628: ${settlement.bank_account_number || "-"}`}</span>
                                {settlement.bank_iban ? <span>{`IBAN: ${settlement.bank_iban}`}</span> : null}
                              </div>
                            ) : null}
                            {settlement.customer_confirmed_at ? (
                              <small>
                                {`\u0623\u0643\u062f \u0627\u0644\u062a\u0627\u062c\u0631 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645 \u0641\u064a ${new Date(settlement.customer_confirmed_at).toLocaleString("ar-PS")}`}
                              </small>
                            ) : null}
                            {settlement.status !== "settled" ? (
                              <button
                                type="button"
                                className="phoenix-merchants__settle-btn phoenix-merchants__settle-btn--compact"
                                disabled={markingSettlementId === settlement.id}
                                onClick={() => handleMarkSettlementSent(settlement.id)}
                              >
                                {markingSettlementId === settlement.id
                                  ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u062f\u064a\u062b..."
                                  : "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0629"}
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="phoenix-merchants__modal-financial-note">
                        لا توجد تسويات مسجلة لهذا التاجر بعد.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MerchantsPage;

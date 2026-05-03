import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../../apis/api";
import "./HandoverRequestsPage.css";

const STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "pending", label: "قيد المعالجة" },
  { value: "approved", label: "بانتظار الإكمال" },
  { value: "rejected", label: "مرفوض" },
  { value: "paid", label: "مكتمل" },
];

const METHOD_OPTIONS = [
  { value: "all", label: "كل الطرق" },
  { value: "cash", label: "تسليم نقدي" },
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "ewallet", label: "محفظة إلكترونية" },
];

const STATUS_CLASS = {
  pending: "admin-handover__status admin-handover__status--pending",
  approved: "admin-handover__status admin-handover__status--approved",
  rejected: "admin-handover__status admin-handover__status--rejected",
  paid: "admin-handover__status admin-handover__status--paid",
};

const formatCurrency = (value) =>
  `₪${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const FALLBACK_DATA = {
  items: [],
  summary: {
    pendingCount: 0,
    approvedCount: 0,
    paidCount: 0,
    totalPendingAmount: 0,
  },
};

function HandoverRequestsPage() {
  const [requestsData, setRequestsData] = useState(FALLBACK_DATA);
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [submittingAction, setSubmittingAction] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const loadRequests = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setPageError("");

      const requestParams = {
        status: filters.status ?? statusFilter,
        method: filters.method ?? methodFilter,
        search: filters.search ?? debouncedSearchQuery,
      };

      const response = await API.get("/admin/handover-requests", {
        params: requestParams,
      });

      setRequestsData(response.data?.data || FALLBACK_DATA);
    } catch (error) {
      setRequestsData(FALLBACK_DATA);
      setPageError("تعذر تحميل طلبات تسليم المبالغ حاليًا.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, methodFilter, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage("");
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedbackMessage]);

  const summary = requestsData.summary || FALLBACK_DATA.summary;
  const items = requestsData.items || [];

  const summaryCards = useMemo(
    () => [
      {
        id: "pending",
        label: "قيد المعالجة",
        value: summary.pendingCount,
        icon: "bi-hourglass-split",
        tone: "admin-handover__summary-card--blue",
      },
      {
        id: "approved",
        label: "بانتظار الإكمال",
        value: summary.approvedCount,
        icon: "bi-patch-check",
        tone: "admin-handover__summary-card--sky",
      },
      {
        id: "paid",
        label: "مكتملة",
        value: summary.paidCount,
        icon: "bi-check2-circle",
        tone: "admin-handover__summary-card--green",
      },
      {
        id: "amount",
        label: "إجمالي المبالغ بانتظار التسليم",
        value: formatCurrency(summary.totalPendingAmount),
        icon: "bi-cash-stack",
        tone: "admin-handover__summary-card--amber",
      },
    ],
    [summary],
  );

  const handleResetFilters = async () => {
    setStatusFilter("all");
    setMethodFilter("all");
    setSearchQuery("");
  };

  const updateRequestStatus = async (request, nextStatus) => {
    try {
      setSubmittingAction(`${request.id}-${nextStatus}`);
      setActionError("");
      setFeedbackMessage("");

      await API.patch(`/admin/handover-requests/${request.id}/status`, {
        status: nextStatus,
      });

      await loadRequests();
      setActionError("");
      setFeedbackMessage("تم تحديث حالة طلب تسليم المبلغ بنجاح.");
    } catch (error) {
      setActionError(
        error.response?.data?.message || "تعذر تحديث حالة طلب تسليم المبلغ حاليًا.",
      );
    } finally {
      setSubmittingAction("");
    }
  };

  const renderActions = (request, compact = false) => {
    const isPending = request.status === "pending";
    const isApproved = request.status === "approved";

    if (!isPending && !isApproved) {
      return null;
    }

    return (
      <div className={`admin-handover__actions ${compact ? "admin-handover__actions--compact" : ""}`}>
        {isPending ? (
          <button
            type="button"
            className="admin-handover__action-btn admin-handover__action-btn--approve"
            onClick={() => updateRequestStatus(request, "approved")}
            disabled={submittingAction === `${request.id}-approved`}
          >
            {submittingAction === `${request.id}-approved` ? "جارٍ الاعتماد..." : "اعتماد"}
          </button>
        ) : null}

        {isApproved ? (
          <button
            type="button"
            className="admin-handover__action-btn admin-handover__action-btn--paid"
            onClick={() => updateRequestStatus(request, "paid")}
            disabled={submittingAction === `${request.id}-paid`}
          >
            {submittingAction === `${request.id}-paid` ? "جارٍ التأكيد..." : "تأكيد الاستلام"}
          </button>
        ) : null}

        <button
          type="button"
          className="admin-handover__action-btn admin-handover__action-btn--reject"
          onClick={() => updateRequestStatus(request, "rejected")}
          disabled={submittingAction === `${request.id}-rejected`}
        >
          {submittingAction === `${request.id}-rejected` ? "جارٍ الرفض..." : "رفض"}
        </button>
      </div>
    );
  };

  return (
    <section className="admin-handover" dir="rtl">
      <div className="admin-handover__hero">
        <div className="admin-handover__hero-copy">
          <span className="admin-handover__eyebrow">الإدارة المالية</span>
          <h1 className="admin-handover__title">طلبات تسليم المبالغ</h1>
          <p className="admin-handover__subtitle">
            راجع طلبات تسليم المبالغ المرسلة من الموظفين، ثم اعتمد الطلب أو أكد استلام المبلغ
            فعليًا من الشركة بنفس الواجهة.
          </p>
        </div>
      </div>

      <div className="admin-handover__summary-grid">
        {summaryCards.map((card) => (
          <article key={card.id} className={`admin-handover__summary-card ${card.tone}`}>
            <div className="admin-handover__summary-icon">
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="admin-handover__summary-copy">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <article className="admin-handover__panel">
        <div className="admin-handover__filters">
          <label className="admin-handover__field">
            <span>بحث باسم الموظف أو الجوال</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="اكتب الاسم أو رقم الجوال"
            />
          </label>

          <label className="admin-handover__field">
            <span>الحالة</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-handover__field">
            <span>طريقة التسليم</span>
            <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
              {METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-handover__filter-actions">
            <button
              type="button"
              className="admin-handover__toolbar-btn"
              onClick={handleResetFilters}
            >
              إعادة ضبط
            </button>
          </div>
        </div>

        {feedbackMessage ? <p className="admin-handover__feedback">{feedbackMessage}</p> : null}
        {actionError ? <p className="admin-handover__feedback admin-handover__feedback--error">{actionError}</p> : null}

        {pageError ? (
          <div className="admin-handover__state">
            <i className="bi bi-exclamation-circle"></i>
            <p>{pageError}</p>
          </div>
        ) : isLoading ? (
          <div className="admin-handover__state">
            <i className="bi bi-arrow-repeat"></i>
            <p>جارٍ تحميل طلبات تسليم المبالغ...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="admin-handover__state">
            <i className="bi bi-inbox"></i>
            <p>لا توجد طلبات مطابقة للفلاتر الحالية.</p>
          </div>
        ) : (
          <>
            <div className="admin-handover__table-wrap">
              <table className="admin-handover__table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>الموظف</th>
                    <th>الجوال</th>
                    <th>المبلغ</th>
                    <th>الطريقة</th>
                    <th>الرصيد الحالي</th>
                    <th>تاريخ الطلب</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((request) => (
                    <tr key={request.id}>
                      <td>#{request.id}</td>
                      <td>{request.employee.fullName}</td>
                      <td>{request.employee.phone}</td>
                      <td>{formatCurrency(request.amount)}</td>
                      <td>{request.methodLabel}</td>
                      <td>{formatCurrency(request.employee.currentBalance)}</td>
                      <td>{formatDate(request.requestedAt)}</td>
                      <td>
                        <span className={STATUS_CLASS[request.status] || STATUS_CLASS.pending}>
                          {request.statusLabel}
                        </span>
                      </td>
                      <td>{renderActions(request, true) || <span className="admin-handover__no-actions">-</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-handover__cards">
              {items.map((request) => (
                <article key={request.id} className="admin-handover__card">
                  <div className="admin-handover__card-top">
                    <div>
                      <h3>طلب #{request.id}</h3>
                      <p>{request.employee.fullName}</p>
                    </div>
                    <span className={STATUS_CLASS[request.status] || STATUS_CLASS.pending}>
                      {request.statusLabel}
                    </span>
                  </div>
                  <div className="admin-handover__card-grid">
                    <div>
                      <span>الجوال</span>
                      <strong>{request.employee.phone}</strong>
                    </div>
                    <div>
                      <span>المبلغ</span>
                      <strong>{formatCurrency(request.amount)}</strong>
                    </div>
                    <div>
                      <span>الطريقة</span>
                      <strong>{request.methodLabel}</strong>
                    </div>
                    <div>
                      <span>الرصيد الحالي</span>
                      <strong>{formatCurrency(request.employee.currentBalance)}</strong>
                    </div>
                  </div>
                  <p className="admin-handover__card-date">{formatDate(request.requestedAt)}</p>
                  {renderActions(request) || <span className="admin-handover__no-actions">لا توجد إجراءات متاحة</span>}
                </article>
              ))}
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export default HandoverRequestsPage;

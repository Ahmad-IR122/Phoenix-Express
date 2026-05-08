import { useMemo, useState } from "react";
import "./ReportsPage.css";
import { useReports } from "../hooks/useReports";

const statusMeta = {
  delivered: {
    label: "تم التسليم",
    className: "phoenix-reports__status-badge--delivered",
  },
  in_delivery: {
    label: "قيد التوصيل",
    className: "phoenix-reports__status-badge--progress",
  },
  returned: {
    label: "مرتجع",
    className: "phoenix-reports__status-badge--returned",
  },
  pending: {
    label: "قيد المراجعة",
    className: "phoenix-reports__status-badge--pending",
  },
};

const paymentMethodMeta = {
  cod: "الدفع عند الاستلام",
  wallet: "محفظة",
  bank_transfer: "تحويل بنكي",
};

const statusFilterOptions = [
  { value: "all", label: "كل الحالات" },
  { value: "delivered", label: "تم التسليم" },
  { value: "in_delivery", label: "قيد التوصيل" },
  { value: "pending", label: "قيد المراجعة" },
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function formatCurrency(value) {
  return `${formatNumber(value)} ₪`;
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildCsvRows(rows) {
  const headers = [
    "رقم الطلب",
    "التاجر",
    "العميل",
    "الهاتف",
    "المندوب",
    "الحالة",
    "طريقة الدفع",
    "سعر التوصيل / العمولة",
    "تاريخ الإنشاء",
    "آخر تحديث",
    "المدينة",
  ];

  const lines = rows.map((row) =>
    [
      row.orderNumber,
      row.merchantName,
      row.customerName,
      row.phone,
      row.delegateName,
      statusMeta[row.status]?.label || row.status,
      paymentMethodMeta[row.paymentMethod] || row.paymentMethod,
      row.deliveryFee ?? row.phoenixCommission ?? row.amount,
      formatDateTime(row.createdAt),
      formatDateTime(row.updatedAt),
      row.city,
    ]
      .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
}

function triggerDownload(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const {
    reports,
    filteredReports,
      summaryCards,
    cities,
    filters,
    setFilters,
    isLoading,
  } = useReports();

  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtersCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === "status" || key === "city") {
        return value !== "all" ? count + 1 : count;
      }

      return String(value || "").trim() ? count + 1 : count;
    }, 0);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      orderNumber: "",
      merchantName: "",
      customerName: "",
      delegateName: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      city: "all",
    });
  };

  const handleExportExcel = () => {
    const csvContent = `\uFEFF${buildCsvRows(filteredReports)}`;
    triggerDownload(csvContent, "phoenix-operations-report.csv", "text/csv;charset=utf-8;");
  };

  const handleExportPdf = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      return;
    }

    const rowsMarkup = filteredReports
      .map(
        (row) => `
          <tr>
            <td>${row.orderNumber}</td>
            <td>${row.merchantName}</td>
            <td>${row.customerName}</td>
            <td>${row.phone}</td>
            <td>${row.delegateName}</td>
            <td>${statusMeta[row.status]?.label || row.status}</td>
            <td>${paymentMethodMeta[row.paymentMethod] || row.paymentMethod}</td>
            <td>${formatCurrency(row.deliveryFee ?? row.phoenixCommission ?? row.amount)}</td>
            <td>${formatDateTime(row.createdAt)}</td>
            <td>${formatDateTime(row.updatedAt)}</td>
          </tr>
        `
      )
      .join("");

    const summaryMarkup = summaryCards
      .map(
        (card) => `
          <div class="summary-card">
            <p>${card.label}</p>
            <strong>${card.value}</strong>
          </div>
        `
      )
      .join("");

    printWindow.document.write(`
      <html lang="ar" dir="rtl">
        <head>
          <title>سجل العمليات والتقارير</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; direction: rtl; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            p { margin: 0 0 18px; color: #475569; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .summary-card { border: 1px solid #dbeafe; border-radius: 14px; padding: 14px; background: #f8fbff; }
            .summary-card p { margin: 0 0 8px; font-size: 13px; color: #64748b; }
            .summary-card strong { font-size: 22px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-size: 13px; }
            th { background: #eff6ff; }
          </style>
        </head>
        <body>
          <h1>سجل العمليات والتقارير</h1>
          <p>تقرير مطبوع من لوحة إدارة Phoenix</p>
          <div class="summary-grid">${summaryMarkup}</div>
          <table>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>التاجر</th>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>المندوب</th>
                <th>الحالة</th>
                <th>طريقة الدفع</th>
                <th>سعر التوصيل / العمولة</th>
                <th>تاريخ الإنشاء</th>
                <th>آخر تحديث</th>
              </tr>
            </thead>
            <tbody>${rowsMarkup}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section dir="rtl" className="phoenix-reports">
      <div className="phoenix-reports__hero">
        <div className="phoenix-reports__hero-copy">
          <span className="phoenix-reports__eyebrow">Phoenix Admin</span>
          <h1 className="phoenix-reports__title">سجل العمليات والتقارير</h1>
          <p className="phoenix-reports__subtitle">
            مركز موحد لمتابعة الطلبات والتحصيلات وحالات التسليم بصورة
            تشغيلية واضحة.
          </p>
        </div>

        <div className="phoenix-reports__actions">
          <button
            type="button"
            className="phoenix-reports__action-btn phoenix-reports__action-btn--ghost"
            onClick={handleExportExcel}
          >
            <i className="bi bi-file-earmark-excel"></i>
            Export Excel
          </button>
          <button
            type="button"
            className="phoenix-reports__action-btn phoenix-reports__action-btn--primary"
            onClick={handleExportPdf}
          >
            <i className="bi bi-file-earmark-pdf"></i>
            Export PDF
          </button>
        </div>
      </div>

      <div className="phoenix-reports__summary-grid">
        {summaryCards.map((card) => (
          <article
            key={card.id}
            className={`phoenix-reports__summary-card${
              card.variant === "profit" ? " phoenix-reports__summary-card--profit" : ""
            }`}
          >
            <div className={`phoenix-reports__summary-icon ${card.iconClass}`}>
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="phoenix-reports__summary-content">
              <span className="phoenix-reports__summary-label">{card.label}</span>
              <strong className="phoenix-reports__summary-value">{card.value}</strong>
              {card.period ? (
                <span className="phoenix-reports__summary-period">{card.period}</span>
              ) : null}
              {card.note ? (
                <span className="phoenix-reports__summary-note">{card.note}</span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <article className="phoenix-reports__panel">
        <div className="phoenix-reports__panel-head">
          <div>
            <h2 className="phoenix-reports__panel-title">الفلاتر المتقدمة</h2>
            <p className="phoenix-reports__panel-subtitle">
              ابحث وفلتر حسب الطلب أو الأطراف المرتبطة أو الحالة أو الفترة الزمنية.
            </p>
          </div>

          <div className="phoenix-reports__panel-badges">
            <span className="phoenix-reports__mini-badge">
              {formatNumber(filteredReports.length)} نتيجة
            </span>
            <span className="phoenix-reports__mini-badge phoenix-reports__mini-badge--soft">
              {filtersCount} فلتر نشط
            </span>
          </div>
        </div>

        <div className="phoenix-reports__filters-grid">
          <label className="phoenix-reports__field phoenix-reports__field--wide">
            <span>بحث شامل في الصفحة</span>
            <input
              type="text"
              value={filters.search}
              placeholder="ابحث برقم الطلب، التاجر، العميل، المندوب، الهاتف، المدينة..."
              onChange={(event) => handleFilterChange("search", event.target.value)}
            />
          </label>

          <label className="phoenix-reports__field">
            <span>البحث برقم الطلب</span>
            <input
              type="text"
              value={filters.orderNumber}
              placeholder="مثال: PX-1045"
              onChange={(event) => handleFilterChange("orderNumber", event.target.value)}
            />
          </label>

          <label className="phoenix-reports__field">
            <span>البحث باسم التاجر</span>
            <input
              type="text"
              value={filters.merchantName}
              placeholder="اسم التاجر"
              onChange={(event) => handleFilterChange("merchantName", event.target.value)}
            />
          </label>

          <label className="phoenix-reports__field">
            <span>البحث باسم العميل</span>
            <input
              type="text"
              value={filters.customerName}
              placeholder="اسم العميل"
              onChange={(event) => handleFilterChange("customerName", event.target.value)}
            />
          </label>

          <label className="phoenix-reports__field">
            <span>البحث باسم المندوب</span>
            <input
              type="text"
              value={filters.delegateName}
              placeholder="اسم المندوب"
              onChange={(event) => handleFilterChange("delegateName", event.target.value)}
            />
          </label>

          <label className="phoenix-reports__field">
            <span>الحالة</span>
            <select
              value={filters.status}
              onChange={(event) => handleFilterChange("status", event.target.value)}
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="phoenix-reports__field">
            <span>من تاريخ</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => handleFilterChange("dateFrom", event.target.value)}
            />
          </label>

          <label className="phoenix-reports__field">
            <span>إلى تاريخ</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => handleFilterChange("dateTo", event.target.value)}
            />
          </label>

          <label className="phoenix-reports__field">
            <span>المدينة</span>
            <select
              value={filters.city}
              onChange={(event) => handleFilterChange("city", event.target.value)}
            >
              <option value="all">كل المدن</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="phoenix-reports__filters-actions">
          <button
            type="button"
            className="phoenix-reports__reset-btn"
            onClick={resetFilters}
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      </article>

      <article className="phoenix-reports__panel">
        <div className="phoenix-reports__panel-head">
          <div>
            <h2 className="phoenix-reports__panel-title">جدول العمليات الرئيسي</h2>
            <p className="phoenix-reports__panel-subtitle">
              عرض مباشر ومهيكل للطلبات المرتبطة بالتسليم والتحصيل وآخر حالة تشغيلية.
            </p>
          </div>
          <span className="phoenix-reports__mini-badge">
            من أصل {formatNumber(reports.length)} طلب
          </span>
        </div>

        <div className="phoenix-reports__table-wrap">
          <table className="phoenix-reports__table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>التاجر</th>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>المندوب</th>
                <th>الحالة</th>
                <th>طريقة الدفع</th>
                <th>المبلغ</th>
                <th>تاريخ الإنشاء</th>
                <th>آخر تحديث</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td className="phoenix-reports__order-id">{report.orderNumber}</td>
                    <td>{report.merchantName}</td>
                    <td>{report.customerName}</td>
                    <td dir="ltr" className="phoenix-reports__ltr-cell">
                      {report.phone}
                    </td>
                    <td>{report.delegateName}</td>
                    <td>
                      <span
                        className={`phoenix-reports__status-badge ${
                          statusMeta[report.status]?.className || ""
                        }`}
                      >
                        {statusMeta[report.status]?.label || report.status}
                      </span>
                    </td>
                    <td>{paymentMethodMeta[report.paymentMethod] || report.paymentMethod}</td>
                    <td className="phoenix-reports__amount">
                      {formatCurrency(report.deliveryFee ?? report.phoenixCommission ?? report.amount)}
                    </td>
                    <td>{formatDateTime(report.createdAt)}</td>
                    <td>{formatDateTime(report.updatedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="phoenix-reports__link-btn"
                        onClick={() => setSelectedOrder(report)}
                      >
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="phoenix-reports__empty">
                    لا توجد نتائج مطابقة للفلاتر الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="phoenix-reports__mobile-cards">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <article key={report.id} className="phoenix-reports__mobile-card">
                <div className="phoenix-reports__mobile-card-head">
                  <div>
                    <span className="phoenix-reports__mobile-label">رقم الطلب</span>
                    <strong>{report.orderNumber}</strong>
                  </div>
                  <span
                    className={`phoenix-reports__status-badge ${
                      statusMeta[report.status]?.className || ""
                    }`}
                  >
                    {statusMeta[report.status]?.label || report.status}
                  </span>
                </div>

                <div className="phoenix-reports__mobile-grid">
                  <div>
                    <span>التاجر</span>
                    <strong>{report.merchantName}</strong>
                  </div>
                  <div>
                    <span>العميل</span>
                    <strong>{report.customerName}</strong>
                  </div>
                  <div>
                    <span>المندوب</span>
                    <strong>{report.delegateName}</strong>
                  </div>
                  <div>
                    <span>سعر التوصيل / العمولة</span>
                    <strong>
                      {formatCurrency(report.deliveryFee ?? report.phoenixCommission ?? report.amount)}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="phoenix-reports__link-btn phoenix-reports__link-btn--block"
                  onClick={() => setSelectedOrder(report)}
                >
                  تفاصيل
                </button>
              </article>
            ))
          ) : (
            <div className="phoenix-reports__empty phoenix-reports__empty--mobile">
              لا توجد نتائج مطابقة للفلاتر الحالية.
            </div>
          )}
        </div>
      </article>

      {selectedOrder && (
        <div
          className="phoenix-reports__modal-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="phoenix-reports__modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="phoenix-reports__modal-head">
              <div>
                <h3>تفاصيل الطلب</h3>
                <p>{selectedOrder.orderNumber}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="phoenix-reports__detail-grid">
              <div>
                <span>التاجر</span>
                <strong>{selectedOrder.merchantName}</strong>
              </div>
              <div>
                <span>العميل</span>
                <strong>{selectedOrder.customerName}</strong>
              </div>
              <div>
                <span>الهاتف</span>
                <strong dir="ltr">{selectedOrder.phone}</strong>
              </div>
              <div>
                <span>المندوب</span>
                <strong>{selectedOrder.delegateName}</strong>
              </div>
              <div>
                <span>الحالة</span>
                <strong>{statusMeta[selectedOrder.status]?.label || selectedOrder.status}</strong>
              </div>
              <div>
                <span>طريقة الدفع</span>
                <strong>
                  {paymentMethodMeta[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                </strong>
              </div>
              <div>
                <span>المدينة</span>
                <strong>{selectedOrder.city}</strong>
              </div>
              <div>
                <span>المنطقة</span>
                <strong>{selectedOrder.area}</strong>
              </div>
              <div>
                <span>سعر التوصيل / العمولة</span>
                <strong>
                  {formatCurrency(
                    selectedOrder.deliveryFee ?? selectedOrder.phoenixCommission ?? selectedOrder.amount
                  )}
                </strong>
              </div>
              <div>
                <span>المبلغ المحصل</span>
                <strong>{formatCurrency(selectedOrder.collectedAmount)}</strong>
              </div>
              <div>
                <span>عمولة Phoenix</span>
                <strong>{formatCurrency(selectedOrder.phoenixCommission)}</strong>
              </div>
              <div>
                <span>مستحق التاجر</span>
                <strong>{formatCurrency(selectedOrder.merchantDue)}</strong>
              </div>
              <div>
                <span>تاريخ الإنشاء</span>
                <strong>{formatDateTime(selectedOrder.createdAt)}</strong>
              </div>
              <div>
                <span>آخر تحديث</span>
                <strong>{formatDateTime(selectedOrder.updatedAt)}</strong>
              </div>
            </div>

          </div>
        </div>
      )}

      {isLoading && (
        <div className="phoenix-reports__loading-overlay">
          <div className="phoenix-reports__loading-card">جارٍ تحميل سجل العمليات...</div>
        </div>
      )}
    </section>
  );
}

export default ReportsPage;

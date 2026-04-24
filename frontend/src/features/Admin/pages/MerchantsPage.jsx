import React, { useState, useMemo } from "react";
import "./MerchantsPage.css";

// TODO: Replace dummy merchants data with GET /api/admin/merchants after financial calculation rules are approved.
const DUMMY_MERCHANTS = [
  {
    id: 1,
    name: "متجر الأناقة",
    phone: "0501234567",
    email: "elegance@example.com",
    location: "رام الله",
    totalOrders: 145,
    deliveredOrders: 128,
    processingOrders: 12,
    cancelledOrders: 5,
    status: "pending_settlement",
  },
  {
    id: 2,
    name: "متجر الإلكترونيات",
    phone: "0507654321",
    email: "electronics@example.com",
    location: "نابلس",
    totalOrders: 98,
    deliveredOrders: 89,
    processingOrders: 7,
    cancelledOrders: 2,
    status: "active",
  },
  {
    id: 3,
    name: "متجر الأزياء",
    phone: "0509876543",
    email: "fashion@example.com",
    location: "الخليل",
    totalOrders: 234,
    deliveredOrders: 201,
    processingOrders: 28,
    cancelledOrders: 5,
    status: "pending_settlement",
  },
  {
    id: 4,
    name: "متجر الكتب",
    phone: "0502345678",
    email: "books@example.com",
    location: "جنين",
    totalOrders: 67,
    deliveredOrders: 62,
    processingOrders: 3,
    cancelledOrders: 2,
    status: "active",
  },
];

const STATUS_LABELS = {
  active: "نشط",
  pending_settlement: "بانتظار التسوية",
  inactive: "غير نشط",
};

const STATUS_CLASS = {
  active: "phoenix-merchants__badge--active",
  pending_settlement: "phoenix-merchants__badge--pending",
  inactive: "phoenix-merchants__badge--inactive",
};

const FILTER_OPTIONS = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشط" },
  { key: "pending_settlement", label: "بانتظار التسوية" },
  { key: "inactive", label: "غير نشط" },
];

function MerchantsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate summary from dummy data
  const summary = useMemo(() => {
    const totalMerchants = DUMMY_MERCHANTS.length;
    const totalParcels = DUMMY_MERCHANTS.reduce(
      (sum, m) => sum + m.totalOrders,
      0
    );
    const deliveredParcels = DUMMY_MERCHANTS.reduce(
      (sum, m) => sum + m.deliveredOrders,
      0
    );
    const pendingSettlement = DUMMY_MERCHANTS.filter(
      (m) => m.status === "pending_settlement"
    ).length;

    return {
      totalMerchants,
      totalParcels,
      deliveredParcels,
      pendingSettlement,
    };
  }, []);

  // Filter merchants based on search and filter
  const filteredMerchants = useMemo(() => {
    return DUMMY_MERCHANTS.filter((merchant) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        merchant.name.toLowerCase().includes(searchLower) ||
        merchant.phone.includes(searchLower) ||
        merchant.email.toLowerCase().includes(searchLower);

      // Status filter
      const matchesFilter =
        activeFilter === "all" || merchant.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  const handleOpenModal = (merchant) => {
    setSelectedMerchant(merchant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMerchant(null);
  };

  return (
    <div className="phoenix-merchants">
      {/* Header */}
      <div className="phoenix-merchants__hero">
        <div className="phoenix-merchants__hero-copy">
          <span className="phoenix-merchants__eyebrow">ركن التجار والشركاء</span>
          <h1 className="phoenix-merchants__title">إدارة التجار ومتابعة نشاطاتهم المالية والتشغيلية</h1>
          <p className="phoenix-merchants__subtitle">
            تابع أداء التجار وإدارة طرودهم وحالتهم التشغيلية
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="phoenix-merchants__summary-grid">
        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--blue">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">
              {summary.totalMerchants}
            </span>
            <span className="phoenix-merchants__summary-label">
              إجمالي التجار
            </span>
          </div>
        </div>

        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--purple">
            <i className="bi bi-box-seam-fill"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">
              {summary.totalParcels}
            </span>
            <span className="phoenix-merchants__summary-label">
              إجمالي الطرود
            </span>
          </div>
        </div>

        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--green">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">
              {summary.deliveredParcels}
            </span>
            <span className="phoenix-merchants__summary-label">
              الطرود المسلّمة
            </span>
          </div>
        </div>

        <div className="phoenix-merchants__summary-card">
          <div className="phoenix-merchants__summary-icon phoenix-merchants__summary-icon--orange">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="phoenix-merchants__summary-content">
            <span className="phoenix-merchants__summary-value">
              {summary.pendingSettlement}
            </span>
            <span className="phoenix-merchants__summary-label">
              طلبات بانتظار التسوية
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="phoenix-merchants__controls">
        <div className="phoenix-merchants__search-wrapper">
          <i className="bi bi-search phoenix-merchants__search-icon"></i>
          <input
            type="text"
            className="phoenix-merchants__search-input"
            placeholder="البحث عن تاجر بالاسم، الهاتف، البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="phoenix-merchants__filters">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.key}
              className={`phoenix-merchants__filter-chip ${
                activeFilter === filter.key
                  ? "phoenix-merchants__filter-chip--active"
                  : ""
              }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Merchants Table */}
      <div className="phoenix-merchants__table-wrapper">
        <table className="phoenix-merchants__table">
          <thead>
            <tr>
              <th>التاجر</th>
              <th>الموقع</th>
              <th>إجمالي الطرود</th>
              <th>تم التسليم</th>
              <th>قيد المعالجة</th>
              <th>ملغي</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredMerchants.length > 0 ? (
              filteredMerchants.map((merchant) => (
                <tr key={merchant.id}>
                  <td>
                    <div className="phoenix-merchants__merchant-cell">
                      <div className="phoenix-merchants__merchant-avatar">
                        <i className="bi bi-shop"></i>
                      </div>
                      <div className="phoenix-merchants__merchant-info">
                        <span className="phoenix-merchants__merchant-name">
                          {merchant.name}
                        </span>
                        <span className="phoenix-merchants__merchant-phone">
                          {merchant.phone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="phoenix-merchants__location">
                      {merchant.location}
                    </span>
                  </td>
                  <td>
                    <span className="phoenix-merchants__stat">
                      {merchant.totalOrders}
                    </span>
                  </td>
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
                  <td>
                    <span
                      className={`phoenix-merchants__badge ${STATUS_CLASS[merchant.status]}`}
                    >
                      {STATUS_LABELS[merchant.status]}
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
                <td colSpan="8" className="phoenix-merchants__empty">
                  لا توجد نتائج مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedMerchant && (
        <div className="phoenix-merchants__modal-overlay" onClick={handleCloseModal}>
          <div
            className="phoenix-merchants__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="phoenix-merchants__modal-header">
              <h2 className="phoenix-merchants__modal-title">تفاصيل التاجر</h2>
              <button
                className="phoenix-merchants__modal-close"
                onClick={handleCloseModal}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="phoenix-merchants__modal-body">
              <div className="phoenix-merchants__modal-section">
                <h3 className="phoenix-merchants__modal-section-title">
                  المعلومات الأساسية
                </h3>
                <div className="phoenix-merchants__modal-grid">
                  <div className="phoenix-merchants__modal-item">
                    <span className="phoenix-merchants__modal-label">
                      اسم التاجر
                    </span>
                    <span className="phoenix-merchants__modal-value">
                      {selectedMerchant.name}
                    </span>
                  </div>
                  <div className="phoenix-merchants__modal-item">
                    <span className="phoenix-merchants__modal-label">
                      رقم الهاتف
                    </span>
                    <span className="phoenix-merchants__modal-value">
                      {selectedMerchant.phone}
                    </span>
                  </div>
                  <div className="phoenix-merchants__modal-item">
                    <span className="phoenix-merchants__modal-label">
                      البريد الإلكتروني
                    </span>
                    <span className="phoenix-merchants__modal-value">
                      {selectedMerchant.email}
                    </span>
                  </div>
                  <div className="phoenix-merchants__modal-item">
                    <span className="phoenix-merchants__modal-label">
                      الموقع
                    </span>
                    <span className="phoenix-merchants__modal-value">
                      {selectedMerchant.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="phoenix-merchants__modal-section">
                <h3 className="phoenix-merchants__modal-section-title">
                  إحصائيات الطرود
                </h3>
                <div className="phoenix-merchants__modal-grid">
                  <div className="phoenix-merchants__modal-item">
                    <span className="phoenix-merchants__modal-label">
                      إجمالي الطرود
                    </span>
                    <span className="phoenix-merchants__modal-value">
                      {selectedMerchant.totalOrders}
                    </span>
                  </div>
                  <div className="phoenix-merchants__modal-item">
                    <span className="phoenix-merchants__modal-label">
                      الطرود المسلّمة
                    </span>
                    <span className="phoenix-merchants__modal-value phoenix-merchants__modal-value--success">
                      {selectedMerchant.deliveredOrders}
                    </span>
                  </div>
                  <div className="phoenix-merchants__modal-item">
                    <span className="phoenix-merchants__modal-label">
                      قيد المعالجة
                    </span>
                    <span className="phoenix-merchants__modal-value phoenix-merchants__modal-value--warning">
                      {selectedMerchant.processingOrders}
                    </span>
                  </div>
                  <div className="phoenix-merchants__modal-item">
                    <span className="phoenix-merchants__modal-label">
                      الملغاة
                    </span>
                    <span className="phoenix-merchants__modal-value phoenix-merchants__modal-value--danger">
                      {selectedMerchant.cancelledOrders}
                    </span>
                  </div>
                </div>
              </div>

              <div className="phoenix-merchants__modal-section">
                <h3 className="phoenix-merchants__modal-section-title">
                  الحالة التشغيلية
                </h3>
                <div className="phoenix-merchants__modal-status">
                  <span
                    className={`phoenix-merchants__badge ${STATUS_CLASS[selectedMerchant.status]}`}
                  >
                    {STATUS_LABELS[selectedMerchant.status]}
                  </span>
                </div>
              </div>

              <div className="phoenix-merchants__modal-section phoenix-merchants__modal-section--financial">
                <h3 className="phoenix-merchants__modal-section-title">
                  ملاحظات مالية
                </h3>
                <p className="phoenix-merchants__modal-financial-note">
                  سيتم ربط تفاصيل الأرباح والتسويات لاحقاً بعد اعتماد منطق
                  الحسابات المالية.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MerchantsPage;
import { useMemo, useState } from "react";
import "./DelegatesPage.css";

const initialDelegatesData = [
  {
    id: 1,
    name: "خالد أحمد",
    phone: "0503334455",
    email: "khaled@example.com",
    area: "الخليل - وسط البلد",
    status: "available",
    activeOrders: 2,
    totalDeliveries: 156,
    successRate: 97.1,
    cancelledOrders: 5,
    collectedAmount: 32400,
  },
  {
    id: 2,
    name: "أحمد محمد",
    phone: "0501112233",
    email: "ahmad@example.com",
    area: "رام الله - حي الطيرة",
    status: "available",
    activeOrders: 3,
    totalDeliveries: 234,
    successRate: 96.5,
    cancelledOrders: 8,
    collectedAmount: 45600,
  },
  {
    id: 3,
    name: "عبدالله سالم",
    phone: "0504445566",
    email: "abdallah@example.com",
    area: "بيت لحم - البلدة القديمة",
    status: "available",
    activeOrders: 4,
    totalDeliveries: 201,
    successRate: 95.8,
    cancelledOrders: 9,
    collectedAmount: 41200,
  },
  {
    id: 4,
    name: "محمد علي",
    phone: "0502223344",
    email: "mohammad@example.com",
    area: "نابلس - حي رفيديا",
    status: "busy",
    activeOrders: 5,
    totalDeliveries: 189,
    successRate: 94.2,
    cancelledOrders: 11,
    collectedAmount: 38900,
  },
  {
    id: 5,
    name: "سعد فهد",
    phone: "0505556677",
    email: "saad@example.com",
    area: "جنين - حي الجواشين",
    status: "offline",
    activeOrders: 0,
    totalDeliveries: 143,
    successRate: 93.5,
    cancelledOrders: 9,
    collectedAmount: 29800,
  },
];

// TODO: Replace dummy delegates data with GET /api/admin/delegates after performance calculation rules are approved.
// TODO: POST /api/admin/delegates to create employee user + employee profile.
// TODO: PATCH /api/admin/delegates/:id to update employee.
// TODO: PATCH /api/admin/delegates/:id/deactivate to set is_active=false.

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  area: "",
  status: "available",
};

const statusMap = {
  available: "متاح",
  busy: "مشغول",
  offline: "غير متصل",
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function getStatusClass(status) {
  if (status === "available") return "available";
  if (status === "busy") return "busy";
  return "offline";
}

function DelegatesPage() {
  const [delegates, setDelegates] = useState(initialDelegatesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDelegate, setSelectedDelegate] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDelegate, setEditingDelegate] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const filteredDelegates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return delegates.filter((delegate) => {
      const matchesSearch =
        !normalizedSearch ||
        delegate.name.toLowerCase().includes(normalizedSearch) ||
        delegate.phone.includes(normalizedSearch) ||
        delegate.email.toLowerCase().includes(normalizedSearch) ||
        delegate.area.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        activeFilter === "all" || delegate.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [delegates, searchTerm, activeFilter]);

  const summary = useMemo(() => {
    return {
      totalDelegates: delegates.length,
      availableDelegates: delegates.filter((item) => item.status === "available").length,
      busyDelegates: delegates.filter((item) => item.status === "busy").length,
      totalDeliveries: delegates.reduce((sum, item) => sum + item.totalDeliveries, 0),
      collectedAmount: delegates.reduce((sum, item) => sum + item.collectedAmount, 0),
    };
  }, [delegates]);

  const openAddModal = () => {
    setEditingDelegate(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEditModal = (delegate) => {
    setEditingDelegate(delegate);
    setFormData({
      name: delegate.name,
      phone: delegate.phone,
      email: delegate.email,
      area: delegate.area,
      status: delegate.status,
    });
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingDelegate(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitDelegate = (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim() || !formData.area.trim()) {
      alert("الرجاء تعبئة الاسم ورقم الهاتف والمنطقة");
      return;
    }

    if (editingDelegate) {
      setDelegates((prev) =>
        prev.map((delegate) =>
          delegate.id === editingDelegate.id
            ? {
                ...delegate,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                area: formData.area.trim(),
                status: formData.status,
              }
            : delegate
        )
      );
    } else {
      const newDelegate = {
        id: Date.now(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || "-",
        area: formData.area.trim(),
        status: formData.status,
        activeOrders: 0,
        totalDeliveries: 0,
        successRate: 0,
        cancelledOrders: 0,
        collectedAmount: 0,
      };

      setDelegates((prev) => [newDelegate, ...prev]);
    }

    closeFormModal();
  };

  const handleDeactivateDelegate = (delegate) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من تعطيل هذا المندوب؟ لن يظهر كمندوب متاح للتخصيص."
    );

    if (!confirmed) return;

    setDelegates((prev) =>
      prev.map((item) =>
        item.id === delegate.id
          ? {
              ...item,
              status: "offline",
              activeOrders: 0,
            }
          : item
      )
    );
  };

  return (
    <div className="phoenix-delegates-page" dir="rtl">
      <section className="phoenix-delegates-hero">
        <div>
          <h1>إدارة المناديب</h1>
          <p>متابعة أداء المناديب وحالة توزيع الطلبات</p>
        </div>

        <button className="add-delegate-btn" onClick={openAddModal}>
          + إضافة مندوب
        </button>
      </section>

      <section className="phoenix-delegates-summary">
        <div className="phoenix-delegates-stat-card">
          <div className="stat-icon blue">👥</div>
          <span>إجمالي المناديب</span>
          <strong>{summary.totalDelegates}</strong>
        </div>

        <div className="phoenix-delegates-stat-card">
          <div className="stat-icon green">🚚</div>
          <span>المناديب المتاحين</span>
          <strong>{summary.availableDelegates}</strong>
        </div>

        <div className="phoenix-delegates-stat-card">
          <div className="stat-icon orange">📦</div>
          <span>المشغولين</span>
          <strong>{summary.busyDelegates}</strong>
        </div>

        <div className="phoenix-delegates-stat-card">
          <div className="stat-icon blue">✓</div>
          <span>إجمالي التوصيلات</span>
          <strong>{formatNumber(summary.totalDeliveries)}</strong>
        </div>

        <div className="phoenix-delegates-stat-card">
          <div className="stat-icon purple">₪</div>
          <span>المبالغ المحصلة</span>
          <strong>{formatNumber(summary.collectedAmount)} ₪</strong>
        </div>
      </section>

      <section className="phoenix-delegates-toolbar">
        <div className="phoenix-delegates-search">
          <span>⌕</span>
          <input
            type="text"
            value={searchTerm}
            placeholder="البحث عن مندوب بالاسم، الهاتف، البريد، المنطقة..."
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="phoenix-delegates-filters">
          <button
            className={activeFilter === "all" ? "active" : ""}
            onClick={() => setActiveFilter("all")}
          >
            الكل
          </button>
          <button
            className={activeFilter === "available" ? "active" : ""}
            onClick={() => setActiveFilter("available")}
          >
            متاح
          </button>
          <button
            className={activeFilter === "busy" ? "active" : ""}
            onClick={() => setActiveFilter("busy")}
          >
            مشغول
          </button>
          <button
            className={activeFilter === "offline" ? "active" : ""}
            onClick={() => setActiveFilter("offline")}
          >
            غير متصل
          </button>
        </div>
      </section>

      <section className="phoenix-delegates-table-card">
        <div className="phoenix-delegates-table-header">
          <h2>جميع المناديب</h2>
          <p>قائمة المناديب وحالة الأداء الحالية</p>
        </div>

        {filteredDelegates.length === 0 ? (
          <div className="phoenix-delegates-empty">
            لا يوجد مناديب مطابقين لعملية البحث الحالية
          </div>
        ) : (
          <div className="phoenix-delegates-table-wrapper">
            <table className="phoenix-delegates-table">
              <thead>
                <tr>
                  <th>المندوب</th>
                  <th>المنطقة</th>
                  <th>الحالة</th>
                  <th>الطلبات النشطة</th>
                  <th>إجمالي التوصيلات</th>
                  <th>نسبة النجاح</th>
                  <th>الملغاة</th>
                  <th>المبالغ المحصلة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredDelegates.map((delegate) => (
                  <tr key={delegate.id}>
                    <td>
                      <div className="delegate-identity">
                        <div className="delegate-avatar">
                          {delegate.name.charAt(0)}
                        </div>
                        <div>
                          <strong>{delegate.name}</strong>
                          <span>{delegate.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td>{delegate.area}</td>

                    <td>
                      <span className={`delegate-status ${getStatusClass(delegate.status)}`}>
                        {statusMap[delegate.status]}
                      </span>
                    </td>

                    <td>
                      <strong>{delegate.activeOrders}</strong>
                    </td>

                    <td>
                      <strong>{formatNumber(delegate.totalDeliveries)}</strong>
                    </td>

                    <td>
                      <span className="success-rate">{delegate.successRate}% ↗</span>
                    </td>

                    <td>
                      <span className="cancelled-orders">{delegate.cancelledOrders} ×</span>
                    </td>

                    <td>
                      <span className="collected-amount">
                        {formatNumber(delegate.collectedAmount)} ₪
                      </span>
                    </td>

                    <td>
                      <div className="delegate-actions">
                        <button
                          className="details-btn"
                          onClick={() => setSelectedDelegate(delegate)}
                        >
                          التفاصيل
                        </button>

                        <button
                          className="edit-btn"
                          onClick={() => openEditModal(delegate)}
                        >
                          تعديل
                        </button>

                        <button
                          className="deactivate-btn"
                          onClick={() => handleDeactivateDelegate(delegate)}
                          disabled={delegate.status === "offline"}
                        >
                          تعطيل
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedDelegate && (
        <div className="phoenix-delegates-modal-backdrop">
          <div className="phoenix-delegates-modal">
            <div className="modal-head">
              <h3>تفاصيل المندوب</h3>
              <button onClick={() => setSelectedDelegate(null)}>×</button>
            </div>

            <div className="modal-delegate-main">
              <div className="delegate-avatar large">
                {selectedDelegate.name.charAt(0)}
              </div>
              <div>
                <h4>{selectedDelegate.name}</h4>
                <p>{selectedDelegate.phone}</p>
              </div>
            </div>

            <div className="modal-grid">
              <div>
                <span>البريد الإلكتروني</span>
                <strong>{selectedDelegate.email}</strong>
              </div>
              <div>
                <span>المنطقة</span>
                <strong>{selectedDelegate.area}</strong>
              </div>
              <div>
                <span>الحالة</span>
                <strong>{statusMap[selectedDelegate.status]}</strong>
              </div>
              <div>
                <span>الطلبات النشطة</span>
                <strong>{selectedDelegate.activeOrders}</strong>
              </div>
              <div>
                <span>إجمالي التوصيلات</span>
                <strong>{formatNumber(selectedDelegate.totalDeliveries)}</strong>
              </div>
              <div>
                <span>نسبة النجاح</span>
                <strong>{selectedDelegate.successRate}%</strong>
              </div>
              <div>
                <span>الطلبات الملغاة</span>
                <strong>{selectedDelegate.cancelledOrders}</strong>
              </div>
              <div>
                <span>المبالغ المحصلة</span>
                <strong>{formatNumber(selectedDelegate.collectedAmount)} ₪</strong>
              </div>
            </div>

            <div className="modal-note">
              <h5>ملاحظات تشغيلية</h5>
              <p>
                سيتم ربط تفاصيل الأداء والمبالغ لاحقاً بعد اعتماد منطق الحسابات
                التشغيلية والمالية.
              </p>
            </div>

            <button
              className="modal-close-btn"
              onClick={() => setSelectedDelegate(null)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="phoenix-delegates-modal-backdrop">
          <div className="phoenix-delegates-modal">
            <div className="modal-head">
              <h3>{editingDelegate ? "تعديل بيانات المندوب" : "إضافة مندوب"}</h3>
              <button onClick={closeFormModal}>×</button>
            </div>

            <form className="delegate-form" onSubmit={handleSubmitDelegate}>
              <div className="form-group">
                <label>الاسم الكامل</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="مثال: أحمد محمد"
                />
              </div>

              <div className="form-group">
                <label>رقم الهاتف</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="delegate@example.com"
                />
              </div>

              <div className="form-group">
                <label>المنطقة / العنوان</label>
                <input
                  name="area"
                  value={formData.area}
                  onChange={handleFormChange}
                  placeholder="رام الله - حي الطيرة"
                />
              </div>

              <div className="form-group">
                <label>الحالة</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="available">متاح</option>
                  <option value="busy">مشغول</option>
                  <option value="offline">غير متصل</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-form-btn" onClick={closeFormModal}>
                  إلغاء
                </button>
                <button type="submit" className="save-form-btn">
                  {editingDelegate ? "حفظ التعديلات" : "إضافة المندوب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DelegatesPage;
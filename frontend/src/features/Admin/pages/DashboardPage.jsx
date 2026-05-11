import React, { useEffect, useMemo, useState } from "react";
import API from "../../../apis/api";
import "./DashboardPage.css";

const DASHBOARD_REFRESH_INTERVAL_MS = 15000;
const getStatusLabel = (status) => {
  if (status === "delivered") return "تم التسليم";
  if (
    [
      "in_transit",
      "picked_up",
      "confirmed",
      "out_for_delivery",
      "accepted",
      "assigned",
      "in_progress",
      "in_delivery",
    ].includes(status)
  ) {
    return "قيد التوصيل";
  }
  return "جديد";
};

const getStatusBadgeClass = (status) => {
  if (status === "delivered") return "admin-dashboard__status admin-dashboard__status--delivered";
  if (
    [
      "in_transit",
      "picked_up",
      "confirmed",
      "out_for_delivery",
      "accepted",
      "assigned",
      "in_progress",
      "in_delivery",
    ].includes(status)
  ) {
    return "admin-dashboard__status admin-dashboard__status--in-progress";
  }
  return "admin-dashboard__status admin-dashboard__status--new";
};

const formatCurrency = (value) =>
  `${new Intl.NumberFormat("ar").format(Number(value) || 0)} ₪`;

const formatNumber = (value) => new Intl.NumberFormat("ar").format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("ar", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildRevenueChart = (data) => {
  const width = 960;
  const height = 320;
  const paddingLeft = 76;
  const paddingRight = 28;
  const paddingTop = 22;
  const paddingBottom = 54;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...data.map((item) => item.value), 0);
  const normalizedMax = maxValue <= 0 ? 10 : Math.ceil(maxValue / 10) * 10;
  const yAxisTicks = Array.from({ length: 5 }, (_, index) => {
    const step = index / 4;
    const value = Math.round(normalizedMax * (1 - step));
    const y = paddingTop + chartHeight * step;
    return { value, y };
  });

  const points = data.map((item, index) => {
    const x = paddingLeft + (index * chartWidth) / Math.max(data.length - 1, 1);
    const y =
      paddingTop +
      chartHeight -
      ((item.value || 0) / Math.max(normalizedMax, 1)) * chartHeight;

    return { ...item, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${
        height - paddingBottom
      } Z`
    : "";

  return {
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingBottom,
    points,
    linePath,
    areaPath,
    yAxisTicks,
  };
};

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    dailyProfit: 0,
    deliveredTodayCount: 0,
    pendingShipments: 0,
    activeShipments: 0,
    availableDelegates: 0,
    regionDistribution: [],
    ordersByCity: [],
    weeklyRevenue: [],
    recentOrders: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) setIsLoading(true);
        setError("");

        const response = await API.get("/admin/dashboard");
        const payload = response?.data?.data;

        if (!isMounted || !payload) return;

        setDashboardData({
          dailyProfit: Number(payload.dailyProfit) || 0,
          deliveredTodayCount: Number(payload.deliveredTodayCount) || 0,
          pendingShipments: Number(payload.pendingShipments) || 0,
          activeShipments: Number(payload.activeShipments) || 0,
          availableDelegates: Number(payload.availableDelegates) || 0,
          regionDistribution: Array.isArray(payload.regionDistribution)
            ? payload.regionDistribution
            : [],
          ordersByCity: Array.isArray(payload.ordersByCity) ? payload.ordersByCity : [],
          weeklyRevenue: Array.isArray(payload.weeklyRevenue) ? payload.weeklyRevenue : [],
          recentOrders: Array.isArray(payload.recentOrders)
            ? payload.recentOrders.slice(0, 10)
            : [],
        });
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message || "تعذر تحميل بيانات لوحة التحكم حالياً."
        );
      } finally {
        if (isMounted && showLoader) {
          setIsLoading(false);
        }
      }
    };

    const refreshDashboard = () => {
      fetchDashboard();
    };

    fetchDashboard({ showLoader: true });
    const intervalId = window.setInterval(refreshDashboard, DASHBOARD_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshDashboard);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDashboard);
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        id: "active-shipments",
        title: "الطلبات النشطة",
        value: String(dashboardData.activeShipments),
        note: "",
        noteType: "positive",
        icon: "bi-box-seam",
      },
      {
        id: "available-delegates",
        title: "المناديب المتاحون",
        value: String(dashboardData.availableDelegates),
        note: "",
        noteType: "positive",
        icon: "bi-people",
      },
      {
        id: "daily-profit",
        title: "الأرباح اليومية",
        value: formatCurrency(dashboardData.dailyProfit),
        note: "",
        noteType: "positive",
        icon: "bi-cash-stack",
      },
      {
        id: "delivered-today",
        title: "المسلّمة اليوم",
        value: String(dashboardData.deliveredTodayCount),
        note: "",
        noteType: "positive",
        icon: "bi-check2-circle",
      },
      {
        id: "pending-shipments",
        title: "الطرود المعلقة",
        value: String(dashboardData.pendingShipments),
        note: "",
        noteType: "negative",
        icon: "bi-hourglass-split",
      },
    ],
    [dashboardData]
  );

  const weeklyRevenue = useMemo(
    () =>
      dashboardData.weeklyRevenue.map((item) => ({
        day: item.day,
        date: item.date,
        value: Number(item.value ?? item.total) || 0,
      })),
    [dashboardData.weeklyRevenue]
  );

  const ordersByCity = useMemo(
    () =>
      (dashboardData.ordersByCity.length > 0
        ? dashboardData.ordersByCity
        : dashboardData.regionDistribution
      ).map((item) => ({
        city: item.city || "-",
        label: item.city || "-",
        count: Number(item.count) || 0,
      })),
    [dashboardData.ordersByCity, dashboardData.regionDistribution]
  );

  const recentOrders = useMemo(
    () =>
      dashboardData.recentOrders.map((order) => ({
        id: `#${order.id}`,
        merchant: order.merchant_name || "-",
        status: order.status || "pending",
        courier: order.delegate_name || "-",
        createdAt: formatDateTime(order.created_at),
      })),
    [dashboardData.recentOrders]
  );

  const revenueChart = buildRevenueChart(weeklyRevenue);
  const weeklyRevenueTotal = weeklyRevenue.reduce((sum, item) => sum + item.value, 0);
  const maxRegionCount = Math.max(...ordersByCity.map((item) => item.count), 1);
  const isEmpty =
    !isLoading &&
    !error &&
    dashboardData.dailyProfit === 0 &&
    dashboardData.deliveredTodayCount === 0 &&
    dashboardData.pendingShipments === 0 &&
    dashboardData.activeShipments === 0 &&
    dashboardData.availableDelegates === 0 &&
    ordersByCity.length === 0 &&
    weeklyRevenue.every((item) => item.value === 0) &&
    recentOrders.length === 0;

  if (error) {
    return (
      <section dir="rtl" className="admin-dashboard">
        <article className="admin-dashboard__card admin-dashboard__state-card">
          <h2 className="admin-dashboard__card-title">تعذر تحميل لوحة التحكم</h2>
          <p className="admin-dashboard__card-subtitle">{error}</p>
        </article>
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section dir="rtl" className="admin-dashboard">
        <article className="admin-dashboard__card admin-dashboard__state-card">
          <h2 className="admin-dashboard__card-title">لا توجد بيانات للعرض</h2>
          <p className="admin-dashboard__card-subtitle">
            ستظهر بيانات لوحة التحكم هنا عند توفر الشحنات والعمليات.
          </p>
        </article>
      </section>
    );
  }

  return (
    <section dir="rtl" className="admin-dashboard">
      <div className="admin-dashboard__stats">
        {stats.map((stat) => (
          <article key={stat.id} className="admin-dashboard__stat-card">
            <div className="admin-dashboard__stat-icon">
              <i className={`bi ${stat.icon}`}></i>
            </div>

            <div className="admin-dashboard__stat-content">
              <p className="admin-dashboard__stat-title">{stat.title}</p>
              <h3 className="admin-dashboard__stat-value">{isLoading ? "—" : stat.value}</h3>
              {stat.note ? (
                <p
                  className={`admin-dashboard__stat-note ${
                    stat.noteType === "positive"
                      ? "admin-dashboard__stat-note--positive"
                      : "admin-dashboard__stat-note--negative"
                  }`}
                >
                  {stat.note}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="admin-dashboard__chart-grid">
        <article className="admin-dashboard__card admin-dashboard__chart-card">
          <div className="admin-dashboard__card-head">
            <div>
              <h2 className="admin-dashboard__card-title">الإيرادات الأسبوعية</h2>
              <p className="admin-dashboard__card-subtitle">
                الإجمالي الأسبوعي: {isLoading ? "—" : formatCurrency(weeklyRevenueTotal)}
              </p>
            </div>
          </div>

          <div className="admin-dashboard__revenue-chart">
            {isLoading ? (
              <div className="admin-dashboard__state-inline">جاري تحميل البيانات...</div>
            ) : weeklyRevenue.length === 0 ? (
              <div className="admin-dashboard__state-inline">لا توجد إيرادات أسبوعية</div>
            ) : (
              <svg
                className="admin-dashboard__revenue-svg"
                viewBox={`0 0 ${revenueChart.width} ${revenueChart.height}`}
                preserveAspectRatio="none"
                aria-label="مخطط الإيرادات الأسبوعية"
                role="img"
              >
                <defs>
                  <linearGradient id="phoenixRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.04" />
                  </linearGradient>
                </defs>

                {revenueChart.yAxisTicks.map((tick) => (
                  <g key={`${tick.value}-${tick.y}`}>
                    <line
                      x1={revenueChart.paddingLeft}
                      x2={revenueChart.width - revenueChart.paddingRight}
                      y1={tick.y}
                      y2={tick.y}
                      className="admin-dashboard__grid-line"
                    />
                    <text
                      x={revenueChart.paddingLeft - 12}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="admin-dashboard__y-axis-label"
                    >
                      {formatNumber(tick.value)}
                    </text>
                  </g>
                ))}

                <path d={revenueChart.areaPath} className="admin-dashboard__area-path" />
                <path d={revenueChart.linePath} className="admin-dashboard__line-path" />

                {revenueChart.points.map((point) => (
                  <g key={point.date}>
                    <title>{`اليوم: ${point.day} | الإيراد: ${formatCurrency(point.value)}`}</title>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      className="admin-dashboard__point"
                    />
                    <text
                      x={point.x}
                      y={revenueChart.height - 14}
                      textAnchor="middle"
                      className="admin-dashboard__axis-label"
                    >
                      {point.day}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </article>

        <article className="admin-dashboard__card admin-dashboard__chart-card">
          <div className="admin-dashboard__card-head">
            <div>
              <h2 className="admin-dashboard__card-title">الطلبات حسب مدينة الاستلام</h2>
              <p className="admin-dashboard__card-subtitle">توزيع الشحنات النشطة حسب مدينة الاستلام</p>
            </div>
          </div>

          <div className="admin-dashboard__region-chart">
            {isLoading ? (
              <div className="admin-dashboard__state-inline">جاري تحميل البيانات...</div>
            ) : ordersByCity.length === 0 ? (
              <div className="admin-dashboard__state-inline">لا توجد بيانات مدن</div>
            ) : (
              <div className="admin-dashboard__region-list">
                {ordersByCity.map((item) => (
                  <div key={item.city} className="admin-dashboard__region-row">
                    <div className="admin-dashboard__region-row-head">
                      <span className="admin-dashboard__region-row-label">{item.label}</span>
                      <span className="admin-dashboard__region-row-value">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                    <div
                      className="admin-dashboard__region-row-track"
                      title={`المدينة: ${item.label} | عدد الطلبات: ${formatNumber(item.count)}`}
                    >
                      <div
                        className="admin-dashboard__region-row-bar"
                        style={{ width: `${Math.max((item.count / maxRegionCount) * 100, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>

      <article className="admin-dashboard__card admin-dashboard__table-card">
        <div className="admin-dashboard__card-head admin-dashboard__card-head--table">
          <div>
            <h2 className="admin-dashboard__card-title">آخر الشحنات</h2>
            <p className="admin-dashboard__card-subtitle">آخر 10 شحنات في النظام</p>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-dashboard__state-inline">جاري تحميل البيانات...</div>
        ) : recentOrders.length === 0 ? (
          <div className="admin-dashboard__state-inline">لا توجد شحنات حديثة</div>
        ) : (
          <div className="admin-dashboard__table-wrap">
            <table className="admin-dashboard__table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>التاجر</th>
                  <th>الحالة</th>
                  <th>المندوب</th>
                  <th>تاريخ الإنشاء</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-dashboard__order-id">{order.id}</td>
                    <td>{order.merchant}</td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>{order.courier}</td>
                    <td>{order.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}

export default DashboardPage;

import React, { useEffect, useMemo, useState } from "react";
import API from "../../../apis/api";
import "./DashboardPage.css";

const fallbackStats = {
  activeOrders: 156,
  availableEmployees: 24,
  pendingOrders: 12,
  dailyRevenue: 24600,
};

const fallbackWeeklyRevenue = [
  { day: "السبت", total: 4400 },
  { day: "الأحد", total: 5000 },
  { day: "الاثنين", total: 4800 },
  { day: "الثلاثاء", total: 6200 },
  { day: "الأربعاء", total: 5800 },
  { day: "الخميس", total: 7200 },
  { day: "الجمعة", total: 7000 },
];

const fallbackOrdersByCity = [
  { name: "رام الله", total: 240 },
  { name: "نابلس", total: 190 },
  { name: "الخليل", total: 155 },
  { name: "بيت لحم", total: 140 },
  { name: "جنين", total: 95 },
];

const fallbackRecentOrders = [
  {
    id: 4521,
    merchant: "متجر الأناقة",
    status: "in_transit",
    driver: "أحمد محمد",
    time: "10:30 ص",
  },
  {
    id: 4520,
    merchant: "متجر الإلكترونيات",
    status: "delivered",
    driver: "محمد علي",
    time: "10:15 ص",
  },
  {
    id: 4519,
    merchant: "متجر الأزياء",
    status: "pending",
    driver: "-",
    time: "10:00 ص",
  },
  {
    id: 4518,
    merchant: "متجر الكتب",
    status: "in_transit",
    driver: "خالد أحمد",
    time: "09:45 ص",
  },
];

const getStatusLabel = (status) => {
  if (status === "delivered") return "تم التسليم";
  if (["in_transit", "picked_up", "confirmed", "out_for_delivery", "accepted"].includes(status)) {
    return "قيد التوصيل";
  }
  return "جديد";
};

const getStatusBadgeClass = (status) => {
  if (status === "delivered") return "admin-dashboard__status admin-dashboard__status--delivered";
  if (["in_transit", "picked_up", "confirmed", "out_for_delivery", "accepted"].includes(status)) {
    return "admin-dashboard__status admin-dashboard__status--in-progress";
  }
  return "admin-dashboard__status admin-dashboard__status--new";
};

const formatCurrency = (value) => `${new Intl.NumberFormat("ar").format(Number(value) || 0)} ₪`;

const buildRevenueChart = (data) => {
  const width = 640;
  const height = 260;
  const paddingX = 30;
  const paddingTop = 24;
  const paddingBottom = 42;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingX * 2;

  const points = data.map((item, index) => {
    const x = paddingX + (index * chartWidth) / Math.max(data.length - 1, 1);
    const y = paddingTop + chartHeight - (item.value / maxValue) * chartHeight;

    return { ...item, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  return {
    width,
    height,
    paddingBottom,
    points,
    linePath,
    areaPath,
  };
};

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    stats: fallbackStats,
    weeklyRevenue: fallbackWeeklyRevenue,
    ordersByCity: fallbackOrdersByCity,
    recentOrders: fallbackRecentOrders,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        const response = await API.get("/admin/dashboard");
        const payload = response?.data?.data;

        if (!isMounted || !payload) {
          return;
        }

        setDashboardData({
          stats: {
            activeOrders: Number(payload.stats?.activeOrders) || 0,
            availableEmployees: Number(payload.stats?.availableEmployees) || 0,
            pendingOrders: Number(payload.stats?.pendingOrders) || 0,
            dailyRevenue: Number(payload.stats?.dailyRevenue) || 0,
          },
          weeklyRevenue:
            payload.weeklyRevenue?.length > 0 ? payload.weeklyRevenue : fallbackWeeklyRevenue,
          ordersByCity:
            payload.ordersByCity?.length > 0 ? payload.ordersByCity : fallbackOrdersByCity,
          recentOrders:
            payload.recentOrders?.length > 0 ? payload.recentOrders : fallbackRecentOrders,
        });
      } catch (error) {
        console.error("تعذر تحميل بيانات لوحة تحكم الأدمن:", error);
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        id: "active-orders",
        title: "الطلبات النشطة",
        value: String(dashboardData.stats.activeOrders),
        note: "الطرود الجديدة مع الطرود المسندة النشطة ضمن التشغيل",
        noteType: "positive",
        icon: "bi-box-seam",
      },
      {
        id: "available-couriers",
        title: "المناديب المتاحين",
        value: String(dashboardData.stats.availableEmployees),
        note: "المناديب النشطون الذين لديهم أقل من 5 طرود جارية",
        noteType: "positive",
        icon: "bi-people",
      },
      {
        id: "pending-assignment",
        title: "الطرود المعلقة",
        value: String(dashboardData.stats.pendingOrders),
        note: "الطرود التي ما زالت بانتظار التخصيص",
        noteType: "negative",
        icon: "bi-hourglass-split",
      },
      {
        id: "daily-profit",
        title: "الأرباح اليومية",
        value: formatCurrency(dashboardData.stats.dailyRevenue),
        note: "إجمالي أرباح الطلبات التي تم تسليمها اليوم",
        noteType: "positive",
        icon: "bi-cash-stack",
      },
    ],
    [dashboardData.stats],
  );

  const weeklyRevenue = useMemo(
    () =>
      dashboardData.weeklyRevenue.map((item) => ({
        day: item.day,
        value: Number(item.total) || 0,
      })),
    [dashboardData.weeklyRevenue],
  );

  const ordersByCity = useMemo(
    () =>
      dashboardData.ordersByCity.map((item) => ({
        city: item.name,
        orders: Number(item.total) || 0,
      })),
    [dashboardData.ordersByCity],
  );

  const recentOrders = useMemo(
    () =>
      dashboardData.recentOrders.map((order) => ({
        id: `#${order.id}`,
        merchant: order.merchant || "-",
        status: order.status || "pending",
        courier: order.driver || "-",
        time: order.time || "-",
      })),
    [dashboardData.recentOrders],
  );

  const revenueChart = buildRevenueChart(weeklyRevenue);
  const maxCityOrders = Math.max(...ordersByCity.map((item) => item.orders), 1);
  const weeklyRevenueTotal = weeklyRevenue.reduce((sum, item) => sum + item.value, 0);

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
              <h3 className="admin-dashboard__stat-value">{stat.value}</h3>
              <p
                className={`admin-dashboard__stat-note ${
                  stat.noteType === "positive"
                    ? "admin-dashboard__stat-note--positive"
                    : "admin-dashboard__stat-note--negative"
                }`}
              >
                {stat.note}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="admin-dashboard__charts">
        <article className="admin-dashboard__card admin-dashboard__card--wide">
          <div className="admin-dashboard__card-head">
            <div>
              <h2 className="admin-dashboard__card-title">الإيرادات الأسبوعية</h2>
              <p className="admin-dashboard__card-subtitle">
                إجمالي: {formatCurrency(weeklyRevenueTotal)}
              </p>
            </div>
          </div>

          <div className="admin-dashboard__revenue-chart">
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
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75, 1].map((step) => {
                const y =
                  24 +
                  (revenueChart.height - 24 - revenueChart.paddingBottom) *
                    (1 - step);

                return (
                  <line
                    key={step}
                    x1="24"
                    x2={revenueChart.width - 24}
                    y1={y}
                    y2={y}
                    className="admin-dashboard__grid-line"
                  />
                );
              })}

              <path d={revenueChart.areaPath} className="admin-dashboard__area-path" />
              <path d={revenueChart.linePath} className="admin-dashboard__line-path" />

              {revenueChart.points.map((point) => (
                <g key={point.day}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5.5"
                    className="admin-dashboard__point"
                  />
                  <text
                    x={point.x}
                    y={revenueChart.height - 12}
                    textAnchor="middle"
                    className="admin-dashboard__axis-label"
                  >
                    {point.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </article>

        <article className="admin-dashboard__card">
          <div className="admin-dashboard__card-head">
            <div>
              <h2 className="admin-dashboard__card-title">الطلبات حسب المنطقة</h2>
              <p className="admin-dashboard__card-subtitle">توزيع الطلبات الحالية</p>
            </div>
          </div>

          <div className="admin-dashboard__bars">
            {ordersByCity.map((item) => (
              <div key={item.city} className="admin-dashboard__bar-item">
                <div className="admin-dashboard__bar-head">
                  <span>{item.city}</span>
                  <span>{item.orders}</span>
                </div>

                <div className="admin-dashboard__bar-track">
                  <div
                    className="admin-dashboard__bar-fill"
                    style={{ width: `${(item.orders / maxCityOrders) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="admin-dashboard__card admin-dashboard__table-card">
        <div className="admin-dashboard__card-head admin-dashboard__card-head--table">
          <div>
            <h2 className="admin-dashboard__card-title">الطلبات الأخيرة</h2>
            <p className="admin-dashboard__card-subtitle">آخر التحديثات في النظام</p>
          </div>

          <button type="button" className="admin-dashboard__view-all">
            عرض الكل
          </button>
        </div>

        <div className="admin-dashboard__table-wrap">
          <table className="admin-dashboard__table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>التاجر</th>
                <th>الحالة</th>
                <th>المندوب</th>
                <th>الوقت</th>
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
                  <td>{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default DashboardPage;

import React, { useEffect, useMemo, useState } from 'react';
import '../../../styles/dashboard-pages.css';
import { getEmployeeDashboard } from '../services/employeeService';

function EmployeeDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getEmployeeDashboard();

        if (isMounted) {
          setDashboard(response?.data || null);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              'تعذر تحميل بيانات لوحة التحكم. تأكد من تشغيل الخادم الخلفي ووجود بيانات موظف تجريبية.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusType = (status) => {
    if (['delivered'].includes(status)) {
      return 'completed';
    }

    if (
      ['accepted', 'picked_up', 'in_transit', 'out_for_delivery', 'confirmed', 'arrived_to_destination_city'].includes(
        status
      )
    ) {
      return 'progress';
    }

    return 'pending';
  };

  const formatCurrency = (value) => {
    const numericValue = Number(value || 0);
    return `₪${numericValue.toLocaleString('en-US')}`;
  };

  const safeStats = {
    activeOrders: Number(dashboard?.stats?.activeOrders ?? 0),
    completedToday: Number(dashboard?.stats?.completedToday ?? 0),
  };

  const stats = useMemo(
    () => [
      {
        title: 'الطلبات الجارية',
        value: loading ? '—' : String(safeStats.activeOrders || 0),
        icon: 'bi-box-seam',
        helper: 'طلبات قيد التنفيذ الآن',
        tone: 'info',
      },
      {
        title: 'المكتملة اليوم',
        value: loading ? '—' : String(safeStats.completedToday || 0),
        icon: 'bi-check2-circle',
        helper: 'طلبات أُنجزت خلال اليوم',
        tone: 'success',
      },
    ],
    [loading, safeStats.activeOrders, safeStats.completedToday]
  );

  const tasks = useMemo(() => {
    return (dashboard?.tasks || []).map((task) => ({
      ...task,
      priceLabel:
        task.price === null || task.price === undefined ? '—' : formatCurrency(task.price),
      statusType: getStatusType(task.status),
      fromLabel: task.from ? `من: ${task.from}` : 'من: غير متوفر',
      toLabel: task.to ? `إلى: ${task.to}` : 'إلى: غير متوفر',
      timeLabel: task.timeWindow || 'غير محدد',
    }));
  }, [dashboard]);

  const employeeName = dashboard?.employee?.full_name || 'الموظف';

  return (
    <div className="employee-dashboard" dir="rtl">
      <section className="employee-dashboard__hero">
        <div className="employee-dashboard__hero-copy">
          <h1 className="employee-dashboard__hero-title"> الرئيسية</h1>
          <p className="employee-dashboard__hero-subtitle">
            {loading
              ? 'جاري تحميل ملخص النشاط والمهام الخاصة بك...'
              : `مرحبًا ${employeeName}، هنا ستجد ملخص يومك والمهام المخصصة لك بشكل واضح ومنظم.`}
          </p>
        </div>

        <div className="employee-dashboard__hero-icon">
          <i className="bi bi-grid-1x2"></i>
        </div>
      </section>

      <div className="dashboard-page__stats employee-dashboard__stats-grid">
        {stats.map((stat) => (
          <article key={stat.title} className="dashboard-page__stat-card employee-dashboard__stat-card">
            <div
              className={`employee-dashboard__stat-icon-wrapper employee-dashboard__stat-icon-wrapper--${stat.tone}`}
            >
              <i className={`bi ${stat.icon}`}></i>
            </div>
            <h3 className="dashboard-page__stat-title employee-dashboard__stat-title">{stat.title}</h3>
            <p className="dashboard-page__stat-value employee-dashboard__stat-value">{stat.value}</p>
            <p className="employee-dashboard__stat-helper">{stat.helper}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-page__sections employee-dashboard__sections-single">
        <section className="dashboard-page__section employee-dashboard__tasks-section employee-dashboard__tasks-section--wide">
          <div className="dashboard-page__section-header employee-dashboard__section-header">
            <div>
              <h2 className="dashboard-page__section-title">المهام اليومية</h2>
              <p className="employee-dashboard__section-hint">
                راجع الشحنات المخصصة لك اليوم وتابع حالتها بسرعة ووضوح.
              </p>
            </div>
          </div>

          <div className="employee-dashboard__tasks-list">
            {loading && (
              <div className="dashboard-page__task-card employee-dashboard__task-card">
                <div className="dashboard-page__task-top">
                  <span className="dashboard-page__price">—</span>
                  <span className="dashboard-page__badge dashboard-page__badge--pending">
                    جاري التحميل
                  </span>
                </div>
                <p className="dashboard-page__task-address-from">يتم الآن تحميل المهام المخصصة لك.</p>
                <p className="dashboard-page__task-address-to">يرجى الانتظار قليلًا.</p>
                <p className="dashboard-page__task-time">
                  <i className="bi bi-clock"></i> —
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="dashboard-page__task-card employee-dashboard__task-card employee-dashboard__task-card--empty">
                <div className="employee-dashboard__empty-icon">
                  <i className="bi bi-wifi-off"></i>
                </div>
                <strong className="employee-dashboard__empty-title">تعذر تحميل البيانات</strong>
                <p className="dashboard-page__task-address-from employee-dashboard__empty-text">{error}</p>
                <p className="dashboard-page__task-address-to employee-dashboard__empty-subtext">
                  لا تحتاج إلى تسجيل دخول كامل الآن. يكفي تشغيل الـ backend ووجود بيانات موظف
                  تجريبية.
                </p>
              </div>
            )}

            {!loading && !error && tasks.length === 0 && (
              <div className="dashboard-page__task-card employee-dashboard__task-card employee-dashboard__task-card--empty">
                <div className="employee-dashboard__empty-icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <strong className="employee-dashboard__empty-title">لا توجد مهام حاليًا</strong>
                <p className="employee-dashboard__empty-subtext">
                  ستظهر الشحنات هنا بمجرد إسنادها إليك.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              tasks.map((task) => (
                <div key={task.shipmentId} className="dashboard-page__task-card employee-dashboard__task-card">
                  <div className="dashboard-page__task-top">
                    <span className="dashboard-page__price">{task.priceLabel}</span>
                    <span
                      className={`dashboard-page__badge dashboard-page__badge--${task.statusType}`}
                    >
                      {task.statusLabel}
                    </span>
                  </div>
                  <p className="dashboard-page__task-address-from">{task.fromLabel}</p>
                  <p className="dashboard-page__task-address-to">{task.toLabel}</p>
                  <p className="dashboard-page__task-time">
                    <i className="bi bi-clock"></i> {task.timeLabel}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default EmployeeDashboardPage;

import React, { useEffect, useMemo, useState } from 'react';
import '../../../styles/dashboard-pages.css';
import {
  getEmployeeDashboard,
  updateEmployeeAvailabilityStatus,
} from '../services/employeeService';

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'متاح' },
  { value: 'busy', label: 'مشغول' },
  { value: 'offline', label: 'غير متصل' },
];

function EmployeeDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getEmployeeDashboard();

        if (isMounted) {
          setDashboard(response?.data || null);
          setAvailabilityStatus(response?.data?.employee?.availabilityStatus || 'available');
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
    if (['delivered'].includes(status)) return 'completed';

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
        helper: '',
        tone: 'info',
      },
      {
        title: 'المكتملة اليوم',
        value: loading ? '—' : String(safeStats.completedToday || 0),
        icon: 'bi-check2-circle',
        helper: 'إجمالي الطلبات المكتملة اليوم',
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

  const handleAvailabilityChange = async (nextStatus) => {
    if (nextStatus === availabilityStatus) return;

    const previousStatus = availabilityStatus;

    try {
      setUpdatingStatus(true);
      setStatusMessage('');
      setAvailabilityStatus(nextStatus);

      const response = await updateEmployeeAvailabilityStatus(nextStatus);
      const nextLabel = response?.data?.availabilityStatusLabel || 'تم التحديث';

      setDashboard((current) =>
        current
          ? {
              ...current,
              employee: {
                ...current.employee,
                availabilityStatus: response?.data?.availabilityStatus || nextStatus,
                availabilityStatusLabel: nextLabel,
              },
            }
          : current
      );

      setStatusMessage(`تم تحديث حالة التوفر إلى ${nextLabel}`);
    } catch (requestError) {
      setAvailabilityStatus(previousStatus);
      setStatusMessage(
        requestError?.response?.data?.message || 'تعذر تحديث حالة التوفر حالياً.'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="employee-dashboard" dir="rtl">
      <section className="employee-dashboard__hero">
        <div className="employee-dashboard__hero-copy">
          <h1 className="employee-dashboard__hero-title">الرئيسية</h1>
          <p className="employee-dashboard__hero-subtitle">
            {loading
              ? 'جاري تحميل الملخص...'
              : `مرحبًا ${employeeName}`}
          </p>
        </div>

        <div className="employee-dashboard__hero-icon">
          <i className="bi bi-grid-1x2"></i>
        </div>
      </section>

      <section className="dashboard-page__section employee-dashboard__availability-section">
        <div className="dashboard-page__section-header employee-dashboard__section-header">
          <div>
            <h2 className="dashboard-page__section-title">حالة التوفر</h2>
          </div>
        </div>

        <div className="employee-dashboard__availability-grid">
          {AVAILABILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`employee-dashboard__availability-option ${
                availabilityStatus === option.value
                  ? 'employee-dashboard__availability-option--active'
                  : ''
              }`}
              onClick={() => handleAvailabilityChange(option.value)}
              disabled={updatingStatus}
            >
              <strong>{option.label}</strong>
            </button>
          ))}
        </div>

        {statusMessage ? (
          <p className="employee-dashboard__availability-note">{statusMessage}</p>
        ) : null}
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
            {stat.helper ? (
              <span
                className="employee-dashboard__info-icon"
                title={stat.helper}
                aria-label={stat.helper}
              >
                <i className="bi bi-info-circle"></i>
              </span>
            ) : null}
          </article>
        ))}
      </div>

      <div className="dashboard-page__sections employee-dashboard__sections-single">
        <section className="dashboard-page__section employee-dashboard__tasks-section employee-dashboard__tasks-section--wide">
          <div className="dashboard-page__section-header employee-dashboard__section-header">
            <div>
              <h2 className="dashboard-page__section-title">المهام اليومية</h2>
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
              </div>
            )}

            {!loading && !error && tasks.length === 0 && (
              <div className="dashboard-page__task-card employee-dashboard__task-card employee-dashboard__task-card--empty">
                <div className="employee-dashboard__empty-icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <strong className="employee-dashboard__empty-title">لا توجد مهام حالياً</strong>
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

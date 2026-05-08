import React, { useEffect, useMemo, useState } from 'react';
import './ordersPage.css';
import API from '../../../apis/api';

const STATUS_META = {
  available: {
    label: 'متاحة',
    tone: 'available',
    group: 'available',
    cardActionLabel: 'قبول الطلب',
    detailsActionLabel: 'قبول الطلب',
  },
  in_progress: {
    label: 'جارية',
    tone: 'progress',
    group: 'inProgress',
    cardActionLabel: 'إتمام التوصيل',
    detailsActionLabel: 'إتمام التوصيل',
  },
  completed: {
    label: 'مكتملة',
    tone: 'completed',
    group: 'completed',
    cardActionLabel: 'تم التوصيل',
    detailsActionLabel: 'تم التوصيل',
  },
  returned: {
    label: 'مرتجعة',
    tone: 'returned',
    group: 'returned',
    cardActionLabel: 'تعذر التسليم',
    detailsActionLabel: 'تعذر التسليم',
  },
};

STATUS_META.cancelled = {
  label: 'ملغاة',
  tone: 'returned',
  group: 'returned',
  cardActionLabel: 'الطلب ملغى',
  detailsActionLabel: 'الطلب ملغى',
};

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'available', label: 'متاحة' },
  { key: 'inProgress', label: 'جارية' },
  { key: 'completed', label: 'مكتملة' },
  { key: 'returned', label: 'مرتجعة' },
];

const currencyFormatter = new Intl.NumberFormat('en-US');

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.available;

const formatPrice = (price) => `₪${currencyFormatter.format(Number(price || 0))}`;

const fallbackText = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  return String(value);
};

const matchesFilter = (order, filterKey) => {
  if (filterKey === 'all') {
    return true;
  }

  return getStatusMeta(order.status).group === filterKey;
};

const mapOrderForUi = (order) => {
  const statusMeta = getStatusMeta(order.status);

  return {
    ...order,
    id: order.id ?? order.orderId ?? order.shipmentId ?? 0,
    shipmentId: order.shipmentId ?? null,
    shipmentNumber: fallbackText(order.shipmentNumber),
    pickupAddress: fallbackText(order.pickupAddress),
    deliveryAddress: fallbackText(order.deliveryAddress),
    senderName: fallbackText(order.senderName),
    senderPhone: fallbackText(order.senderPhone),
    receiverName: fallbackText(order.receiverName || order.customerName),
    receiverPhone: fallbackText(order.receiverPhone),
    parcelType: fallbackText(order.parcelType),
    parcelDescription: fallbackText(order.parcelDescription),
    specialNotes: fallbackText(order.specialNotes),
    time: fallbackText(order.time),
    destinationCity: fallbackText(order.destinationCity),
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    statusGroup: statusMeta.group,
    cardActionLabel: statusMeta.cardActionLabel,
    detailsActionLabel: statusMeta.detailsActionLabel,
    formattedPrice: formatPrice(order.price),
  };
};

function EmployeeOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [shipmentQuery, setShipmentQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingShipmentId, setUpdatingShipmentId] = useState(null);
  const [updatingLocationShipmentId, setUpdatingLocationShipmentId] = useState(null);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setLoadError('');

      const response = await API.get('/employees/orders');
      const fetchedOrders = response.data?.data?.orders || [];

      setOrders(fetchedOrders.map(mapOrderForUi));
    } catch (error) {
      setLoadError('تعذر تحميل الطلبات حاليًا. حاول مرة أخرى.');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filterCounts = useMemo(() => {
    return orders.reduce(
      (accumulator, order) => {
        accumulator.all += 1;
        accumulator[order.statusGroup] += 1;
        return accumulator;
      },
      { all: 0, available: 0, inProgress: 0, completed: 0, returned: 0 }
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedShipmentQuery = shipmentQuery.trim().toLowerCase();
    const normalizedCustomerQuery = customerQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesShipment =
        !normalizedShipmentQuery ||
        String(order.id).toLowerCase().includes(normalizedShipmentQuery) ||
        order.shipmentNumber.toLowerCase().includes(normalizedShipmentQuery);

      const matchesCustomer =
        !normalizedCustomerQuery ||
        order.receiverName.toLowerCase().includes(normalizedCustomerQuery) ||
        order.senderName.toLowerCase().includes(normalizedCustomerQuery);

      return matchesFilter(order, activeFilter) && matchesShipment && matchesCustomer;
    });
  }, [activeFilter, customerQuery, orders, shipmentQuery]);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const hasOrders = orders.length > 0;
  const hasSearchQuery = Boolean(shipmentQuery.trim() || customerQuery.trim());
  const hasFilteredOrders = filteredOrders.length > 0;

  const replaceOrder = (updatedOrder) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.shipmentId === updatedOrder.shipmentId ? mapOrderForUi(updatedOrder) : order
      )
    );
  };

  const openDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setIsDetailsOpen(true);
  };

  const updateShipmentStatus = async (order, nextStatus) => {
    if (!order?.shipmentId) {
      return;
    }

    try {
      setUpdatingShipmentId(order.shipmentId);
      setActionError('');

      const payload =
        nextStatus === 'delivered'
          ? {
              status: nextStatus,
              currentLocation: order.destinationCity !== '-' ? order.destinationCity : undefined,
            }
          : {
              status: nextStatus,
            };

      const response = await API.patch(
        `/employees/orders/${order.shipmentId}/status`,
        payload
      );

      const updatedOrder = response.data?.data;

      if (updatedOrder) {
        replaceOrder(updatedOrder);
      }

      if (nextStatus === 'picked_up') {
        setActiveFilter('inProgress');
      }

      if (nextStatus === 'delivered') {
        setActiveFilter('completed');
      }

      if (nextStatus === 'returned') {
        setActiveFilter('returned');
      }
    } catch (error) {
      setActionError('تعذر تحديث حالة الطلب. حاول مرة أخرى.');
    } finally {
      setUpdatingShipmentId(null);
    }
  };

  const updateShipmentLocation = async (order) => {
    if (!order?.shipmentId) {
      return;
    }

    if (!navigator.geolocation) {
      setActionError('المتصفح لا يدعم خدمة تحديد الموقع.');
      return;
    }

    try {
      setUpdatingLocationShipmentId(order.shipmentId);
      setActionError('');

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      const response = await API.patch(
        `/employees/orders/${order.shipmentId}/location`,
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
      );

      const updatedOrder = response.data?.data;

      if (updatedOrder) {
        replaceOrder(updatedOrder);
      }
    } catch (error) {
      setActionError(
        error.code === 1
          ? 'يرجى السماح للمتصفح بالوصول إلى موقعك الحالي.'
          : 'تعذر تحديث موقع الشحنة حالياً. حاول مرة أخرى.'
      );
    } finally {
      setUpdatingLocationShipmentId(null);
    }
  };

  const handleAcceptOrder = (order) => updateShipmentStatus(order, 'picked_up');

  const handleCompleteOrder = (order) => updateShipmentStatus(order, 'delivered');
  const handleReturnOrder = (order) => updateShipmentStatus(order, 'returned');

  const handleCardAction = (order) => {
    if (order.status === 'available') {
      handleAcceptOrder(order);
      return;
    }

    if (order.status === 'in_progress') {
      handleCompleteOrder(order);
    }
  };

  const resetSearch = () => {
    setShipmentQuery('');
    setCustomerQuery('');
    setActiveFilter('all');
  };

  const renderDetailsContent = (order) => {
    if (!order) {
      return null;
    }

    const isAvailable = order.status === 'available';
    const isCompleted = order.status === 'completed';
    const isUpdating = updatingShipmentId === order.shipmentId;
    const isUpdatingLocation = updatingLocationShipmentId === order.shipmentId;

    return (
      <div className="employee-orders-page__details-card">
        <div className="employee-orders-page__details-header">
          <div>
            <h3 className="employee-orders-page__details-title">تفاصيل الطلب</h3>
            <p className="employee-orders-page__details-subtitle">
              رقم الطلب #{order.id} • رقم الشحنة {order.shipmentNumber}
            </p>
          </div>
          <span
            className={`employee-orders-page__status employee-orders-page__status--${order.statusTone}`}
          >
            {order.statusLabel}
          </span>
        </div>

        <div className="employee-orders-page__details-section">
          <h4 className="employee-orders-page__section-heading">معلومات الطرد</h4>
          <div className="employee-orders-page__details-grid employee-orders-page__details-grid--two">
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">نوع الطرد</p>
              <p className="employee-orders-page__detail-value">{order.parcelType}</p>
            </div>
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">رسوم التوصيل</p>
              <p className="employee-orders-page__detail-value">{order.formattedPrice}</p>
            </div>
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">سعر الطرد</p>
              <p className="employee-orders-page__detail-value">
                {order.declaredValue ? formatPrice(order.declaredValue) : 'غير محدد'}
              </p>
            </div>
            <div className="employee-orders-page__detail-item employee-orders-page__detail-item--wide">
              <p className="employee-orders-page__detail-label">الوصف</p>
              <p className="employee-orders-page__detail-value">{order.parcelDescription}</p>
            </div>
            <div className="employee-orders-page__detail-item employee-orders-page__detail-item--wide">
              <p className="employee-orders-page__detail-label">الملاحظات الخاصة</p>
              <p className="employee-orders-page__detail-value">{order.specialNotes}</p>
            </div>
          </div>
        </div>

        <div className="employee-orders-page__details-section">
          <h4 className="employee-orders-page__section-heading">معلومات الاستلام</h4>
          <div className="employee-orders-page__details-grid employee-orders-page__details-grid--three">
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">اسم المرسل</p>
              <p className="employee-orders-page__detail-value">{order.senderName}</p>
            </div>
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">رقم هاتف المرسل</p>
              <p className="employee-orders-page__detail-value">{order.senderPhone}</p>
            </div>
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">عنوان الاستلام</p>
              <p className="employee-orders-page__detail-value">{order.pickupAddress}</p>
            </div>
          </div>
        </div>

        <div className="employee-orders-page__details-section">
          <h4 className="employee-orders-page__section-heading">معلومات التوصيل</h4>
          <div className="employee-orders-page__details-grid employee-orders-page__details-grid--three">
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">اسم المستلم</p>
              <p className="employee-orders-page__detail-value">{order.receiverName}</p>
            </div>
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">رقم هاتف المستلم</p>
              <p className="employee-orders-page__detail-value">{order.receiverPhone}</p>
            </div>
            <div className="employee-orders-page__detail-item">
              <p className="employee-orders-page__detail-label">عنوان التوصيل</p>
              <p className="employee-orders-page__detail-value">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        <div className="employee-orders-page__details-section">
          <h4 className="employee-orders-page__section-heading">حالة التوصيل</h4>
          <div className="employee-orders-page__detail-item">
            <p className="employee-orders-page__detail-label">الحالة الحالية</p>
            <p className="employee-orders-page__detail-value">
              {order.statusLabel} • الوقت المتوقع {order.time}
            </p>
          </div>
        </div>

        <div className="employee-orders-page__actions-box">
          <h4 className="employee-orders-page__actions-title">قسم الإجراءات</h4>
          <p className="employee-orders-page__actions-note">
            اقبل الطلب عند الاستلام، ثم أتم التوصيل من هنا ليتم تحديث حالة الشحنة والطلب
            مباشرة.
          </p>

          {isAvailable ? (
            <button
              type="button"
              className="employee-orders-page__confirm-btn employee-orders-page__confirm-btn--accept"
              onClick={() => handleAcceptOrder(order)}
              disabled={isUpdating}
            >
              {isUpdating ? 'جارٍ التحديث...' : 'قبول الطلب'}
            </button>
          ) : isCompleted ? (
            <button
              type="button"
              className="employee-orders-page__confirm-btn employee-orders-page__confirm-btn--completed"
              disabled
            >
              تم التوصيل
            </button>
          ) : order.status === 'returned' ? (
            <button
              type="button"
              className="employee-orders-page__confirm-btn employee-orders-page__confirm-btn--returned"
              disabled
            >
              تعذر التسليم
            </button>
          ) : order.status === 'cancelled' ? (
            <button
              type="button"
              className="employee-orders-page__confirm-btn employee-orders-page__confirm-btn--returned"
              disabled
            >
              الطلب ملغى
            </button>
          ) : (
            <div className="employee-orders-page__dual-actions">
              <button
                type="button"
                className="employee-orders-page__confirm-btn employee-orders-page__confirm-btn--finish"
                onClick={() => handleCompleteOrder(order)}
                disabled={isUpdating}
              >
                {isUpdating ? 'جارٍ التحديث...' : order.detailsActionLabel}
              </button>
              <button
                type="button"
                className="employee-orders-page__confirm-btn employee-orders-page__confirm-btn--return"
                onClick={() => handleReturnOrder(order)}
                disabled={isUpdating}
              >
                {isUpdating ? 'جارٍ التحديث...' : 'تعذر التسليم'}
              </button>
            </div>
          )}

          {order.status === 'in_progress' ? (
            <button
              type="button"
              className="employee-orders-page__location-btn"
              onClick={() => updateShipmentLocation(order)}
              disabled={isUpdatingLocation}
            >
              <i className="bi bi-geo-alt"></i>
              {isUpdatingLocation ? 'جارٍ تحديث الموقع...' : 'تحديث موقعي الحالي'}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="employee-orders-page" dir="rtl">
      <section className="employee-orders-page__hero">
        <div className="employee-orders-page__hero-text">
          <div className="employee-orders-page__title-row">
            <h1 className="employee-orders-page__title">إدارة الطلبات</h1>
            <span className="employee-orders-page__count-pill">{filterCounts.all}</span>
          </div>
          <p className="employee-orders-page__subtitle">
            استعرض الطلبات المتاحة والجارية والمكتملة، وتتبع دورة التنفيذ من القبول حتى
            إتمام التوصيل من نفس الصفحة.
          </p>
        </div>

        <div className="employee-orders-page__hero-icon">
          <i className="bi bi-box-seam"></i>
        </div>
      </section>

      <section className="employee-orders-page__toolbar">
        <label className="employee-orders-page__search-field">
          <i className="bi bi-upc-scan employee-orders-page__search-icon"></i>
          <input
            type="text"
            className="employee-orders-page__search-input"
            placeholder="بحث برقم الشحنة"
            value={shipmentQuery}
            onChange={(event) => setShipmentQuery(event.target.value)}
          />
        </label>

        <label className="employee-orders-page__search-field">
          <i className="bi bi-search employee-orders-page__search-icon"></i>
          <input
            type="text"
            className="employee-orders-page__search-input"
            placeholder="بحث باسم الزبون"
            value={customerQuery}
            onChange={(event) => setCustomerQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="employee-orders-page__filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`employee-orders-page__filter-btn ${
              activeFilter === filter.key ? 'employee-orders-page__filter-btn--active' : ''
            }`}
            onClick={() => setActiveFilter(filter.key)}
          >
            <span>{filter.label}</span>
            <span className="employee-orders-page__filter-count">{filterCounts[filter.key]}</span>
          </button>
        ))}
      </section>

      {loadError ? (
        <section className="employee-orders-page__empty">
          <div className="employee-orders-page__empty-icon">
            <i className="bi bi-exclamation-circle"></i>
          </div>
          <h2 className="employee-orders-page__empty-title">حدثت مشكلة أثناء تحميل الطلبات</h2>
          <p className="employee-orders-page__empty-text">{loadError}</p>
          <button
            type="button"
            className="employee-orders-page__secondary-btn"
            onClick={loadOrders}
          >
            إعادة المحاولة
          </button>
        </section>
      ) : isLoading ? (
        <section className="employee-orders-page__empty">
          <div className="employee-orders-page__empty-icon">
            <i className="bi bi-arrow-repeat"></i>
          </div>
          <h2 className="employee-orders-page__empty-title">جارٍ تحميل الطلبات</h2>
          <p className="employee-orders-page__empty-text">نجهز لك الطلبات المعيّنة لك الآن.</p>
        </section>
      ) : !hasOrders ? (
        <section className="employee-orders-page__empty">
          <div className="employee-orders-page__empty-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h2 className="employee-orders-page__empty-title">لا توجد طلبات حاليًا</h2>
          <p className="employee-orders-page__empty-text">
            ستظهر هنا الطلبات الجديدة فور توفرها مع دورة العمل الكاملة من القبول حتى
            الإتمام.
          </p>
        </section>
      ) : (
        <section className="employee-orders-page__content">
          {actionError ? (
            <p className="employee-orders-page__empty-text">{actionError}</p>
          ) : null}
          {!hasFilteredOrders ? (
            <div className="employee-orders-page__results-empty">
              <div className="employee-orders-page__empty-icon">
                <i className="bi bi-search"></i>
              </div>
              <h2 className="employee-orders-page__empty-title">لا توجد نتائج مطابقة</h2>
              <p className="employee-orders-page__empty-text">
                لم يتم العثور على طلبات مطابقة للبحث الحالي أو الفلتر المختار.
              </p>
              {hasSearchQuery ? (
                <button
                  type="button"
                  className="employee-orders-page__secondary-btn"
                  onClick={resetSearch}
                >
                  إعادة ضبط البحث
                </button>
              ) : null}
            </div>
          ) : (
            <div className="employee-orders-page__list">
              {filteredOrders.map((order) => (
                <article
                  key={order.shipmentId || order.id}
                  className="employee-orders-page__card"
                  onClick={() => openDetails(order.id)}
                >
                  <div className="employee-orders-page__card-top">
                    <div className="employee-orders-page__order-code">
                      <p className="employee-orders-page__eyebrow">رقم الطلب</p>
                      <h2 className="employee-orders-page__order-number">#{order.id}</h2>
                      <p className="employee-orders-page__shipment-number">
                        رقم الشحنة: {order.shipmentNumber}
                      </p>
                    </div>

                    <span
                      className={`employee-orders-page__status employee-orders-page__status--${order.statusTone}`}
                    >
                      {order.statusLabel}
                    </span>
                  </div>

                  <div className="employee-orders-page__card-body">
                    <div className="employee-orders-page__price-row">
                      <div className="employee-orders-page__price-stack">
                        <span className="employee-orders-page__price">{order.formattedPrice}</span>
                        <span className="employee-orders-page__price-caption">رسوم التوصيل</span>
                      </div>
                      <span className="employee-orders-page__time">
                        <i className="bi bi-clock"></i>
                        {order.time}
                      </span>
                    </div>

                    <div className="employee-orders-page__info-grid">
                      <div className="employee-orders-page__info-box">
                        <p className="employee-orders-page__info-label">نقطة الاستلام</p>
                        <p className="employee-orders-page__info-value">{order.pickupAddress}</p>
                      </div>
                      <div className="employee-orders-page__info-box">
                        <p className="employee-orders-page__info-label">نقطة التوصيل</p>
                        <p className="employee-orders-page__info-value">{order.deliveryAddress}</p>
                      </div>
                      <div className="employee-orders-page__info-box">
                        <p className="employee-orders-page__info-label">الزبون</p>
                        <p className="employee-orders-page__info-value">{order.receiverName}</p>
                      </div>
                      <div className="employee-orders-page__info-box">
                        <p className="employee-orders-page__info-label">نوع الطرد</p>
                        <p className="employee-orders-page__info-value">{order.parcelType}</p>
                      </div>
                      <div className="employee-orders-page__info-box">
                        <p className="employee-orders-page__info-label">سعر الطرد</p>
                        <p className="employee-orders-page__info-value">
                          {order.declaredValue ? formatPrice(order.declaredValue) : 'غير محدد'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="employee-orders-page__card-footer">
                    {order.status === 'in_progress' ? (
                      <div className="employee-orders-page__card-actions">
                        <button
                          type="button"
                          className="employee-orders-page__action-btn employee-orders-page__action-btn--finish"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCompleteOrder(order);
                          }}
                          disabled={updatingShipmentId === order.shipmentId}
                        >
                          {updatingShipmentId === order.shipmentId ? 'جارٍ التحديث...' : 'إتمام التوصيل'}
                        </button>
                        <button
                          type="button"
                          className="employee-orders-page__action-btn employee-orders-page__action-btn--return"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleReturnOrder(order);
                          }}
                          disabled={updatingShipmentId === order.shipmentId}
                        >
                          {updatingShipmentId === order.shipmentId ? 'جارٍ التحديث...' : 'تعذر التسليم'}
                        </button>
                        <button
                          type="button"
                          className="employee-orders-page__action-btn employee-orders-page__action-btn--location"
                          onClick={(event) => {
                            event.stopPropagation();
                            updateShipmentLocation(order);
                          }}
                          disabled={updatingLocationShipmentId === order.shipmentId}
                        >
                          {updatingLocationShipmentId === order.shipmentId
                            ? 'جارٍ تحديد الموقع...'
                            : 'تحديث موقعي'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`employee-orders-page__action-btn ${
                          order.status === 'completed'
                            ? 'employee-orders-page__action-btn--completed'
                            : order.status === 'returned'
                              ? 'employee-orders-page__action-btn--returned'
                              : order.status === 'cancelled'
                                ? 'employee-orders-page__action-btn--returned'
                                : 'employee-orders-page__action-btn--accept'
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCardAction(order);
                        }}
                        disabled={
                          order.status === 'completed' ||
                          order.status === 'returned' ||
                          order.status === 'cancelled' ||
                          updatingShipmentId === order.shipmentId
                        }
                      >
                        {updatingShipmentId === order.shipmentId
                          ? 'جارٍ التحديث...'
                          : order.status === 'returned'
                            ? 'تعذر التسليم'
                            : order.cardActionLabel}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {isDetailsOpen && selectedOrder ? (
        <div className="employee-orders-page__modal" onClick={() => setIsDetailsOpen(false)}>
          <div
            className="employee-orders-page__modal-body"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="employee-orders-page__modal-header">
              <div>
                <h3 className="employee-orders-page__details-title">تفاصيل الطلب</h3>
                <p className="employee-orders-page__details-subtitle">
                  عرض تفصيلي للطلب المحدد مع الإجراءات
                </p>
              </div>
              <button
                type="button"
                className="employee-orders-page__close-btn"
                onClick={() => setIsDetailsOpen(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {renderDetailsContent(selectedOrder)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default EmployeeOrdersPage;

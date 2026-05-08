'use strict';

const { Op } = require('sequelize');
const {
  Employee,
  User,
  Vehicle,
  EmployeeDocument,
  EmployeeWallet,
  WalletTransaction,
  WithdrawalRequest,
  Shipment,
  Order,
  Region,
  TrackingUpdate,
  sequelize,
} = require('../models');
const { STATUS_LABELS } = require('./employee-dashboard.service');
const { notifyAdmins } = require('./notification.service');

const EMPLOYEE_ORDER_STATUS = {
  accepted: { status: 'available', statusLabel: 'متاحة' },
  picked_up: { status: 'in_progress', statusLabel: 'جارية' },
  in_transit: { status: 'in_progress', statusLabel: 'جارية' },
  arrived_to_destination_city: { status: 'in_progress', statusLabel: 'جارية' },
  out_for_delivery: { status: 'in_progress', statusLabel: 'جارية' },
  delivered: { status: 'completed', statusLabel: 'مكتملة' },
  returned: { status: 'returned', statusLabel: 'مرتجعة' },
};

EMPLOYEE_ORDER_STATUS.cancelled = { status: 'cancelled', statusLabel: 'ملغاة' };

const EMPLOYEE_AVAILABILITY_LABELS = {
  available: 'متاح',
  busy: 'مشغول',
  offline: 'غير متصل',
};

const ACTIVE_SHIPMENT_STATUSES = [
  'accepted',
  'picked_up',
  'in_transit',
  'arrived_to_destination_city',
  'out_for_delivery',
];

const DOCUMENT_STATUS_LABELS = {
  valid: 'سارية',
  expiring_soon: 'تنتهي قريبًا',
  expired: 'منتهية',
};
const EMPLOYEE_DOCUMENT_TYPES = [
  'driving_license',
  'vehicle_license',
  'vehicle_insurance',
  'national_id',
];
const DOCUMENT_TYPES_WITH_EXPIRY = [
  'driving_license',
  'vehicle_license',
  'vehicle_insurance',
];

const WITHDRAWAL_STATUS_LABELS = {
  pending: 'قيد المعالجة',
  approved: 'بانتظار الإكمال',
  rejected: 'مرفوض',
  paid: 'مكتمل',
};

const TRANSACTION_TYPE_LABELS = {
  earning: 'تحصيل من عميل',
  handover: 'تسليم للشركة',
  withdrawal: 'تسليم للشركة',
  adjustment: 'تعديل',
};

const WITHDRAWAL_METHOD_MAP = {
  bank_transfer: 'bank_transfer',
  office_cash: 'cash',
  e_wallet: 'ewallet',
  cash: 'cash',
  ewallet: 'ewallet',
};

const SHIPMENT_PICKED_UP_NOTE = 'تم استلام الطرد من نقطة الاستلام';
const SHIPMENT_DELIVERED_NOTE = 'تم تسليم الطرد بنجاح';
const SHIPMENT_RETURNED_NOTE = 'تعذر التسليم وتمت إعادة الطرد إلى الشركة';

const PACKAGE_SIZE_LABELS = {
  small: 'طرد صغير',
  medium: 'طرد متوسط',
  large: 'طرد كبير',
};

const STATUS_TRANSITIONS = {
  accepted: {
    nextStatus: 'picked_up',
    orderStatus: 'picked_up',
    note: SHIPMENT_PICKED_UP_NOTE,
  },
  picked_up: {
    nextStatus: 'delivered',
    orderStatus: 'delivered',
    note: SHIPMENT_DELIVERED_NOTE,
  },
  picked_up_returned: {
    nextStatus: 'returned',
    orderStatus: 'returned',
    note: SHIPMENT_RETURNED_NOTE,
  },
  in_transit: {
    nextStatus: 'delivered',
    orderStatus: 'delivered',
    note: SHIPMENT_DELIVERED_NOTE,
  },
  in_transit_returned: {
    nextStatus: 'returned',
    orderStatus: 'returned',
    note: SHIPMENT_RETURNED_NOTE,
  },
  arrived_to_destination_city: {
    nextStatus: 'delivered',
    orderStatus: 'delivered',
    note: SHIPMENT_DELIVERED_NOTE,
  },
  arrived_to_destination_city_returned: {
    nextStatus: 'returned',
    orderStatus: 'returned',
    note: SHIPMENT_RETURNED_NOTE,
  },
  out_for_delivery: {
    nextStatus: 'delivered',
    orderStatus: 'delivered',
    note: SHIPMENT_DELIVERED_NOTE,
  },
  out_for_delivery_returned: {
    nextStatus: 'returned',
    orderStatus: 'returned',
    note: SHIPMENT_RETURNED_NOTE,
  },
};

const getWeekRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getDayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const buildAddressLine = (...parts) => parts.filter(Boolean).join(' - ') || null;

const formatTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ar-PS', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const fallbackValue = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  return value;
};

const calculateDocumentStatus = (expiryDate) => {
  if (!expiryDate) return 'valid';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return 'valid';
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return 'expired';

  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 30) return 'expiring_soon';

  return 'valid';
};

const validateDocumentExpiry = ({ documentType, expiryDate }) => {
  if (DOCUMENT_TYPES_WITH_EXPIRY.includes(documentType) && !expiryDate) {
    const error = new Error('Expiry date is required for this document type');
    error.statusCode = 400;
    throw error;
  }

  if (documentType === 'national_id') {
    return null;
  }

  return expiryDate || null;
};

const calculateCollectedAmountForOrder = (order) => {
  const productPrice =
    order?.declared_value !== null && order?.declared_value !== undefined
      ? Number(order.declared_value)
      : 0;
  const deliveryFee =
    order?.region?.price !== null && order?.region?.price !== undefined
      ? Number(order.region.price)
      : 0;

  return {
    productPrice,
    deliveryFee,
    totalCollected: productPrice + deliveryFee,
  };
};

const resolveEmployeeByUserId = async (userId) =>
  Employee.findOne({
    where: { user_id: userId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'phone', 'role'],
        required: false,
      },
      {
        model: Vehicle,
        as: 'vehicle',
        required: false,
      },
      {
        model: EmployeeDocument,
        as: 'documents',
        required: false,
      },
      {
        model: EmployeeWallet,
        as: 'wallet',
        required: false,
      },
    ],
  });

const ensureAuthenticatedEmployee = async ({ userId }) => {
  const employee = await resolveEmployeeByUserId(userId);

  if (!employee) {
    const error = new Error('Employee profile not found for the authenticated user');
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

const getAvailabilityLabel = (status) =>
  EMPLOYEE_AVAILABILITY_LABELS[status] || EMPLOYEE_AVAILABILITY_LABELS.available;

const buildAvatarInitials = (fullName) =>
  fullName
    ? fullName
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
    : 'مو';

const mapEmployeeProfileData = (employee) => {
  const vehicle = employee.vehicle;

  return {
    employee: {
      id: employee.id,
      fullName: employee.full_name,
      jobTitle: 'موظف توصيل',
      phone: employee.user?.phone || null,
      email: employee.user?.email || null,
      address: employee.address || null,
      availabilityStatus: employee.availability_status,
      availabilityStatusLabel: getAvailabilityLabel(employee.availability_status),
      isActive: Boolean(employee.is_active),
      avatarInitials: buildAvatarInitials(employee.full_name),
    },
    vehicle: {
      id: vehicle?.id || null,
      type: vehicle?.type || null,
      licenseNumber: vehicle?.plate_number || null,
      plateNumber: vehicle?.plate_number || null,
      brand: vehicle?.brand || null,
      model: vehicle?.model || null,
      color: vehicle?.color || null,
      year: vehicle?.year || null,
      vehiclePhotoUrl: vehicle?.vehicle_photo_url || null,
    },
    documents: (employee.documents || []).map((document) => ({
      id: document.id,
      name: document.document_type,
      documentType: document.document_type,
      fileUrl: document.file_url,
      expiryDate: document.expiry_date,
      status: document.status,
      statusLabel: DOCUMENT_STATUS_LABELS[document.status] || document.status,
    })),
  };
};

const recordDeliveredShipmentEarning = async ({ employeeId, order, transaction }) => {
  if (!order?.id) {
    return;
  }

  const [wallet] = await EmployeeWallet.findOrCreate({
    where: { employee_id: employeeId },
    defaults: {
      employee_id: employeeId,
      available_balance: 0,
      total_earnings: 0,
    },
    transaction,
  });

  const existingEarning = await WalletTransaction.findOne({
    where: {
      wallet_id: wallet.id,
      order_id: order.id,
      transaction_type: 'earning',
    },
    transaction,
  });

  if (existingEarning) {
    return;
  }

  const { productPrice, deliveryFee, totalCollected } = calculateCollectedAmountForOrder(order);

  await wallet.update(
    {
      available_balance: Number(wallet.available_balance || 0) + totalCollected,
      total_earnings: Number(wallet.total_earnings || 0) + totalCollected,
    },
    { transaction }
  );

  await WalletTransaction.create(
    {
      wallet_id: wallet.id,
      order_id: order.id,
      transaction_type: 'earning',
      amount: totalCollected,
      description: `تحصيل من العميل للشحنة #${order.id} (قيمة الطلب: ${productPrice}, التوصيل: ${deliveryFee})`,
    },
    { transaction }
  );
};

const mapShipmentStatus = (shipmentStatus) =>
  EMPLOYEE_ORDER_STATUS[shipmentStatus] || {
    status: 'available',
    statusLabel: STATUS_LABELS[shipmentStatus] || 'متاحة',
  };

const mapOrderCard = (shipment) => {
  const order = shipment.order;
  const region = order?.region;
  const mappedStatus = mapShipmentStatus(shipment.current_status);

  return {
    id: order?.id || shipment.id,
    shipmentId: shipment.id,
    orderId: order?.id || null,
    shipmentNumber: fallbackValue(shipment.tracking_number || `PHX-${shipment.id}`),
    status: mappedStatus.status,
    statusLabel: mappedStatus.statusLabel,
    shipmentStatus: shipment.current_status,
    shipmentStatusLabel: STATUS_LABELS[shipment.current_status] || shipment.current_status,
    isActive: ACTIVE_SHIPMENT_STATUSES.includes(shipment.current_status),
    price: region?.price !== undefined && region?.price !== null ? Number(region.price) : 0,
    declaredValue:
      order?.declared_value !== null && order?.declared_value !== undefined
        ? Number(order.declared_value)
        : null,
    time: formatTime(shipment.estimated_delivery_date || order?.createdAt),
    pickupAddress: fallbackValue(order?.sender_address),
    deliveryAddress: fallbackValue(order?.receiver_address),
    senderName: fallbackValue(order?.sender_name),
    senderPhone: fallbackValue(order?.sender_phone),
    receiverName: fallbackValue(order?.receiver_name),
    receiverPhone: fallbackValue(order?.receiver_phone),
    customerName: fallbackValue(order?.receiver_name),
    parcelType: PACKAGE_SIZE_LABELS[order?.package_size] || fallbackValue(order?.package_size),
    parcelDescription: fallbackValue(order?.package_description),
    specialNotes: order?.is_fragile ? 'الطرد قابل للكسر ويحتاج إلى عناية أثناء النقل' : '-',
    proofImage: null,
    originCity: fallbackValue(order?.origin_city),
    destinationCity: fallbackValue(order?.destination_city),
    timeWindow: shipment.estimated_delivery_date,
    currentLatitude:
      shipment.current_latitude !== null && shipment.current_latitude !== undefined
        ? Number(shipment.current_latitude)
        : null,
    currentLongitude:
      shipment.current_longitude !== null && shipment.current_longitude !== undefined
        ? Number(shipment.current_longitude)
        : null,
    locationUpdatedAt: shipment.location_updated_at,
  };
};

const mapOrderDetails = (shipment) => {
  const order = shipment.order;
  const region = order?.region;
  const mappedStatus = mapShipmentStatus(shipment.current_status);

  return {
    shipmentId: shipment.id,
    orderId: order?.id || null,
    shipmentNumber: shipment.tracking_number,
    status: mappedStatus.status,
    statusLabel: mappedStatus.statusLabel,
    shipmentStatus: shipment.current_status,
    shipmentStatusLabel: STATUS_LABELS[shipment.current_status] || shipment.current_status,
    price: region?.price !== undefined && region?.price !== null ? Number(region.price) : 0,
    senderName: order?.sender_name || null,
    senderPhone: order?.sender_phone || null,
    senderAddress: order?.sender_address || null,
    receiverName: order?.receiver_name || null,
    receiverPhone: order?.receiver_phone || null,
    receiverAddress: order?.receiver_address || null,
    packageSize: order?.package_size || null,
    deliverySpeed: order?.delivery_speed || null,
    packageDescription: order?.package_description || null,
    isFragile: Boolean(order?.is_fragile),
    declaredValue:
      order?.declared_value !== null && order?.declared_value !== undefined
        ? Number(order.declared_value)
        : null,
    estimatedDeliveryDate: shipment.estimated_delivery_date,
    currentLatitude:
      shipment.current_latitude !== null && shipment.current_latitude !== undefined
        ? Number(shipment.current_latitude)
        : null,
    currentLongitude:
      shipment.current_longitude !== null && shipment.current_longitude !== undefined
        ? Number(shipment.current_longitude)
        : null,
    locationUpdatedAt: shipment.location_updated_at,
    region: region
      ? {
          id: region.id,
          name: region.name,
          price: Number(region.price || 0),
        }
      : null,
  };
};

const updateEmployeeShipmentLocation = async ({ userId, shipmentId, latitude, longitude }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);

  if (
    !Number.isFinite(numericLatitude) ||
    !Number.isFinite(numericLongitude) ||
    numericLatitude < -90 ||
    numericLatitude > 90 ||
    numericLongitude < -180 ||
    numericLongitude > 180
  ) {
    const error = new Error('Invalid shipment location coordinates');
    error.statusCode = 400;
    throw error;
  }

  const shipment = await Shipment.findOne({
    where: {
      id: shipmentId,
      driver_id: employee.id,
      current_status: {
        [Op.in]: ACTIVE_SHIPMENT_STATUSES,
      },
    },
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'price'],
            required: false,
          },
        ],
      },
    ],
  });

  if (!shipment || !shipment.order) {
    const error = new Error('Employee active shipment not found');
    error.statusCode = 404;
    throw error;
  }

  await shipment.update({
    current_latitude: numericLatitude,
    current_longitude: numericLongitude,
    location_updated_at: new Date(),
  });

  const updatedShipment = await Shipment.findByPk(shipment.id, {
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'price'],
            required: false,
          },
        ],
      },
    ],
  });

  return mapOrderCard(updatedShipment);
};

const getAssignedEmployeeShipments = async ({ employeeId }) =>
  Shipment.findAll({
    where: { driver_id: employeeId },
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'price'],
            required: false,
          },
        ],
      },
    ],
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

const getEmployeeOrdersData = async ({ userId }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const shipments = await getAssignedEmployeeShipments({ employeeId: employee.id });
  const orders = shipments.map(mapOrderCard);
  const activeOrdersCount = orders.filter((order) => order.status === 'in_progress').length;
  const availableOrdersCount = orders.filter((order) => order.status === 'available').length;
  const completedOrdersCount = orders.filter((order) => order.shipmentStatus === 'delivered').length;
  const returnedOrdersCount = orders.filter((order) => order.shipmentStatus === 'returned').length;

  return {
    employee: {
      id: employee.id,
      fullName: employee.full_name,
      availabilityStatus: employee.availability_status,
      availabilityStatusLabel: getAvailabilityLabel(employee.availability_status),
    },
    summary: {
      totalOrdersCount: orders.length,
      activeOrdersCount,
      availableOrdersCount,
      completedOrdersCount,
      returnedOrdersCount,
    },
    orders,
  };
};

const getEmployeeDashboardData = async ({ userId }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const ordersData = await getEmployeeOrdersData({ userId });
  const { start, end } = getDayRange();
  const completedToday = await Shipment.count({
    where: {
      driver_id: employee.id,
      current_status: 'delivered',
    },
    include: [
      {
        model: Order,
        as: 'order',
        attributes: [],
        required: true,
        where: {
          delivered_at: {
            [Op.between]: [start, end],
          },
        },
      },
    ],
  });

  const dailyEarnings = employee.wallet
    ? await WalletTransaction.sum('amount', {
        where: {
          wallet_id: employee.wallet.id,
          transaction_type: 'earning',
          createdAt: {
            [Op.between]: [start, end],
          },
        },
      })
    : 0;

  return {
    employee: {
      id: employee.id,
      full_name: employee.full_name,
      availabilityStatus: employee.availability_status,
      availabilityStatusLabel: getAvailabilityLabel(employee.availability_status),
    },
    stats: {
      activeOrders: ordersData.summary.activeOrdersCount,
      completedToday,
      dailyEarnings: Number(dailyEarnings || 0),
    },
    tasks: ordersData.orders.filter((order) => order.isActive).map((order) => ({
      shipmentId: order.shipmentId,
      orderId: order.orderId,
      trackingNumber: order.shipmentNumber,
      status: order.shipmentStatus,
      statusLabel: order.shipmentStatusLabel,
      price: order.price,
      from: buildAddressLine(order.senderName, order.pickupAddress),
      to: buildAddressLine(order.receiverName, order.deliveryAddress),
      timeWindow: order.timeWindow,
    })),
  };
};

const getEmployeeOrderDetailsData = async ({ userId, shipmentId }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });

  const shipment = await Shipment.findOne({
    where: {
      id: shipmentId,
      driver_id: employee.id,
    },
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'price'],
            required: false,
          },
        ],
      },
    ],
  });

  if (!shipment) return null;
  return mapOrderDetails(shipment);
};

const updateEmployeeOrderStatus = async ({ userId, shipmentId, status, currentLocation }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });

  const shipment = await Shipment.findOne({
    where: {
      id: shipmentId,
      driver_id: employee.id,
    },
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'price'],
            required: false,
          },
        ],
      },
    ],
  });

  if (!shipment || !shipment.order) {
    const error = new Error('Employee order not found');
    error.statusCode = 404;
    throw error;
  }

  const transitionKey = status === 'returned' ? `${shipment.current_status}_returned` : shipment.current_status;
  const transition = STATUS_TRANSITIONS[transitionKey];
  if (!transition || transition.nextStatus !== status) {
    const error = new Error('Invalid shipment status transition');
    error.statusCode = 400;
    throw error;
  }

  await sequelize.transaction(async (transaction) => {
    await shipment.update({ current_status: transition.nextStatus }, { transaction });

    const orderUpdates = { status: transition.orderStatus };
    if (transition.nextStatus === 'delivered' && !shipment.order.delivered_at) {
      orderUpdates.delivered_at = new Date();
    }

    await shipment.order.update(orderUpdates, { transaction });

    await TrackingUpdate.create(
      {
        shipment_id: shipment.id,
        status: transition.nextStatus,
        note: transition.note,
        current_location:
          currentLocation ||
          (transition.nextStatus === 'picked_up'
            ? shipment.order.origin_city || shipment.order.sender_address || null
            : shipment.order.destination_city || shipment.order.receiver_address || null),
      },
      { transaction }
    );

    if (transition.nextStatus === 'delivered') {
      await recordDeliveredShipmentEarning({
        employeeId: employee.id,
        order: shipment.order,
        transaction,
      });

      const remainingActiveShipments = await Shipment.count({
        where: {
          driver_id: employee.id,
          current_status: {
            [Op.in]: ACTIVE_SHIPMENT_STATUSES,
          },
          id: {
            [Op.ne]: shipment.id,
          },
        },
        transaction,
      });

      if (remainingActiveShipments === 0 && employee.availability_status === 'busy') {
        await employee.update(
          {
            availability_status: 'available',
          },
          { transaction }
        );
      }
    }
  });

  if (transition.nextStatus === 'returned') {
    await notifyAdmins({
      type: 'returned_shipment_created',
      title: 'شحنة مرتجعة جديدة تحتاج متابعة',
      body: `تم تحويل الشحنة رقم ${shipment.tracking_number || `PHX-${shipment.id}`} إلى حالة مرتجعة.`,
      entityType: 'shipment',
      entityId: shipment.id,
      actionUrl: '/admin/returned-shipments',
    });
  }

  if (transition.nextStatus === 'delivered') {
    await notifyAdmins({
      type: 'shipment_delivered_by_employee',
      title: `تمت الطلبية بواسطة ${employee.full_name || 'الموظف'}`,
      body: `أكمل ${employee.full_name || 'الموظف'} تسليم الطلبية رقم ${shipment.tracking_number || `PHX-${shipment.id}`}.`,
      entityType: 'shipment',
      entityId: shipment.id,
      actionUrl: '/admin/parcel-distribution',
    });
  }

  const updatedShipment = await Shipment.findOne({
    where: {
      id: shipmentId,
      driver_id: employee.id,
    },
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'price'],
            required: false,
          },
        ],
      },
    ],
  });

  return mapOrderCard(updatedShipment);
};

const getEmployeeProfileData = async ({ userId }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  return mapEmployeeProfileData(employee);
};

const updateEmployeeProfileData = async ({ userId, payload }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const { full_name, address, phone, email } = payload || {};

  if (full_name !== undefined && !String(full_name).trim()) {
    const error = new Error('Full name is required');
    error.statusCode = 400;
    throw error;
  }

  await sequelize.transaction(async (transaction) => {
    await employee.update(
      {
        full_name: full_name !== undefined ? String(full_name).trim() : employee.full_name,
        address: address !== undefined ? String(address).trim() || null : employee.address,
      },
      { transaction },
    );

    if (phone !== undefined || email !== undefined) {
      const user = await User.findByPk(employee.user_id, { transaction });

      if (!user) {
        const error = new Error('Associated user account not found');
        error.statusCode = 404;
        throw error;
      }

      await user.update(
        {
          phone: phone !== undefined ? String(phone).trim() : user.phone,
          email: email !== undefined ? String(email).trim() : user.email,
        },
        { transaction },
      );
    }
  });

  const refreshedEmployee = await ensureAuthenticatedEmployee({ userId });
  return mapEmployeeProfileData(refreshedEmployee);
};

const updateEmployeeVehicleData = async ({ userId, payload }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const normalizedPayload = {
    brand: payload?.brand ? String(payload.brand).trim() : null,
    model: payload?.model ? String(payload.model).trim() : null,
    color: payload?.color ? String(payload.color).trim() : null,
    year: payload?.year ? Number(payload.year) : null,
    type: payload?.type ? String(payload.type).trim() : null,
    plate_number: payload?.plate_number ? String(payload.plate_number).trim() : null,
    vehicle_photo_url: payload?.vehicle_photo_url
      ? String(payload.vehicle_photo_url).trim()
      : null,
  };

  if (!normalizedPayload.brand || !normalizedPayload.model || !normalizedPayload.plate_number) {
    const error = new Error('Vehicle brand, model, and plate number are required');
    error.statusCode = 400;
    throw error;
  }

  const [vehicle] = await Vehicle.findOrCreate({
    where: { employee_id: employee.id },
    defaults: {
      employee_id: employee.id,
      ...normalizedPayload,
    },
  });

  await vehicle.update({
    brand: normalizedPayload.brand,
    model: normalizedPayload.model,
    color: normalizedPayload.color,
    year: normalizedPayload.year,
    type: normalizedPayload.type,
    plate_number: normalizedPayload.plate_number,
    vehicle_photo_url: normalizedPayload.vehicle_photo_url,
  });

  const refreshedEmployee = await ensureAuthenticatedEmployee({ userId });
  return mapEmployeeProfileData(refreshedEmployee);
};

const createEmployeeDocumentData = async ({ userId, payload }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const documentType = String(payload?.document_type || '').trim();
  const fileUrl = String(payload?.file_url || '').trim();
  const expiryDate = validateDocumentExpiry({
    documentType,
    expiryDate: payload?.expiry_date || null,
  });

  if (!EMPLOYEE_DOCUMENT_TYPES.includes(documentType)) {
    const error = new Error('Invalid document type');
    error.statusCode = 400;
    throw error;
  }

  if (!fileUrl) {
    const error = new Error('Document file URL is required');
    error.statusCode = 400;
    throw error;
  }

  await EmployeeDocument.create({
    employee_id: employee.id,
    document_type: documentType,
    file_url: fileUrl,
    expiry_date: expiryDate || null,
    status: calculateDocumentStatus(expiryDate),
  });

  const refreshedEmployee = await ensureAuthenticatedEmployee({ userId });
  return mapEmployeeProfileData(refreshedEmployee);
};

const updateEmployeeDocumentData = async ({ userId, documentId, payload }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const document = await EmployeeDocument.findOne({
    where: {
      id: documentId,
      employee_id: employee.id,
    },
  });

  if (!document) {
    const error = new Error('Employee document not found');
    error.statusCode = 404;
    throw error;
  }

  const documentType =
    payload?.document_type !== undefined
      ? String(payload.document_type || '').trim()
      : document.document_type;
  const fileUrl =
    payload?.file_url !== undefined ? String(payload.file_url || '').trim() : document.file_url;
  const requestedExpiryDate =
    payload?.expiry_date !== undefined ? payload.expiry_date || null : document.expiry_date;
  const expiryDate = validateDocumentExpiry({
    documentType,
    expiryDate: requestedExpiryDate,
  });

  if (!EMPLOYEE_DOCUMENT_TYPES.includes(documentType)) {
    const error = new Error('Invalid document type');
    error.statusCode = 400;
    throw error;
  }

  if (!fileUrl) {
    const error = new Error('Document file URL is required');
    error.statusCode = 400;
    throw error;
  }

  await document.update({
    document_type: documentType,
    file_url: fileUrl,
    expiry_date: expiryDate,
    status: calculateDocumentStatus(expiryDate),
  });

  const refreshedEmployee = await ensureAuthenticatedEmployee({ userId });
  return mapEmployeeProfileData(refreshedEmployee);
};

const deleteEmployeeDocumentData = async ({ userId, documentId }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const document = await EmployeeDocument.findOne({
    where: {
      id: documentId,
      employee_id: employee.id,
    },
  });

  if (!document) {
    const error = new Error('Employee document not found');
    error.statusCode = 404;
    throw error;
  }

  await document.destroy();

  const refreshedEmployee = await ensureAuthenticatedEmployee({ userId });
  return mapEmployeeProfileData(refreshedEmployee);
};

const updateEmployeeAvailabilityStatus = async ({ userId, availabilityStatus }) => {
  if (!['available', 'busy', 'offline'].includes(availabilityStatus)) {
    const error = new Error('Invalid availability status');
    error.statusCode = 400;
    throw error;
  }

  const employee = await ensureAuthenticatedEmployee({ userId });

  await employee.update({
    availability_status: availabilityStatus,
  });

  return {
    employeeId: employee.id,
    availabilityStatus: employee.availability_status,
    availabilityStatusLabel: getAvailabilityLabel(employee.availability_status),
  };
};

const getEmployeeWalletData = async ({ userId }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const wallet = employee.wallet;
  const { start, end } = getWeekRange();

  const weeklyEarnings = wallet
    ? await WalletTransaction.sum('amount', {
        where: {
          wallet_id: wallet.id,
          transaction_type: 'earning',
          createdAt: {
            [Op.between]: [start, end],
          },
        },
      })
    : 0;

  const transactions = wallet
    ? await WalletTransaction.findAll({
        where: { wallet_id: wallet.id },
        order: [['createdAt', 'DESC']],
        limit: 30,
      })
    : [];

  const withdrawalRequests = await WithdrawalRequest.findAll({
    where: { employee_id: employee.id },
    order: [['requested_at', 'DESC']],
    limit: 30,
  });

  const mergedTransactions = [
    ...transactions.map((transaction) => ({
      id: `wallet-${transaction.id}`,
      date: transaction.createdAt,
      type: TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type,
      amount: Number(transaction.amount || 0),
      status: 'completed',
      statusLabel: 'مكتمل',
      source: 'wallet_transaction',
    })),
    ...withdrawalRequests.map((request) => ({
      id: `withdrawal-${request.id}`,
      date: request.requested_at,
      type: 'تسليم للشركة',
      amount: Number(request.amount || 0),
      status: request.status,
      statusLabel: WITHDRAWAL_STATUS_LABELS[request.status] || request.status,
      source: 'withdrawal_request',
      withdrawalMethod: request.withdrawal_method,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    employee: {
      id: employee.id,
      fullName: employee.full_name,
    },
    summary: {
      currentBalance: Number(wallet?.available_balance || 0),
      totalEarnings: Number(wallet?.total_earnings || 0),
      weeklyEarnings: Number(weeklyEarnings || 0),
    },
    transactions: mergedTransactions,
  };
};

const createEmployeeWithdrawalRequest = async ({ userId, amount, withdrawalMethod }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });
  const wallet = employee.wallet;

  if (!wallet) {
    const error = new Error('Employee wallet not found');
    error.statusCode = 404;
    throw error;
  }

  const normalizedMethod = WITHDRAWAL_METHOD_MAP[withdrawalMethod];
  const numericAmount = Number(amount);

  if (!normalizedMethod) {
    const error = new Error('Invalid handover method');
    error.statusCode = 400;
    throw error;
  }

  if (!numericAmount || numericAmount <= 0) {
    const error = new Error('Handover amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  if (numericAmount > Number(wallet.available_balance || 0)) {
    const error = new Error('Handover amount exceeds collected balance');
    error.statusCode = 400;
    throw error;
  }

  const request = await WithdrawalRequest.create({
    employee_id: employee.id,
    amount: numericAmount,
    withdrawal_method: normalizedMethod,
    status: 'pending',
  });

  await notifyAdmins({
    type: 'delegate_handover_request_created',
    title: `طلب تسليم مبلغ جديد من ${employee.full_name || 'مندوب'}`,
    body: `تم إرسال طلب تسليم مبلغ بقيمة ${numericAmount} شيكل ويحتاج إلى مراجعة الأدمن.`,
    entityType: 'withdrawal_request',
    entityId: request.id,
    actionUrl: '/admin/handover-requests',
  });

  return {
    id: request.id,
    amount: Number(request.amount || 0),
    withdrawalMethod: request.withdrawal_method,
    status: request.status,
    statusLabel: WITHDRAWAL_STATUS_LABELS[request.status] || request.status,
    requestedAt: request.requested_at,
  };
};

module.exports = {
  ACTIVE_SHIPMENT_STATUSES,
  EMPLOYEE_AVAILABILITY_LABELS,
  ensureAuthenticatedEmployee,
  getAssignedEmployeeShipments,
  getEmployeeOrdersData,
  getEmployeeDashboardData,
  getEmployeeOrderDetailsData,
  updateEmployeeOrderStatus,
  updateEmployeeShipmentLocation,
  getEmployeeProfileData,
  updateEmployeeProfileData,
  updateEmployeeVehicleData,
  createEmployeeDocumentData,
  updateEmployeeDocumentData,
  deleteEmployeeDocumentData,
  updateEmployeeAvailabilityStatus,
  getEmployeeWalletData,
  createEmployeeWithdrawalRequest,
};

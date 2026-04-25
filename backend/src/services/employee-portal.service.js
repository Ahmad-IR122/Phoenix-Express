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

const EMPLOYEE_ORDER_STATUS = {
  accepted: {
    status: 'available',
    statusLabel: 'متاح',
  },
  picked_up: {
    status: 'in_progress',
    statusLabel: 'جارية',
  },
  in_transit: {
    status: 'in_progress',
    statusLabel: 'جارية',
  },
  arrived_to_destination_city: {
    status: 'in_progress',
    statusLabel: 'جارية',
  },
  out_for_delivery: {
    status: 'in_progress',
    statusLabel: 'جارية',
  },
  delivered: {
    status: 'completed',
    statusLabel: 'مكتملة',
  },
};

const DOCUMENT_STATUS_LABELS = {
  valid: 'سارية',
  expiring_soon: 'تنتهي قريبًا',
  expired: 'منتهية',
};

const WITHDRAWAL_STATUS_LABELS = {
  pending: 'قيد المعالجة',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
  paid: 'مكتمل',
};

const TRANSACTION_TYPE_LABELS = {
  earning: 'عمولة شحنة',
  withdrawal: 'سحب',
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
  in_transit: {
    nextStatus: 'delivered',
    orderStatus: 'delivered',
    note: SHIPMENT_DELIVERED_NOTE,
  },
  arrived_to_destination_city: {
    nextStatus: 'delivered',
    orderStatus: 'delivered',
    note: SHIPMENT_DELIVERED_NOTE,
  },
  out_for_delivery: {
    nextStatus: 'delivered',
    orderStatus: 'delivered',
    note: SHIPMENT_DELIVERED_NOTE,
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

const buildAddressLine = (...parts) => parts.filter(Boolean).join(' - ') || null;

const formatTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ar-PS', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const fallbackValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  return value;
};

const resolveEmployeeByUserId = async (userId) => {
  return Employee.findOne({
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
};

const ensureAuthenticatedEmployee = async ({ userId }) => {
  const employee = await resolveEmployeeByUserId(userId);

  if (!employee) {
    const error = new Error('Employee profile not found for the authenticated user');
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

const mapShipmentStatus = (shipmentStatus) => {
  return (
    EMPLOYEE_ORDER_STATUS[shipmentStatus] || {
      status: 'available',
      statusLabel: STATUS_LABELS[shipmentStatus] || 'متاح',
    }
  );
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
    price: region?.price !== undefined && region?.price !== null ? Number(region.price) : 0,
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
    declaredValue: order?.declared_value !== null && order?.declared_value !== undefined
      ? Number(order.declared_value)
      : null,
    estimatedDeliveryDate: shipment.estimated_delivery_date,
    region: region
      ? {
          id: region.id,
          name: region.name,
          price: Number(region.price || 0),
        }
      : null,
  };
};

const getEmployeeOrdersData = async ({ userId }) => {
  const employee = await ensureAuthenticatedEmployee({ userId });

  const shipments = await Shipment.findAll({
    where: { driver_id: employee.id },
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

  return {
    employee: {
      id: employee.id,
      fullName: employee.full_name,
    },
    orders: shipments.map(mapOrderCard),
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

  if (!shipment) {
    return null;
  }

  return mapOrderDetails(shipment);
};

const updateEmployeeOrderStatus = async ({
  userId,
  shipmentId,
  status,
  currentLocation,
}) => {
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

  const transition = STATUS_TRANSITIONS[shipment.current_status];

  if (!transition || transition.nextStatus !== status) {
    const error = new Error('Invalid shipment status transition');
    error.statusCode = 400;
    throw error;
  }

  await sequelize.transaction(async (transaction) => {
    await shipment.update(
      {
        current_status: transition.nextStatus,
      },
      { transaction }
    );

    const orderUpdates = {
      status: transition.orderStatus,
    };

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
  });

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
  const vehicle = employee.vehicle;

  return {
    employee: {
      id: employee.id,
      fullName: employee.full_name,
      jobTitle: 'موظف توصيل',
      phone: employee.user?.phone || null,
      email: employee.user?.email || null,
      address: employee.address || null,
      avatarInitials: employee.full_name
        ? employee.full_name
            .split(' ')
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
        : 'مو',
    },
    vehicle: {
      type: vehicle?.type || buildAddressLine(vehicle?.brand, vehicle?.model) || null,
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
      fileUrl: document.file_url,
      expiryDate: document.expiry_date,
      status: document.status,
      statusLabel: DOCUMENT_STATUS_LABELS[document.status] || document.status,
    })),
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
      type: 'سحب',
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
    const error = new Error('Invalid withdrawal method');
    error.statusCode = 400;
    throw error;
  }

  if (!numericAmount || numericAmount <= 0) {
    const error = new Error('Withdrawal amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  if (numericAmount > Number(wallet.available_balance || 0)) {
    const error = new Error('Withdrawal amount exceeds current balance');
    error.statusCode = 400;
    throw error;
  }

  const request = await WithdrawalRequest.create({
    employee_id: employee.id,
    amount: numericAmount,
    withdrawal_method: normalizedMethod,
    status: 'pending',
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
  getEmployeeOrdersData,
  getEmployeeOrderDetailsData,
  updateEmployeeOrderStatus,
  getEmployeeProfileData,
  getEmployeeWalletData,
  createEmployeeWithdrawalRequest,
};

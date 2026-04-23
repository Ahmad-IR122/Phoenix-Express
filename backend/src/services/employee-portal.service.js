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

const getWeekRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const buildAddressLine = (...parts) => parts.filter(Boolean).join(' - ') || null;

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
    shipmentId: shipment.id,
    orderId: order?.id || null,
    shipmentNumber: shipment.tracking_number,
    status: mappedStatus.status,
    statusLabel: mappedStatus.statusLabel,
    shipmentStatus: shipment.current_status,
    shipmentStatusLabel: STATUS_LABELS[shipment.current_status] || shipment.current_status,
    price: region?.price !== undefined && region?.price !== null ? Number(region.price) : 0,
    pickupAddress: order?.sender_address || null,
    deliveryAddress: order?.receiver_address || null,
    customerName: order?.receiver_name || null,
    parcelType: order?.package_size || null,
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
  getEmployeeProfileData,
  getEmployeeWalletData,
  createEmployeeWithdrawalRequest,
};

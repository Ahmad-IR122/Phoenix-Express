'use strict';

const { Op } = require('sequelize');
const {
  Employee,
  User,
  EmployeeWallet,
  WalletTransaction,
  Shipment,
  Order,
  Region,
} = require('../models');

const STATUS_LABELS = {
  pending: 'معلق',
  accepted: 'مقبول',
  picked_up: 'تم الاستلام',
  in_transit: 'قيد التوصيل',
  out_for_delivery: 'خرج للتسليم',
  delivered: 'مكتمل',
  confirmed: 'مؤكد',
  cancelled: 'ملغي',
  arrived_to_destination_city: 'وصل إلى مدينة الوجهة',
};

const getDayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const buildAddressLine = (name, address) => {
  return [name, address].filter(Boolean).join(' - ') || null;
};

const resolveTaskStatus = (shipment, order) => {
  return shipment.current_status || order?.status || 'pending';
};

const mapTask = (shipment) => {
  const order = shipment.order;
  const region = order?.region;
  const status = resolveTaskStatus(shipment, order);

  return {
    shipmentId: shipment.id,
    orderId: order?.id || null,
    trackingNumber: shipment.tracking_number,
    status,
    statusLabel: STATUS_LABELS[status] || status,
    price: region?.price !== undefined && region?.price !== null ? Number(region.price) : null,
    from: buildAddressLine(order?.sender_name, order?.sender_address),
    to: buildAddressLine(order?.receiver_name, order?.receiver_address),
    timeWindow: null,
  };
};

const findFallbackEmployee = async () => {
  return Employee.findOne({
    attributes: ['id', 'full_name', 'user_id'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'role', 'email', 'phone'],
        where: { role: 'employee' },
        required: true,
      },
      {
        model: EmployeeWallet,
        as: 'wallet',
        attributes: ['id'],
        required: false,
      },
    ],
    order: [['id', 'ASC']],
  });
};

const getEmployeeDashboardData = async ({ userId }) => {
  const { start, end } = getDayRange();

  const employee = userId
    ? await Employee.findOne({
        where: { user_id: userId },
        attributes: ['id', 'full_name', 'user_id'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'role', 'email', 'phone'],
          },
          {
            model: EmployeeWallet,
            as: 'wallet',
            attributes: ['id'],
            required: false,
          },
        ],
      })
    : null;

  const resolvedEmployee = employee || (await findFallbackEmployee());

  if (!resolvedEmployee) {
    return null;
  }

  const activeOrdersPromise = Shipment.count({
    where: {
      driver_id: resolvedEmployee.id,
      current_status: {
        [Op.ne]: 'delivered',
      },
    },
  });

  const completedShipmentsPromise = Shipment.findAll({
    where: {
      driver_id: resolvedEmployee.id,
      current_status: 'delivered',
    },
    attributes: ['id', 'updatedAt'],
    include: [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'delivered_at'],
        required: false,
      },
    ],
  });

  const dailyEarningsPromise = resolvedEmployee.wallet
    ? WalletTransaction.sum('amount', {
        where: {
          wallet_id: resolvedEmployee.wallet.id,
          transaction_type: 'earning',
          createdAt: {
            [Op.between]: [start, end],
          },
        },
      })
    : Promise.resolve(0);

  const tasksPromise = Shipment.findAll({
    where: {
      driver_id: resolvedEmployee.id,
      current_status: {
        [Op.ne]: 'delivered',
      },
    },
    include: [
      {
        model: Order,
        as: 'order',
        attributes: [
          'id',
          'sender_name',
          'sender_address',
          'receiver_name',
          'receiver_address',
          'status',
          'delivered_at',
        ],
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
      ['estimated_delivery_date', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
  });

  const [activeOrders, completedShipments, dailyEarnings, tasks] = await Promise.all([
    activeOrdersPromise,
    completedShipmentsPromise,
    dailyEarningsPromise,
    tasksPromise,
  ]);

  const completedToday = completedShipments.filter((shipment) => {
    const deliveredAt = shipment.order?.delivered_at || shipment.updatedAt;
    if (!deliveredAt) {
      return false;
    }

    const deliveredDate = new Date(deliveredAt);
    return deliveredDate >= start && deliveredDate <= end;
  }).length;

  return {
    employee: {
      id: resolvedEmployee.id,
      full_name: resolvedEmployee.full_name,
    },
    stats: {
      activeOrders,
      completedToday,
      dailyEarnings: Number(dailyEarnings || 0),
    },
    tasks: tasks.map(mapTask),
  };
};

module.exports = {
  getEmployeeDashboardData,
  STATUS_LABELS,
};

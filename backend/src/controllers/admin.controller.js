"use strict";

const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const {
  Admin,
  User,
  Order,
  Region,
  Employee,
  Customer,
  CompanyCustomerProfile,
  IndividualCustomerProfile,
  Shipment,
  TrackingUpdate,
  sequelize,
} = require("../models");

const ACTIVE_SHIPMENT_STATUSES = [
  "accepted",
  "picked_up",
  "in_transit",
  "arrived_to_destination_city",
  "out_for_delivery",
];
const FINISHED_ORDER_STATUSES = ["delivered", "cancelled"];
const NEW_PARCEL_ORDER_STATUSES = ["pending", "confirmed"];
const ASSIGNED_PARCEL_STATUS_LABELS = {
  accepted: "مسند",
  picked_up: "تم الاستلام",
  in_transit: "جارية",
  arrived_to_destination_city: "وصلت للمدينة",
  out_for_delivery: "قيد التوصيل",
  delivered: "تم التسليم",
};
const DELIVERY_SPEED_PRIORITY = {
  express: "فوري",
  urgent: "عاجل",
  normal: "عادي",
};
const ARABIC_DAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const getStartOfDay = (date = new Date()) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const getEndOfDay = (date = new Date()) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const getArabicDayName = (date) => ARABIC_DAY_NAMES[new Date(date).getDay()];

const formatArabicTime = (dateValue) => {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  let hours = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const period = hours >= 12 ? "م" : "ص";

  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveMerchantName = (order) => {
  const companyName = order.customer?.company_profile?.company_name;
  if (companyName) return companyName;

  const individualName = order.customer?.individual_profile?.full_name;
  if (individualName) return individualName;

  return order.sender_name || "-";
};

const buildTrackingNumber = (orderId) => `PHX-${orderId}`;

const getDriverAvailabilityStatus = (activeParcels) =>
  activeParcels >= 5 ? "مشغول" : "متاح";

const countActiveShipmentsByDriver = async (transaction) => {
  const rows = await Shipment.findAll({
    attributes: [
      "driver_id",
      [sequelize.fn("COUNT", sequelize.col("Shipment.id")), "active_count"],
    ],
    where: {
      driver_id: {
        [Op.not]: null,
      },
      current_status: {
        [Op.in]: ACTIVE_SHIPMENT_STATUSES,
      },
    },
    group: ["driver_id"],
    ...(transaction ? { transaction } : {}),
    raw: true,
  });

  return new Map(
    rows.map((row) => [toNumber(row.driver_id), toNumber(row.active_count)]),
  );
};

const getNewParcelOrders = async (transaction) =>
  Order.findAll({
    where: {
      status: {
        [Op.in]: NEW_PARCEL_ORDER_STATUSES,
      },
    },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id"],
        required: false,
        include: [
          {
            model: CompanyCustomerProfile,
            as: "company_profile",
            attributes: ["company_name"],
            required: false,
          },
          {
            model: IndividualCustomerProfile,
            as: "individual_profile",
            attributes: ["full_name"],
            required: false,
          },
        ],
      },
      {
        model: Shipment,
        as: "shipment",
        attributes: ["id", "driver_id", "current_status", "tracking_number"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    ...(transaction ? { transaction } : {}),
  });

const getAssignedActiveShipments = async (transaction) =>
  Shipment.findAll({
    where: {
      driver_id: {
        [Op.not]: null,
      },
      current_status: {
        [Op.in]: ACTIVE_SHIPMENT_STATUSES,
      },
    },
    include: [
      {
        model: Order,
        as: "order",
        required: true,
        where: {
          status: {
            [Op.notIn]: FINISHED_ORDER_STATUSES,
          },
        },
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id"],
            required: false,
            include: [
              {
                model: CompanyCustomerProfile,
                as: "company_profile",
                attributes: ["company_name"],
                required: false,
              },
              {
                model: IndividualCustomerProfile,
                as: "individual_profile",
                attributes: ["full_name"],
                required: false,
              },
            ],
          },
        ],
      },
      {
        model: Employee,
        as: "driver",
        attributes: ["id", "full_name", "address", "is_active"],
        required: false,
      },
    ],
    order: [["updatedAt", "DESC"]],
    ...(transaction ? { transaction } : {}),
  });

const getActiveEmployees = async (transaction) =>
  Employee.findAll({
    where: {
      is_active: true,
    },
    attributes: ["id", "full_name", "address", "is_active"],
    order: [["full_name", "ASC"]],
    ...(transaction ? { transaction } : {}),
  });

const buildDriverSummaries = (employees, activeCountsByDriverId) =>
  employees.map((employee) => {
    const activeParcels = activeCountsByDriverId.get(employee.id) || 0;
    const availabilityStatus = getDriverAvailabilityStatus(activeParcels);

    return {
      id: employee.id,
      fullName: employee.full_name,
      address: employee.address || "-",
      isActive: Boolean(employee.is_active),
      activeParcels,
      availabilityStatus,
      canReceiveOrders: activeParcels < 5,
    };
  });

const buildParcelDistributionPayload = ({
  newParcelOrders,
  assignedShipments,
  activeEmployees,
  activeCountsByDriverId,
}) => {
  const newParcels = newParcelOrders
    .filter((order) => !order.shipment || !order.shipment.driver_id)
    .map((order) => ({
      orderId: order.id,
      merchant: resolveMerchantName(order),
      priority: DELIVERY_SPEED_PRIORITY[order.delivery_speed] || "عادي",
      receiverName: order.receiver_name || "-",
      receiverPhone: order.receiver_phone || "-",
      receiverAddress: order.receiver_address || "-",
      destinationCity: order.destination_city || "-",
      packageDescription: order.package_description || "-",
      packageSize: order.package_size || "-",
      orderStatus: order.status || "-",
      shipmentId: order.shipment?.id || null,
    }));

  const assignedParcels = assignedShipments.map((shipment) => ({
    shipmentId: shipment.id,
    orderId: shipment.order?.id || null,
    merchant: resolveMerchantName(shipment.order),
    driverId: shipment.driver?.id || shipment.driver_id || null,
    driverName: shipment.driver?.full_name || "-",
    driverAddress: shipment.driver?.address || "-",
    status: shipment.current_status,
    statusLabel:
      ASSIGNED_PARCEL_STATUS_LABELS[shipment.current_status] || "قيد التوصيل",
    receiverName: shipment.order?.receiver_name || "-",
    receiverPhone: shipment.order?.receiver_phone || "-",
    receiverAddress: shipment.order?.receiver_address || "-",
    trackingNumber: shipment.tracking_number || buildTrackingNumber(shipment.order?.id),
  }));

  const availableDrivers = buildDriverSummaries(activeEmployees, activeCountsByDriverId);
  const newParcelsCount = newParcels.length;
  const assignedParcelsCount = assignedParcels.length;
  const totalActiveParcels = newParcelsCount + assignedParcelsCount;
  const availableDriversCount = availableDrivers.filter((driver) => driver.canReceiveOrders).length;
  const busyDriversCount = availableDrivers.filter((driver) => !driver.canReceiveOrders).length;

  return {
    newParcels,
    assignedParcels,
    availableDrivers,
    summary: {
      newParcelsCount,
      assignedParcelsCount,
      totalActiveParcels,
      availableDriversCount,
      busyDriversCount,
    },
  };
};

const getParcelDistribution = async (req, res) => {
  try {
    const [newParcelOrders, assignedShipments, activeEmployees, activeCountsByDriverId] =
      await Promise.all([
        getNewParcelOrders(),
        getAssignedActiveShipments(),
        getActiveEmployees(),
        countActiveShipmentsByDriver(),
      ]);

    const parcelDistributionData = buildParcelDistributionPayload({
      newParcelOrders,
      assignedShipments,
      activeEmployees,
      activeCountsByDriverId,
    });

    return res.status(200).json({
      success: true,
      message: "تم جلب بيانات توزيع الطرود بنجاح",
      data: parcelDistributionData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل في جلب بيانات توزيع الطرود",
      data: {
        newParcels: [],
        assignedParcels: [],
        availableDrivers: [],
        summary: {
          newParcelsCount: 0,
          assignedParcelsCount: 0,
          totalActiveParcels: 0,
          availableDriversCount: 0,
          busyDriversCount: 0,
        },
      },
    });
  }
};

const assignParcelToDriver = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const orderId = toNumber(req.body.orderId);
    const driverId = toNumber(req.body.driverId);

    if (!orderId || !driverId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "بيانات التخصيص غير مكتملة",
      });
    }

    const order = await Order.findByPk(orderId, { transaction });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود",
      });
    }

    const employee = await Employee.findOne({
      where: {
        id: driverId,
        is_active: true,
      },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "المندوب غير موجود أو غير نشط",
      });
    }

    const activeParcels = await Shipment.count({
      where: {
        driver_id: employee.id,
        current_status: {
          [Op.in]: ACTIVE_SHIPMENT_STATUSES,
        },
      },
      transaction,
    });

    if (activeParcels >= 5) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "لا يمكن تخصيص الطلب لهذا المندوب لأنه مشغول حالياً",
      });
    }

    let shipment = await Shipment.findOne({
      where: {
        order_id: order.id,
      },
      transaction,
    });

    if (shipment) {
      await shipment.update(
        {
          driver_id: employee.id,
          current_status: "accepted",
          tracking_number: shipment.tracking_number || buildTrackingNumber(order.id),
        },
        { transaction },
      );
    } else {
      shipment = await Shipment.create(
        {
          order_id: order.id,
          driver_id: employee.id,
          tracking_number: buildTrackingNumber(order.id),
          current_status: "accepted",
          estimated_delivery_date: null,
        },
        { transaction },
      );
    }

    if (order.status === "pending") {
      await order.update(
        {
          status: "confirmed",
        },
        { transaction },
      );
    }

    await TrackingUpdate.create(
      {
        shipment_id: shipment.id,
        status: "accepted",
        note: "تم تخصيص الطرد للمندوب",
        current_location: order.origin_city || null,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "تم تخصيص الطرد للمندوب بنجاح",
      data: {
        orderId: order.id,
        driverId: employee.id,
        driverName: employee.full_name,
        trackingNumber: shipment.tracking_number,
      },
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: "فشل في تخصيص الطرد للمندوب",
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();
    const last7DaysStart = getStartOfDay(
      new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000),
    );

    const [
      newParcelOrders,
      assignedActiveShipments,
      deliveredTodayOrders,
      deliveredWeeklyOrders,
      ordersByCityRows,
      recentOrdersRows,
      activeCountsByDriverId,
      activeEmployees,
    ] = await Promise.all([
      getNewParcelOrders(),
      getAssignedActiveShipments(),
      Order.findAll({
        where: {
          status: "delivered",
          delivered_at: {
            [Op.ne]: null,
            [Op.between]: [todayStart, todayEnd],
          },
        },
        attributes: ["id", "delivered_at"],
        include: [
          {
            model: Region,
            as: "region",
            attributes: ["price"],
            required: false,
          },
        ],
      }),
      Order.findAll({
        where: {
          status: "delivered",
          delivered_at: {
            [Op.ne]: null,
            [Op.between]: [last7DaysStart, todayEnd],
          },
        },
        attributes: ["id", "delivered_at"],
        include: [
          {
            model: Region,
            as: "region",
            attributes: ["price"],
            required: false,
          },
        ],
        order: [["delivered_at", "ASC"]],
      }),
      Order.findAll({
        attributes: [
          ["destination_city", "name"],
          [sequelize.fn("COUNT", sequelize.col("Order.id")), "total"],
        ],
        where: {
          destination_city: {
            [Op.and]: [{ [Op.not]: null }, { [Op.ne]: "" }],
          },
        },
        group: ["destination_city"],
        order: [[sequelize.literal('COUNT("Order"."id")'), "DESC"]],
        limit: 5,
        raw: true,
      }),
      Order.findAll({
        attributes: ["id", "sender_name", "status", "createdAt"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id"],
            required: false,
            include: [
              {
                model: CompanyCustomerProfile,
                as: "company_profile",
                attributes: ["company_name"],
                required: false,
              },
              {
                model: IndividualCustomerProfile,
                as: "individual_profile",
                attributes: ["full_name"],
                required: false,
              },
            ],
          },
          {
            model: Shipment,
            as: "shipment",
            attributes: ["id", "driver_id"],
            required: false,
            include: [
              {
                model: Employee,
                as: "driver",
                attributes: ["full_name"],
                required: false,
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 4,
      }),
      countActiveShipmentsByDriver(),
      getActiveEmployees(),
    ]);

    const parcelDistributionData = buildParcelDistributionPayload({
      newParcelOrders,
      assignedShipments: assignedActiveShipments,
      activeEmployees,
      activeCountsByDriverId,
    });

    const dailyRevenue = deliveredTodayOrders.reduce(
      (sum, order) => sum + toNumber(order.region?.price),
      0,
    );

    const weeklyRevenueMap = new Map();
    for (let i = 0; i < 7; i += 1) {
      const currentDate = new Date(last7DaysStart.getTime() + i * 24 * 60 * 60 * 1000);
      const key = currentDate.toISOString().slice(0, 10);
      weeklyRevenueMap.set(key, {
        day: getArabicDayName(currentDate),
        total: 0,
      });
    }

    deliveredWeeklyOrders.forEach((order) => {
      const dateKey = new Date(order.delivered_at).toISOString().slice(0, 10);
      const currentDay = weeklyRevenueMap.get(dateKey);

      if (currentDay) {
        currentDay.total += toNumber(order.region?.price);
      }
    });

    const weeklyRevenue = Array.from(weeklyRevenueMap.values()).map((item) => ({
      day: item.day,
      total: item.total,
    }));

    const ordersByCity = (ordersByCityRows || []).map((item) => ({
      name: item.name || "-",
      total: toNumber(item.total),
    }));

    const recentOrders = (recentOrdersRows || []).map((order) => ({
      id: order.id,
      merchant: resolveMerchantName(order),
      status: order.status || "-",
      driver: order.shipment?.driver?.full_name || "-",
      time: formatArabicTime(order.createdAt),
    }));

    return res.status(200).json({
      success: true,
      message: "Admin dashboard data fetched successfully",
      data: {
        stats: {
          activeOrders: toNumber(parcelDistributionData.summary.totalActiveParcels),
          availableEmployees: toNumber(parcelDistributionData.summary.availableDriversCount),
          pendingOrders: toNumber(parcelDistributionData.summary.newParcelsCount),
          dailyRevenue: toNumber(dailyRevenue),
        },
        weeklyRevenue,
        ordersByCity,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    console.error("Failed to fetch admin dashboard data:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard data",
      data: {
        stats: {
          activeOrders: 0,
          availableEmployees: 0,
          pendingOrders: 0,
          dailyRevenue: 0,
        },
        weeklyRevenue: [],
        ordersByCity: [],
        recentOrders: [],
      },
    });
  }
};

const createAdmin = async (req, res) => {
  let transaction;
  try {
    const { email, phone, password, role, is_active } = req.body;
    if (role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Role must be 'admin'",
      });
    }

    transaction = await sequelize.transaction();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        email,
        phone,
        password: hashedPassword,
        role,
      },
      { transaction },
    );

    const admin = await Admin.create(
      {
        user_id: user.id,
        is_active,
      },
      { transaction },
    );

    await transaction.commit();

    const result = await Admin.findByPk(admin.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: result,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(400).json({
      success: false,
      message: "Failed to create admin",
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      errors: [error.message],
    });
  }
};

const findAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin",
      errors: [error.message],
    });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, password, role, is_active } = req.body;
    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const user = await User.findByPk(admin.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Associated user not found",
      });
    }

    await user.update({
      email: email !== undefined ? email : user.email,
      phone: phone !== undefined ? phone : user.phone,
      password:
        password !== undefined
          ? await bcrypt.hash(password, 10)
          : user.password,
      role: role !== undefined ? role : user.role,
    });

    await admin.update({
      is_active: is_active !== undefined ? is_active : admin.is_active,
    });

    const result = await Admin.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update admin",
      errors: [error.message],
    });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    await admin.destroy();

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete admin",
      errors: [error.message],
    });
  }
};

module.exports = {
  getAdminDashboard,
  getParcelDistribution,
  assignParcelToDriver,
  createAdmin,
  getAllAdmins,
  findAdminById,
  updateAdmin,
  deleteAdmin,
};

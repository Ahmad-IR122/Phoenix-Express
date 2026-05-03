"use strict";

const moment = require("moment-timezone");
const { Op } = require("sequelize");
const {
  Admin,
  User,
  Order,
  Region,
  Employee,
  Vehicle,
  EmployeeWallet,
  WithdrawalRequest,
  Customer,
  CompanyCustomerProfile,
  IndividualCustomerProfile,
  MerchantSettlement,
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
  returned: "مرتجعة",
  cancelled: "ملغاة",
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
const DASHBOARD_TIME_ZONE = process.env.DASHBOARD_TIME_ZONE || "Asia/Hebron";
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => String(value || "").trim();

const getStartOfDay = (date = new Date()) => {
  return moment.tz(date, DASHBOARD_TIME_ZONE).startOf("day").toDate();
};

const getEndOfDay = (date = new Date()) => {
  return moment.tz(date, DASHBOARD_TIME_ZONE).endOf("day").toDate();
};

const getLocalDateKey = (dateValue) => {
  const date = moment(dateValue);
  return date.isValid() ? date.tz(DASHBOARD_TIME_ZONE).format("YYYY-MM-DD") : "";
};

const getCurrentWeekRange = () => {
  const now = moment.tz(DASHBOARD_TIME_ZONE);
  const day = now.day();
  const diffToSaturday = day === 6 ? 0 : day + 1;
  const start = now.clone().subtract(diffToSaturday, "days").startOf("day");
  const end = start.clone().add(6, "days").endOf("day");

  return { start: start.toDate(), end: end.toDate() };
};

const getArabicDayName = (date) => {
  const zonedDate = moment(date).tz(DASHBOARD_TIME_ZONE);
  return zonedDate.isValid() ? ARABIC_DAY_NAMES[zonedDate.day()] : "-";
};

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

const normalizeSearchTerm = (value) => String(value || "").trim().toLowerCase();

const formatMoneyValue = (value) => toNumber(value);

const mapDistributionParcel = (order) => ({
  orderId: order.id,
  shipmentId: order.shipment?.id || null,
  shipmentNumber:
    order.shipment?.tracking_number ||
    (order.shipment?.id || order.id ? buildTrackingNumber(order.id) : "-"),
  merchant: resolveMerchantName(order),
  senderName: order.sender_name || "-",
  senderPhone: order.sender_phone || "-",
  originCity: order.origin_city || "-",
  destinationCity: order.destination_city || "-",
  receiverName: order.receiver_name || "-",
  receiverPhone: order.receiver_phone || "-",
  receiverAddress: order.receiver_address || "-",
  region: order.region
    ? {
        id: order.region.id,
        name: order.region.name || "-",
      }
    : null,
  regionName: order.region?.name || "-",
  productPrice: formatMoneyValue(order.declared_value),
  deliveryFee: formatMoneyValue(order.region?.price),
  priority: DELIVERY_SPEED_PRIORITY[order.delivery_speed] || "عادي",
  packageDescription: order.package_description || "-",
  packageSize: order.package_size || "-",
  orderStatus: order.status || "-",
  shipmentStatus: order.shipment?.current_status || null,
});

const matchesDistributionSearch = (parcel, searchTerm) => {
  if (!searchTerm) return true;

  const haystack = [
    parcel.orderId,
    parcel.shipmentId,
    parcel.shipmentNumber,
    parcel.merchant,
    parcel.senderName,
    parcel.senderPhone,
    parcel.receiverName,
    parcel.receiverPhone,
    parcel.receiverAddress,
    parcel.originCity,
    parcel.destinationCity,
    parcel.regionName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchTerm);
};

const filterDistributionParcels = (parcels, filters = {}) => {
  const searchTerm = normalizeSearchTerm(filters.search);
  const regionId = toNumber(filters.regionId);
  const shipmentStatus = normalizeSearchTerm(filters.shipmentStatus);
  const driverId = toNumber(filters.driverId);

  return parcels.filter((parcel) => {
    if (regionId && toNumber(parcel.region?.id) !== regionId) {
      return false;
    }

    if (shipmentStatus && shipmentStatus !== "all") {
      const currentStatus = normalizeSearchTerm(parcel.shipmentStatus || parcel.status);
      if (currentStatus !== shipmentStatus) {
        return false;
      }
    }

    if (driverId && toNumber(parcel.driverId) !== driverId) {
      return false;
    }

    return matchesDistributionSearch(parcel, searchTerm);
  });
};

const EMPLOYEE_AVAILABILITY_STATUS_LABELS = {
  available: "متاح",
  busy: "مشغول",
  offline: "غير متصل",
};
const HANDOVER_REQUEST_STATUS_LABELS = {
  pending: "قيد المعالجة",
  approved: "بانتظار الإكمال",
  rejected: "مرفوض",
  paid: "مكتمل",
};
const HANDOVER_METHOD_LABELS = {
  cash: "تسليم نقدي",
  bank_transfer: "تحويل بنكي",
  ewallet: "محفظة إلكترونية",
};
const MERCHANT_SETTLEMENT_STATUS_LABELS = {
  pending: "بانتظار التسوية",
  requested: "تم إرسال الطلب للتاجر",
  settled: "تمت التسوية",
  inactive: "غير نشط",
};
const RETURNED_SHIPMENT_STATUS_LABELS = {
  returned: "مرتجعة",
  cancelled: "ملغاة",
};
const DELEGATE_ACTIVE_ORDER_STATUSES = [
  "picked_up",
  "in_transit",
  "arrived_to_destination_city",
  "out_for_delivery",
];

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
        model: Region,
        as: "region",
        attributes: ["id", "name", "price"],
        required: false,
      },
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
            model: Region,
            as: "region",
            attributes: ["id", "name", "price"],
            required: false,
          },
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
        attributes: ["id", "full_name", "address", "is_active", "availability_status"],
        required: false,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["phone"],
            required: false,
          },
        ],
      },
    ],
    order: [["updatedAt", "DESC"]],
    ...(transaction ? { transaction } : {}),
  });

const getWorkingEmployees = async (transaction) =>
  Employee.findAll({
    where: {
      is_active: true,
    },
    attributes: ["id", "full_name", "address", "is_active", "availability_status"],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["phone"],
        required: false,
      },
    ],
    order: [["full_name", "ASC"]],
    ...(transaction ? { transaction } : {}),
  });

const buildDriverSummaries = (employees, activeCountsByDriverId) =>
  employees.map((employee) => {
    const activeParcels = activeCountsByDriverId.get(employee.id) || 0;
    const availabilityStatus =
      EMPLOYEE_AVAILABILITY_STATUS_LABELS[employee.availability_status] || "متاح";

    return {
      id: employee.id,
      fullName: employee.full_name,
      phone: employee.user?.phone || "-",
      address: employee.address || "-",
      isActive: Boolean(employee.is_active),
      availabilityStatusKey: employee.availability_status,
      activeParcels,
      availabilityStatus,
      canReceiveOrders: employee.is_active && employee.availability_status === "available",
    };
  });

const buildParcelDistributionPayload = ({
  newParcelOrders,
  assignedShipments,
  activeEmployees,
  activeCountsByDriverId,
}) => {
  const newParcels = newParcelOrders
    .filter((order) => {
      if (!order.shipment) return true;
      if (order.shipment.driver_id) return false;
      return !["delivered", "returned", "cancelled"].includes(order.shipment.current_status);
    })
    .map(mapDistributionParcel);

  const assignedParcels = assignedShipments.map((shipment) => ({
    shipmentId: shipment.id,
    orderId: shipment.order?.id || null,
    shipmentNumber: shipment.tracking_number || buildTrackingNumber(shipment.order?.id),
    merchant: resolveMerchantName(shipment.order),
    driverId: shipment.driver?.id || shipment.driver_id || null,
    driverName: shipment.driver?.full_name || "-",
    driverPhone: shipment.driver?.user?.phone || "-",
    driverAddress: shipment.driver?.address || "-",
    status: shipment.current_status,
    statusLabel:
      ASSIGNED_PARCEL_STATUS_LABELS[shipment.current_status] || "قيد التوصيل",
    senderName: shipment.order?.sender_name || "-",
    senderPhone: shipment.order?.sender_phone || "-",
    originCity: shipment.order?.origin_city || "-",
    destinationCity: shipment.order?.destination_city || "-",
    receiverName: shipment.order?.receiver_name || "-",
    receiverPhone: shipment.order?.receiver_phone || "-",
    receiverAddress: shipment.order?.receiver_address || "-",
    region: shipment.order?.region
      ? {
          id: shipment.order.region.id,
          name: shipment.order.region.name || "-",
        }
      : null,
    regionName: shipment.order?.region?.name || "-",
    productPrice: formatMoneyValue(shipment.order?.declared_value),
    deliveryFee: formatMoneyValue(shipment.order?.region?.price),
    trackingNumber: shipment.tracking_number || buildTrackingNumber(shipment.order?.id),
  }));

  const allDrivers = buildDriverSummaries(activeEmployees, activeCountsByDriverId);
  const availableDrivers = allDrivers.filter((driver) => driver.availabilityStatusKey === "available");
  const newParcelsCount = newParcels.length;
  const assignedParcelsCount = assignedParcels.length;
  const totalActiveParcels = newParcelsCount + assignedParcelsCount;
  const availableDriversCount = allDrivers.filter(
    (driver) => driver.availabilityStatusKey === "available"
  ).length;
  const busyDriversCount = allDrivers.filter(
    (driver) => driver.availabilityStatusKey === "busy"
  ).length;

  return {
    newParcels,
    assignedParcels,
    availableDrivers,
    allDrivers,
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
        getWorkingEmployees(),
        countActiveShipmentsByDriver(),
      ]);

    const parcelDistributionData = buildParcelDistributionPayload({
      newParcelOrders,
      assignedShipments,
      activeEmployees,
      activeCountsByDriverId,
    });

    const filteredNewParcels = filterDistributionParcels(parcelDistributionData.newParcels, {
      search: req.query.search,
      regionId: req.query.regionId,
    });
    const filteredAssignedParcels = filterDistributionParcels(
      parcelDistributionData.assignedParcels,
      {
        search: req.query.search,
        regionId: req.query.regionId,
        shipmentStatus: req.query.shipmentStatus,
        driverId: req.query.driverId,
      },
    );

    return res.status(200).json({
      success: true,
      message: "تم جلب بيانات توزيع الطرود بنجاح",
      data: {
        ...parcelDistributionData,
        newParcels: filteredNewParcels,
        assignedParcels: filteredAssignedParcels,
        filters: {
          search: req.query.search || "",
          regionId: req.query.regionId || "",
          shipmentStatus: req.query.shipmentStatus || "all",
          driverId: req.query.driverId || "",
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل في جلب بيانات توزيع الطرود",
      data: {
        newParcels: [],
        assignedParcels: [],
        availableDrivers: [],
        allDrivers: [],
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

    if (!NEW_PARCEL_ORDER_STATUSES.includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "هذا الطلب ليس ضمن الطرود المعلقة الجاهزة للتخصيص",
      });
    }

    const employee = await Employee.findOne({
      where: {
        id: driverId,
        is_active: true,
        availability_status: "available",
      },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "المندوب غير متاح حالياً للاستلام",
      });
    }

    let shipment = await Shipment.findOne({
      where: {
        order_id: order.id,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (
      shipment?.driver_id &&
      ACTIVE_SHIPMENT_STATUSES.includes(shipment.current_status)
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "تم تخصيص هذا الطلب بالفعل إلى مندوب آخر",
      });
    }

    if (shipment?.current_status === "returned") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "الطرود المرتجعة يعاد تخصيصها فقط من صفحة الشحنات المرتجعة",
      });
    }

    if (shipment?.current_status === "delivered" || shipment?.current_status === "cancelled") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "لا يمكن تخصيص هذا الطلب بحالته الحالية",
      });
    }

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
    if (!transaction.finished) {
      await transaction.rollback();
    }
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
    const last7DaysStart = getStartOfDay(new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000));

    const [
      pendingShipments,
      activeShipments,
      availableDelegates,
      deliveredTodayRows,
      regionDistributionRows,
      deliveredWeeklyRows,
      recentShipmentRows,
    ] = await Promise.all([
      // Count orders with status in NEW_PARCEL_ORDER_STATUSES that don't have assigned shipments
      Order.count({
        where: {
          status: {
            [Op.in]: NEW_PARCEL_ORDER_STATUSES,
          },
          [Op.or]: [
            {
              "$shipment.id$": null,
            },
            {
              "$shipment.driver_id$": null,
            },
          ],
        },
        include: [
          {
            model: Shipment,
            as: "shipment",
            attributes: [],
            required: false,
          },
        ],
        distinct: true,
      }),
      // Count shipments with driver_id NOT NULL and current_status in ACTIVE_SHIPMENT_STATUSES
      Shipment.count({
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
            attributes: [],
            required: true,
            where: {
              status: {
                [Op.notIn]: FINISHED_ORDER_STATUSES,
              },
            },
          },
        ],
      }),
      Employee.count({
        where: {
          is_active: true,
          availability_status: "available",
        },
      }),
      Order.findAll({
        attributes: ["delivered_at"],
        where: {
          status: "delivered",
          delivered_at: {
            [Op.between]: [todayStart, todayEnd],
          },
        },
        include: [
          {
            model: Region,
            as: "region",
            attributes: ["price"],
            required: true,
          },
        ],
        raw: false,
      }),
      Shipment.findAll({
        attributes: [
          [sequelize.col("order.destination_city"), "city"],
          [sequelize.fn("COUNT", sequelize.col("Shipment.id")), "count"],
        ],
        include: [
          {
            model: Order,
            as: "order",
            attributes: [],
            required: true,
            where: {
              status: {
                [Op.notIn]: FINISHED_ORDER_STATUSES,
              },
            },
          },
        ],
        where: {
          driver_id: {
            [Op.not]: null,
          },
          current_status: {
            [Op.in]: ACTIVE_SHIPMENT_STATUSES,
          },
        },
        group: ["order.destination_city"],
        order: [[sequelize.literal('COUNT("Shipment"."id")'), "DESC"]],
        raw: true,
      }),
      Order.findAll({
        attributes: ["delivered_at"],
        where: {
          status: "delivered",
          delivered_at: {
            [Op.between]: [last7DaysStart, todayEnd],
          },
        },
        include: [
          {
            model: Region,
            as: "region",
            attributes: ["price"],
            required: true,
          },
        ],
        order: [["delivered_at", "ASC"]],
      }),
      Shipment.findAll({
        attributes: ["id", "current_status", "createdAt"],
        include: [
          {
            model: Order,
            as: "order",
            attributes: ["id", "sender_name"],
            required: true,
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
            attributes: ["full_name"],
            required: false,
          },
        ],
        order: [[sequelize.col("Shipment.created_at"), "DESC"]],
        limit: 10,
      }),
    ]);

    const dailyProfit = deliveredTodayRows.reduce(
      (sum, order) => sum + toNumber(order.region?.price),
      0,
    );
    const deliveredTodayCount = deliveredTodayRows.length;

    const weeklyRevenueMap = new Map();
    for (let i = 0; i < 7; i += 1) {
      const currentDate = new Date(last7DaysStart.getTime() + i * 24 * 60 * 60 * 1000);
      const key = getLocalDateKey(currentDate);
      weeklyRevenueMap.set(key, {
        day: getArabicDayName(currentDate),
        date: key,
        deliveredCount: 0,
        total: 0,
      });
    }

    deliveredWeeklyRows.forEach((order) => {
      const dateKey = getLocalDateKey(order.delivered_at);
      const currentDay = weeklyRevenueMap.get(dateKey);

      if (currentDay) {
        currentDay.total += toNumber(order.region?.price);
        currentDay.deliveredCount += 1;
      }
    });

    const weeklyRevenue = Array.from(weeklyRevenueMap.values());

    const ordersByCity = (regionDistributionRows || []).map((row) => ({
      city: row.city || "-",
      count: toNumber(row.count),
    }));

    const recentOrders = (recentShipmentRows || []).slice(0, 10).map((shipment) => ({
      id: shipment.order?.id || shipment.id,
      merchant_name: resolveMerchantName(shipment.order || {}),
      delegate_name: shipment.driver?.full_name || "-",
      status: shipment.current_status || shipment.order?.status || "-",
      created_at: shipment.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Admin dashboard data fetched successfully",
      data: {
        dailyProfit: toNumber(dailyProfit),
        deliveredTodayCount: toNumber(deliveredTodayCount),
        pendingShipments: toNumber(pendingShipments),
        activeShipments: toNumber(activeShipments),
        availableDelegates: toNumber(availableDelegates),
        regionDistribution: ordersByCity,
        ordersByCity,
        weeklyRevenue,
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
        dailyProfit: 0,
        deliveredTodayCount: 0,
        pendingShipments: 0,
        activeShipments: 0,
        availableDelegates: 0,
        regionDistribution: [],
        ordersByCity: [],
        weeklyRevenue: [],
        recentOrders: [],
      },
    });
  }
};

const buildMerchantStatusFromFinancials = ({
  merchantDue,
  settledAmount,
  pendingSettlementAmount,
  deliveredCount,
}) => {
  if (!deliveredCount) {
    return "inactive";
  }

  if (pendingSettlementAmount > 0) {
    return "requested";
  }

  return settledAmount >= merchantDue ? "settled" : "pending";
};

const buildMerchantSummaryRow = ({
  merchant,
  orderStats,
  deliveredFinancials,
  settledAmount,
  pendingSettlementAmount,
}) => {
  const companyProfile = merchant.companyProfile || merchant.company_profile || null;
  const totalParcels = toNumber(orderStats.total_parcels);
  const deliveredCount = toNumber(orderStats.delivered_count);
  const pendingCount = toNumber(orderStats.pending_count);
  const returnedCount = toNumber(orderStats.returned_count);
  const merchantDue = toNumber(deliveredFinancials.merchant_due);
  const phoenixCommission = toNumber(deliveredFinancials.phoenix_commission);
  const totalCollected = merchantDue + phoenixCommission;
  const remainingSettlementAmount = Math.max(merchantDue - settledAmount, 0);
  const availableSettlementRequestAmount = Math.max(
    merchantDue - settledAmount - pendingSettlementAmount,
    0
  );
  const settlementStatus = buildMerchantStatusFromFinancials({
    merchantDue,
    settledAmount,
    pendingSettlementAmount,
    deliveredCount,
  });

  return {
    id: merchant.id,
    merchant_name: companyProfile?.company_name || merchant.user?.email || `Merchant #${merchant.id}`,
    phone: companyProfile?.company_phone || merchant.user?.phone || "-",
    email: merchant.user?.email || "-",
    location: companyProfile?.company_location || "-",
    total_parcels: totalParcels,
    delivered_count: deliveredCount,
    pending_count: pendingCount,
    returned_count: returnedCount,
    total_collected: totalCollected,
    phoenix_commission: phoenixCommission,
    merchant_due: merchantDue,
    total_settled_amount: settledAmount,
    pending_settlement_amount: pendingSettlementAmount,
    outstanding_revenue: remainingSettlementAmount,
    remaining_settlement_amount: remainingSettlementAmount,
    available_settlement_request_amount: availableSettlementRequestAmount,
    settlement_status: settlementStatus,
    settlement_status_label:
      MERCHANT_SETTLEMENT_STATUS_LABELS[settlementStatus] || settlementStatus,
  };
};

const getMerchantAggregationData = async ({ customerId = null } = {}) => {
  const merchantWhere = {
    customer_type: "company",
    ...(customerId ? { id: customerId } : {}),
  };
  const orderWhere = customerId ? { customer_id: customerId } : {};

  const [merchants, orderStatsRows, deliveredFinancialRows, settlementRows] =
    await Promise.all([
      Customer.findAll({
        where: merchantWhere,
        attributes: ["id", "customer_type"],
        include: [
          {
            model: CompanyCustomerProfile,
            as: "companyProfile",
            attributes: ["company_name", "company_phone", "company_location"],
            required: false,
          },
          {
            model: User,
            as: "user",
            attributes: ["email", "phone"],
            required: false,
          },
        ],
        order: [["id", "ASC"]],
      }),
      Order.findAll({
        attributes: [
          "customer_id",
          [sequelize.fn("COUNT", sequelize.col("Order.id")), "total_parcels"],
          [
            sequelize.literal(`SUM(CASE WHEN "Order"."status" = 'delivered' THEN 1 ELSE 0 END)`),
            "delivered_count",
          ],
          [
            sequelize.literal(
              `SUM(CASE WHEN CAST("shipment"."current_status" AS TEXT) = 'returned' THEN 1 ELSE 0 END)`
            ),
            "returned_count",
          ],
          [
            sequelize.literal(
              `SUM(CASE WHEN "Order"."status" <> 'delivered' AND COALESCE(CAST("shipment"."current_status" AS TEXT), '') <> 'returned' THEN 1 ELSE 0 END)`
            ),
            "pending_count",
          ],
        ],
        where: orderWhere,
        include: [
          {
            model: Shipment,
            as: "shipment",
            attributes: [],
            required: false,
          },
        ],
        group: ["Order.customer_id"],
        raw: true,
      }),
      Order.findAll({
        attributes: [
          "customer_id",
          [
            sequelize.fn(
              "SUM",
              sequelize.literal('COALESCE("Order"."declared_value", 0)')
            ),
            "merchant_due",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal('COALESCE("region"."price", 0)')
            ),
            "phoenix_commission",
          ],
        ],
        where: {
          ...orderWhere,
          status: "delivered",
        },
        include: [
          {
            model: Region,
            as: "region",
            attributes: [],
            required: true,
          },
        ],
        group: ["Order.customer_id"],
        raw: true,
      }),
      MerchantSettlement.findAll({
        attributes: [
          "customer_id",
          [
            sequelize.fn(
              "SUM",
              sequelize.literal(`CASE WHEN "status" = 'settled' THEN COALESCE("amount", 0) ELSE 0 END`)
            ),
            "settled_amount",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal(`CASE WHEN "status" IN ('pending', 'requested') THEN COALESCE("amount", 0) ELSE 0 END`)
            ),
            "pending_amount",
          ],
        ],
        where: orderWhere,
        group: ["customer_id"],
        raw: true,
      }),
    ]);

  const orderStatsMap = new Map(
    orderStatsRows.map((row) => [toNumber(row.customer_id), row])
  );
  const deliveredFinancialsMap = new Map(
    deliveredFinancialRows.map((row) => [toNumber(row.customer_id), row])
  );
  const settlementMap = new Map(
    settlementRows.map((row) => [
      toNumber(row.customer_id),
      {
        settledAmount: toNumber(row.settled_amount),
        pendingAmount: toNumber(row.pending_amount),
      },
    ])
  );

  return merchants
    .map((merchant) =>
      buildMerchantSummaryRow({
        merchant,
        orderStats: orderStatsMap.get(merchant.id) || {},
        deliveredFinancials: deliveredFinancialsMap.get(merchant.id) || {},
        settledAmount: settlementMap.get(merchant.id)?.settledAmount || 0,
        pendingSettlementAmount: settlementMap.get(merchant.id)?.pendingAmount || 0,
      })
    )
    .sort((a, b) => a.merchant_name.localeCompare(b.merchant_name, "ar"));
};

const getAdminMerchants = async (req, res) => {
  try {
    const merchants = await getMerchantAggregationData();

    return res.status(200).json({
      success: true,
      message: "Merchants fetched successfully",
      data: merchants,
    });
  } catch (error) {
    console.error("FETCH MERCHANTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch merchants",
      error: error.message,
    });
  }
};

const getAdminMerchantById = async (req, res) => {
  try {
    const customerId = toNumber(req.params.id);

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Invalid merchant id",
      });
    }

    const merchants = await getMerchantAggregationData({ customerId });
    const merchant = merchants[0];

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const settlements = await MerchantSettlement.findAll({
      where: { customer_id: customerId },
      attributes: ["id", "amount", "status", "payment_method", "settled_at", "notes", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Merchant fetched successfully",
      data: {
        ...merchant,
        settlements: settlements.map((item) => ({
          id: item.id,
          amount: toNumber(item.amount),
          status: item.status,
          payment_method: item.payment_method || "cash",
          settled_at: item.settled_at,
          notes: item.notes || "",
          created_at: item.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("FETCH MERCHANTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch merchant",
      error: error.message,
    });
  }
};

const settleAdminMerchant = async (req, res) => {
  try {
    const customerId = toNumber(req.params.id);
    const requestedAmount = toNumber(req.body?.amount);
    const paymentMethod = String(req.body?.payment_method || "").trim();
    const notes = String(req.body?.notes || "").trim() || null;
    const allowedPaymentMethods = ["cash", "bank_transfer", "ewallet"];

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Invalid merchant id",
      });
    }

    const merchants = await getMerchantAggregationData({ customerId });
    const merchant = merchants[0];

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const availableSettlementRequestAmount = toNumber(
      merchant.available_settlement_request_amount ?? merchant.outstanding_revenue
    );
    const settlementAmount =
      requestedAmount > 0 ? requestedAmount : availableSettlementRequestAmount;
    const status = "requested";

    if (settlementAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No remaining amount is available for a new settlement request",
      });
    }

    if (settlementAmount > availableSettlementRequestAmount) {
      return res.status(400).json({
        success: false,
        message: "Settlement request amount cannot exceed the remaining amount awaiting request",
      });
    }

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "A valid payment method is required",
      });
    }

    const settlement = await MerchantSettlement.create({
      customer_id: customerId,
      amount: settlementAmount,
      status,
      payment_method: paymentMethod,
      settled_at: null,
      notes,
    });

    const refreshedMerchants = await getMerchantAggregationData({ customerId });
    const refreshedMerchant = refreshedMerchants[0];

    return res.status(200).json({
      success: true,
      message: "Settlement request recorded and is awaiting merchant approval",
      data: {
        settlement: {
          id: settlement.id,
          amount: toNumber(settlement.amount),
          status: settlement.status,
          payment_method: settlement.payment_method,
          settled_at: settlement.settled_at,
          notes: settlement.notes || "",
        },
        merchant: refreshedMerchant,
      },
    });
  } catch (error) {
    console.error("MERCHANT SETTLEMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to settle merchant",
      error: error.message,
    });
  }
};

const getAuthenticatedAdminProfile = async (req, res) => {
  try {
    const userId = toNumber(req.user?.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const admin = await Admin.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "phone", "role"],
          required: true,
        },
      ],
    });

    if (!admin || !admin.user) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: admin.id,
        is_active: admin.is_active,
        user: {
          id: admin.user.id,
          email: admin.user.email,
          phone: admin.user.phone,
          role: admin.user.role,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin profile",
      errors: [error.message],
    });
  }
};

const updateAuthenticatedAdminProfile = async (req, res) => {
  try {
    const userId = toNumber(req.user?.id);
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const admin = await Admin.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "phone", "role"],
          required: true,
        },
      ],
    });

    if (!admin || !admin.user) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

    await admin.user.update({
      email: email || admin.user.email,
      phone: phone || admin.user.phone,
    });

    const refreshedAdmin = await Admin.findOne({
      where: { id: admin.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "phone", "role"],
          required: true,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      data: {
        id: refreshedAdmin.id,
        is_active: refreshedAdmin.is_active,
        user: {
          id: refreshedAdmin.user.id,
          email: refreshedAdmin.user.email,
          phone: refreshedAdmin.user.phone,
          role: refreshedAdmin.user.role,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update admin profile",
      errors: error.errors ? error.errors.map((err) => err.message) : [error.message],
    });
  }
};

const mapShipmentStatusToReportStatus = (shipmentStatus, orderStatus) => {
  if (shipmentStatus === "returned") {
    return "returned";
  }

  if (shipmentStatus === "delivered" || orderStatus === "delivered") {
    return "delivered";
  }

  if (
    ["accepted", "picked_up", "in_transit", "arrived_to_destination_city", "out_for_delivery"].includes(
      shipmentStatus
    )
  ) {
    return "in_delivery";
  }

  return "pending";
};

const getAdminReports = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Shipment,
          as: "shipment",
          required: false,
          include: [
            {
              model: Employee,
              as: "driver",
              attributes: ["id", "full_name"],
              required: false,
            },
          ],
        },
        {
          model: Region,
          as: "region",
          attributes: ["id", "name", "price"],
          required: false,
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "customer_type"],
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
      order: [["createdAt", "DESC"]],
    });

    const data = orders.map((order) => {
      const shipment = order.shipment || null;
      const reportStatus = mapShipmentStatusToReportStatus(shipment?.current_status, order.status);
      const declaredValue = toNumber(order.declared_value);
      const phoenixCommission = reportStatus === "delivered" ? toNumber(order.region?.price) : 0;
      const collectedAmount = reportStatus === "delivered" ? declaredValue + phoenixCommission : 0;

      return {
        id: order.id,
        orderNumber: shipment?.tracking_number || `PX-${order.id}`,
        merchantName:
          order.customer?.company_profile?.company_name ||
          order.customer?.individual_profile?.full_name ||
          order.sender_name ||
          "-",
        customerName: order.receiver_name || "-",
        phone: order.receiver_phone || "-",
        delegateName: shipment?.driver?.full_name || "غير مخصص",
        status: reportStatus,
        paymentMethod: "cod",
        amount: declaredValue + phoenixCommission,
        collectedAmount,
        phoenixCommission,
        merchantDue: reportStatus === "delivered" ? declaredValue : 0,
        city: order.destination_city || "-",
        area: order.receiver_address || "-",
        createdAt: order.createdAt,
        updatedAt: shipment?.updatedAt || order.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin reports",
      errors: [error.message],
    });
  }
};

const getAdminReturnedOrdersReport = async (req, res) => {
  try {
    const returnedShipments = await Shipment.findAll({
      where: {
        current_status: "returned",
      },
      include: [
        {
          model: Order,
          as: "order",
          required: true,
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "customer_type"],
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
          attributes: ["id", "full_name"],
          required: false,
        },
        {
          model: TrackingUpdate,
          as: "tracking_updates",
          attributes: ["status", "note", "createdAt"],
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    const data = returnedShipments.map((shipment) => {
      const latestReturnedUpdate = [...(shipment.tracking_updates || [])]
        .filter((item) => item.status === "returned")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      return {
        id: shipment.id,
        orderNumber: shipment.tracking_number || `PX-${shipment.order?.id}`,
        merchantName:
          shipment.order?.customer?.company_profile?.company_name ||
          shipment.order?.customer?.individual_profile?.full_name ||
          shipment.order?.sender_name ||
          "-",
        customerName: shipment.order?.receiver_name || "-",
        delegateName: shipment.driver?.full_name || "غير مخصص",
        returnReason: latestReturnedUpdate?.note || "لا يوجد سبب إرجاع مسجل",
        city: shipment.order?.destination_city || "-",
        returnedAt: latestReturnedUpdate?.createdAt || shipment.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch returned orders report",
      errors: [error.message],
    });
  }
};

const mapHandoverRequestRow = (request) => ({
  id: request.id,
  amount: toNumber(request.amount),
  method: request.withdrawal_method,
  methodLabel:
    HANDOVER_METHOD_LABELS[request.withdrawal_method] || request.withdrawal_method || "-",
  status: request.status,
  statusLabel: HANDOVER_REQUEST_STATUS_LABELS[request.status] || request.status,
  requestedAt: request.requested_at,
  processedAt: request.processed_at,
  employee: {
    id: request.employee?.id || null,
    fullName: request.employee?.full_name || "-",
    phone: request.employee?.user?.phone || "-",
    currentBalance: toNumber(request.employee?.wallet?.available_balance),
  },
});

const getAdminHandoverRequests = async (req, res) => {
  try {
    const { status, method, search } = req.query;

    const where = {};
    if (status && status !== "all") {
      where.status = status;
    }

    if (method && method !== "all") {
      where.withdrawal_method = method;
    }

    const trimmedSearch = typeof search === "string" ? search.trim() : "";
    const include = [
      {
        model: Employee,
        as: "employee",
        required: true,
        attributes: ["id", "full_name"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["phone"],
            required: false,
          },
          {
            model: EmployeeWallet,
            as: "wallet",
            attributes: ["available_balance"],
            required: false,
          },
        ],
      },
    ];

    const requests = await WithdrawalRequest.findAll({
      where,
      include,
      order: [["requested_at", "DESC"]],
    });

    const normalizedSearch = trimmedSearch.toLowerCase();
    const filteredRequests = normalizedSearch
      ? requests.filter((request) => {
          const fullName = String(request.employee?.full_name || "").toLowerCase();
          const phone = String(request.employee?.user?.phone || "").toLowerCase();

          return fullName.includes(normalizedSearch) || phone.includes(normalizedSearch);
        })
      : requests;

    const items = filteredRequests.map(mapHandoverRequestRow);
    const summary = {
      pendingCount: items.filter((item) => item.status === "pending").length,
      approvedCount: items.filter((item) => item.status === "approved").length,
      paidCount: items.filter((item) => item.status === "paid").length,
      totalPendingAmount: items
        .filter((item) => item.status === "pending" || item.status === "approved")
        .reduce((sum, item) => sum + toNumber(item.amount), 0),
    };

    return res.status(200).json({
      success: true,
      message: "تم جلب طلبات تسليم المبالغ بنجاح",
      data: {
        items,
        summary,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل في جلب طلبات تسليم المبالغ",
      errors: [error.message],
    });
  }
};

const getAdminHandoverRequestById = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "full_name", "address", "availability_status"],
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["phone", "email"],
              required: false,
            },
            {
              model: EmployeeWallet,
              as: "wallet",
              attributes: ["available_balance", "total_earnings"],
              required: false,
            },
          ],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "طلب تسليم المبلغ غير موجود",
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم جلب تفاصيل طلب تسليم المبلغ بنجاح",
      data: mapHandoverRequestRow(request),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل في جلب تفاصيل طلب تسليم المبلغ",
      errors: [error.message],
    });
  }
};

const getAllowedNextStatuses = (currentStatus) => {
  if (currentStatus === "pending") {
    return ["approved", "rejected"];
  }

  if (currentStatus === "approved") {
    return ["paid", "rejected"];
  }

  return [];
};

const getReturnedShipments = async (req, res) => {
  try {
    const shipments = await Shipment.findAll({
      where: {
        current_status: "returned",
      },
      include: [
        {
          model: Order,
          as: "order",
          required: true,
          include: [
            {
              model: Region,
              as: "region",
              attributes: ["id", "name", "price"],
              required: false,
            },
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
          attributes: ["id", "full_name", "availability_status"],
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    const activeCountsByDriverId = await countActiveShipmentsByDriver();
    const workingEmployees = await getWorkingEmployees();
    const availableDrivers = buildDriverSummaries(workingEmployees, activeCountsByDriverId).filter(
      (driver) => driver.canReceiveOrders,
    );

    const items = shipments.map((shipment) => ({
      shipmentId: shipment.id,
      orderId: shipment.order?.id || null,
      shipmentNumber: shipment.tracking_number || buildTrackingNumber(shipment.order?.id),
      merchantName: resolveMerchantName(shipment.order),
      receiverName: shipment.order?.receiver_name || "-",
      receiverPhone: shipment.order?.receiver_phone || "-",
      receiverAddress: shipment.order?.receiver_address || "-",
      employeeName: shipment.driver?.full_name || "-",
      employeeId: shipment.driver?.id || shipment.driver_id || null,
      returnedAt: shipment.updatedAt,
      productPrice: toNumber(shipment.order?.declared_value),
      deliveryFee: toNumber(shipment.order?.region?.price),
      status: shipment.current_status,
      statusLabel:
        RETURNED_SHIPMENT_STATUS_LABELS[shipment.current_status] || shipment.current_status,
    }));

    return res.status(200).json({
      success: true,
      message: "تم جلب الشحنات المرتجعة بنجاح",
      data: {
        items,
        availableDrivers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل في جلب الشحنات المرتجعة",
      errors: [error.message],
    });
  }
};

const getAdminDelegates = async (req, res) => {
  try {
    const { search, availability_status, is_active } = req.query;
    const { start, end } = getCurrentWeekRange();

    const where = {};
    if (availability_status && availability_status !== "all") {
      where.availability_status = availability_status;
    }

    if (typeof is_active === "string" && is_active !== "all") {
      if (is_active === "true") {
        where.is_active = true;
      } else if (is_active === "false") {
        where.is_active = false;
      }
    }

    const employees = await Employee.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "phone"],
          required: false,
        },
        {
          model: Vehicle,
          as: "vehicle",
          required: false,
        },
        {
          model: EmployeeWallet,
          as: "wallet",
          attributes: ["available_balance"],
          required: false,
        },
      ],
      order: [["id", "DESC"]],
    });

    const trimmedSearch = typeof search === "string" ? search.trim().toLowerCase() : "";
    const filteredEmployees = trimmedSearch
      ? employees.filter((employee) => {
          const fullName = String(employee.full_name || "").toLowerCase();
          const phone = String(employee.user?.phone || "").toLowerCase();
          return fullName.includes(trimmedSearch) || phone.includes(trimmedSearch);
        })
      : employees;

    const employeeIds = filteredEmployees.map((employee) => employee.id);
    let shipmentCountsByEmployee = new Map();

    if (employeeIds.length > 0) {
      const shipmentCounts = await Shipment.findAll({
        attributes: [
          "driver_id",
          "current_status",
          [sequelize.fn("COUNT", sequelize.col("Shipment.id")), "count"],
        ],
        where: {
          driver_id: {
            [Op.in]: employeeIds,
          },
          current_status: {
            [Op.in]: [...DELEGATE_ACTIVE_ORDER_STATUSES],
          },
        },
        group: ["driver_id", "current_status"],
        raw: true,
      });

      const deliveredAndReturnedCounts = await Shipment.findAll({
        attributes: [
          "driver_id",
          "current_status",
          [sequelize.fn("COUNT", sequelize.col("Shipment.id")), "count"],
        ],
        where: {
          driver_id: {
            [Op.in]: employeeIds,
          },
          current_status: {
            [Op.in]: ["delivered", "returned"],
          },
          updatedAt: {
            [Op.between]: [start, end],
          },
        },
        group: ["driver_id", "current_status"],
        raw: true,
      });

      shipmentCountsByEmployee = [...shipmentCounts, ...deliveredAndReturnedCounts].reduce(
        (accumulator, row) => {
          const employeeId = toNumber(row.driver_id);
          const current = accumulator.get(employeeId) || {
            activeOrdersCount: 0,
            deliveredOrdersCount: 0,
            returnedOrdersCount: 0,
          };

          if (DELEGATE_ACTIVE_ORDER_STATUSES.includes(row.current_status)) {
            current.activeOrdersCount += toNumber(row.count);
          }

          if (row.current_status === "delivered") {
            current.deliveredOrdersCount += toNumber(row.count);
          }

          if (row.current_status === "returned") {
            current.returnedOrdersCount += toNumber(row.count);
          }

          accumulator.set(employeeId, current);
          return accumulator;
        },
        new Map(),
      );
    }

    const delegates = filteredEmployees.map((employee) => {
      const counters = shipmentCountsByEmployee.get(employee.id) || {
        activeOrdersCount: 0,
        deliveredOrdersCount: 0,
        returnedOrdersCount: 0,
      };

      return {
        id: employee.id,
        userId: employee.user?.id || null,
        full_name: employee.full_name,
        phone: employee.user?.phone || "",
        availability_status: employee.availability_status,
        is_active: Boolean(employee.is_active),
        vehicle: employee.vehicle
          ? {
              id: employee.vehicle.id,
              type: employee.vehicle.type,
              brand: employee.vehicle.brand,
              model: employee.vehicle.model,
              plate_number: employee.vehicle.plate_number,
            }
          : null,
        activeOrdersCount: counters.activeOrdersCount,
        deliveredOrdersCount: counters.deliveredOrdersCount,
        returnedOrdersCount: counters.returnedOrdersCount,
        collectedAmount: toNumber(employee.wallet?.available_balance),
      };
    });

    const activeDelegates = delegates.filter((delegate) => delegate.is_active);

    const summary = {
      totalDelegates: delegates.length,
      availableDelegates: activeDelegates.filter(
        (delegate) => delegate.availability_status === "available",
      ).length,
      busyDelegates: activeDelegates.filter(
        (delegate) => delegate.availability_status === "busy",
      ).length,
      offlineDelegates: activeDelegates.filter(
        (delegate) => delegate.availability_status === "offline",
      ).length,
      totalCollectedAmount: delegates.reduce(
        (sum, delegate) => sum + toNumber(delegate.collectedAmount),
        0,
      ),
      totalDeliveriesThisWeek: delegates.reduce(
        (sum, delegate) => sum + toNumber(delegate.deliveredOrdersCount),
        0,
      ),
      totalReturnsThisWeek: delegates.reduce(
        (sum, delegate) => sum + toNumber(delegate.returnedOrdersCount),
        0,
      ),
    };

    return res.status(200).json({
      success: true,
      message: "تم جلب بيانات المناديب بنجاح",
      data: {
        summary,
        delegates,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل في جلب بيانات المناديب",
      errors: [error.message],
    });
  }
};

const updateAdminDelegateStatus = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "المندوب غير موجود",
      });
    }

    const nextIsActive =
      typeof req.body?.is_active === "boolean" ? req.body.is_active : !employee.is_active;

    await employee.update({
      is_active: nextIsActive,
    });

    return res.status(200).json({
      success: true,
      message: nextIsActive ? "تم تفعيل المندوب بنجاح" : "تم تعطيل المندوب بنجاح",
      data: {
        id: employee.id,
        is_active: employee.is_active,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل في تحديث حالة المندوب",
      errors: [error.message],
    });
  }
};

const reassignReturnedShipment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const shipmentId = toNumber(req.params.shipmentId);
    const driverId = toNumber(req.body.driverId);

    if (!shipmentId || !driverId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "بيانات إعادة التخصيص غير مكتملة",
      });
    }

    const shipment = await Shipment.findOne({
      where: {
        id: shipmentId,
        current_status: "returned",
      },
      include: [
        {
          model: Order,
          as: "order",
          required: true,
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!shipment || !shipment.order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "الشحنة المرتجعة غير موجودة",
      });
    }

    const employee = await Employee.findOne({
      where: {
        id: driverId,
        is_active: true,
        availability_status: "available",
      },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "المندوب غير متاح حاليًا لإعادة التخصيص",
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
        message: "لا يمكن إعادة تخصيص الشحنة لهذا المندوب لأنه مشغول حاليًا",
      });
    }

    await employee.update(
      {
        availability_status: "busy",
      },
      { transaction },
    );

    await shipment.update(
      {
        driver_id: employee.id,
        current_status: "accepted",
      },
      { transaction },
    );

    await shipment.order.update(
      {
        status: "confirmed",
      },
      { transaction },
    );

    await TrackingUpdate.create(
      {
        shipment_id: shipment.id,
        status: "accepted",
        note: "تمت إعادة تخصيص الشحنة المرتجعة إلى مندوب جديد",
        current_location: shipment.order.origin_city || shipment.order.sender_address || null,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "تمت إعادة تخصيص الشحنة المرتجعة بنجاح",
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return res.status(500).json({
      success: false,
      message: "فشل في إعادة تخصيص الشحنة المرتجعة",
      errors: [error.message],
    });
  }
};

const cancelReturnedShipment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const shipmentId = toNumber(req.params.shipmentId);

    if (!shipmentId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "رقم الشحنة غير صالح",
      });
    }

    const shipment = await Shipment.findOne({
      where: {
        id: shipmentId,
        current_status: "returned",
      },
      include: [
        {
          model: Order,
          as: "order",
          required: true,
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!shipment || !shipment.order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "الشحنة المرتجعة غير موجودة",
      });
    }

    await shipment.update(
      {
        current_status: "cancelled",
      },
      { transaction },
    );

    await shipment.order.update(
      {
        status: "cancelled",
      },
      { transaction },
    );

    await TrackingUpdate.create(
      {
        shipment_id: shipment.id,
        status: "cancelled",
        note: "تم إلغاء الشحنة المرتجعة من قبل الإدارة",
        current_location: shipment.order.origin_city || shipment.order.sender_address || null,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "تم إلغاء الشحنة المرتجعة بنجاح",
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: "فشل في إلغاء الشحنة المرتجعة",
      errors: [error.message],
    });
  }
};

const updateAdminHandoverRequestStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { status } = req.body;

    if (!["approved", "rejected", "paid"].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "حالة الطلب غير صالحة",
      });
    }

    const request = await WithdrawalRequest.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "طلب تسليم المبلغ غير موجود",
      });
    }

    const allowedStatuses = getAllowedNextStatuses(request.status);
    if (!allowedStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "لا يمكن تغيير حالة الطلب إلى هذه القيمة",
      });
    }

    await request.update(
      {
        status,
        processed_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    const refreshedRequest = await WithdrawalRequest.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "full_name"],
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["phone"],
              required: false,
            },
            {
              model: EmployeeWallet,
              as: "wallet",
              attributes: ["available_balance"],
              required: false,
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "تم تحديث حالة طلب تسليم المبلغ بنجاح",
      data: mapHandoverRequestRow(refreshedRequest),
    });
  } catch (error) {
    console.error("Admin handover status update error:", error);
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message || "فشل في تحديث حالة طلب تسليم المبلغ"
          : "فشل في تحديث حالة طلب تسليم المبلغ",
      errors: process.env.NODE_ENV === "development" ? [error.message] : undefined,
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

    const user = await User.create(
      {
        email: normalizeEmail(email),
        phone: normalizePhone(phone),
        password,
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
    if (transaction && !transaction.finished) {
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
      email: email !== undefined ? normalizeEmail(email) : user.email,
      phone: phone !== undefined ? normalizePhone(phone) : user.phone,
      password:
        password !== undefined
          ? password
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
  getAdminMerchants,
  getAdminMerchantById,
  settleAdminMerchant,
  getAuthenticatedAdminProfile,
  updateAuthenticatedAdminProfile,
  getAdminReports,
  getAdminReturnedOrdersReport,
  getParcelDistribution,
  assignParcelToDriver,
  getAdminDelegates,
  updateAdminDelegateStatus,
  getReturnedShipments,
  reassignReturnedShipment,
  cancelReturnedShipment,
  getAdminHandoverRequests,
  getAdminHandoverRequestById,
  updateAdminHandoverRequestStatus,
  createAdmin,
  getAllAdmins,
  findAdminById,
  updateAdmin,
  deleteAdmin,
};

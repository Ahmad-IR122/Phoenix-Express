// TODO: Replace this local in-memory service with real admin courier endpoints.
const NOW = new Date("2026-04-24T12:00:00");
const ACTIVE_SHIPMENT_STATUSES = ["assigned", "picked_up", "in_transit", "out_for_delivery"];
const DELIVERED_SHIPMENT_STATUSES = ["delivered"];
const RETURNED_SHIPMENT_STATUSES = ["returned"];

const PAYMENT_METHOD_LABELS = {
  cod: "الدفع عند الاستلام",
  wallet: "محفظة",
  bank_transfer: "تحويل بنكي",
};

export const VEHICLE_TYPE_LABELS = {
  motorcycle: "دراجة نارية",
  sedan: "سيارة سيدان",
  van: "فان",
};

const SHIPMENT_STATUS_LABELS = {
  assigned: "مخصص",
  picked_up: "تم الاستلام",
  in_transit: "قيد التوصيل",
  out_for_delivery: "قيد التوصيل",
  delivered: "تم التسليم",
  returned: "مرتجع",
};

const EMPLOYEE_SEEDS = [
  {
    id: 1,
    fullName: "خالد أحمد",
    phone: "0503334455",
    city: "الخليل",
    area: "وسط البلد",
    vehicleType: "motorcycle",
    nationalId: "900112345",
    licenseNumber: "LIC-1132",
    isActive: true,
    lastSeenAt: "2026-04-24T11:38:00",
  },
  {
    id: 2,
    fullName: "أحمد محمد",
    phone: "0501112233",
    city: "رام الله",
    area: "حي الطيرة",
    vehicleType: "motorcycle",
    nationalId: "901223344",
    licenseNumber: "LIC-2041",
    isActive: true,
    lastSeenAt: "2026-04-24T10:56:00",
  },
  {
    id: 3,
    fullName: "عبدالله سالم",
    phone: "0504445566",
    city: "بيت لحم",
    area: "البلدة القديمة",
    vehicleType: "sedan",
    nationalId: "903451122",
    licenseNumber: "LIC-3108",
    isActive: true,
    lastSeenAt: "2026-04-24T09:42:00",
  },
  {
    id: 4,
    fullName: "محمد علي",
    phone: "0502223344",
    city: "نابلس",
    area: "حي رفيديا",
    vehicleType: "van",
    nationalId: "904772211",
    licenseNumber: "LIC-4029",
    isActive: true,
    lastSeenAt: "2026-04-24T11:14:00",
  },
  {
    id: 5,
    fullName: "سعد فهد",
    phone: "0505556677",
    city: "جنين",
    area: "حي الجواشين",
    vehicleType: "motorcycle",
    nationalId: "905441188",
    licenseNumber: "LIC-5203",
    isActive: false,
    lastSeenAt: "2026-04-23T18:25:00",
  },
  {
    id: 6,
    fullName: "يزن شريف",
    phone: "0506667788",
    city: "رام الله",
    area: "الماصيون",
    vehicleType: "motorcycle",
    nationalId: "906556677",
    licenseNumber: "LIC-6184",
    isActive: true,
    lastSeenAt: "2026-04-22T08:35:00",
  },
  {
    id: 7,
    fullName: "محمود ياسر",
    phone: "0507778899",
    city: "طولكرم",
    area: "الحي الشرقي",
    vehicleType: "sedan",
    nationalId: "907778899",
    licenseNumber: "LIC-7007",
    isActive: false,
    lastSeenAt: "2026-04-10T17:20:00",
  },
];

const COURIER_OPERATION_PLANS = {
  1: {
    merchant: "متجر الأناقة",
    monthly: [
      { month: "2026-01", delivered: 13, returned: 1, averageAmount: 145 },
      { month: "2026-02", delivered: 14, returned: 0, averageAmount: 152 },
      { month: "2026-03", delivered: 15, returned: 1, averageAmount: 150 },
      { month: "2026-04", delivered: 14, returned: 0, averageAmount: 158 },
    ],
    currentOrders: [
      {
        amount: 165,
        paymentMethod: "cod",
        city: "الخليل",
        area: "دوار ابن رشد",
        status: "out_for_delivery",
        createdAt: "2026-04-24T08:10:00",
        updatedAt: "2026-04-24T11:20:00",
      },
      {
        amount: 132,
        paymentMethod: "wallet",
        city: "الخليل",
        area: "عين سارة",
        status: "in_transit",
        createdAt: "2026-04-24T07:40:00",
        updatedAt: "2026-04-24T10:55:00",
      },
    ],
    withdrawals: [420, 310],
  },
  2: {
    merchant: "متجر الإلكترونيات",
    monthly: [
      { month: "2026-01", delivered: 17, returned: 1, averageAmount: 210 },
      { month: "2026-02", delivered: 18, returned: 1, averageAmount: 225 },
      { month: "2026-03", delivered: 19, returned: 1, averageAmount: 215 },
      { month: "2026-04", delivered: 18, returned: 0, averageAmount: 230 },
    ],
    currentOrders: [
      {
        amount: 320,
        paymentMethod: "cod",
        city: "رام الله",
        area: "حي الماصيون",
        status: "assigned",
        createdAt: "2026-04-24T09:00:00",
        updatedAt: "2026-04-24T10:10:00",
      },
      {
        amount: 255,
        paymentMethod: "bank_transfer",
        city: "رام الله",
        area: "البيرة الشمالية",
        status: "out_for_delivery",
        createdAt: "2026-04-24T08:35:00",
        updatedAt: "2026-04-24T11:00:00",
      },
      {
        amount: 184,
        paymentMethod: "cod",
        city: "رام الله",
        area: "سطح مرحبا",
        status: "in_transit",
        createdAt: "2026-04-24T08:20:00",
        updatedAt: "2026-04-24T09:44:00",
      },
    ],
    withdrawals: [530, 285],
  },
  3: {
    merchant: "متجر الرياضة",
    monthly: [
      { month: "2026-01", delivered: 15, returned: 0, averageAmount: 178 },
      { month: "2026-02", delivered: 15, returned: 1, averageAmount: 182 },
      { month: "2026-03", delivered: 16, returned: 1, averageAmount: 186 },
      { month: "2026-04", delivered: 15, returned: 0, averageAmount: 190 },
    ],
    currentOrders: [
      {
        amount: 205,
        paymentMethod: "cod",
        city: "بيت لحم",
        area: "بيت جالا",
        status: "out_for_delivery",
        createdAt: "2026-04-24T08:15:00",
        updatedAt: "2026-04-24T09:30:00",
      },
    ],
    withdrawals: [460, 250],
  },
  4: {
    merchant: "متجر المنزل",
    monthly: [
      { month: "2026-01", delivered: 16, returned: 1, averageAmount: 205 },
      { month: "2026-02", delivered: 17, returned: 1, averageAmount: 198 },
      { month: "2026-03", delivered: 17, returned: 1, averageAmount: 212 },
      { month: "2026-04", delivered: 18, returned: 1, averageAmount: 220 },
    ],
    currentOrders: [
      {
        amount: 298,
        paymentMethod: "cod",
        city: "نابلس",
        area: "المخفية",
        status: "assigned",
        createdAt: "2026-04-24T07:50:00",
        updatedAt: "2026-04-24T08:10:00",
      },
      {
        amount: 345,
        paymentMethod: "cod",
        city: "نابلس",
        area: "رفيديا",
        status: "picked_up",
        createdAt: "2026-04-24T07:20:00",
        updatedAt: "2026-04-24T09:15:00",
      },
      {
        amount: 188,
        paymentMethod: "wallet",
        city: "نابلس",
        area: "الجامعة",
        status: "in_transit",
        createdAt: "2026-04-24T08:05:00",
        updatedAt: "2026-04-24T10:00:00",
      },
      {
        amount: 214,
        paymentMethod: "bank_transfer",
        city: "نابلس",
        area: "مخفية",
        status: "out_for_delivery",
        createdAt: "2026-04-24T08:30:00",
        updatedAt: "2026-04-24T11:12:00",
      },
      {
        amount: 267,
        paymentMethod: "cod",
        city: "نابلس",
        area: "شارع عصيرة",
        status: "out_for_delivery",
        createdAt: "2026-04-24T09:10:00",
        updatedAt: "2026-04-24T11:18:00",
      },
    ],
    withdrawals: [610, 430],
  },
  5: {
    merchant: "متجر الكتب",
    monthly: [
      { month: "2026-01", delivered: 9, returned: 1, averageAmount: 122 },
      { month: "2026-02", delivered: 10, returned: 1, averageAmount: 128 },
      { month: "2026-03", delivered: 10, returned: 1, averageAmount: 130 },
      { month: "2026-04", delivered: 10, returned: 0, averageAmount: 136 },
    ],
    currentOrders: [],
    withdrawals: [220, 140],
  },
  6: {
    merchant: "متجر الهدايا",
    monthly: [
      { month: "2026-01", delivered: 11, returned: 0, averageAmount: 154 },
      { month: "2026-02", delivered: 11, returned: 1, averageAmount: 158 },
      { month: "2026-03", delivered: 11, returned: 0, averageAmount: 162 },
      { month: "2026-04", delivered: 11, returned: 0, averageAmount: 166 },
    ],
    currentOrders: [],
    withdrawals: [180, 125],
  },
  7: {
    merchant: "متجر الأثاث",
    monthly: [
      { month: "2026-01", delivered: 6, returned: 1, averageAmount: 260 },
      { month: "2026-02", delivered: 5, returned: 1, averageAmount: 245 },
      { month: "2026-03", delivered: 4, returned: 1, averageAmount: 240 },
      { month: "2026-04", delivered: 0, returned: 0, averageAmount: 240 },
    ],
    currentOrders: [],
    withdrawals: [260],
  },
};

const merchantNames = [
  "متجر الأناقة",
  "متجر الإلكترونيات",
  "متجر الرياضة",
  "متجر المنزل",
  "متجر الكتب",
  "متجر الهدايا",
  "متجر العطور",
];

const customerFirstNames = ["ليان", "عمر", "هبة", "سارة", "يزن", "رنا", "جود", "نور", "حمزة", "ديمة"];
const customerLastNames = ["شحادة", "دراوشة", "جرار", "قنديل", "نخلة", "أبو لبدة", "الحاج", "قدومي", "سمارة", "زواهرة"];

let employeesTable = clone(EMPLOYEE_SEEDS);
let ordersTable = [];
let shipmentsTable = [];
let walletTransactionsTable = [];
let employeeWalletsTable = [];

buildOperationalTables();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function buildOperationalTables() {
  ordersTable = [];
  shipmentsTable = [];
  walletTransactionsTable = [];

  let orderId = 4000;
  let shipmentId = 9000;
  let transactionId = 15000;

  employeesTable.forEach((employee) => {
    const plan = COURIER_OPERATION_PLANS[employee.id];

    if (!plan) {
      return;
    }

    plan.monthly.forEach((monthPlan, monthIndex) => {
      for (let deliveredIndex = 0; deliveredIndex < monthPlan.delivered; deliveredIndex += 1) {
        orderId += 1;
        shipmentId += 1;

        const createdAt = `${monthPlan.month}-${pad((deliveredIndex % 26) + 1)}T09:${pad(
          (deliveredIndex * 3) % 60
        )}:00`;
        const updatedAt = `${monthPlan.month}-${pad((deliveredIndex % 26) + 1)}T16:${pad(
          (deliveredIndex * 7) % 60
        )}:00`;
        const paymentMethod = deliveredIndex % 4 === 0 ? "wallet" : deliveredIndex % 5 === 0 ? "bank_transfer" : "cod";
        const amount = monthPlan.averageAmount + ((deliveredIndex + monthIndex) % 4) * 12;

        const order = buildOrderRecord({
          orderId,
          employee,
          merchantName: plan.merchant || merchantNames[deliveredIndex % merchantNames.length],
          amount,
          paymentMethod,
          city: employee.city,
          area: employee.area,
          createdAt,
        });

        ordersTable.push(order);
        shipmentsTable.push(
          buildShipmentRecord({
            shipmentId,
            orderId,
            employeeId: employee.id,
            status: "delivered",
            updatedAt,
            createdAt,
            returnedReason: null,
          })
        );

        if (paymentMethod === "cod") {
          transactionId += 1;
          walletTransactionsTable.push({
            id: transactionId,
            employeeId: employee.id,
            type: "collection_credit",
            amount,
            createdAt: updatedAt,
            referenceType: "order",
            referenceId: orderId,
          });
        }

        transactionId += 1;
        walletTransactionsTable.push({
          id: transactionId,
          employeeId: employee.id,
          type: "earning_credit",
          amount: Math.round(amount * 0.11),
          createdAt: updatedAt,
          referenceType: "shipment",
          referenceId: shipmentId,
        });
      }

      for (let returnedIndex = 0; returnedIndex < monthPlan.returned; returnedIndex += 1) {
        orderId += 1;
        shipmentId += 1;

        const createdAt = `${monthPlan.month}-${pad(20 + returnedIndex)}T10:${pad(
          returnedIndex * 9
        )}:00`;
        const updatedAt = `${monthPlan.month}-${pad(22 + returnedIndex)}T17:${pad(
          returnedIndex * 11
        )}:00`;
        const amount = monthPlan.averageAmount - 10 + returnedIndex * 15;

        const order = buildOrderRecord({
          orderId,
          employee,
          merchantName: plan.merchant,
          amount,
          paymentMethod: "cod",
          city: employee.city,
          area: employee.area,
          createdAt,
        });

        ordersTable.push(order);
        shipmentsTable.push(
          buildShipmentRecord({
            shipmentId,
            orderId,
            employeeId: employee.id,
            status: "returned",
            updatedAt,
            createdAt,
            returnedReason: returnedIndex % 2 === 0 ? "رفض العميل الاستلام" : "العنوان غير مكتمل",
          })
        );
      }
    });

    plan.currentOrders.forEach((currentOrder, currentIndex) => {
      orderId += 1;
      shipmentId += 1;

      const order = buildOrderRecord({
        orderId,
        employee,
        merchantName: plan.merchant,
        amount: currentOrder.amount,
        paymentMethod: currentOrder.paymentMethod,
        city: currentOrder.city,
        area: currentOrder.area,
        createdAt: currentOrder.createdAt,
      });

      ordersTable.push(order);
      shipmentsTable.push(
        buildShipmentRecord({
          shipmentId,
          orderId,
          employeeId: employee.id,
          status: currentOrder.status,
          updatedAt: currentOrder.updatedAt,
          createdAt: currentOrder.createdAt,
          returnedReason: null,
        })
      );

      if (currentIndex === 0) {
        employee.lastSeenAt = currentOrder.updatedAt;
      }
    });

    plan.withdrawals.forEach((withdrawalAmount, withdrawalIndex) => {
      transactionId += 1;
      walletTransactionsTable.push({
        id: transactionId,
        employeeId: employee.id,
        type: "withdrawal_debit",
        amount: withdrawalAmount,
        createdAt: `2026-04-${pad(8 + withdrawalIndex)}T12:00:00`,
        referenceType: "wallet",
        referenceId: employee.id,
      });
    });
  });

  employeeWalletsTable = employeesTable.map((employee) => {
    const earningCredits = walletTransactionsTable
      .filter((transaction) => transaction.employeeId === employee.id && transaction.type === "earning_credit")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const withdrawals = walletTransactionsTable
      .filter((transaction) => transaction.employeeId === employee.id && transaction.type === "withdrawal_debit")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      employeeId: employee.id,
      currentBalance: Math.max(earningCredits - withdrawals, 0),
      currency: "ILS",
      updatedAt: employee.lastSeenAt,
    };
  });
}

function buildOrderRecord({
  orderId,
  employee,
  merchantName,
  amount,
  paymentMethod,
  city,
  area,
  createdAt,
}) {
  const nameIndex = orderId % customerFirstNames.length;

  return {
    id: orderId,
    orderNumber: `PX-${orderId}`,
    merchantName,
    customerName: `${customerFirstNames[nameIndex]} ${customerLastNames[nameIndex]}`,
    customerPhone: `0599${pad((orderId % 87) + 10)}${pad((orderId % 63) + 20)}${pad((orderId % 41) + 30)}`,
    city,
    area,
    paymentMethod,
    amount,
    employeeId: employee.id,
    createdAt,
  };
}

function buildShipmentRecord({
  shipmentId,
  orderId,
  employeeId,
  status,
  updatedAt,
  createdAt,
  returnedReason,
}) {
  return {
    id: shipmentId,
    orderId,
    employeeId,
    status,
    createdAt,
    updatedAt,
    returnedReason,
  };
}

function getEmployeeWallet(employeeId) {
  return employeeWalletsTable.find((wallet) => wallet.employeeId === employeeId) || {
    employeeId,
    currentBalance: 0,
    currency: "ILS",
    updatedAt: null,
  };
}

function getEmployeeTransactions(employeeId) {
  return walletTransactionsTable.filter((transaction) => transaction.employeeId === employeeId);
}

function getEmployeeShipments(employeeId) {
  return shipmentsTable.filter((shipment) => shipment.employeeId === employeeId);
}

function getOrderById(orderId) {
  return ordersTable.find((order) => order.id === orderId) || null;
}

function getLastActivityDate(employee, shipments) {
  const shipmentDates = shipments.map((shipment) => new Date(shipment.updatedAt).getTime());
  const employeeSeen = employee.lastSeenAt ? new Date(employee.lastSeenAt).getTime() : 0;
  const latest = Math.max(employeeSeen, ...shipmentDates, 0);

  return latest ? new Date(latest).toISOString() : null;
}

function deriveCourierStatus(employee, activeShipments, lastActivity) {
  if (!employee.isActive) {
    return "offline";
  }

  if (activeShipments >= 5) {
    return "busy";
  }

  const hoursSinceLastActivity = lastActivity
    ? (NOW.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60)
    : 999;

  if (hoursSinceLastActivity > 18 && activeShipments === 0) {
    return "offline";
  }

  return "available";
}

function deriveActivityState(employee) {
  return employee.isActive ? "active" : "inactive";
}

function deriveCourierRow(employee) {
  const shipments = getEmployeeShipments(employee.id);
  const wallet = getEmployeeWallet(employee.id);
  const transactions = getEmployeeTransactions(employee.id);

  const activeShipments = shipments.filter((shipment) =>
    ACTIVE_SHIPMENT_STATUSES.includes(shipment.status)
  );
  const deliveredShipments = shipments.filter((shipment) =>
    DELIVERED_SHIPMENT_STATUSES.includes(shipment.status)
  );
  const returnedShipments = shipments.filter((shipment) =>
    RETURNED_SHIPMENT_STATUSES.includes(shipment.status)
  );

  const lastActivity = getLastActivityDate(employee, shipments);
  const status = deriveCourierStatus(employee, activeShipments.length, lastActivity);
  const activityState = deriveActivityState(employee);

  const collectedAmount = transactions
    .filter((transaction) => transaction.type === "collection_credit")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return {
    id: employee.id,
    name: employee.fullName,
    phone: employee.phone,
    city: employee.city,
    area: employee.area,
    vehicleType: employee.vehicleType,
    nationalId: employee.nationalId || "-",
    licenseNumber: employee.licenseNumber || "-",
    isActive: employee.isActive,
    activityState,
    status,
    activeOrdersCount: activeShipments.length,
    totalDeliveries: deliveredShipments.length,
    returnedOrders: returnedShipments.length,
    collectedAmount,
    lastActivity,
    walletBalance: wallet.currentBalance,
  };
}

function buildDetailsSection(employeeId) {
  const employee = employeesTable.find((item) => item.id === employeeId);

  if (!employee) {
    return null;
  }

  const courierRow = deriveCourierRow(employee);
  const shipments = getEmployeeShipments(employeeId);
  const wallet = getEmployeeWallet(employeeId);
  const transactions = getEmployeeTransactions(employeeId);

  const enrichShipment = (shipment) => {
    const order = getOrderById(shipment.orderId);

    return {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      orderNumber: order?.orderNumber || `PX-${shipment.orderId}`,
      merchantName: order?.merchantName || "-",
      customerName: order?.customerName || "-",
      customerPhone: order?.customerPhone || "-",
      amount: order?.amount || 0,
      paymentMethod: PAYMENT_METHOD_LABELS[order?.paymentMethod] || order?.paymentMethod || "-",
      city: order?.city || employee.city,
      area: order?.area || employee.area,
      status: SHIPMENT_STATUS_LABELS[shipment.status] || shipment.status,
      rawStatus: shipment.status,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      returnedReason: shipment.returnedReason,
    };
  };

  const currentOrders = shipments
    .filter((shipment) => ACTIVE_SHIPMENT_STATUSES.includes(shipment.status))
    .map(enrichShipment)
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));

  const recentDeliveries = shipments
    .filter((shipment) => DELIVERED_SHIPMENT_STATUSES.includes(shipment.status))
    .map(enrichShipment)
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
    .slice(0, 6);

  const returnedOrders = shipments
    .filter((shipment) => RETURNED_SHIPMENT_STATUSES.includes(shipment.status))
    .map(enrichShipment)
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
    .slice(0, 6);

  const monthlyPerformanceMap = shipments.reduce((accumulator, shipment) => {
    const monthKey = shipment.updatedAt.slice(0, 7);

    if (!accumulator[monthKey]) {
      accumulator[monthKey] = {
        month: monthKey,
        delivered: 0,
        returned: 0,
        active: 0,
        collections: 0,
      };
    }

    if (DELIVERED_SHIPMENT_STATUSES.includes(shipment.status)) {
      accumulator[monthKey].delivered += 1;

      const order = getOrderById(shipment.orderId);
      if (order?.paymentMethod === "cod") {
        accumulator[monthKey].collections += Number(order.amount || 0);
      }
    }

    if (RETURNED_SHIPMENT_STATUSES.includes(shipment.status)) {
      accumulator[monthKey].returned += 1;
    }

    if (ACTIVE_SHIPMENT_STATUSES.includes(shipment.status)) {
      accumulator[monthKey].active += 1;
    }

    return accumulator;
  }, {});

  const monthlyPerformance = Object.values(monthlyPerformanceMap)
    .sort((left, right) => right.month.localeCompare(left.month))
    .slice(0, 4);

  const totalHandledOrders = courierRow.totalDeliveries + courierRow.returnedOrders;
  const deliveryQualityScore =
    totalHandledOrders > 0 ? courierRow.totalDeliveries / totalHandledOrders : 0.6;
  const workloadScore = Math.min(courierRow.activeOrdersCount / 5, 1) * 0.15;
  const overallRating = Number(
    Math.min(Math.max((deliveryQualityScore * 4.5 + workloadScore) + 0.5, 2.5), 5).toFixed(1)
  );

  const collectionsTotal = transactions
    .filter((transaction) => transaction.type === "collection_credit")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const earningCredits = transactions
    .filter((transaction) => transaction.type === "earning_credit")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const withdrawals = transactions
    .filter((transaction) => transaction.type === "withdrawal_debit")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return {
    ...courierRow,
    email: `${employee.fullName.split(" ")[0].toLowerCase()}@phoenix.local`,
    currentOrders,
    recentDeliveries,
    returnedOrders,
    monthlyPerformance,
    finance: {
      walletBalance: wallet.currentBalance,
      collectionsTotal,
      earningCredits,
      withdrawals,
    },
    overallRating,
  };
}

export async function getAllCouriers() {
  return employeesTable.map(deriveCourierRow);
}

export async function createCourier(payload) {
  const nextId = Math.max(...employeesTable.map((item) => item.id), 0) + 1;

  employeesTable = [
    ...employeesTable,
    {
      id: nextId,
      fullName: payload.fullName,
      phone: payload.phone,
      city: payload.city,
      area: payload.area,
      vehicleType: payload.vehicleType,
      nationalId: payload.nationalId || "",
      licenseNumber: payload.licenseNumber || "",
      isActive: payload.isActive,
      lastSeenAt: NOW.toISOString(),
    },
  ];

  employeeWalletsTable = [
    ...employeeWalletsTable,
    {
      employeeId: nextId,
      currentBalance: 0,
      currency: "ILS",
      updatedAt: NOW.toISOString(),
    },
  ];

  return deriveCourierRow(employeesTable[employeesTable.length - 1]);
}

export async function updateCourier(courierId, payload) {
  employeesTable = employeesTable.map((employee) =>
    employee.id === courierId
      ? {
          ...employee,
          fullName: payload.fullName,
          phone: payload.phone,
          city: payload.city,
          area: payload.area,
          vehicleType: payload.vehicleType,
          nationalId: payload.nationalId || "",
          licenseNumber: payload.licenseNumber || "",
          isActive: payload.isActive,
        }
      : employee
  );

  const updated = employeesTable.find((employee) => employee.id === courierId);
  return updated ? deriveCourierRow(updated) : null;
}

export async function toggleCourierStatus(courierId) {
  employeesTable = employeesTable.map((employee) =>
    employee.id === courierId
      ? {
          ...employee,
          isActive: !employee.isActive,
          lastSeenAt: !employee.isActive ? NOW.toISOString() : employee.lastSeenAt,
        }
      : employee
  );

  const updated = employeesTable.find((employee) => employee.id === courierId);
  return updated ? deriveCourierRow(updated) : null;
}

export async function getCourierDetails(courierId) {
  return buildDetailsSection(courierId);
}

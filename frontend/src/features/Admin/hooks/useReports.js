import { useEffect, useMemo, useState } from "react";
import { getAdminReports, getReturnedOrders } from "../services/reportsService";

const initialFilters = {
  orderNumber: "",
  merchantName: "",
  customerName: "",
  delegateName: "",
  status: "all",
  dateFrom: "",
  dateTo: "",
  city: "all",
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function formatCurrency(value) {
  return `${formatNumber(value)} ₪`;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatRangeDate(value) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function withinDateRange(dateValue, dateFrom, dateTo) {
  if (!dateValue) return false;

  const targetDate = new Date(dateValue);

  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);

    if (targetDate < from) {
      return false;
    }
  }

  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    if (targetDate > to) {
      return false;
    }
  }

  return true;
}

function getStartOfWeek(dateValue) {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEndOfWeek(dateValue) {
  const date = getStartOfWeek(dateValue);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getStartOfMonth(dateValue) {
  const date = new Date(dateValue);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEndOfMonth(dateValue) {
  const date = new Date(dateValue);
  date.setMonth(date.getMonth() + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getStartOfYear(dateValue) {
  const date = new Date(dateValue);
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEndOfYear(dateValue) {
  const date = new Date(dateValue);
  date.setMonth(11, 31);
  date.setHours(23, 59, 59, 999);
  return date;
}

function isSameWeek(dateValue, referenceDate) {
  const targetDate = new Date(dateValue);
  const reference = new Date(referenceDate);
  const targetWeekStart = getStartOfWeek(targetDate);
  const referenceWeekStart = getStartOfWeek(reference);
  return targetWeekStart.getTime() === referenceWeekStart.getTime();
}

function isSameMonth(dateValue, referenceDate) {
  const targetDate = new Date(dateValue);
  const reference = new Date(referenceDate);
  return (
    targetDate.getFullYear() === reference.getFullYear() &&
    targetDate.getMonth() === reference.getMonth()
  );
}

function isSameYear(dateValue, referenceDate) {
  return new Date(dateValue).getFullYear() === new Date(referenceDate).getFullYear();
}

export function useReports() {
  const [reports, setReports] = useState([]);
  const [returnedOrders, setReturnedOrders] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        const [operationsData, returnedData] = await Promise.all([
          getAdminReports(),
          getReturnedOrders(),
        ]);

        if (!isMounted) {
          return;
        }

        setReports(Array.isArray(operationsData) ? operationsData : []);
        setReturnedOrders(Array.isArray(returnedData) ? returnedData : []);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesOrderNumber =
        !normalize(filters.orderNumber) ||
        normalize(report.orderNumber).includes(normalize(filters.orderNumber));

      const matchesMerchant =
        !normalize(filters.merchantName) ||
        normalize(report.merchantName).includes(normalize(filters.merchantName));

      const matchesCustomer =
        !normalize(filters.customerName) ||
        normalize(report.customerName).includes(normalize(filters.customerName));

      const matchesDelegate =
        !normalize(filters.delegateName) ||
        normalize(report.delegateName).includes(normalize(filters.delegateName));

      const matchesStatus =
        filters.status === "all" || report.status === filters.status;

      const matchesCity = filters.city === "all" || report.city === filters.city;
      const matchesDate = withinDateRange(report.createdAt, filters.dateFrom, filters.dateTo);

      return (
        matchesOrderNumber &&
        matchesMerchant &&
        matchesCustomer &&
        matchesDelegate &&
        matchesStatus &&
        matchesCity &&
        matchesDate
      );
    });
  }, [reports, filters]);

  const filteredReturnedOrders = useMemo(() => {
    return returnedOrders.filter((item) => {
      const matchesOrderNumber =
        !normalize(filters.orderNumber) ||
        normalize(item.orderNumber).includes(normalize(filters.orderNumber));

      const matchesMerchant =
        !normalize(filters.merchantName) ||
        normalize(item.merchantName).includes(normalize(filters.merchantName));

      const matchesCustomer =
        !normalize(filters.customerName) ||
        normalize(item.customerName).includes(normalize(filters.customerName));

      const matchesDelegate =
        !normalize(filters.delegateName) ||
        normalize(item.delegateName).includes(normalize(filters.delegateName));

      const matchesStatus = filters.status === "all" || filters.status === "returned";
      const matchesCity = filters.city === "all" || item.city === filters.city;
      const matchesDate = withinDateRange(item.returnedAt, filters.dateFrom, filters.dateTo);

      return (
        matchesOrderNumber &&
        matchesMerchant &&
        matchesCustomer &&
        matchesDelegate &&
        matchesStatus &&
        matchesCity &&
        matchesDate
      );
    });
  }, [returnedOrders, filters]);

  const cities = useMemo(() => {
    return [...new Set(reports.map((report) => report.city).filter(Boolean))];
  }, [reports]);

  const summaryCards = useMemo(() => {
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekEnd = getEndOfWeek(now);
    const monthStart = getStartOfMonth(now);
    const monthEnd = getEndOfMonth(now);
    const yearStart = getStartOfYear(now);
    const yearEnd = getEndOfYear(now);
    const deliveredOrders = reports.filter((item) => item.status === "delivered");
    const inDeliveryOrders = reports.filter((item) => item.status === "in_delivery");
    const returnedCount = returnedOrders.length;

    const weeklyProfit = deliveredOrders.reduce((sum, item) => {
      const completedAt = item.updatedAt || item.createdAt;
      if (!completedAt || !isSameWeek(completedAt, now)) {
        return sum;
      }

      return sum + Number(item.phoenixCommission || 0);
    }, 0);

    const monthlyProfit = deliveredOrders.reduce((sum, item) => {
      const completedAt = item.updatedAt || item.createdAt;
      if (!completedAt || !isSameMonth(completedAt, now)) {
        return sum;
      }

      return sum + Number(item.phoenixCommission || 0);
    }, 0);

    const yearlyProfit = deliveredOrders.reduce((sum, item) => {
      const completedAt = item.updatedAt || item.createdAt;
      if (!completedAt || !isSameYear(completedAt, now)) {
        return sum;
      }

      return sum + Number(item.phoenixCommission || 0);
    }, 0);

    return [
      {
        id: "total-orders",
        label: "إجمالي الطلبات",
        value: formatNumber(reports.length),
        note: "عدد السجلات الناتجة عن الربط بين orders وshipments.",
        icon: "bi-receipt",
        iconClass: "phoenix-reports__summary-icon--blue",
      },
      {
        id: "delivered-orders",
        label: "تم التسليم",
        value: formatNumber(deliveredOrders.length),
        note: "طلبات حالتها delivered في shipments.",
        icon: "bi-check2-circle",
        iconClass: "phoenix-reports__summary-icon--green",
      },
      {
        id: "in-delivery-orders",
        label: "قيد التوصيل",
        value: formatNumber(inDeliveryOrders.length),
        note: "طلبات ما زالت ضمن مسار التوزيع والتسليم.",
        icon: "bi-truck",
        iconClass: "phoenix-reports__summary-icon--orange",
      },
      {
        id: "returned-orders",
        label: "المرتجعات",
        value: formatNumber(returnedCount),
        note: "طلبات مرتبطة بحالة returned أو سجل إرجاع معتمد.",
        icon: "bi-arrow-counterclockwise",
        iconClass: "phoenix-reports__summary-icon--red",
      },
      {
        id: "weekly-profit",
        label: "الأرباح الأسبوعية",
        value: formatCurrency(weeklyProfit),
        note: `من ${formatRangeDate(weekStart)} إلى ${formatRangeDate(weekEnd)}`,
        period: `الفترة: ${formatRangeDate(weekStart)} - ${formatRangeDate(weekEnd)}`,
        icon: "bi-cash-stack",
        iconClass: "phoenix-reports__summary-icon--blue",
        variant: "profit",
      },
      {
        id: "monthly-profit",
        label: "الأرباح الشهرية",
        value: formatCurrency(monthlyProfit),
        note: `من ${formatRangeDate(monthStart)} إلى ${formatRangeDate(monthEnd)}`,
        period: `الفترة: ${formatRangeDate(monthStart)} - ${formatRangeDate(monthEnd)}`,
        icon: "bi-bank",
        iconClass: "phoenix-reports__summary-icon--indigo",
        variant: "profit",
      },
      {
        id: "yearly-profit",
        label: "الأرباح السنوية",
        value: formatCurrency(yearlyProfit),
        note: `من ${formatRangeDate(yearStart)} إلى ${formatRangeDate(yearEnd)}`,
        period: `الفترة: ${formatRangeDate(yearStart)} - ${formatRangeDate(yearEnd)}`,
        icon: "bi-shop-window",
        iconClass: "phoenix-reports__summary-icon--green",
        variant: "profit",
      },
    ];
  }, [reports, returnedOrders]);

  return {
    reports,
    returnedOrders,
    filteredReports,
    filteredReturnedOrders,
    summaryCards,
    cities,
    filters,
    setFilters,
    isLoading,
  };
}

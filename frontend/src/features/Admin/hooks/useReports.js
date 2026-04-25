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
    const deliveredOrders = reports.filter((item) => item.status === "delivered");
    const inDeliveryOrders = reports.filter((item) => item.status === "in_delivery");
    const pendingOrders = reports.filter((item) => item.status === "pending");

    const totalCollectedAmount = deliveredOrders.reduce(
      (sum, item) => sum + Number(item.collectedAmount || 0),
      0
    );
    const phoenixCommission = deliveredOrders.reduce(
      (sum, item) => sum + Number(item.phoenixCommission || 0),
      0
    );
    const merchantsDue = deliveredOrders.reduce(
      (sum, item) => sum + Number(item.merchantDue || 0),
      0
    );
    const pendingAmounts = [...inDeliveryOrders, ...pendingOrders].reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

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
        value: formatNumber(returnedOrders.length),
        note: "طلبات مرتبطة بحالة returned أو سجل إرجاع معتمد.",
        icon: "bi-arrow-counterclockwise",
        iconClass: "phoenix-reports__summary-icon--red",
      },
      {
        id: "collected-amount",
        label: "إجمالي المبالغ المحصلة",
        value: formatCurrency(totalCollectedAmount),
        note: "مجموع المبالغ المحصلة فعليًا للطلبات المسلمة.",
        icon: "bi-cash-stack",
        iconClass: "phoenix-reports__summary-icon--blue",
      },
      {
        id: "phoenix-commission",
        label: "عمولة Phoenix",
        value: formatCurrency(phoenixCommission),
        note: "صافي العمولة المستند لاحقًا إلى wallet_transactions.",
        icon: "bi-bank",
        iconClass: "phoenix-reports__summary-icon--indigo",
      },
      {
        id: "merchant-dues",
        label: "مستحقات التجار",
        value: formatCurrency(merchantsDue),
        note: "المبالغ التي يجب تحويلها للتجار بعد خصم العمولة.",
        icon: "bi-shop-window",
        iconClass: "phoenix-reports__summary-icon--green",
      },
      {
        id: "pending-amounts",
        label: "المبالغ المعلقة",
        value: formatCurrency(pendingAmounts),
        note: "طلبات قيد التوصيل أو المراجعة ولم تُحسم ماليًا بعد.",
        icon: "bi-hourglass-split",
        iconClass: "phoenix-reports__summary-icon--orange",
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

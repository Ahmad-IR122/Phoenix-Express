import { useEffect, useMemo, useState } from "react";
import {
  createCourier,
  getAllCouriers,
  getCourierDetails,
  toggleCourierStatus,
  updateCourier,
} from "../services/courierService";

const initialFilters = {
  name: "",
  phone: "",
  area: "all",
  status: "all",
  vehicleType: "all",
  activity: "all",
};

const vehicleTypeLabels = {
  motorcycle: "دراجة نارية",
  sedan: "سيارة سيدان",
  van: "فان",
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

export function useCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [couriersSummary, setCouriersSummary] = useState({
    totalDelegates: 0,
    availableDelegates: 0,
    busyDelegates: 0,
    offlineDelegates: 0,
    totalCollectedAmount: 0,
    totalDeliveriesThisWeek: 0,
    totalReturnsThisWeek: 0,
  });
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const loadCouriers = async () => {
    setIsLoading(true);

    try {
      const data = await getAllCouriers();
      setCouriers(Array.isArray(data?.delegates) ? data.delegates : []);
      setCouriersSummary(
        data?.summary || {
          totalDelegates: 0,
          availableDelegates: 0,
          busyDelegates: 0,
          offlineDelegates: 0,
          totalCollectedAmount: 0,
          totalDeliveriesThisWeek: 0,
          totalReturnsThisWeek: 0,
        },
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  const filteredCouriers = useMemo(() => {
    return couriers.filter((courier) => {
      const matchesName =
        !normalize(filters.name) || normalize(courier.name).includes(normalize(filters.name));
      const matchesPhone =
        !normalize(filters.phone) || normalize(courier.phone).includes(normalize(filters.phone));
      const matchesArea = filters.area === "all" || courier.area === filters.area;
      const matchesStatus = filters.status === "all" || courier.status === filters.status;
      const matchesVehicle =
        filters.vehicleType === "all" || courier.vehicleType === filters.vehicleType;
      const matchesActivity =
        filters.activity === "all" || courier.activityState === filters.activity;

      return (
        matchesName &&
        matchesPhone &&
        matchesArea &&
        matchesStatus &&
        matchesVehicle &&
        matchesActivity
      );
    });
  }, [couriers, filters]);

  const summaryCards = useMemo(() => {
    return [
      {
        id: "total-couriers",
        label: "إجمالي المناديب",
        value: formatNumber(couriersSummary.totalDelegates),
        icon: "bi-people",
        iconClass: "phoenix-delegates__summary-icon--blue",
      },
      {
        id: "available-couriers",
        label: "المناديب المتاحين",
        value: formatNumber(couriersSummary.availableDelegates),
        icon: "bi-person-check",
        iconClass: "phoenix-delegates__summary-icon--green",
      },
      {
        id: "busy-couriers",
        label: "المناديب المشغولين",
        value: formatNumber(couriersSummary.busyDelegates),
        icon: "bi-truck",
        iconClass: "phoenix-delegates__summary-icon--orange",
      },
      {
        id: "weekly-deliveries",
        label: "إجمالي التوصيلات هذا الأسبوع",
        value: formatNumber(couriersSummary.totalDeliveriesThisWeek),
        icon: "bi-box-seam",
        iconClass: "phoenix-delegates__summary-icon--teal",
      },
      {
        id: "offline-couriers",
        label: "المناديب غير المتصلين",
        value: formatNumber(couriersSummary.offlineDelegates),
        icon: "bi-person-x",
        iconClass: "phoenix-delegates__summary-icon--slate",
      },
      {
        id: "total-collected",
        label: "إجمالي المبالغ المحصلة",
        value: formatCurrency(couriersSummary.totalCollectedAmount),
        icon: "bi-cash-stack",
        iconClass: "phoenix-delegates__summary-icon--purple",
      },
    ];
  }, [couriersSummary]);

  const areas = useMemo(
    () => [...new Set(couriers.map((courier) => courier.area).filter(Boolean))].sort(),
    [couriers],
  );

  const vehicleTypes = useMemo(
    () => [...new Set(couriers.map((courier) => courier.vehicleType).filter(Boolean))],
    [couriers],
  );

  const submitCreateCourier = async (payload) => {
    setIsMutating(true);

    try {
      await createCourier(payload);
      await loadCouriers();
    } finally {
      setIsMutating(false);
    }
  };

  const submitUpdateCourier = async (courierId, payload) => {
    setIsMutating(true);

    try {
      await updateCourier(courierId, payload);
      await loadCouriers();
    } finally {
      setIsMutating(false);
    }
  };

  const submitToggleCourierStatus = async (courierId, isActive) => {
    setIsMutating(true);

    try {
      await toggleCourierStatus(courierId, isActive);
      await loadCouriers();
    } finally {
      setIsMutating(false);
    }
  };

  const loadCourierDetails = async (courierId) => {
    return getCourierDetails(courierId);
  };

  return {
    couriers,
    filteredCouriers,
    filters,
    setFilters,
    summaryCards,
    areas,
    vehicleTypes,
    vehicleTypeLabels,
    isLoading,
    isMutating,
    submitCreateCourier,
    submitUpdateCourier,
    submitToggleCourierStatus,
    loadCourierDetails,
  };
}

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
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const loadCouriers = async () => {
    setIsLoading(true);

    try {
      const data = await getAllCouriers();
      setCouriers(Array.isArray(data) ? data : []);
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

  const operationalCouriers = useMemo(() => couriers, [couriers]);

  const summaryCards = useMemo(() => {
    const availableCouriers = operationalCouriers.filter((courier) => courier.status === "available");
    const busyCouriers = operationalCouriers.filter((courier) => courier.status === "busy");
    const offlineCouriers = operationalCouriers.filter((courier) => courier.status === "offline");

    const totalDeliveries = operationalCouriers.reduce(
      (sum, courier) => sum + Number(courier.totalDeliveries || 0),
      0
    );
    const totalCollectedAmount = operationalCouriers.reduce(
      (sum, courier) => sum + Number(courier.collectedAmount || 0),
      0
    );

    return [
      {
        id: "total-couriers",
        label: "إجمالي المناديب",
        value: formatNumber(operationalCouriers.length),
        icon: "bi-people",
        iconClass: "phoenix-delegates__summary-icon--blue",
      },
      {
        id: "available-couriers",
        label: "المناديب المتاحين",
        value: formatNumber(availableCouriers.length),
        icon: "bi-person-check",
        iconClass: "phoenix-delegates__summary-icon--green",
      },
      {
        id: "busy-couriers",
        label: "المناديب المشغولين",
        value: formatNumber(busyCouriers.length),
        icon: "bi-truck",
        iconClass: "phoenix-delegates__summary-icon--orange",
      },
      {
        id: "offline-couriers",
        label: "غير المتصلين / غير النشطين",
        value: formatNumber(offlineCouriers.length),
        icon: "bi-person-x",
        iconClass: "phoenix-delegates__summary-icon--slate",
      },
      {
        id: "total-deliveries",
        label: "إجمالي التوصيلات",
        value: formatNumber(totalDeliveries),
        icon: "bi-check2-circle",
        iconClass: "phoenix-delegates__summary-icon--blue",
      },
      {
        id: "total-collected",
        label: "إجمالي المبالغ المحصلة",
        value: formatCurrency(totalCollectedAmount),
        icon: "bi-cash-stack",
        iconClass: "phoenix-delegates__summary-icon--purple",
      },
    ];
  }, [operationalCouriers]);

  const areas = useMemo(
    () => [...new Set(couriers.map((courier) => courier.area).filter(Boolean))].sort(),
    [couriers]
  );

  const vehicleTypes = useMemo(
    () => [...new Set(couriers.map((courier) => courier.vehicleType).filter(Boolean))],
    [couriers]
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

  const submitToggleCourierStatus = async (courierId) => {
    setIsMutating(true);

    try {
      await toggleCourierStatus(courierId);
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

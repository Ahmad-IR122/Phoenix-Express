import React from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiCreditCard,
  FiCheckCircle,
  FiLock,
  FiLogOut,
  FiMail,
  FiPackage,
  FiPhone,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { changePassword } from "../../auth/services/authService";
import {
  confirmCustomerSettlement,
  deleteCustomerOrder,
  getCustomerOrders,
  getCustomerProfile,
  getCustomerSettlements,
  requestCustomerSettlement,
  updateCustomerProfile,
  updateCustomerProfileLegacy,
} from "../services/customerService";
import "./CustomerProfilePage.css";
import {
  hasMinPasswordLength,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
} from "../../../utils/validators";

const statusTextByValue = {
  accepted: "تم قبول الطلب",
  picked_up: "تم استلام الطرد",
  in_transit: "قيد التوصيل",
  arrived_to_destination_city: "وصل إلى مدينة الوجهة",
  out_for_delivery: "خارج للتسليم",
  delivered: "تم التسليم",
  returned: "مرتجع",
  cancelled: "ملغي",
  pending: "قيد المراجعة",
};

const getStatusType = (status) => {
  if (status === "delivered") return "delivered";
  if (status === "cancelled" || status === "returned") return "cancelled";
  return "shipping";
};

const formatOrderDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

const mapCustomerOrder = (order) => {
  const status = order.shipment?.current_status || order.status || "pending";
  const isEditable =
    order.shipment?.current_status === "accepted" && !order.shipment?.driver_id;

  return {
    id: order.id,
    raw: order,
    trackingNumber: order.shipment?.tracking_number || `ORDER-${order.id}`,
    status: statusTextByValue[status] || status,
    rawStatus: status,
    statusType: getStatusType(status),
    from: order.origin_city || "-",
    to: order.destination_city || "-",
    date: formatOrderDate(order.created_at || order.createdAt),
    canEdit: isEditable,
    price: `${order.region?.price || 0} شيكل`,
  };
};

const regionValueByName = {
  west_bank: "west-bank",
  "west-bank": "west-bank",
  jerusalem: "jerusalem",
  inside: "inside",
};

const deliverySpeedToFormValue = {
  normal: "normal",
  urgent: "urgent",
  express: "immediate",
};

const mapOrderToDeliveryFormState = (order) => ({
  editOrderId: order.id,
  selectedRegion:
    regionValueByName[order.region?.name] ||
    regionValueByName[order.selectedRegion] ||
    "",
  originalCity: order.origin_city || "",
  destinationCity: order.destination_city || "",
  senderName: order.sender_name || "",
  senderPhone: order.sender_phone || "",
  senderAddress: order.sender_address || "",
  receiverName: order.receiver_name || "",
  receiverPhone: order.receiver_phone || "",
  receiverAddress: order.receiver_address || "",
  orderStatus: deliverySpeedToFormValue[order.delivery_speed] || "normal",
  orderSize: order.package_size || "",
  isFragile: Boolean(order.is_fragile),
  orderPrice:
    order.declared_value !== null && order.declared_value !== undefined
      ? String(order.declared_value)
      : "",
  orderDescription: order.package_description || "",
});

const orderFilterOptions = [
  {
    value: "all",
    label: "\u0627\u0644\u0643\u0644",
  },
  {
    value: "company",
    label: "\u062f\u0627\u062e\u0644 \u0627\u0644\u0634\u0631\u0643\u0629",
  },
  {
    value: "shipping",
    label: "\u0642\u064a\u062f \u0627\u0644\u062a\u0648\u0635\u064a\u0644",
  },
  {
    value: "delivered",
    label: "\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
  },
];

const orderFilterStatusMap = {
  company: ["pending", "accepted"],
  shipping: [
    "picked_up",
    "in_transit",
    "arrived_to_destination_city",
    "out_for_delivery",
  ],
  delivered: ["delivered"],
};

const matchesOrderFilter = (order, filter) => {
  if (filter === "all") return true;

  return (orderFilterStatusMap[filter] || []).includes(order.rawStatus);
};

const settlementStatusLabels = {
  pending: "\u0637\u0644\u0628\u0643 \u0642\u064a\u062f \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629",
  requested: "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0629 \u0648\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u0623\u0643\u064a\u062f\u0643",
  settled: "\u062a\u0645\u062a \u0627\u0644\u062a\u0633\u0648\u064a\u0629",
  received: "\u062a\u0645\u062a \u0627\u0644\u062a\u0633\u0648\u064a\u0629",
};

const normalizeSettlementStatus = (status) => (status === "received" ? "settled" : status);

const getSettlementNarrative = (settlement) => {
  if (
    (settlement.status === "settled" || settlement.status === "received") &&
    settlement.customer_confirmed_at
  ) {
    return `\u0623\u0643\u062f\u062a \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645 \u0628\u062a\u0627\u0631\u064a\u062e ${formatSettlementDate(settlement.customer_confirmed_at)}`;
  }

  if (settlement.status === "requested") {
    return settlement.settled_at
      ? `\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0629 \u0644\u0643 \u0628\u062a\u0627\u0631\u064a\u062e ${formatSettlementDate(settlement.settled_at)}. \u064a\u0631\u062c\u0649 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645 \u0644\u0625\u063a\u0644\u0627\u0642\u0647\u0627.`
      : "\u062a\u0645\u062a \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u062a\u0633\u0648\u064a\u0629 \u0648\u0647\u064a \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u0623\u0643\u064a\u062f\u0643 \u0644\u0644\u0627\u0633\u062a\u0644\u0627\u0645.";
  }

  if (settlement.status === "pending") {
    return "\u0623\u0631\u0633\u0644\u062a \u0637\u0644\u0628 \u062a\u0633\u0648\u064a\u0629 \u0644\u0644\u0625\u062f\u0627\u0631\u0629 \u0648\u0647\u0648 \u0627\u0644\u0622\u0646 \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629.";
  }

  return settlementStatusLabels[settlement.status] || settlement.status;
};

const settlementMethodLabels = {
  cash: "\u0646\u0642\u062f\u0627\u064b",
  bank_transfer: "\u062a\u062d\u0648\u064a\u0644 \u0628\u0646\u0643\u064a",
  ewallet: "\u0645\u062d\u0641\u0638\u0629 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0629",
};

const formatCurrency = (value) =>
  `${new Intl.NumberFormat("ar-PS").format(Number(value) || 0)} \u0634\u064a\u0643\u0644`;

const formatSettlementDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!storedUser) return {};

  try {
    return JSON.parse(storedUser);
  } catch {
    return {};
  }
};

const getDisplayName = (user) =>
  user.fullName ||
  user.full_name ||
  user.name ||
  user.customer?.individual_profile?.full_name ||
  user.customer?.company_profile?.company_name ||
  user.customer?.full_name ||
  user.employee?.full_name ||
  "عميل فينوكس";

const getProfileName = (customer) =>
  customer?.individual_profile?.full_name ||
  customer?.company_profile?.company_name ||
  customer?.user?.full_name ||
  "عميل فينوكس";

const getProfileValidationMessage = ({ name, email, phone }) => {
  if (!name) return "الاسم مطلوب.";
  if (name.length < 2) return "الاسم لازم يكون حرفين على الأقل.";
  if (!email) return "البريد الإلكتروني مطلوب.";
  if (!isValidEmail(email)) {
    return "اكتبي بريد إلكتروني صحيح مثل name@example.com.";
  }
  if (!phone) return "رقم الهاتف مطلوب.";
  if (!/^[0-9]{7,15}$/.test(phone)) {
    return "رقم الهاتف لازم يكون أرقام فقط من 7 إلى 15 رقم.";
  }

  return "";
};

const saveStoredUser = (user) => {
  const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
  storage.setItem("user", JSON.stringify(user));
};

const getProfileSaveErrorMessage = (error) => {
  const message = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message;

  if (error.response?.status === 404) {
    return "تعذر الوصول إلى خدمة تحديث الملف الشخصي، يرجى إعادة تشغيل الخادم والمحاولة مرة أخرى.";
  }

  if (!error.response && message) {
    return message;
  }

  return message || "تعذر حفظ البيانات، يرجى المحاولة مرة أخرى.";
};

const getPasswordErrorMessage = (message = "") => {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("current password is incorrect")) {
    return "كلمة المرور الحالية غير صحيحة، يرجى إدخال كلمة المرور الحالية بشكل صحيح.";
  }

  if (normalizedMessage.includes("confirmation does not match")) {
    return "تأكيد كلمة المرور الجديدة غير مطابق.";
  }

  if (normalizedMessage.includes("at least 8 characters")) {
    return "كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل.";
  }

  if (normalizedMessage.includes("required")) {
    return "عبّي كل خانات كلمة المرور قبل الحفظ.";
  }

  return message || "راجع البيانات وحاول مرة ثانية.";
};

const getPasswordAlertTitle = (message = "") => {
  if (message.includes("غير صحيحة")) {
    return "كلمة المرور الحالية غير صحيحة";
  }

  if (message.includes("الحالية غير صحيحة")) {
    return "كلمة المرور الحالية غير صحيحة";
  }

  if (message.includes("غير مطابق")) {
    return "كلمة المرور غير متطابقة";
  }

  if (message.includes("8 أحرف")) {
    return "كلمة المرور قصيرة";
  }

  if (message.includes("عبّي")) {
    return "البيانات ناقصة";
  }

  return "تعذر تغيير كلمة المرور";
};

const CustomerProfilePage = () => {
  const navigate = useNavigate();
  const storedUser = React.useMemo(() => getStoredUser(), []);
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const [isEditing, setIsEditing] = React.useState(false);
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);
  const [customerOrders, setCustomerOrders] = React.useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true);
  const [ordersFilter, setOrdersFilter] = React.useState("all");
  const [settlementData, setSettlementData] = React.useState(null);
  const [isLoadingSettlements, setIsLoadingSettlements] = React.useState(true);
  const [isSubmittingSettlement, setIsSubmittingSettlement] = React.useState(false);
  const [settlementForm, setSettlementForm] = React.useState({
    amount: "",
    payment_method: "cash",
    bank_name: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_iban: "",
    notes: "",
  });
  const [profileForm, setProfileForm] = React.useState({
    name: getDisplayName(storedUser),
    email: storedUser.email || "ahmad@example.com",
    phone: storedUser.phone || "0599123456",
  });
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visiblePasswords, setVisiblePasswords] = React.useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getCustomerProfile();
        const customer = response.data;

        if (!customer?.user) return;

        setProfileForm({
          name: getProfileName(customer),
          email: customer.user.email || "",
          phone: customer.user.phone || "",
        });

        saveStoredUser({
          ...customer.user,
          customer,
        });
      } catch {
        // Keep the locally stored user data if the profile request fails.
      }
    };

    loadProfile();
  }, []);

  const filteredCustomerOrders = React.useMemo(
    () => customerOrders.filter((order) => matchesOrderFilter(order, ordersFilter)),
    [customerOrders, ordersFilter]
  );

  React.useEffect(() => {
    const loadOrders = async () => {
      setIsLoadingOrders(true);

      try {
        const response = await getCustomerOrders();
        const nextOrders = Array.isArray(response.data)
          ? response.data.map(mapCustomerOrder)
          : [];
        setCustomerOrders(nextOrders);
      } catch {
        setCustomerOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  const loadSettlements = React.useCallback(async () => {
    setIsLoadingSettlements(true);

    try {
      const response = await getCustomerSettlements();
      const data = response.data || null;
      setSettlementData(data);
      setSettlementForm((current) => ({
        ...current,
        amount:
          Number(data?.available_settlement_request_amount) > 0
            ? String(data.available_settlement_request_amount)
            : "",
      }));
    } catch {
      setSettlementData(null);
    } finally {
      setIsLoadingSettlements(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/");
  };

  const handleProfileSave = async () => {
    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim().toLowerCase(),
      phone: profileForm.phone.trim(),
    };
    const validationMessage = getProfileValidationMessage(payload);

    if (validationMessage) {
      Swal.fire({
        icon: "warning",
        title: "راجعي البيانات",
        text: validationMessage,
        confirmButtonText: "تمام",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    setIsSavingProfile(true);

    try {
      let response;

      try {
        response = await updateCustomerProfile(payload);
      } catch (error) {
        const shouldUseLegacySave =
          error.response?.status === 404 ||
          error.response?.status === 405 ||
          !error.response;

        if (!shouldUseLegacySave) {
          throw error;
        }

        response = await updateCustomerProfileLegacy(payload, getStoredUser());
      }

      const customer = response.data;

      setProfileForm({
        name: getProfileName(customer),
        email: customer.user?.email || payload.email,
        phone: customer.user?.phone || payload.phone,
      });

      const updatedUser = customer.user
        ? {
            ...customer.user,
            customer,
          }
        : {
            ...getStoredUser(),
            full_name: payload.name,
            email: payload.email,
            phone: payload.phone,
            customer,
          };

      saveStoredUser({
        ...updatedUser,
      });

      setIsEditing(false);
      Swal.fire({
        icon: "success",
        title: "تم حفظ التعديل",
        text: "تم تحديث بياناتك في قاعدة البيانات.",
        confirmButtonText: "تمام",
        confirmButtonColor: "#38b6ff",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذر حفظ البيانات",
        text: getProfileSaveErrorMessage(error),
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38b6ff",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmitPassword = async (event) => {
    event.preventDefault();

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "بيانات كلمة المرور غير مكتملة",
        text: "يرجى تعبئة جميع حقول كلمة المرور قبل حفظ التغييرات.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    if (!hasMinPasswordLength(newPassword)) {
      Swal.fire({
        icon: "warning",
        title: "كلمة المرور قصيرة",
        text: `كلمة المرور الجديدة لازم تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`,
        confirmButtonText: "تمام",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    if (currentPassword === newPassword) {
      Swal.fire({
        icon: "warning",
        title: "كلمة المرور غير متغيرة",
        text: "اكتبي كلمة مرور جديدة مختلفة عن كلمة المرور الحالية.",
        confirmButtonText: "تمام",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "كلمة المرور غير متطابقة",
        text: "تأكد من كتابة كلمة المرور الجديدة بنفس الشكل.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    setIsSavingPassword(true);

    try {
      await changePassword(
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        token
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      Swal.fire({
        icon: "success",
        title: "تم تغيير كلمة المرور",
        text: "يمكنك استخدام كلمة المرور الجديدة من الآن.",
        confirmButtonText: "تمام",
        confirmButtonColor: "#38b6ff",
      });
    } catch (error) {
      const friendlyMessage = getPasswordErrorMessage(error.response?.data?.message);
      Swal.fire({
        icon: "error",
        title: getPasswordAlertTitle(friendlyMessage),
        text: friendlyMessage,
        confirmButtonText: "حسناً",
        confirmButtonColor: "#38b6ff",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setVisiblePasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setShowPasswordForm(false);
  };

  const handleEditOrder = (order) => {
    if (!order.canEdit) return;

    navigate("/request-delivery", {
      state: mapOrderToDeliveryFormState(order.raw),
    });
  };

  const handleDeleteOrder = async (order) => {
    if (!order.canEdit) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "\u062d\u0630\u0641 \u0627\u0644\u0637\u0631\u062f",
      text: "\u0647\u0644 \u062a\u0631\u064a\u062f\u064a\u0646 \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0637\u0631\u062f\u061f \u064a\u0645\u0643\u0646 \u0627\u0644\u062d\u0630\u0641 \u0641\u0642\u0637 \u0637\u0627\u0644\u0645\u0627 \u0623\u0646\u0647 \u0645\u0627 \u0632\u0627\u0644 \u062f\u0627\u062e\u0644 \u0627\u0644\u0634\u0631\u0643\u0629.",
      showCancelButton: true,
      confirmButtonText: "\u0646\u0639\u0645\u060c \u0627\u062d\u0630\u0641",
      cancelButtonText: "\u0625\u0644\u063a\u0627\u0621",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteCustomerOrder(order.id);
      setCustomerOrders((current) =>
        current.filter((item) => item.id !== order.id)
      );
      Swal.fire({
        icon: "success",
        title: "\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0637\u0631\u062f",
        text: "\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0637\u0631\u062f \u0645\u0646 \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0628\u0646\u062c\u0627\u062d.",
        confirmButtonText: "\u062a\u0645\u0627\u0645",
        confirmButtonColor: "#38b6ff",
      });
    } catch (error) {
      const deleteErrorMessage =
        error.response?.status === 403
          ? "\u064a\u0645\u0643\u0646 \u062d\u0630\u0641 \u0627\u0644\u0637\u0631\u062f \u0641\u0642\u0637 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0645\u0627 \u0632\u0627\u0644 \u062f\u0627\u062e\u0644 \u0627\u0644\u0634\u0631\u0643\u0629."
          : error.response?.data?.message ||
            "\u062a\u0639\u0630\u0631 \u062d\u0630\u0641 \u0627\u0644\u0637\u0631\u062f\u060c \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.";

      Swal.fire({
        icon: "error",
        title: "\u062a\u0639\u0630\u0631 \u062d\u0630\u0641 \u0627\u0644\u0637\u0631\u062f",
        text: deleteErrorMessage,
        confirmButtonText: "\u062d\u0633\u0646\u0627\u064b",
        confirmButtonColor: "#38b6ff",
      });
    }
  };

  const handleSettlementFormChange = (event) => {
    const { name, value } = event.target;
    setSettlementForm((current) => ({ ...current, [name]: value }));
  };

  const handleSettlementRequest = async (event) => {
    event.preventDefault();

    const amount = Number(settlementForm.amount);
    const availableAmount = Number(settlementData?.available_settlement_request_amount) || 0;

    if (!amount || amount <= 0 || amount > availableAmount) {
      Swal.fire({
        icon: "warning",
        title: "\u0631\u0627\u062c\u0639\u064a \u0642\u064a\u0645\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0629",
        text: "\u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0642\u064a\u0645\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0629 \u0636\u0645\u0646 \u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062a\u0627\u062d.",
        confirmButtonText: "\u062a\u0645\u0627\u0645",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    if (
      settlementForm.payment_method === "bank_transfer" &&
      (!settlementForm.bank_name.trim() ||
        !settlementForm.bank_account_holder.trim() ||
        !settlementForm.bank_account_number.trim())
    ) {
      Swal.fire({
        icon: "warning",
        title: "\u0628\u064a\u0627\u0646\u0627\u062a \u0628\u0646\u0643\u064a\u0629 \u0646\u0627\u0642\u0635\u0629",
        text: "\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0628\u0646\u0643 \u0648\u0627\u0633\u0645 \u0635\u0627\u062d\u0628 \u0627\u0644\u062d\u0633\u0627\u0628 \u0648\u0631\u0642\u0645 \u0627\u0644\u062d\u0633\u0627\u0628.",
        confirmButtonText: "\u062d\u0633\u0646\u0627\u064b",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    setIsSubmittingSettlement(true);

    try {
      const response = await requestCustomerSettlement({
        amount,
        payment_method: settlementForm.payment_method,
        bank_name: settlementForm.bank_name.trim(),
        bank_account_holder: settlementForm.bank_account_holder.trim(),
        bank_account_number: settlementForm.bank_account_number.trim(),
        bank_iban: settlementForm.bank_iban.trim(),
        notes: settlementForm.notes.trim(),
      });

      setSettlementData(response.data?.summary || settlementData);
      setSettlementForm({
        amount: "",
        payment_method: "cash",
        bank_name: "",
        bank_account_holder: "",
        bank_account_number: "",
        bank_iban: "",
        notes: "",
      });
      await loadSettlements();

      Swal.fire({
        icon: "success",
        title: "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u062a\u0633\u0648\u064a\u0629",
        text: "\u0633\u064a\u0638\u0647\u0631 \u0627\u0644\u0637\u0644\u0628 \u0644\u062f\u0649 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0644\u0645\u0631\u0627\u062c\u0639\u062a\u0647 \u0648\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0645\u0628\u0644\u063a.",
        confirmButtonText: "\u062a\u0645\u0627\u0645",
        confirmButtonColor: "#38b6ff",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u062a\u0633\u0648\u064a\u0629",
        text:
          error.response?.data?.message ||
          "\u0631\u0627\u062c\u0639\u064a \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0648\u062d\u0627\u0648\u0644\u064a \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.",
        confirmButtonText: "\u062d\u0633\u0646\u0627\u064b",
        confirmButtonColor: "#38b6ff",
      });
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  const handleConfirmSettlementReceipt = async (settlementId) => {
    const result = await Swal.fire({
      icon: "question",
      title: "\u062a\u0623\u0643\u064a\u062f \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u062a\u0633\u0648\u064a\u0629",
      text: "\u0647\u0644 \u062a\u0624\u0643\u062f\u064a\u0646 \u0623\u0646 \u0645\u0628\u0644\u063a \u0627\u0644\u062a\u0633\u0648\u064a\u0629 \u0648\u0635\u0644\u0643 \u0628\u0627\u0644\u0641\u0639\u0644\u061f",
      showCancelButton: true,
      confirmButtonText: "\u0646\u0639\u0645\u060c \u062a\u0645 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645",
      cancelButtonText: "\u0625\u0644\u063a\u0627\u0621",
      confirmButtonColor: "#08c854",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await confirmCustomerSettlement(settlementId);
      setSettlementData(response.data?.summary || settlementData);
      await loadSettlements();
      Swal.fire({
        icon: "success",
        title: "\u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645",
        text: "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0629 \u0628\u0646\u062c\u0627\u062d.",
        confirmButtonText: "\u062a\u0645\u0627\u0645",
        confirmButtonColor: "#38b6ff",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "\u062a\u0639\u0630\u0631 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645",
        text:
          error.response?.data?.message ||
          "\u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.",
        confirmButtonText: "\u062d\u0633\u0646\u0627\u064b",
        confirmButtonColor: "#38b6ff",
      });
    }
  };

  return (
    <main className="customer-profile-page" dir="rtl">
      <section className="customer-profile-shell">
        <div className="customer-profile-header">
          <h1>الملف الشخصي</h1>
          <button type="button" className="customer-logout-btn" onClick={handleLogout}>
            تسجيل الخروج
            <FiLogOut aria-hidden="true" />
          </button>
        </div>

        <div className="customer-profile-grid">
          <div className="customer-profile-content">
            <section className="customer-info-card">
              <div className="customer-card-heading">
                <h2>المعلومات الشخصية</h2>
                <button
                  type="button"
                  className="customer-edit-btn"
                  onClick={isEditing ? handleProfileSave : () => setIsEditing(true)}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "جاري الحفظ..." : isEditing ? "حفظ" : "تعديل"}
                  <FiEdit2 aria-hidden="true" />
                </button>
              </div>

              <div className="customer-profile-fields">
                <label>
                  <span>
                    الاسم
                    <FiUser aria-hidden="true" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    readOnly={!isEditing}
                  />
                </label>

                <label>
                  <span>
                    البريد الإلكتروني
                    <FiMail aria-hidden="true" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    readOnly={!isEditing}
                  />
                </label>

                <label>
                  <span>
                    رقم الهاتف
                    <FiPhone aria-hidden="true" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    readOnly={!isEditing}
                  />
                </label>
              </div>
            </section>

            <section className="customer-settlements-card">
              <div className="customer-card-heading">
                <h2>
                  {"\u062a\u0633\u0648\u064a\u0627\u062a \u0627\u0644\u062a\u0627\u062c\u0631"}
                  <FiCreditCard aria-hidden="true" />
                </h2>
              </div>

              {isLoadingSettlements ? (
                <p className="customer-settlement-message">
                  {"\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0633\u0648\u064a\u0627\u062a..."}
                </p>
              ) : settlementData ? (
                <>
                  <div className="customer-settlement-summary">
                    <div>
                      <span>{"\u0645\u0633\u062a\u062d\u0642\u0627\u062a\u0643 \u0645\u0646 \u0627\u0644\u0637\u0631\u0648\u062f \u0627\u0644\u0645\u0633\u0644\u0651\u0645\u0629"}</span>
                      <strong>{formatCurrency(settlementData.merchant_due)}</strong>
                    </div>
                    <div>
                      <span>{"\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0633\u0648\u0651\u0649"}</span>
                      <strong>{formatCurrency(settlementData.total_settled_amount)}</strong>
                    </div>
                    <div>
                      <span>{"\u0627\u0644\u0645\u062a\u0628\u0642\u064a \u0644\u0644\u062a\u0633\u0648\u064a\u0629"}</span>
                      <strong>{formatCurrency(settlementData.remaining_settlement_amount)}</strong>
                    </div>
                    <div>
                      <span>{"\u0637\u0644\u0628\u0627\u062a \u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629"}</span>
                      <strong>{formatCurrency(settlementData.pending_settlement_amount)}</strong>
                    </div>
                  </div>

                  <form className="customer-settlement-form" onSubmit={handleSettlementRequest}>
                    <div className="customer-settlement-form-grid">
                      <label>
                        <span>{"\u0642\u064a\u0645\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0629"}</span>
                        <input
                          type="number"
                          name="amount"
                          min="0"
                          step="0.01"
                          max={settlementData.available_settlement_request_amount || 0}
                          value={settlementForm.amount}
                          onChange={handleSettlementFormChange}
                          placeholder={formatCurrency(settlementData.available_settlement_request_amount)}
                        />
                      </label>
                      <label>
                        <span>{"\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645"}</span>
                        <select
                          name="payment_method"
                          value={settlementForm.payment_method}
                          onChange={handleSettlementFormChange}
                        >
                          {Object.entries(settlementMethodLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {settlementForm.payment_method === "bank_transfer" ? (
                        <>
                          <label>
                            <span>{"\u0627\u0633\u0645 \u0627\u0644\u0628\u0646\u0643"}</span>
                            <input
                              type="text"
                              name="bank_name"
                              value={settlementForm.bank_name}
                              onChange={handleSettlementFormChange}
                            />
                          </label>
                          <label>
                            <span>{"\u0627\u0633\u0645 \u0635\u0627\u062d\u0628 \u0627\u0644\u062d\u0633\u0627\u0628"}</span>
                            <input
                              type="text"
                              name="bank_account_holder"
                              value={settlementForm.bank_account_holder}
                              onChange={handleSettlementFormChange}
                            />
                          </label>
                          <label>
                            <span>{"\u0631\u0642\u0645 \u0627\u0644\u062d\u0633\u0627\u0628"}</span>
                            <input
                              type="text"
                              name="bank_account_number"
                              value={settlementForm.bank_account_number}
                              onChange={handleSettlementFormChange}
                            />
                          </label>
                          <label>
                            <span>{"IBAN \u0627\u062e\u062a\u064a\u0627\u0631\u064a"}</span>
                            <input
                              type="text"
                              name="bank_iban"
                              value={settlementForm.bank_iban}
                              onChange={handleSettlementFormChange}
                            />
                          </label>
                        </>
                      ) : null}
                      <label className="customer-settlement-notes">
                        <span>{"\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u062e\u062a\u064a\u0627\u0631\u064a\u0629"}</span>
                        <textarea
                          name="notes"
                          rows="3"
                          value={settlementForm.notes}
                          onChange={handleSettlementFormChange}
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="customer-settlement-submit"
                      disabled={
                        isSubmittingSettlement ||
                        Number(settlementData.available_settlement_request_amount) <= 0
                      }
                    >
                      {isSubmittingSettlement
                        ? "\u062c\u0627\u0631\u064a \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628..."
                        : "\u0637\u0644\u0628 \u062a\u0633\u0648\u064a\u0629"}
                    </button>
                  </form>

                  <div className="customer-settlement-history">
                    <h3>{"\u0633\u062c\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0627\u062a"}</h3>
                    {settlementData.settlements?.length ? (
                      settlementData.settlements.map((settlement) => {
                        const normalizedStatus = normalizeSettlementStatus(settlement.status);

                        return (
                        <article className="customer-settlement-record" key={settlement.id}>
                          <div>
                            <strong>{formatCurrency(settlement.amount)}</strong>
                            <span className={`customer-settlement-status ${normalizedStatus}`}>
                              {settlementStatusLabels[normalizedStatus] || normalizedStatus}
                            </span>
                          </div>
                          <p>
                            {"\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645: "}
                            {settlementMethodLabels[settlement.payment_method] || settlement.payment_method}
                          </p>
                          {settlement.payment_method === "bank_transfer" ? (
                            <p>
                              {settlement.bank_name} - {settlement.bank_account_number}
                            </p>
                          ) : null}
                          <small>
                            {"\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0637\u0644\u0628: "}
                            {formatSettlementDate(settlement.requested_at || settlement.created_at)}
                          </small>
                          <small>
                            {getSettlementNarrative({
                              ...settlement,
                              status: normalizedStatus,
                            })}
                          </small>
                          {settlement.settled_at ? (
                            <small>
                              {"\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0631\u0633\u0627\u0644: "}
                              {formatSettlementDate(settlement.settled_at)}
                            </small>
                          ) : null}
                          {normalizedStatus === "requested" ? (
                            <button
                              type="button"
                              className="customer-settlement-confirm"
                              onClick={() => handleConfirmSettlementReceipt(settlement.id)}
                            >
                              <FiCheckCircle aria-hidden="true" />
                              {"\u062a\u0623\u0643\u064a\u062f \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u062a\u0633\u0648\u064a\u0629"}
                            </button>
                          ) : null}
                        </article>
                      )})
                    ) : (
                      <p className="customer-settlement-message">
                        {"\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0633\u0648\u064a\u0627\u062a \u0645\u0633\u062c\u0644\u0629 \u062d\u0627\u0644\u064a\u0627\u064b."}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="customer-settlement-message">
                  {"\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0633\u0648\u064a\u0627\u062a."}
                </p>
              )}
            </section>

            <section className="customer-password-card">
              <div className="customer-card-heading">
                <h2>
                  تغيير كلمة المرور
                  <FiLock aria-hidden="true" />
                </h2>
                <button
                  type="button"
                  className="customer-edit-btn"
                  onClick={() => setShowPasswordForm((current) => !current)}
                >
                  تغيير
                </button>
              </div>

              <p>اضغط على زر "تغيير" لتحديث كلمة المرور الخاصة بك</p>

              {showPasswordForm && (
                <form className="customer-password-form" onSubmit={handleSubmitPassword} noValidate>
                  <div className="customer-password-field">
                    <input
                      type={visiblePasswords.currentPassword ? "text" : "password"}
                      name="currentPassword"
                      placeholder="كلمة المرور الحالية"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                    />
                    <button
                      type="button"
                      className="customer-password-eye"
                      onClick={() => togglePasswordVisibility("currentPassword")}
                      aria-label={
                        visiblePasswords.currentPassword
                          ? "إخفاء كلمة المرور الحالية"
                          : "إظهار كلمة المرور الحالية"
                      }
                    >
                      {visiblePasswords.currentPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>

                  <div className="customer-password-field">
                    <input
                      type={visiblePasswords.newPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="كلمة المرور الجديدة"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                    />
                    <button
                      type="button"
                      className="customer-password-eye"
                      onClick={() => togglePasswordVisibility("newPassword")}
                      aria-label={
                        visiblePasswords.newPassword
                          ? "إخفاء كلمة المرور الجديدة"
                          : "إظهار كلمة المرور الجديدة"
                      }
                    >
                      {visiblePasswords.newPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>

                  <div className="customer-password-field">
                    <input
                      type={visiblePasswords.confirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="تأكيد كلمة المرور الجديدة"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                    <button
                      type="button"
                      className="customer-password-eye"
                      onClick={() => togglePasswordVisibility("confirmPassword")}
                      aria-label={
                        visiblePasswords.confirmPassword
                          ? "إخفاء تأكيد كلمة المرور"
                          : "إظهار تأكيد كلمة المرور"
                      }
                    >
                      {visiblePasswords.confirmPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>

                  <div className="customer-password-actions">
                    <button type="submit" disabled={isSavingPassword}>
                      {isSavingPassword ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                    </button>
                    <button
                      type="button"
                      className="customer-password-cancel"
                      onClick={handleCancelPasswordChange}
                      disabled={isSavingPassword}
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>

          <aside className="customer-orders-card">
            <h2>
              طلباتي السابقة
              <FiPackage aria-hidden="true" />
            </h2>

            <div className="customer-orders-filters" role="group" aria-label="Order filters">
              {orderFilterOptions.map((filterOption) => (
                <button
                  key={filterOption.value}
                  type="button"
                  className={`customer-orders-filter-btn${
                    ordersFilter === filterOption.value ? " is-active" : ""
                  }`}
                  onClick={() => setOrdersFilter(filterOption.value)}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>

            <div className="customer-orders-list">
              {isLoadingOrders ? (
                <p className="customer-orders-message">جاري تحميل طلباتك...</p>
              ) : customerOrders.length === 0 ? (
                <p className="customer-orders-message">لا توجد طلبات مسجلة على حسابك حالياً.</p>
              ) : filteredCustomerOrders.length === 0 ? (
                <p className="customer-orders-message">
                  {"\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0636\u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u062d\u0627\u0644\u064a\u0627\u064b."}
                </p>
              ) : (
                filteredCustomerOrders.map((order) => (
                  <article className="customer-order-item" key={order.trackingNumber}>
                    <div className="customer-order-top">
                      <span className={`customer-order-status ${order.statusType}`}>
                        {order.status}
                      </span>
                      <strong>{order.trackingNumber}#</strong>
                    </div>

                    <dl className="customer-order-details">
                      <div>
                        <dt>من:</dt>
                        <dd>{order.from}</dd>
                      </div>
                      <div>
                        <dt>إلى:</dt>
                        <dd>{order.to}</dd>
                      </div>
                      <div>
                        <dt>التاريخ:</dt>
                        <dd>{order.date}</dd>
                      </div>
                      <div>
                        <dt>السعر:</dt>
                        <dd className="customer-order-price">{order.price}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className="customer-track-btn"
                      onClick={() =>
                        navigate("/tracking", {
                          state: { trackingNumber: order.trackingNumber },
                        })
                      }
                    >
                      تتبع الطرد
                    </button>
                    {order.canEdit ? (
                      <div className="customer-order-actions">
                        <button
                          type="button"
                          className="customer-order-edit-btn"
                          onClick={() => handleEditOrder(order)}
                        >
                          <FiEdit2 aria-hidden="true" />
                          {"\u062a\u0639\u062f\u064a\u0644"}
                        </button>
                        <button
                          type="button"
                          className="customer-order-delete-btn"
                          onClick={() => handleDeleteOrder(order)}
                        >
                          <FiTrash2 aria-hidden="true" />
                          {"\u062d\u0630\u0641"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>

            <button
              type="button"
              className="customer-new-order-btn"
              onClick={() => navigate("/request-delivery")}
            >
              طلب جديد
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default CustomerProfilePage;

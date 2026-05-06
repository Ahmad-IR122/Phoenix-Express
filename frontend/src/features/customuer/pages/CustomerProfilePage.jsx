import React from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FiEdit2,
  FiEye,
  FiEyeOff,
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
  deleteCustomerOrder,
  getCustomerOrders,
  getCustomerProfile,
  updateCustomerProfile,
  updateCustomerProfileLegacy,
} from "../services/customerService";
import "./CustomerProfilePage.css";

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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

    if (newPassword.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "كلمة المرور قصيرة",
        text: "كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل.",
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

            <div className="customer-orders-list">
              {isLoadingOrders ? (
                <p className="customer-orders-message">جاري تحميل طلباتك...</p>
              ) : customerOrders.length === 0 ? (
                <p className="customer-orders-message">لا توجد طلبات مسجلة على حسابك حالياً.</p>
              ) : (
                customerOrders.map((order) => (
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

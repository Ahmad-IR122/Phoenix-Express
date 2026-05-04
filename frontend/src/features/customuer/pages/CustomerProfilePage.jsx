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
  FiUser,
} from "react-icons/fi";
import { changePassword } from "../../auth/services/authService";
import {
  getCustomerProfile,
  updateCustomerProfile,
  updateCustomerProfileLegacy,
} from "../services/customerService";
import "./CustomerProfilePage.css";

const orders = [
  {
    trackingNumber: "PH12345678",
    status: "تم التسليم",
    statusType: "delivered",
    from: "نابلس",
    to: "رام الله",
    date: "2026-04-20",
    price: "20 شيكل",
  },
  {
    trackingNumber: "PH87654321",
    status: "قيد التوصيل",
    statusType: "shipping",
    from: "القدس",
    to: "نابلس",
    date: "2026-04-19",
    price: "30 شيكل",
  },
  {
    trackingNumber: "PH11223344",
    status: "تم التسليم",
    statusType: "delivered",
    from: "نابلس",
    to: "حيفا",
    date: "2026-04-18",
    price: "70 شيكل",
  },
];

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
  user.name ||
  user.customer?.individual_profile?.full_name ||
  user.customer?.company_profile?.company_name ||
  user.customer?.full_name ||
  user.employee?.full_name ||
  user.email?.split("@")[0] ||
  "عميل فينوكس";

const getProfileName = (customer) =>
  customer?.individual_profile?.full_name ||
  customer?.company_profile?.company_name ||
  customer?.user?.email?.split("@")[0] ||
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
              {orders.map((order) => (
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
                </article>
              ))}
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

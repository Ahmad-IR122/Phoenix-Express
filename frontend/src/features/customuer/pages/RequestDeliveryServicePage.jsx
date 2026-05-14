import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getDeliveryRegions, updateCustomerOrder } from "../services/customerService";
import "./RequestDeliveryServicePage.css";
import { isValidAuthPhone } from "../../../utils/validators";

const DEFAULT_DELIVERY_REGION_OPTIONS = [
  { value: "west-bank", label: "الضفة الغربية", price: 20 },
  { value: "jerusalem", label: "القدس", price: 30 },
  { value: "inside", label: "الداخل", price: 70 },
];
const REGION_VALUE_BY_NAME = {
  west_bank: "west-bank",
  jerusalem: "jerusalem",
  inside: "inside",
};

const orderSizeOptions = [
  { value: "small", label: "صغير" },
  { value: "medium", label: "متوسط" },
  { value: "large", label: "كبير" },
];

const parcelStatusOptions = [
  { value: "normal", label: "عادي" },
  { value: "urgent", label: "عاجل" },
  { value: "immediate", label: "فوري" },
];
const isAuthenticated = () =>
  Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"));

const initialFormData = {
  selectedRegion: "",
  originalCity: "",
  destinationCity: "",
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  orderStatus: "normal",
  orderSize: "",
  isFragile: false,
  orderPrice: "",
  orderDescription: "",
};

const RequestDeliveryServicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editOrderId = location.state?.editOrderId || null;
  const isEditMode = Boolean(editOrderId);
  const [formData, setFormData] = useState(initialFormData);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deliveryRegionOptions, setDeliveryRegionOptions] = useState(
    DEFAULT_DELIVERY_REGION_OPTIONS
  );

  useEffect(() => {
    let isMounted = true;

    const loadRegions = async () => {
      try {
        const response = await getDeliveryRegions();
        const items = Array.isArray(response?.data) ? response.data : [];

        if (!isMounted || !items.length) {
          return;
        }

        setDeliveryRegionOptions(
          items.map((region) => ({
            value: REGION_VALUE_BY_NAME[region.name] || region.name,
            label: region.label || region.name,
            price: Number(region.price) || 0,
          }))
        );
      } catch {
        // Keep the current fallback prices if the request fails.
      }
    };

    loadRegions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setFormData(initialFormData);
      return;
    }

    setFormData({
      ...initialFormData,
      ...location.state,
    });
  }, [isEditMode, location.state]);

  const handleChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const selectedRegionDetails = useMemo(
    () =>
      deliveryRegionOptions.find(
        (region) => region.value === formData.selectedRegion,
      ) || null,
    [deliveryRegionOptions, formData.selectedRegion],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated()) {
      Swal.fire({
        icon: "warning",
        title: "تسجيل الدخول مطلوب",
        text: "لا يمكن إنشاء طلب توصيل قبل تسجيل الدخول.",
        confirmButtonText: "تسجيل الدخول",
        confirmButtonColor: "#38b6ff",
      }).then(() => navigate("/login", { state: { from: "/request-delivery" } }));
      return;
    }
    const invalidSenderPhone = !isValidAuthPhone(formData.senderPhone);
    const invalidReceiverPhone = !isValidAuthPhone(formData.receiverPhone);
    if (invalidSenderPhone || invalidReceiverPhone) {
      let title = "";
      let text = "يرجى إدخال رقم هاتف صحيح مكوّن من 10 أرقام ويبدأ بـ 05.";
      if (invalidSenderPhone && invalidReceiverPhone) {
        title = "رقما هاتفي المرسل والمستلم غير صحيحين";
      } else if (invalidSenderPhone) {
        title = "رقم هاتف المرسل غير صحيح";
      } else {
        title = "رقم هاتف المستلم غير صحيح";
      }
      Swal.fire({
        icon: "warning",
        title,
        text,
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }


    if (!formData.selectedRegion) {
      Swal.fire({
        icon: "warning",
        title: "اختيار المنطقة مطلوب",
        text: "يرجى اختيار منطقة التوصيل قبل المتابعة.",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#38b6ff",
      });
      return;
    }

    if (isEditMode) {
      setIsSavingEdit(true);

      try {
        await updateCustomerOrder(editOrderId, formData);
        await Swal.fire({
          icon: "success",
          title: "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0637\u0631\u062f",
          text: "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a \u0628\u0646\u062c\u0627\u062d \u0637\u0627\u0644\u0645\u0627 \u0623\u0646 \u0627\u0644\u0637\u0631\u062f \u0645\u0627 \u0632\u0627\u0644 \u062f\u0627\u062e\u0644 \u0627\u0644\u0634\u0631\u0643\u0629.",
          confirmButtonText: "\u062a\u0645\u0627\u0645",
          confirmButtonColor: "#38b6ff",
        });
        navigate("/profile");
      } catch (error) {
        const editErrorMessage =
          error.response?.status === 403
            ? "\u064a\u0645\u0643\u0646 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0631\u062f \u0641\u0642\u0637 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0645\u0627 \u0632\u0627\u0644 \u062f\u0627\u062e\u0644 \u0627\u0644\u0634\u0631\u0643\u0629."
            : error.response?.data?.message ||
            "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a\u060c \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.";

        Swal.fire({
          icon: "error",
          title: "\u062a\u0639\u0630\u0631 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0631\u062f",
          text: editErrorMessage,
          confirmButtonText: "\u062d\u0633\u0646\u0627\u064b",
          confirmButtonColor: "#38b6ff",
        });
      } finally {
        setIsSavingEdit(false);
      }

      return;
    }

    navigate("/order-confirmation", {
      state: {
        ...formData,
        deliveryRegionLabel: selectedRegionDetails?.label || "",
        deliveryAmount: selectedRegionDetails?.price || 0,
      },
    });
  };

  return (
    <div className="request-delivery-service-page min-vh-100 py-5" dir="rtl">
      <main className="container">
        <section className="request-delivery-service-page__shell mx-auto">
          <header className="text-center mb-4 mb-md-5">
            <h1 className="request-delivery-service-page__title fw-bold mb-3">
              طلب خدمة توصيل
            </h1>
            {isEditMode ? (
              <div className="request-delivery-service-page__edit-note">
                {"\u0623\u0646\u062a\u0650 \u0627\u0644\u0622\u0646 \u0628\u0648\u0636\u0639 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0631\u062f\u060c \u0648\u0633\u064a\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a \u0645\u0628\u0627\u0634\u0631\u0629."}
              </div>
            ) : null}
            <p className="request-delivery-service-page__subtitle mb-0">
              املأ النموذج وسنتواصل معك فوراً
            </p>
          </header>

          <div className="card border-0 request-delivery-service-page__card">
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-12">
                    <label
                      htmlFor="delivery-region"
                      className="form-label request-delivery-service-page__label"
                    >
                      <i className="bi bi-geo-alt"></i> المنطقة
                    </label>
                    <input
                      id="delivery-region"
                      type="hidden"
                      value={formData.selectedRegion}
                      required
                    />
                    <div className="request-delivery-service-page__region-options">
                      {deliveryRegionOptions.map((region) => (
                        <button
                          key={region.value}
                          type="button"
                          className={`request-delivery-service-page__region-option${formData.selectedRegion === region.value
                            ? " is-selected"
                            : ""
                            }`}
                          onClick={() =>
                            handleChange("selectedRegion", region.value)
                          }
                        >
                          <span>{region.label}</span>
                          <strong>{region.price} شيكل</strong>
                        </button>
                      ))}
                    </div>

                    {selectedRegionDetails ? (
                      <div className="request-delivery-service-page__price text-center">
                        <span className="request-delivery-service-page__price-value">
                          {selectedRegionDetails.price}
                        </span>
                        <span className="request-delivery-service-page__price-currency">
                          شيكل
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="origin-city"
                      className="form-label request-delivery-service-page__label"
                    >
                      المدينة الأصل
                    </label>
                    <input
                      id="origin-city"
                      type="text"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل المدينة الأصل"
                      value={formData.originalCity}
                      onChange={(event) =>
                        handleChange("originalCity", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="destination-city"
                      className="form-label request-delivery-service-page__label"
                    >
                      مدينة الوصول
                    </label>
                    <input
                      id="destination-city"
                      type="text"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل مدينة الوصول"
                      value={formData.destinationCity}
                      onChange={(event) =>
                        handleChange("destinationCity", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-12">
                    <h2 className="request-delivery-service-page__section-title mb-0">
                      <i className="bi bi-person"></i> معلومات المرسل
                    </h2>
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="sender-name"
                      className="form-label request-delivery-service-page__label"
                    >
                      اسم المرسل
                    </label>
                    <input
                      id="sender-name"
                      type="text"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل اسم المرسل"
                      value={formData.senderName}
                      onChange={(event) =>
                        handleChange("senderName", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="sender-phone"
                      className="form-label request-delivery-service-page__label"
                    >
                      رقم هاتف المرسل
                    </label>
                    <input
                      id="sender-phone"
                      type="tel"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل رقم الهاتف"
                      value={formData.senderPhone}
                      onChange={(event) =>
                        handleChange("senderPhone", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label
                      htmlFor="sender-address"
                      className="form-label request-delivery-service-page__label"
                    >
                      عنوان المرسل
                    </label>
                    <input
                      id="sender-address"
                      type="text"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل عنوان المرسل"
                      value={formData.senderAddress}
                      onChange={(event) =>
                        handleChange("senderAddress", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-12">
                    <h2 className="request-delivery-service-page__section-title mb-0">
                      <i className="bi bi-person"></i> معلومات المستلم
                    </h2>
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="receiver-name"
                      className="form-label request-delivery-service-page__label"
                    >
                      اسم المستلم
                    </label>
                    <input
                      id="receiver-name"
                      type="text"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل اسم المستلم"
                      value={formData.receiverName}
                      onChange={(event) =>
                        handleChange("receiverName", event.target.value)
                      }
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="receiver-phone"
                      className="form-label request-delivery-service-page__label"
                    >
                      رقم هاتف المستلم
                    </label>
                    <input
                      id="receiver-phone"
                      type="tel"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل رقم الهاتف"
                      value={formData.receiverPhone}
                      onChange={(event) =>
                        handleChange("receiverPhone", event.target.value)
                      }
                    />
                  </div>

                  <div className="col-12">
                    <label
                      htmlFor="receiver-address"
                      className="form-label request-delivery-service-page__label"
                    >
                      عنوان المستلم
                    </label>
                    <input
                      id="receiver-address"
                      type="text"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل عنوان المستلم"
                      value={formData.receiverAddress}
                      onChange={(event) =>
                        handleChange("receiverAddress", event.target.value)
                      }
                    />
                  </div>

                  <div className="col-12">
                    <h2 className="request-delivery-service-page__section-title mb-0">
                      <i className="bi bi-box-seam"></i> تفاصيل الطرد
                    </h2>
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="parcel-size"
                      className="form-label request-delivery-service-page__label"
                    >
                      حجم الطرد
                    </label>
                    <select
                      id="parcel-size"
                      className="form-select request-delivery-service-page__input"
                      value={formData.orderSize}
                      onChange={(event) =>
                        handleChange("orderSize", event.target.value)
                      }
                    >
                      <option value="" disabled>
                        اختر حجم الطرد
                      </option>
                      {orderSizeOptions.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="parcel-status"
                      className="form-label request-delivery-service-page__label"
                    >
                      حالة الطرد
                    </label>
                    <select
                      id="parcel-status"
                      className="form-select request-delivery-service-page__input"
                      value={formData.orderStatus}
                      onChange={(event) =>
                        handleChange("orderStatus", event.target.value)
                      }
                    >
                      {parcelStatusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="parcel-price"
                      className="form-label request-delivery-service-page__label"
                    >
                      سعر الطرد (اختياري)
                    </label>
                    <input
                      id="parcel-price"
                      type="number"
                      min="0"
                      className="form-control request-delivery-service-page__input"
                      placeholder="أدخل سعر الطرد بالشيكل"
                      value={formData.orderPrice}
                      onChange={(event) =>
                        handleChange("orderPrice", event.target.value)
                      }
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="request-delivery-service-page__checkbox-wrap form-check">
                      <input
                        id="parcel-fragile"
                        type="checkbox"
                        className="form-check-input request-delivery-service-page__checkbox-input"
                        checked={formData.isFragile}
                        onChange={(event) =>
                          handleChange("isFragile", event.target.checked)
                        }
                      />
                      <label
                        htmlFor="parcel-fragile"
                        className="form-check-label request-delivery-service-page__checkbox-label"
                      >
                        &nbsp; &nbsp; &nbsp; &nbsp; قابل للكسر
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label
                      htmlFor="parcel-description"
                      className="form-label request-delivery-service-page__label"
                    >
                      وصف الطرد اختياري
                    </label>
                    <textarea
                      id="parcel-description"
                      rows="4"
                      className="form-control request-delivery-service-page__input request-delivery-service-page__textarea"
                      placeholder="أدخل وصفاً مختصراً للطرد"
                      value={formData.orderDescription}
                      onChange={(event) =>
                        handleChange("orderDescription", event.target.value)
                      }
                    />
                  </div>

                  <div className="col-12 pt-2">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                      <button
                        type="button"
                        className="btn request-delivery-service-page__button request-delivery-service-page__button--secondary"
                        onClick={() => navigate(-1)}
                      >
                        رجوع
                      </button>
                      <button
                        type="submit"
                        className={`btn request-delivery-service-page__button request-delivery-service-page__button--primary${isEditMode ? " request-delivery-service-page__button--editing" : ""}`}
                        disabled={isSavingEdit}
                      >
                        {isEditMode ? (
                          <span className="request-delivery-service-page__edit-submit-text">
                            {isSavingEdit
                              ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..."
                              : "\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644"}
                          </span>
                        ) : null}
                        متابعة الدفع
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RequestDeliveryServicePage;

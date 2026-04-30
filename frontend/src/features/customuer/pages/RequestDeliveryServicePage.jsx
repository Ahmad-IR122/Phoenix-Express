import React, { useMemo, useState } from "react";
import "./RequestDeliveryServicePage.css";

const deliveryRegionOptions = [
  { value: "west-bank", label: "الضفة الغربية", price: 20 },
  { value: "jerusalem", label: "القدس", price: 30 },
  { value: "inside", label: "الداخل", price: 70 },
];
const orderSize = [
  {
    value: "small",
    label: "صغير",
  },
  {
    value: "medium",
    label: "متوسط",
  },
  {
    value: "large",
    label: "كبير",
  },
];
const parcelStatusOptions = [
  { value: "normal", label: "عادي" },
  { value: "urgent", label: "عاجل" },
  { value: "immediate", label: "فوري" },
];

const RequestDeliveryServicePage = () => {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedOrderSize, setSelectedOrderSize] = useState("");

  const selectedRegionDetails = useMemo(
    () =>
      deliveryRegionOptions.find((region) => region.value === selectedRegion) ||
      null,
    [selectedRegion],
  );

  return (
    <div className="request-delivery-service-page min-vh-100 py-5" dir="rtl">
      <main className="container">
        <section className="request-delivery-service-page__shell mx-auto">
          <header className="text-center mb-4 mb-md-5">
            <h1 className="request-delivery-service-page__title fw-bold mb-3">
              طلب خدمة توصيل
            </h1>
            <p className="request-delivery-service-page__subtitle mb-0">
              املأ النموذج وسنتواصل معك فوراً
            </p>
          </header>

          <div className="card border-0 request-delivery-service-page__card">
            <div className="card-body p-4 p-md-5">
              <form>
                <div className="row g-4">
                  <div className="col-12">
                    <label
                      htmlFor="delivery-region"
                      className="form-label request-delivery-service-page__label"
                    >
                      <i class="bi bi-geo-alt"></i>  المنطقة 
                    </label>
                    <select
                      id="delivery-region"
                      className="form-select request-delivery-service-page__input"
                      value={selectedRegion}
                      onChange={(event) =>
                        setSelectedRegion(event.target.value)
                      }
                    >
                      <option value="" disabled>
                        اختر المنطقة
                      </option>
                      {deliveryRegionOptions.map((region) => (
                        <option key={region.value} value={region.value}>
                          {`${region.label} (${region.price} شيكل)`}
                        </option>
                      ))}
                    </select>

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
                    />
                  </div>

                  <div className="col-12">
                    <h2 className="request-delivery-service-page__section-title mb-0">
                    <i class="bi bi-person"></i>  معلومات المرسل 
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
                    />
                  </div>

                  <div className="col-12">
                    <h2 className="request-delivery-service-page__section-title mb-0">
                      <i class="bi bi-person"></i>  معلومات المستلم
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
                    />
                  </div>

                  <div className="col-12">
                    <h2 className="request-delivery-service-page__section-title mb-0">
                    <i class="bi bi-box-seam"></i>  تفاصيل الطرد
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
                      defaultValue=""
                      value={selectedOrderSize}
                      onChange={(e) => setSelectedOrderSize(e.target.value)}
                    >
                      <option value="" disabled>
                        اختر حجم الطرد
                      </option>
                      {orderSize.map((size) => (
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
                      defaultValue="normal"
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
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    
                    <div className="request-delivery-service-page__checkbox-wrap form-check">
                      <input
                        id="parcel-fragile"
                        type="checkbox"
                        className="form-check-input request-delivery-service-page__checkbox-input"
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
                    />
                  </div>

                  <div className="col-12 pt-2">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                      <button
                        type="button"
                        className="btn request-delivery-service-page__button request-delivery-service-page__button--secondary"
                      >
                        رجوع
                      </button>
                      <button
                        type="submit"
                        className="btn request-delivery-service-page__button request-delivery-service-page__button--primary"
                      >
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

import API from "../../../apis/api";

export const getTrackingByNumber = async (trackingNumber) => {
  const response = await API.get(
    `/tracking/number/${encodeURIComponent(trackingNumber)}`
  );

  return response.data;
};

export const getCustomerProfile = async () => {
  const response = await API.get("/customers/profile/me");
  return response.data;
};

export const getCustomerOrders = async () => {
  const response = await API.get("/orders/me");
  return response.data;
};

export const updateCustomerProfile = async (payload) => {
  const response = await API.patch("/customers/profile/me", payload);
  return response.data;
};

export const updateCustomerProfileLegacy = async (payload, storedUser = {}) => {
  const userId = storedUser.id || storedUser.userId || storedUser.user_id;
  const customer = storedUser.customer || {};
  const customerId = customer.id || customer.customer_id;
  const customerType = customer.customer_type || (storedUser.role === "company" ? "company" : "individual");

  if (!userId || !customerId) {
    throw new Error("بيانات الحساب غير مكتملة، يرجى تسجيل الدخول مرة أخرى.");
  }

  await API.put(`/auth/${userId}`, {
    email: payload.email,
    phone: payload.phone,
    role: storedUser.role || "customer",
  });

  const profilePayload =
    customerType === "company"
      ? {
          user_id: userId,
          customer_type: customerType,
          company_name: payload.name,
          company_phone: payload.phone,
          company_location: customer.company_profile?.company_location || "",
        }
      : {
          user_id: userId,
          customer_type: customerType,
          full_name: payload.name,
        };

  const response = await API.put(`/customers/${customerId}`, profilePayload);
  return response.data;
};

import API from "../../../apis/api";

export async function getAdminProfile() {
  const response = await API.get("/admin/profile");
  return response.data;
}

export async function updateAdminProfile(payload) {
  const response = await API.patch("/admin/profile", payload);
  return response.data;
}

export async function changeAdminPassword(payload) {
  const response = await API.patch("/auth/change-password", payload);
  return response.data;
}

export async function settleMerchant(merchantId, payload) {
  const response = await API.post(`/admin/merchants/${merchantId}/settlements`, payload);
  return response.data;
}

export async function markMerchantSettlementSent(settlementId, payload = {}) {
  const response = await API.patch(`/admin/merchant-settlements/${settlementId}/sent`, payload);
  return response.data;
}

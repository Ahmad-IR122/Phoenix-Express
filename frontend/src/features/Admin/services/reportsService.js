import API from "../../../apis/api";

export async function getAdminReports() {
  const response = await API.get("/admin/reports");
  return Array.isArray(response?.data?.data) ? response.data.data : [];
}

export async function getReturnedOrders() {
  const response = await API.get("/admin/reports/returned");
  return Array.isArray(response?.data?.data) ? response.data.data : [];
}

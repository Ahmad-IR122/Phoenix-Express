import API from "../../../apis/api";

export async function getAdminRegions() {
  const response = await API.get("/admin/regions");
  return response.data;
}

export async function updateAdminRegionPrice(regionId, payload) {
  const response = await API.patch(`/admin/regions/${regionId}`, payload);
  return response.data;
}

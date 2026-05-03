import API from "../../../apis/api";

export const getTrackingByNumber = async (trackingNumber) => {
  const response = await API.get(
    `/tracking/number/${encodeURIComponent(trackingNumber)}`
  );

  return response.data;
};

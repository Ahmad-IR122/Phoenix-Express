import API from "../apis/api";

export const subscribeToNewsletter = async (email) => {
  const response = await API.post("/newsletter/subscribe", { email });
  return response.data;
};

export const getEmployeeNewsletter = async () => {
  const response = await API.get("/newsletter/employee");
  return response.data;
};

export const getEmployeeNewsletterStatus = async () => {
  const response = await API.get("/newsletter/employee/status");
  return response.data;
};

export const sendEmployeeNewsletter = async (payload) => {
  const response = await API.post("/newsletter/employee/send", payload);
  return response.data;
};

export const getEmployeeNewsletterSendStatus = async (jobId) => {
  const response = await API.get(`/newsletter/employee/send-status/${jobId}`);
  return response.data;
};

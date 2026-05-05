import API from "../apis/api";

export async function getCustomerSupportConversation() {
  const response = await API.get("/support-chat/customer/conversation");
  return response.data;
}

export async function sendCustomerSupportMessage(message) {
  const response = await API.post("/support-chat/customer/messages", { message });
  return response.data;
}

export async function getEmployeeSupportConversations() {
  const response = await API.get("/support-chat/employee/conversations");
  return response.data;
}

export async function sendEmployeeSupportMessage(conversationId, message) {
  const response = await API.post(
    `/support-chat/employee/conversations/${conversationId}/messages`,
    { message }
  );
  return response.data;
}

export async function deleteEmployeeSupportConversation(conversationId) {
  const response = await API.delete(`/support-chat/employee/conversations/${conversationId}`);
  return response.data;
}

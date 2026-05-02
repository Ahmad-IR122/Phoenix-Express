import API from '../../../apis/api';

export async function getEmployeeDashboard() {
  const response = await API.get('/employees/dashboard');
  return response.data;
}

export async function getEmployeeProfile() {
  const response = await API.get('/employees/profile');
  return response.data;
}

export async function updateEmployeeProfile(payload) {
  const response = await API.patch('/employees/profile', payload);
  return response.data;
}

export async function updateEmployeeVehicle(payload) {
  const response = await API.patch('/employees/vehicle', payload);
  return response.data;
}

export async function createEmployeeDocument(payload) {
  const response = await API.post('/employees/documents', payload);
  return response.data;
}

export async function updateEmployeeDocument(id, payload) {
  const response = await API.patch(`/employees/documents/${id}`, payload);
  return response.data;
}

export async function deleteEmployeeDocument(id) {
  const response = await API.delete(`/employees/documents/${id}`);
  return response.data;
}

export async function updateEmployeeAvailabilityStatus(availabilityStatus) {
  const response = await API.patch('/employees/profile/status', {
    availabilityStatus,
  });
  return response.data;
}

export async function changeAccountPassword(payload) {
  const response = await API.patch('/auth/change-password', payload);
  return response.data;
}

export async function getEmployeeOrders() {
  const response = await API.get('/employees/orders');
  return response.data;
}

export async function getEmployeeWallet() {
  const response = await API.get('/employees/wallet');
  return response.data;
}

export async function submitEmployeeHandoverRequest(payload) {
  const response = await API.post('/employees/wallet/withdrawals', payload);
  return response.data;
}
